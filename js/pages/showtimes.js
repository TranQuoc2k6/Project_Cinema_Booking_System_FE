/**
 * ==========================================================================
 * SHOWTIMES PAGE CONTROLLER (js/pages/showtimes.js)
 * Quản lý tương tác, bộ lọc, tab ngày, gom nhóm rạp và điều hướng đặt vé (Task T3C6866)
 * ==========================================================================
 */

(function () {
  'use strict';

  // State của trang
  const state = {
    selectedDate: '',           // 'YYYY-MM-DD'
    selectedMovieId: 'all',     // 'all' hoặc ID số
    selectedCity: 'all',        // 'all' hoặc 'Hà Nội', 'TP. Hồ Chí Minh'...
    selectedCinemaId: 'all',    // 'all' hoặc ID cụ thể
    selectedFormat: 'all',      // 'all', '2D', '3D', 'IMAX', 'VIP'
    searchKeyword: '',          // Từ khóa tìm kiếm phim
    hidePastShowtimes: false,   // Ẩn các suất chiếu đã trôi qua
    days: [],                   // 7 ngày tới
    allMovies: [],              // Danh sách phim
    allCinemas: [],             // Danh sách cụm rạp
    currentShowtimes: []        // Danh sách suất chiếu đang tải
  };

  /**
   * Khởi tạo trang
   */
  async function init() {
    // 1. Tạo danh sách 7 ngày tới tính từ thời điểm hiện tại
    initSevenDays();

    // 2. Đọc URL Parameters (nhận movieId, cinemaId, city, date)
    parseUrlParams();

    // 3. Tải danh sách phim và cụm rạp để điền vào bộ lọc
    await Promise.all([loadMoviesFilter(), loadCinemasFilter()]);

    // 4. Render thanh Tab 7 ngày & trạng thái bộ lọc định dạng
    renderDaysTabs();
    updateFormatButtonsState();

    // 5. Gắn sự kiện cho các thành phần bộ lọc
    bindFilterEvents();

    // 6. Tải và hiển thị danh sách suất chiếu
    await fetchAndRenderShowtimes();

    // 7. Đồng bộ thông tin người dùng trên Header nếu đã đăng nhập
    syncUserHeader();
  }

  /**
   * Khởi tạo mảng 7 ngày tính từ ngày hiện tại
   */
  function initSevenDays() {
    state.days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const ymd = window.FormatUtil ? window.FormatUtil.formatDateToYMD(d) : d.toISOString().split('T')[0];
      state.days.push({
        dateObj: d,
        ymd: ymd,
        dayIndex: i
      });
    }

    // Nếu chưa chọn ngày thì mặc định chọn ngày đầu tiên (Hôm nay)
    if (!state.selectedDate) {
      state.selectedDate = state.days[0].ymd;
    }
  }

  /**
   * Đọc các tham số từ Query String URL
   */
  function parseUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const movieIdParam = params.get('movieId') || params.get('movie');
    const cinemaIdParam = params.get('cinemaId') || params.get('cinema');
    const cityParam = params.get('city');
    const dateParam = params.get('date');

    if (movieIdParam) {
      state.selectedMovieId = movieIdParam;
    }
    if (cinemaIdParam) {
      state.selectedCinemaId = cinemaIdParam;
    }
    if (cityParam) {
      state.selectedCity = cityParam;
    }
    if (dateParam && state.days.some(d => d.ymd === dateParam)) {
      state.selectedDate = dateParam;
    }
  }

  /**
   * Tải danh sách phim cho bộ lọc
   */
  async function loadMoviesFilter() {
    if (window.MovieService) {
      const res = await window.MovieService.getMovies();
      if (res.success && Array.isArray(res.data)) {
        state.allMovies = res.data;
        renderMovieFilterOptions();
      }
    }
  }

  /**
   * Tải danh sách cụm rạp cho bộ lọc
   */
  async function loadCinemasFilter() {
    if (window.ShowtimeService) {
      state.allCinemas = window.ShowtimeService.getCinemasList();
      renderCinemaFilterOptions();
    }
  }

  /**
   * Render các options cho select Phim
   */
  function renderMovieFilterOptions() {
    const select = document.getElementById('filter-movie-select');
    if (!select) return;

    let html = '<option value="all">🎬 Tất cả các phim</option>';
    state.allMovies.forEach(m => {
      const isSelected = String(m.id) === String(state.selectedMovieId);
      html += `<option value="${m.id}" ${isSelected ? 'selected' : ''}>${m.title}</option>`;
    });
    select.innerHTML = html;

    // Hiển thị banner phim đang được lọc (nếu có)
    updateMovieBanner();
  }

  /**
   * Render các options cho select Cụm rạp (lọc theo thành phố nếu có)
   */
  function renderCinemaFilterOptions() {
    const select = document.getElementById('filter-cinema-select');
    if (!select) return;

    let filtered = state.allCinemas;
    if (state.selectedCity && state.selectedCity !== 'all') {
      filtered = filtered.filter(c => c.city.toLowerCase() === state.selectedCity.toLowerCase());
    }

    let html = '<option value="all">🏢 Tất cả cụm rạp</option>';
    filtered.forEach(c => {
      const isSelected = String(c.id) === String(state.selectedCinemaId);
      html += `<option value="${c.id}" ${isSelected ? 'selected' : ''}>${c.name} (${c.city})</option>`;
    });
    select.innerHTML = html;
  }

  /**
   * Cập nhật banner thông báo phim đang lọc
   */
  function updateMovieBanner() {
    const banner = document.getElementById('movie-filter-banner');
    if (!banner) return;

    if (state.selectedMovieId && state.selectedMovieId !== 'all') {
      const movie = state.allMovies.find(m => String(m.id) === String(state.selectedMovieId));
      if (movie) {
        banner.classList.remove('hidden');
        banner.innerHTML = `
          <div class="flex items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-cyan-950/80 via-slate-900 to-slate-900 border border-cyan-500/30">
            <div class="flex items-center gap-4">
              <img src="${movie.poster_url}" alt="${movie.title}" class="w-12 h-16 object-cover rounded-lg shadow-md border border-slate-700">
              <div>
                <span class="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <i class="fa-solid fa-filter"></i> Đang xem lịch chiếu phim:
                </span>
                <h3 class="text-base sm:text-lg font-black text-white">${movie.title}</h3>
                <p class="text-xs text-slate-400">${movie.duration_minutes} phút • ${movie.genres?.join(', ') || 'Điện ảnh'}</p>
              </div>
            </div>
            <button onclick="window.ShowtimesPage.clearMovieFilter()" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700 transition-all flex items-center gap-1.5 whitespace-nowrap">
              <i class="fa-solid fa-xmark text-rose-400"></i> Xem tất cả phim
            </button>
          </div>
        `;
        return;
      }
    }
    banner.classList.add('hidden');
    banner.innerHTML = '';
  }

  /**
   * Render thanh trượt 7 ngày
   */
  function renderDaysTabs() {
    const container = document.getElementById('days-tabs-container');
    if (!container) return;

    const dayNames = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

    container.innerHTML = state.days.map((item, index) => {
      const d = item.dateObj;
      const isSelected = item.ymd === state.selectedDate;
      const formattedDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      
      let label = dayNames[d.getDay()];
      let badge = '';

      if (index === 0) {
        label = 'Hôm nay';
        badge = '<span class="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-rose-500 text-white mt-1 shadow-sm">NOW</span>';
      } else if (index === 1) {
        label = 'Ngày mai';
      }

      return `
        <button type="button" 
                onclick="window.ShowtimesPage.selectDate('${item.ymd}')"
                class="group relative flex-shrink-0 px-5 py-3.5 rounded-2xl flex flex-col items-center justify-center border transition-all duration-300 min-w-[96px] sm:min-w-[110px] ${
                  isSelected 
                    ? 'bg-gradient-to-b from-cyan-500 to-cyan-600 border-cyan-300 text-slate-950 font-black shadow-lg shadow-cyan-500/30 scale-105 z-10' 
                    : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/80'
                }">
          <span class="text-[11px] uppercase tracking-wider ${isSelected ? 'text-slate-950 font-black' : 'text-slate-400 font-semibold group-hover:text-cyan-400'}">
            ${label}
          </span>
          <span class="text-lg font-black tracking-tight my-0.5 ${isSelected ? 'text-slate-950' : 'text-white'}">
            ${formattedDate}
          </span>
          ${badge}
          ${isSelected ? '<span class="absolute -bottom-1.5 w-3 h-1.5 bg-cyan-300 rounded-full"></span>' : ''}
        </button>
      `;
    }).join('');
  }

  /**
   * Chọn ngày chiếu
   */
  function selectDate(ymd) {
    if (state.selectedDate === ymd) return;
    state.selectedDate = ymd;
    renderDaysTabs();
    fetchAndRenderShowtimes();
  }

  /**
   * Cuộn thanh tab ngày sang trái hoặc phải
   */
  function scrollDaysTabs(direction) {
    const container = document.getElementById('days-tabs-container');
    if (!container) return;
    const scrollAmount = 240;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  }

  /**
   * Gắn sự kiện cho các input / filter
   */
  function bindFilterEvents() {
    // 1. Phim
    const movieSelect = document.getElementById('filter-movie-select');
    if (movieSelect) {
      movieSelect.addEventListener('change', (e) => {
        state.selectedMovieId = e.target.value;
        updateMovieBanner();
        fetchAndRenderShowtimes();
      });
    }

    // 2. Thành phố
    const citySelect = document.getElementById('filter-city-select');
    if (citySelect) {
      citySelect.addEventListener('change', (e) => {
        state.selectedCity = e.target.value;
        // Reset cinema khi đổi thành phố
        state.selectedCinemaId = 'all';
        renderCinemaFilterOptions();
        fetchAndRenderShowtimes();
      });
    }

    // 3. Cụm rạp
    const cinemaSelect = document.getElementById('filter-cinema-select');
    if (cinemaSelect) {
      cinemaSelect.addEventListener('change', (e) => {
        state.selectedCinemaId = e.target.value;
        fetchAndRenderShowtimes();
      });
    }

    // 4. Định dạng phòng chiếu
    const formatButtons = document.querySelectorAll('[data-format-filter]');
    formatButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        state.selectedFormat = btn.getAttribute('data-format-filter');
        updateFormatButtonsState();
        fetchAndRenderShowtimes();
      });
    });

    // 5. Tìm kiếm nhanh tên phim
    const searchInput = document.getElementById('filter-search-input');
    if (searchInput) {
      let debounceTimer = null;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          state.searchKeyword = e.target.value.trim().toLowerCase();
          renderShowtimesContent();
        }, 250);
      });
    }

    // 6. Checkbox ẩn suất chiếu đã qua
    const hidePastCheckbox = document.getElementById('hide-past-checkbox');
    if (hidePastCheckbox) {
      hidePastCheckbox.addEventListener('change', (e) => {
        state.hidePastShowtimes = e.target.checked;
        renderShowtimesContent();
      });
    }

    // 7. Nút Reset bộ lọc
    const resetBtn = document.getElementById('reset-filters-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', resetFilters);
    }
  }

  /**
   * Đặt lại tất cả bộ lọc về mặc định
   */
  function resetFilters() {
    state.selectedMovieId = 'all';
    state.selectedCity = 'all';
    state.selectedCinemaId = 'all';
    state.selectedFormat = 'all';
    state.searchKeyword = '';
    state.hidePastShowtimes = false;

    // Reset input elements
    const movieSelect = document.getElementById('filter-movie-select');
    if (movieSelect) movieSelect.value = 'all';

    const citySelect = document.getElementById('filter-city-select');
    if (citySelect) citySelect.value = 'all';

    const cinemaSelect = document.getElementById('filter-cinema-select');
    if (cinemaSelect) cinemaSelect.value = 'all';

    const searchInput = document.getElementById('filter-search-input');
    if (searchInput) searchInput.value = '';

    const hidePastCheckbox = document.getElementById('hide-past-checkbox');
    if (hidePastCheckbox) hidePastCheckbox.checked = false;

    updateFormatButtonsState();
    updateMovieBanner();
    renderCinemaFilterOptions();
    fetchAndRenderShowtimes();
  }

  /**
   * Cập nhật đồng bộ style của các nút lọc định dạng phòng (Đồng bộ màu Cyan rực rỡ khi Active)
   */
  function updateFormatButtonsState() {
    const formatButtons = document.querySelectorAll('[data-format-filter]');
    const activeClass = 'px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs border border-cyan-300 shadow-lg shadow-cyan-500/30 scale-105 transition-all';
    const inactiveClass = 'px-4 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs border border-slate-800 transition-all scale-100 shadow-none';

    formatButtons.forEach(btn => {
      const val = btn.getAttribute('data-format-filter');
      const isSelected = val === state.selectedFormat;
      btn.className = isSelected ? activeClass : inactiveClass;
    });
  }

  /**
   * Bỏ lọc riêng phim
   */
  function clearMovieFilter() {
    state.selectedMovieId = 'all';
    const movieSelect = document.getElementById('filter-movie-select');
    if (movieSelect) movieSelect.value = 'all';
    updateMovieBanner();
    fetchAndRenderShowtimes();
  }

  /**
   * Tải dữ liệu suất chiếu từ ShowtimeService
   */
  async function fetchAndRenderShowtimes() {
    const container = document.getElementById('showtimes-content');
    if (!container) return;

    // Hiển thị trạng thái đang tải (skeleton)
    container.innerHTML = `
      <div class="glass-panel p-8 rounded-3xl border border-slate-800/80 flex flex-col items-center justify-center min-h-[300px]">
        <div class="w-12 h-12 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin mb-4"></div>
        <p class="text-sm font-semibold text-slate-400 animate-pulse">Đang đồng bộ dữ liệu lịch chiếu hệ thống...</p>
      </div>
    `;

    if (!window.ShowtimeService) {
      container.innerHTML = `<div class="p-6 text-center text-rose-400">Không tìm thấy ShowtimeService.</div>`;
      return;
    }

    const res = await window.ShowtimeService.getShowtimes({
      date: state.selectedDate,
      movieId: state.selectedMovieId !== 'all' ? state.selectedMovieId : null,
      cinemaId: state.selectedCinemaId !== 'all' ? state.selectedCinemaId : null,
      city: state.selectedCity !== 'all' ? state.selectedCity : null,
      format: state.selectedFormat !== 'all' ? state.selectedFormat : null
    });

    if (res.success && Array.isArray(res.data)) {
      state.currentShowtimes = res.data;
    } else {
      state.currentShowtimes = [];
    }

    renderShowtimesContent();
  }

  /**
   * Render danh sách suất chiếu được gom nhóm theo Cụm Rạp (Cinema Groups)
   */
  function renderShowtimesContent() {
    const container = document.getElementById('showtimes-content');
    const countBadge = document.getElementById('showtimes-count-badge');
    if (!container) return;

    // Áp dụng bộ lọc client-side cho search keyword và hidePastShowtimes
    let list = [...state.currentShowtimes];

    if (state.searchKeyword) {
      list = list.filter(s => s.movie_title.toLowerCase().includes(state.searchKeyword));
    }

    if (state.hidePastShowtimes) {
      list = list.filter(s => !window.ShowtimeService.isPastShowtime(s.start_time));
    }

    // Cập nhật số lượng suất chiếu tìm thấy
    if (countBadge) {
      const activeCount = list.filter(s => !window.ShowtimeService.isPastShowtime(s.start_time)).length;
      countBadge.innerHTML = `Tìm thấy <b class="text-cyan-400">${list.length}</b> suất chiếu (${activeCount} khả dụng)`;
    }

    // Kiểm tra nếu danh sách rỗng
    if (list.length === 0) {
      renderEmptyState(container);
      return;
    }

    // Gom nhóm theo Cụm Rạp (Cinema Grouping)
    const cinemaGroups = {};
    list.forEach(showtime => {
      const cId = showtime.cinema_id;
      if (!cinemaGroups[cId]) {
        cinemaGroups[cId] = {
          cinema_id: cId,
          cinema_name: showtime.cinema_name,
          cinema_brand: showtime.cinema_brand,
          city: showtime.city,
          district: showtime.district,
          cinema_address: showtime.cinema_address,
          movies: {}
        };
      }

      const mId = showtime.movie_id;
      if (!cinemaGroups[cId].movies[mId]) {
        cinemaGroups[cId].movies[mId] = {
          movie_id: mId,
          movie_title: showtime.movie_title,
          poster_url: showtime.poster_url,
          duration_minutes: showtime.duration_minutes,
          age_rating: showtime.age_rating,
          genres: showtime.genres,
          formats: {}
        };
      }

      const fmt = showtime.format || '2D Digital';
      if (!cinemaGroups[cId].movies[mId].formats[fmt]) {
        cinemaGroups[cId].movies[mId].formats[fmt] = [];
      }

      cinemaGroups[cId].movies[mId].formats[fmt].push(showtime);
    });

    // Render HTML các cụm rạp
    container.innerHTML = Object.values(cinemaGroups).map(cinema => {
      const brandLogo = getBrandBadge(cinema.cinema_brand || cinema.cinema_name);

      return `
        <div class="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800/80 shadow-2xl relative overflow-hidden transition-all duration-300 hover:border-slate-700">
          
          <!-- Cinema Header Info -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6 mb-6">
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center shrink-0 shadow-md">
                ${brandLogo}
              </div>
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <h2 class="text-lg sm:text-xl font-black text-white">${cinema.cinema_name}</h2>
                  <span class="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                    <i class="fa-solid fa-map-pin text-[9px] mr-1"></i>${cinema.city}
                  </span>
                </div>
                <p class="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                  <i class="fa-solid fa-location-dot text-rose-500"></i>
                  <span>${cinema.cinema_address || 'Đang cập nhật địa chỉ'}</span>
                </p>
              </div>
            </div>

            <div class="flex items-center gap-3 self-start sm:self-auto">
              <a href="https://maps.google.com/?q=${encodeURIComponent(cinema.cinema_name + ' ' + cinema.cinema_address)}" target="_blank" class="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white border border-slate-800 transition-all flex items-center gap-1.5">
                <i class="fa-solid fa-diamond-turn-right text-cyan-400"></i> Chỉ đường
              </a>
            </div>
          </div>

          <!-- Movies List within this Cinema -->
          <div class="space-y-8">
            ${Object.values(cinema.movies).map(movie => `
              <div class="flex flex-col lg:flex-row gap-6 p-5 rounded-2xl bg-slate-900/40 border border-slate-800/60 transition-all hover:border-slate-700/80">
                
                <!-- Movie Poster & Quick Info -->
                <div class="flex gap-4 lg:w-72 shrink-0">
                  <a href="movie-detail.html?id=${movie.movie_id}" class="group relative block w-20 h-28 sm:w-24 sm:h-34 rounded-xl overflow-hidden shadow-lg border border-slate-700/80 shrink-0">
                    <img src="${movie.poster_url || 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=400'}" alt="${movie.movie_title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                    <div class="absolute inset-0 bg-slate-950/20 group-hover:bg-transparent transition-all"></div>
                  </a>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span class="text-[10px] font-black px-1.5 py-0.5 rounded ${getAgeRatingClass(movie.age_rating)}">${movie.age_rating || 'P'}</span>
                      <span class="text-[11px] text-slate-400"><i class="fa-regular fa-clock text-cyan-400 mr-1"></i>${movie.duration_minutes}m</span>
                    </div>
                    <a href="movie-detail.html?id=${movie.movie_id}" class="block text-sm sm:text-base font-black text-white hover:text-cyan-400 transition-colors line-clamp-2">
                      ${movie.movie_title}
                    </a>
                    <p class="text-xs text-slate-400 mt-1 line-clamp-1">${movie.genres ? movie.genres.join(' • ') : 'Điện ảnh'}</p>
                    <a href="movie-detail.html?id=${movie.movie_id}" class="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:underline mt-2">
                      Xem chi tiết <i class="fa-solid fa-angle-right text-[9px]"></i>
                    </a>
                  </div>
                </div>

                <!-- Formats & Showtime Chips Grid -->
                <div class="flex-1 space-y-4 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-slate-800/80 lg:pl-6">
                  ${Object.entries(movie.formats).map(([formatName, showtimes]) => `
                    <div>
                      <!-- Format Header Badge -->
                      <div class="flex items-center gap-2 mb-2.5">
                        <span class="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md ${getFormatBadgeClass(formatName)}">
                          ${formatName}
                        </span>
                        <span class="text-xs text-slate-500">• ${showtimes.length} khung giờ</span>
                      </div>

                      <!-- Showtime Chips -->
                      <div class="flex flex-wrap gap-2.5">
                        ${showtimes.map(st => renderShowtimeChip(st)).join('')}
                      </div>
                    </div>
                  `).join('')}
                </div>

              </div>
            `).join('')}
          </div>

        </div>
      `;
    }).join('');
  }

  /**
   * Render từng nút Showtime Chip (Kiểm tra giờ chiếu thời gian thực)
   */
  function renderShowtimeChip(showtime) {
    const isPast = window.ShowtimeService.isPastShowtime(showtime.start_time);
    const timeFormatted = window.FormatUtil ? window.FormatUtil.extractTime(showtime.start_time) : showtime.start_time.split(' ')[1];
    const endTimeFormatted = window.FormatUtil ? window.FormatUtil.extractTime(showtime.end_time) : (showtime.end_time ? showtime.end_time.split(' ')[1] : '');
    const priceFormatted = window.FormatUtil ? window.FormatUtil.currency(showtime.price) : `${showtime.price} đ`;

    if (isPast) {
      // Suất chiếu đã qua: Làm mờ, Disable, không thể bấm, hiển thị badge Đã chiếu
      return `
        <div class="group relative px-4 py-2.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-500 opacity-50 cursor-not-allowed select-none transition-all flex flex-col items-center justify-center min-w-[105px]">
          <span class="text-sm font-black line-through text-slate-500">${timeFormatted}</span>
          <span class="text-[9px] font-bold text-rose-400 uppercase mt-0.5 flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Đã chiếu
          </span>
          
          <!-- Tooltip khi rê chuột -->
          <div class="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center pointer-events-none z-20">
            <div class="bg-slate-950 text-slate-300 text-[10px] font-medium py-1 px-2.5 rounded-lg border border-slate-800 shadow-xl whitespace-nowrap">
              Suất này đã bắt đầu (${timeFormatted}). Vui lòng chọn suất sau!
            </div>
            <div class="w-1.5 h-1.5 bg-slate-950 border-r border-b border-slate-800 transform rotate-45 -mt-1"></div>
          </div>
        </div>
      `;
    }

    // Suất chiếu hợp lệ: Sáng đẹp, click được, hiệu ứng hover phát sáng neon đồng bộ
    let borderAccent = 'border-slate-700/80 hover:border-cyan-300 hover:shadow-cyan-500/30';
    let typeBadge = '';
    if (showtime.format.includes('IMAX')) {
      borderAccent = 'border-purple-500/50 hover:border-purple-300 hover:shadow-purple-500/30';
      typeBadge = '<span class="text-[8px] font-black uppercase px-1 rounded bg-purple-900/90 text-purple-200 border border-purple-500/40">IMAX</span>';
    } else if (showtime.format.includes('VIP')) {
      borderAccent = 'border-amber-500/50 hover:border-amber-300 hover:shadow-amber-500/30';
      typeBadge = '<span class="text-[8px] font-black uppercase px-1 rounded bg-amber-900/90 text-amber-200 border border-amber-500/40">VIP</span>';
    }

    return `
      <button type="button" 
              onclick="window.ShowtimesPage.handleSelectShowtime(${showtime.id})"
              class="group relative px-4 py-2.5 rounded-2xl bg-slate-900/95 hover:bg-gradient-to-br hover:from-cyan-500 hover:to-teal-400 border ${borderAccent} text-slate-200 hover:text-slate-950 transition-all duration-200 shadow-md hover:scale-105 active:scale-95 flex flex-col items-center justify-center min-w-[105px] text-center">
        
        <!-- Giờ bắt đầu & Badge phụ nếu có -->
        <div class="flex items-center gap-1.5">
          <span class="text-sm sm:text-base font-black tracking-tight group-hover:text-slate-950 transition-colors">
            ${timeFormatted}
          </span>
          ${typeBadge}
        </div>

        <!-- Giờ kết thúc & Tên phòng -->
        <div class="flex items-center gap-1 text-[10px] text-slate-400 group-hover:text-slate-900 font-semibold mt-0.5 transition-colors">
          <span>~${endTimeFormatted}</span>
          <span>•</span>
          <span>${showtime.room_name ? showtime.room_name.split(' ')[0] : 'P.Chiếu'}</span>
        </div>

        <!-- Giá vé và ghế trống -->
        <div class="mt-1 pt-1 border-t border-slate-800/80 group-hover:border-slate-900/20 w-full flex items-center justify-between gap-1 text-[9px] font-bold text-emerald-400 group-hover:text-slate-950 transition-colors">
          <span>${priceFormatted}</span>
          <span class="text-slate-400 group-hover:text-slate-800">${showtime.available_seats || 40}c</span>
        </div>

      </button>
    `;
  }

  /**
   * Render giao diện khi không tìm thấy suất chiếu nào
   */
  function renderEmptyState(container) {
    container.innerHTML = `
      <div class="glass-panel p-12 rounded-3xl border border-slate-800/80 text-center max-w-2xl mx-auto my-8">
        <div class="w-20 h-20 rounded-3xl bg-slate-900/80 border border-slate-800 flex items-center justify-center mx-auto mb-4 text-3xl text-cyan-400 shadow-inner">
          <i class="fa-solid fa-film"></i>
        </div>
        <h3 class="text-xl font-black text-white mb-2">Không tìm thấy suất chiếu phù hợp</h3>
        <p class="text-sm text-slate-400 mb-6 leading-relaxed">
          Rất tiếc, hiện chưa có suất chiếu nào khớp với tiêu chí bạn đã lọc cho ngày đã chọn. Vui lòng thử chọn một ngày khác hoặc đặt lại bộ lọc.
        </p>
        <div class="flex flex-wrap items-center justify-center gap-3">
          <button onclick="window.ShowtimesPage.resetFilters()" class="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-cyan-500/25">
            <i class="fa-solid fa-rotate-left mr-1.5"></i> Đặt lại tất cả bộ lọc
          </button>
          <a href="movies.html" class="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider border border-slate-700 transition-all">
            Xem danh sách phim khác
          </a>
        </div>
      </div>
    `;
  }

  /**
   * Xử lý khi người dùng bấm vào một suất chiếu: Chuyển hướng sang trang chọn ghế
   */
  function handleSelectShowtime(showtimeId) {
    const showtime = state.currentShowtimes.find(s => s.id === showtimeId);
    if (!showtime) {
      alert('Không tìm thấy thông tin suất chiếu!');
      return;
    }

    // Kiểm tra lại lần nữa phòng trường hợp quá giờ
    if (window.ShowtimeService.isPastShowtime(showtime.start_time)) {
      alert('Suất chiếu này đã bắt đầu. Vui lòng chọn một suất chiếu khác!');
      return;
    }

    // Lưu thông tin chi tiết suất chiếu vào sessionStorage để booking.html đồng bộ hiển thị
    try {
      sessionStorage.setItem('selected_showtime', JSON.stringify(showtime));
    } catch (e) {
      console.warn('Không thể lưu session:', e);
    }

    const timeOnly = window.FormatUtil ? window.FormatUtil.extractTime(showtime.start_time) : showtime.start_time.split(' ')[1];

    // Điều hướng sang trang chọn ghế theo yêu cầu:
    // pages/booking.html?showtimeId=15&movieId=...&cinema=...&time=...
    const bookingUrl = `booking.html?showtimeId=${showtime.id}&movieId=${showtime.movie_id}&cinema=${encodeURIComponent(showtime.cinema_name)}&time=${encodeURIComponent(timeOnly)}`;
    window.location.href = bookingUrl;
  }

  /**
   * Helper: Class màu sắc cho nhãn độ tuổi
   */
  function getAgeRatingClass(rating) {
    switch (rating) {
      case 'T18':
        return 'bg-rose-950 text-rose-300 border border-rose-500/40';
      case 'T16':
        return 'bg-amber-950 text-amber-300 border border-amber-500/40';
      case 'T13':
        return 'bg-yellow-950 text-yellow-300 border border-yellow-500/40';
      case 'K':
        return 'bg-blue-950 text-blue-300 border border-blue-500/40';
      case 'P':
      default:
        return 'bg-emerald-950 text-emerald-300 border border-emerald-500/40';
    }
  }

  /**
   * Helper: Class màu sắc cho định dạng phòng chiếu (Đồng bộ tươi sáng & sắc nét)
   */
  function getFormatBadgeClass(format) {
    if (format.includes('IMAX')) {
      return 'bg-gradient-to-r from-purple-950/90 to-indigo-950/90 text-purple-200 border border-purple-400/70 shadow-sm shadow-purple-500/25';
    }
    if (format.includes('VIP')) {
      return 'bg-gradient-to-r from-amber-950/90 to-yellow-950/90 text-amber-200 border border-amber-400/70 shadow-sm shadow-amber-500/25';
    }
    if (format.includes('4DX')) {
      return 'bg-gradient-to-r from-rose-950/90 to-pink-950/90 text-rose-200 border border-rose-400/70 shadow-sm shadow-rose-500/25';
    }
    return 'bg-cyan-950/90 text-cyan-300 border border-cyan-400/70 shadow-sm shadow-cyan-500/25';
  }

  /**
   * Helper: Logo / Icon cho thương hiệu rạp
   */
  function getBrandBadge(brandName) {
    const name = (brandName || '').toUpperCase();
    if (name.includes('CGV')) {
      return '<span class="text-rose-500 font-black text-sm tracking-tighter">CGV</span>';
    }
    if (name.includes('BHD')) {
      return '<span class="text-emerald-400 font-black text-xs tracking-tighter">BHD</span>';
    }
    if (name.includes('GALAXY')) {
      return '<span class="text-amber-400 font-black text-[11px] tracking-tighter">GLX</span>';
    }
    if (name.includes('LOTTE')) {
      return '<span class="text-red-500 font-black text-[11px] tracking-tighter">LOTTE</span>';
    }
    return '<i class="fa-solid fa-film text-cyan-400 text-base"></i>';
  }

  /**
   * Đồng bộ header user profile
   */
  function syncUserHeader() {
    if (window.renderAppHeader) {
      window.renderAppHeader();
      return;
    }
    const authContainer = document.getElementById('header-auth-section');
    if (!authContainer) return;

    if (window.StorageService && window.StorageService.isAuthenticated()) {
      const user = window.StorageService.getUser();
      authContainer.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="hidden sm:flex flex-col text-right">
            <span class="text-xs font-bold text-white">${user.full_name || user.email}</span>
            <span class="text-[10px] text-cyan-400">${user.role === 'admin' ? 'Quản Trị Viên' : 'Thành Viên 3D'}</span>
          </div>
          <a href="profile.html" class="w-9 h-9 rounded-xl border border-cyan-400/50 flex items-center justify-center bg-slate-900 text-cyan-400 text-xs font-bold shadow-md hover:border-cyan-400 transition-all">
            <i class="fa-solid fa-user"></i>
          </a>
        </div>
      `;
    }
  }

  // Khơi tạo khi DOM sẵn sàng
  document.addEventListener('DOMContentLoaded', init);

  // Xuất API công khai ra window để gọi từ các sự kiện onclick
  window.ShowtimesPage = {
    selectDate,
    scrollDaysTabs,
    clearMovieFilter,
    resetFilters,
    handleSelectShowtime
  };

})();
