/**
 * ==========================================================================
 * MOVIES PAGE CONTROLLER (js/pages/movies.js)
 * Quản lý trang Danh sách phim: Tải từ API, Shimmer Skeleton Loading,
 * Thông báo Empty & Error đa ngữ cảnh, Phân trang & Tối ưu Responsive Mobile
 * ==========================================================================
 */

const MoviesPage = {
  state: {
    allMovies: [],
    filteredMovies: [],
    currentFilter: 'ALL', // 'ALL' | 'now_showing' | 'coming_soon'
    searchQuery: '',
    selectedGenre: '',
    currentPage: 1,
    itemsPerPage: 8,
    isLoading: false,
    error: null,
    errorType: null
  },

  /**
   * Khởi tạo trang
   */
  init() {
    this.updateHeaderAndFooter();
    this.bindEvents();
    this.fetchMovies();
  },

  /**
   * Cập nhật Header và Footer từ components
   */
  updateHeaderAndFooter() {
    if (typeof window.renderAppHeader === 'function') {
      window.renderAppHeader();
    } else {
      this.updateAuthHeaderFallback();
    }

    if (typeof window.renderAppFooter === 'function') {
      window.renderAppFooter();
    }
  },

  /**
   * Fallback header nếu chưa nạp component header
   */
  updateAuthHeaderFallback() {
    const authSec = document.getElementById('header-auth-section');
    if (!authSec) return;

    const isAuth = window.StorageService ? window.StorageService.isAuthenticated() : false;
    const user = window.StorageService ? window.StorageService.getUser() : null;

    if (isAuth && user) {
      const avatarUrl = user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100';
      const displayName = user.full_name || user.email || 'Người dùng';

      authSec.innerHTML = `
        <div class="flex items-center gap-3">
          <a href="profile.html" class="flex items-center gap-2 text-xs font-semibold text-slate-200 hover:text-[#ff5e1e] transition-colors">
            <img src="${avatarUrl}" alt="${displayName}" class="w-8 h-8 rounded-full border border-[#ff5e1e]/40 object-cover" onerror="this.src='https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'">
            <span class="max-w-[120px] truncate">${displayName}</span>
          </a>
          <button id="logout-btn" title="Đăng xuất" class="px-3 py-1.5 rounded-full glass-panel text-xs text-slate-400 hover:text-[#ff5e1e] transition-colors">
            <i class="fa-solid fa-arrow-right-from-bracket"></i>
          </button>
        </div>
      `;

      const logoutBtn = document.getElementById('logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          if (window.AuthService && typeof window.AuthService.logout === 'function') {
            window.AuthService.logout('login.html');
          } else {
            if (window.StorageService) window.StorageService.clearAuth();
            window.location.href = 'login.html';
          }
        });
      }
    } else {
      authSec.innerHTML = `
        <a href="login.html" class="px-4 py-2 rounded-full glass-panel text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
          Đăng Nhập
        </a>
        <a href="register.html" class="px-4 py-2 rounded-full bg-gradient-to-r from-[#ff5e1e] to-[#ea580c] text-xs font-bold text-white shadow-md hover:brightness-110 transition-all">
          Đăng Ký
        </a>
      `;
    }
  },

  /**
   * Gắn sự kiện cho các thành phần UI
   */
  bindEvents() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.state.searchQuery = (e.target.value || '').trim().toLowerCase();
        this.state.currentPage = 1;
        this.applyFiltersAndRender();
      });
    }

    const genreSelect = document.getElementById('genre-select');
    if (genreSelect) {
      genreSelect.addEventListener('change', (e) => {
        this.state.selectedGenre = (e.target.value || '').trim().toLowerCase();
        this.state.currentPage = 1;
        this.applyFiltersAndRender();
      });
    }

    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const status = btn.getAttribute('data-status') || 'ALL';
        this.filterMovies(status, btn);
      });
    });
  },

  /**
   * Escape HTML chống XSS khi render từ khóa người dùng nhập
   */
  escapeHtml(str) {
    if (!str || typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  /**
   * 1. TRẠNG THÁI LOADING (SKELETON SHIMMER GRID)
   */
  renderSkeletonLoading() {
    const grid = document.getElementById('movies-grid');
    const pagination = document.getElementById('movies-pagination');
    if (!grid) return;

    if (pagination) pagination.innerHTML = '';

    // Tạo 8 thẻ skeleton tương ứng 8 item trên 1 trang
    let skeletons = '';
    for (let i = 0; i < 8; i++) {
      skeletons += `
        <div class="glass-card rounded-2xl overflow-hidden border border-slate-800/80 flex flex-col">
          <div class="relative aspect-[2/3] w-full skeleton-shimmer">
            <div class="absolute top-2.5 left-2.5 w-16 h-5 rounded-md skeleton-shimmer opacity-80"></div>
          </div>
          <div class="p-3 sm:p-4 bg-[#131722] flex-1 flex flex-col justify-between gap-3">
            <div>
              <div class="h-4 w-4/5 rounded skeleton-shimmer mb-2"></div>
              <div class="flex items-center justify-between gap-2 mt-2">
                <div class="h-3 w-1/3 rounded skeleton-shimmer"></div>
                <div class="h-3 w-1/4 rounded skeleton-shimmer"></div>
              </div>
              <div class="h-3 w-full rounded skeleton-shimmer mt-2.5 hidden sm:block"></div>
              <div class="h-3 w-2/3 rounded skeleton-shimmer mt-1 hidden sm:block"></div>
            </div>
            <div class="flex flex-col sm:flex-row gap-2 pt-2 border-t border-white/5">
              <div class="flex-1 h-8 rounded-xl skeleton-shimmer"></div>
              <div class="flex-1 h-8 rounded-xl skeleton-shimmer"></div>
            </div>
          </div>
        </div>
      `;
    }

    grid.innerHTML = skeletons;
  },

  /**
   * Tải danh sách phim từ Backend API
   */
  async fetchMovies() {
    const grid = document.getElementById('movies-grid');
    if (!grid) return;

    this.state.isLoading = true;
    this.state.error = null;
    this.state.errorType = null;
    this.renderSkeletonLoading();

    try {
      if (!window.MovieService || typeof window.MovieService.getMovies !== 'function') {
        throw new Error('Dịch vụ dữ liệu phim chưa sẵn sàng');
      }

      const res = await window.MovieService.getMovies();

      if (!res || !res.success) {
        throw new Error(res?.message || 'Không thể lấy dữ liệu phim từ máy chủ');
      }

      this.state.allMovies = Array.isArray(res.data) ? res.data : [];
      this.state.currentPage = 1;
      this.populateGenreOptions();
      this.applyFiltersAndRender();
    } catch (error) {
      console.error('[MoviesPage.fetchMovies]', error);
      this.state.error = error.message || 'Lỗi kết nối máy chủ';
      this.state.errorType = 'API_ERROR';
      this.renderErrorState();
    } finally {
      this.state.isLoading = false;
    }
  },

  /**
   * Nạp danh sách thể loại động vào dropdown
   */
  populateGenreOptions() {
    const genreSelect = document.getElementById('genre-select');
    if (!genreSelect) return;

    const genreSet = new Set();
    this.state.allMovies.forEach((m) => {
      if (Array.isArray(m.genres)) {
        m.genres.forEach((g) => {
          const name = typeof g === 'string' ? g : g.name;
          if (name && name.trim()) genreSet.add(name.trim());
        });
      }
    });

    let optionsHtml = '<option value="">Tất cả thể loại</option>';
    if (genreSet.size > 0) {
      genreSet.forEach((genre) => {
        const isSelected = this.state.selectedGenre.toLowerCase() === genre.toLowerCase();
        optionsHtml += `<option value="${this.escapeHtml(genre)}" ${isSelected ? 'selected' : ''}>${this.escapeHtml(genre)}</option>`;
      });
    } else {
      // Fallback các thể loại phổ biến
      const defaultGenres = ['Hành Động', 'Tình Cảm', 'Kinh Dị', 'Hoạt Hình', 'Khoa Học Viễn Tưởng', 'Gia Đình'];
      defaultGenres.forEach((g) => {
        optionsHtml += `<option value="${g}">${g}</option>`;
      });
    }
    genreSelect.innerHTML = optionsHtml;
  },

  /**
   * Lọc theo trạng thái tab: ALL | now_showing | coming_soon
   */
  filterMovies(status, btnElement) {
    this.state.currentFilter = status || 'ALL';
    this.state.currentPage = 1;

    const allButtons = document.querySelectorAll('.filter-btn');
    allButtons.forEach((b) => {
      b.className = 'filter-btn shrink-0 px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors';
    });

    if (btnElement) {
      btnElement.className = 'filter-btn shrink-0 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#ff5e1e] to-[#ea580c] text-white shadow-[0_0_15px_rgba(255,94,30,0.4)]';
    } else {
      const targetBtn = document.querySelector(`.filter-btn[data-status="${status}"]`);
      if (targetBtn) {
        targetBtn.className = 'filter-btn shrink-0 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#ff5e1e] to-[#ea580c] text-white shadow-[0_0_15px_rgba(255,94,30,0.4)]';
      }
    }

    this.applyFiltersAndRender();
  },

  /**
   * Lọc phim & phân trang
   */
  applyFiltersAndRender() {
    const { allMovies, currentFilter, searchQuery, selectedGenre } = this.state;

    const filtered = allMovies.filter((movie) => {
      // 1. Trạng thái (now_showing, coming_soon, ALL)
      let matchStatus = true;
      if (currentFilter !== 'ALL') {
        const movieStatus = (movie.status || '').toLowerCase();
        const filterVal = currentFilter.toLowerCase();
        matchStatus = movieStatus === filterVal;
      }

      // 2. Tìm kiếm tên phim, đạo diễn, mô tả
      let matchSearch = true;
      if (searchQuery) {
        const title = (movie.title || '').toLowerCase();
        const originalTitle = (movie.original_title || movie.slug || '').toLowerCase();
        const desc = (movie.description || '').toLowerCase();
        matchSearch = title.includes(searchQuery) || originalTitle.includes(searchQuery) || desc.includes(searchQuery);
      }

      // 3. Lọc theo thể loại
      let matchGenre = true;
      if (selectedGenre) {
        const target = selectedGenre.toLowerCase();
        if (Array.isArray(movie.genres) && movie.genres.length > 0) {
          matchGenre = movie.genres.some((g) => {
            const name = (typeof g === 'string' ? g : g.name || '').toLowerCase();
            return name.includes(target);
          });
        } else if (movie.description) {
          matchGenre = movie.description.toLowerCase().includes(target);
        } else if (movie.title) {
          matchGenre = movie.title.toLowerCase().includes(target);
        }
      }

      return matchStatus && matchSearch && matchGenre;
    });

    this.state.filteredMovies = filtered;

    // Trường hợp danh sách rỗng (Empty States)
    if (!filtered || filtered.length === 0) {
      this.renderEmptyState();
      return;
    }

    // Phân trang
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / this.state.itemsPerPage);

    if (this.state.currentPage > totalPages) {
      this.state.currentPage = totalPages;
    }
    if (this.state.currentPage < 1) {
      this.state.currentPage = 1;
    }

    const startIndex = (this.state.currentPage - 1) * this.state.itemsPerPage;
    const endIndex = Math.min(startIndex + this.state.itemsPerPage, totalItems);
    const paginatedItems = filtered.slice(startIndex, endIndex);

    this.renderMovies(paginatedItems);
    this.renderPagination(totalItems, totalPages, startIndex, endIndex);
  },

  /**
   * 2. TRẠNG THÁI EMPTY ĐA NGỮ CẢNH
   */
  renderEmptyState() {
    const grid = document.getElementById('movies-grid');
    const pagination = document.getElementById('movies-pagination');
    if (!grid) return;

    if (pagination) pagination.innerHTML = '';

    const { allMovies, searchQuery, selectedGenre, currentFilter } = this.state;

    // Ngữ cảnh A: Chưa có phim nào trong hệ thống
    if (!allMovies || allMovies.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full py-16 text-center">
          <div class="max-w-md mx-auto p-8 rounded-3xl glass-panel border border-white/10">
            <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/80 border border-white/10 flex items-center justify-center text-slate-400 text-2xl">
              <i class="fa-solid fa-film"></i>
            </div>
            <h3 class="text-lg font-bold text-white mb-2">Chưa Có Phim Nào Trong Hệ Thống</h3>
            <p class="text-xs text-slate-400 mb-6 leading-relaxed">
              Danh sách phim hiện đang được cập nhật. Quý khách vui lòng quay lại sau ít phút hoặc tải lại trang.
            </p>
            <button onclick="window.MoviesPage.fetchMovies()" class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#ff5e1e] to-[#ea580c] hover:brightness-110 text-white text-xs font-bold transition-all shadow-[0_0_12px_rgba(255,94,30,0.4)] inline-flex items-center gap-2">
              <i class="fa-solid fa-rotate-right"></i> Tải lại dữ liệu
            </button>
          </div>
        </div>
      `;
      return;
    }

    // Ngữ cảnh B: Tìm kiếm không có kết quả
    if (searchQuery) {
      grid.innerHTML = `
        <div class="col-span-full py-16 text-center">
          <div class="max-w-md mx-auto p-8 rounded-3xl glass-panel border border-[#ff5e1e]/20">
            <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#ff5e1e]/10 border border-[#ff5e1e]/30 flex items-center justify-center text-[#ff5e1e] text-2xl">
              <i class="fa-solid fa-magnifying-glass"></i>
            </div>
            <h3 class="text-lg font-bold text-white mb-2">Không Tìm Thấy Phim Phù Hợp</h3>
            <p class="text-xs text-slate-400 mb-6 leading-relaxed">
              Không tìm thấy bộ phim nào khớp với từ khóa "<strong class="text-white">${this.escapeHtml(searchQuery)}</strong>".
            </p>
            <div class="flex flex-col sm:flex-row gap-3 justify-center">
              <button onclick="window.MoviesPage.clearSearch()" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ff5e1e] to-[#ea580c] hover:brightness-110 text-white text-xs font-bold transition-all shadow-[0_0_12px_rgba(255,94,30,0.4)] inline-flex items-center justify-center gap-2">
                <i class="fa-solid fa-xmark"></i> Xóa từ khóa tìm kiếm
              </button>
              <button onclick="window.MoviesPage.resetAllFilters()" class="px-5 py-2.5 rounded-xl glass-panel text-slate-300 hover:text-white text-xs font-semibold transition-colors">
                Xem tất cả phim
              </button>
            </div>
          </div>
        </div>
      `;
      return;
    }

    // Ngữ cảnh C: Lọc theo thể loại không có kết quả
    if (selectedGenre) {
      grid.innerHTML = `
        <div class="col-span-full py-16 text-center">
          <div class="max-w-md mx-auto p-8 rounded-3xl glass-panel border border-cyan-500/20">
            <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-2xl">
              <i class="fa-solid fa-tags"></i>
            </div>
            <h3 class="text-lg font-bold text-white mb-2">Chưa Có Phim Thể Loại Này</h3>
            <p class="text-xs text-slate-400 mb-6 leading-relaxed">
              Hiện chưa có bộ phim nào thuộc thể loại "<strong class="text-white">${this.escapeHtml(selectedGenre)}</strong>".
            </p>
            <button onclick="window.MoviesPage.clearGenre()" class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#ff5e1e] to-[#ea580c] hover:brightness-110 text-white text-xs font-bold transition-all shadow-[0_0_12px_rgba(255,94,30,0.4)] inline-flex items-center gap-2">
              <i class="fa-solid fa-layer-group"></i> Hiển thị tất cả thể loại
            </button>
          </div>
        </div>
      `;
      return;
    }

    // Ngữ cảnh D: Tab trạng thái không có phim
    const statusText = currentFilter === 'now_showing' ? 'đang chiếu' : currentFilter === 'coming_soon' ? 'sắp chiếu' : '';
    grid.innerHTML = `
      <div class="col-span-full py-16 text-center">
        <div class="max-w-md mx-auto p-8 rounded-3xl glass-panel border border-amber-500/20">
          <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 text-2xl">
            <i class="fa-solid fa-calendar-xmark"></i>
          </div>
          <h3 class="text-lg font-bold text-white mb-2">Không Có Phim ${statusText ? statusText.toUpperCase() : ''}</h3>
          <p class="text-xs text-slate-400 mb-6 leading-relaxed">
            Hiện tại không có bộ phim nào trong danh mục ${statusText}. Quý khách vui lòng chuyển sang tab khác để khám phá thêm phim.
          </p>
          <button onclick="window.MoviesPage.resetFilter()" class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#ff5e1e] to-[#ea580c] hover:brightness-110 text-white text-xs font-bold transition-all shadow-[0_0_12px_rgba(255,94,30,0.4)] inline-flex items-center gap-2">
            <i class="fa-solid fa-film"></i> Xem tất cả phim
          </button>
        </div>
      </div>
    `;
  },

  /**
   * 3. TRẠNG THÁI ERROR THÂN THIỆN
   */
  renderErrorState() {
    const grid = document.getElementById('movies-grid');
    const pagination = document.getElementById('movies-pagination');
    if (!grid) return;

    if (pagination) pagination.innerHTML = '';

    grid.innerHTML = `
      <div class="col-span-full py-16 text-center">
        <div class="max-w-md mx-auto p-8 rounded-3xl glass-panel border border-[#ff5e1e]/30 shadow-[0_0_30px_rgba(255,94,30,0.15)]">
          <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#ff5e1e]/10 border border-[#ff5e1e]/30 flex items-center justify-center text-[#ff5e1e] text-2xl shadow-[0_0_20px_rgba(255,94,30,0.2)]">
            <i class="fa-solid fa-triangle-exclamation"></i>
          </div>
          <h3 class="text-lg font-bold text-white mb-2">Không Thể Kết Nối Máy Chủ</h3>
          <p class="text-xs text-slate-400 mb-6 leading-relaxed">
            Hệ thống gặp sự cố trong quá trình tải danh sách phim. Vui lòng kiểm tra lại đường truyền mạng hoặc thử lại sau ít phút.
          </p>
          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <button onclick="window.MoviesPage.fetchMovies()" class="px-6 py-3 rounded-xl bg-gradient-to-r from-[#ff5e1e] to-[#ea580c] hover:brightness-110 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(255,94,30,0.4)] flex items-center justify-center gap-2">
              <i class="fa-solid fa-rotate-right"></i> Thử Lại
            </button>
            <a href="../index.html" class="px-6 py-3 rounded-xl glass-panel text-slate-300 hover:text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2">
              <i class="fa-solid fa-house"></i> Về trang chủ
            </a>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * 4. RENDER DANH SÁCH THẺ PHIM (RESPONSIVE MOBILE 2 CỘT)
   */
  renderMovies(list) {
    const grid = document.getElementById('movies-grid');
    if (!grid) return;

    grid.innerHTML = list.map((movie) => {
      const statusNormalized = (movie.status || '').toLowerCase();
      const isNowShowing = statusNormalized === 'now_showing';
      const isComingSoon = statusNormalized === 'coming_soon';

      let statusBadge = `
        <span class="absolute top-2 left-2 sm:top-3 sm:left-3 bg-slate-700/90 backdrop-blur text-slate-200 text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded shadow-[0_0_10px_rgba(0,0,0,0.5)]">
          NGỪNG CHIẾU
        </span>
      `;
      if (isNowShowing) {
        statusBadge = `
          <span class="absolute top-2 left-2 sm:top-3 sm:left-3 bg-[#d4ff00] text-[#0b0d12] text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded shadow-[0_0_10px_rgba(212,255,0,0.5)]">
            ĐANG CHIẾU
          </span>
        `;
      } else if (isComingSoon) {
        statusBadge = `
          <span class="absolute top-2 left-2 sm:top-3 sm:left-3 bg-[#ff5e1e] text-white text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded shadow-[0_0_10px_rgba(255,94,30,0.5)]">
            SẮP CHIẾU
          </span>
        `;
      }

      const poster = movie.poster_url || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600';
      const durationText = movie.duration_minutes
        ? (window.FormatUtil ? window.FormatUtil.duration(movie.duration_minutes) : `${movie.duration_minutes}p`)
        : '120p';

      const releaseDateText = movie.release_date
        ? `KC: ${movie.release_date}`
        : 'KC: Sắp ra mắt';

      const description = movie.description || 'Trải nghiệm điện ảnh đỉnh cao với âm thanh và hình ảnh sống động.';

      return `
        <div class="glass-card movie-card rounded-2xl overflow-hidden border border-slate-800 flex flex-col group">
          <div class="relative aspect-[2/3] overflow-hidden bg-[#0b0d12]">
            <img src="${poster}" alt="${this.escapeHtml(movie.title)}" onerror="this.src='https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600'" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent"></div>
            ${statusBadge}
          </div>
          <div class="p-3 sm:p-4 bg-[#131722] flex-1 flex flex-col justify-between card-content">
            <div>
              <h4 class="text-xs sm:text-base font-bold text-white truncate group-hover:text-[#ff5e1e] transition-colors" title="${this.escapeHtml(movie.title)}">
                ${this.escapeHtml(movie.title)}
              </h4>
              <div class="flex items-center justify-between text-[10px] sm:text-xs text-slate-400 mt-1 mb-2">
                <span><i class="fa-regular fa-clock mr-1 text-[#ff5e1e]"></i> ${durationText}</span>
                <span class="truncate ml-1">${releaseDateText}</span>
              </div>
              <p class="text-xs text-slate-400 line-clamp-2 leading-relaxed hidden sm:block">${this.escapeHtml(description)}</p>
            </div>
            <div class="flex flex-col sm:flex-row gap-1.5 sm:gap-2 mt-3 pt-3 border-t border-white/5">
              <a href="movie-detail.html?id=${movie.id}" class="flex-1 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold text-center border border-white/10 transition-colors flex items-center justify-center min-h-[36px]">
                Chi tiết
              </a>
              <a href="showtimes.html?movieId=${movie.id}" class="flex-1 py-2 rounded-xl bg-gradient-to-r from-[#ff5e1e] to-[#ea580c] hover:brightness-110 text-white text-xs font-bold text-center shadow-[0_0_12px_rgba(255,94,30,0.4)] transition-all flex items-center justify-center min-h-[36px]">
                Đặt vé
              </a>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  /**
   * 5. RENDER PHÂN TRANG (PAGINATION)
   */
  renderPagination(totalItems, totalPages, startIndex, endIndex) {
    const pagination = document.getElementById('movies-pagination');
    if (!pagination) return;

    if (totalPages <= 1) {
      pagination.innerHTML = `
        <div class="w-full text-center sm:text-left text-xs text-slate-400 font-mono">
          Hiển thị <strong>${totalItems}</strong> phim
        </div>
      `;
      return;
    }

    const { currentPage } = this.state;

    let pageButtonsHtml = '';
    for (let p = 1; p <= totalPages; p++) {
      const isActive = p === currentPage;
      pageButtonsHtml += `
        <button onclick="window.MoviesPage.goToPage(${p})" class="pagination-btn ${isActive ? 'pagination-btn-active' : 'glass-panel text-slate-300 hover:text-white hover:border-[#ff5e1e]/40'}">
          ${p}
        </button>
      `;
    }

    const prevDisabled = currentPage <= 1 ? 'disabled' : '';
    const nextDisabled = currentPage >= totalPages ? 'disabled' : '';

    pagination.innerHTML = `
      <div class="text-xs text-slate-400 font-mono order-2 sm:order-1 text-center sm:text-left">
        Hiển thị <strong>${startIndex + 1} - ${endIndex}</strong> trong tổng số <strong>${totalItems}</strong> phim
      </div>
      <div class="flex items-center gap-1.5 order-1 sm:order-2 flex-wrap justify-center">
        <button onclick="window.MoviesPage.goToPage(${currentPage - 1})" ${prevDisabled} class="pagination-btn glass-panel text-slate-300 hover:text-white hover:border-[#ff5e1e]/40 ${prevDisabled}" title="Trang trước">
          <i class="fa-solid fa-chevron-left text-xs"></i>
        </button>
        ${pageButtonsHtml}
        <button onclick="window.MoviesPage.goToPage(${currentPage + 1})" ${nextDisabled} class="pagination-btn glass-panel text-slate-300 hover:text-white hover:border-[#ff5e1e]/40 ${nextDisabled}" title="Trang sau">
          <i class="fa-solid fa-chevron-right text-xs"></i>
        </button>
      </div>
    `;
  },

  /**
   * Chuyển trang
   */
  goToPage(page) {
    this.state.currentPage = page;
    this.applyFiltersAndRender();
    const grid = document.getElementById('movies-grid');
    if (grid && typeof grid.scrollIntoView === 'function') {
      grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  },

  /**
   * Helper dọn dẹp bộ lọc
   */
  clearSearch() {
    this.state.searchQuery = '';
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
    this.state.currentPage = 1;
    this.applyFiltersAndRender();
  },

  clearGenre() {
    this.state.selectedGenre = '';
    const genreSelect = document.getElementById('genre-select');
    if (genreSelect) genreSelect.value = '';
    this.state.currentPage = 1;
    this.applyFiltersAndRender();
  },

  resetFilter() {
    this.filterMovies('ALL', null);
  },

  resetAllFilters() {
    this.state.searchQuery = '';
    this.state.selectedGenre = '';
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
    const genreSelect = document.getElementById('genre-select');
    if (genreSelect) genreSelect.value = '';
    this.filterMovies('ALL', null);
  }
};

// Gán biến toàn cục hỗ trợ gọi inline từ HTML
window.MoviesPage = MoviesPage;
window.filterMovies = (status, btn) => MoviesPage.filterMovies(status, btn);
window.handleSearch = () => {
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    MoviesPage.state.searchQuery = (searchInput.value || '').trim().toLowerCase();
  }
  const genreSelect = document.getElementById('genre-select');
  if (genreSelect) {
    MoviesPage.state.selectedGenre = (genreSelect.value || '').trim().toLowerCase();
  }
  MoviesPage.state.currentPage = 1;
  MoviesPage.applyFiltersAndRender();
};

document.addEventListener('DOMContentLoaded', () => {
  MoviesPage.init();
});
