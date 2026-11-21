/**
 * ==========================================================================
 * MOVIES PAGE CONTROLLER (js/pages/movies.js)
 * Quản lý trang Danh sách phim: Tải từ API, tìm kiếm, lọc theo trạng thái
 * ==========================================================================
 */

const MoviesPage = {
  state: {
    allMovies: [],
    currentFilter: 'ALL', // 'ALL' | 'now_showing' | 'coming_soon'
    searchQuery: '',
    selectedGenre: '',
    isLoading: false
  },

  init() {
    this.updateAuthHeader();
    this.bindEvents();
    this.fetchMovies();
  },

  updateAuthHeader() {
    if (window.renderAppHeader) {
      window.renderAppHeader();
      return;
    }
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

  bindEvents() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.state.searchQuery = e.target.value.trim().toLowerCase();
        this.applyFiltersAndRender();
      });
    }

    const genreSelect = document.getElementById('genre-select');
    if (genreSelect) {
      genreSelect.addEventListener('change', (e) => {
        this.state.selectedGenre = e.target.value.trim().toLowerCase();
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

  async fetchMovies() {
    const grid = document.getElementById('movies-grid');
    if (!grid) return;

    this.state.isLoading = true;
    grid.innerHTML = `
      <div class="col-span-full py-20 text-center">
        <div class="inline-flex flex-col items-center gap-3">
          <i class="fa-solid fa-circle-notch fa-spin text-3xl text-[#ff5e1e]"></i>
          <span class="text-sm font-medium text-slate-400">Đang tải danh sách phim từ hệ thống...</span>
        </div>
      </div>
    `;

    try {
      if (!window.MovieService || typeof window.MovieService.getMovies !== 'function') {
        throw new Error('MovieService chưa sẵn sàng');
      }

      const res = await window.MovieService.getMovies();

      if (!res.success) {
        throw new Error(res.message || 'Không thể lấy dữ liệu phim từ máy chủ');
      }

      this.state.allMovies = Array.isArray(res.data) ? res.data : [];
      this.populateGenreOptions();
      this.applyFiltersAndRender();
    } catch (error) {
      console.error('[MoviesPage.fetchMovies]', error);
      grid.innerHTML = `
        <div class="col-span-full py-16 text-center">
          <div class="max-w-md mx-auto p-6 rounded-2xl glass-panel border border-[#ff5e1e]/30">
            <i class="fa-solid fa-triangle-exclamation text-3xl text-[#ff5e1e] mb-3"></i>
            <h3 class="text-base font-bold text-white mb-1">Không thể tải danh sách phim</h3>
            <p class="text-xs text-slate-400 mb-4">${error.message || 'Vui lòng kiểm tra kết nối API Backend hoặc thử lại sau.'}</p>
            <button onclick="window.MoviesPage.fetchMovies()" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ff5e1e] to-[#ea580c] hover:brightness-110 text-white text-xs font-bold transition-all shadow-[0_0_12px_rgba(255,94,30,0.4)]">
              <i class="fa-solid fa-rotate-right mr-1.5"></i> Thử Lại
            </button>
          </div>
        </div>
      `;
    } finally {
      this.state.isLoading = false;
    }
  },

  populateGenreOptions() {
    const genreSelect = document.getElementById('genre-select');
    if (!genreSelect) return;

    // Trích xuất thể loại từ dữ liệu phim (nếu có trường genres)
    const genreSet = new Set();
    this.state.allMovies.forEach((m) => {
      if (Array.isArray(m.genres)) {
        m.genres.forEach((g) => {
          const name = typeof g === 'string' ? g : g.name;
          if (name) genreSet.add(name);
        });
      }
    });

    if (genreSet.size > 0) {
      let optionsHtml = '<option value="">Tất cả thể loại</option>';
      genreSet.forEach((genre) => {
        optionsHtml += `<option value="${genre}">${genre}</option>`;
      });
      genreSelect.innerHTML = optionsHtml;
    }
  },

  filterMovies(status, btnElement) {
    this.state.currentFilter = status;

    const allButtons = document.querySelectorAll('.filter-btn');
    allButtons.forEach((b) => {
      b.className = 'filter-btn px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors';
    });

    if (btnElement) {
      btnElement.className = 'filter-btn px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#ff5e1e] to-[#ea580c] text-white shadow-[0_0_15px_rgba(255,94,30,0.4)]';
    }

    this.applyFiltersAndRender();
  },

  applyFiltersAndRender() {
    const { allMovies, currentFilter, searchQuery, selectedGenre } = this.state;

    const filtered = allMovies.filter((movie) => {
      // 1. Lọc theo trạng thái phim (so sánh không phân biệt hoa/thường)
      let matchStatus = true;
      if (currentFilter !== 'ALL') {
        const movieStatus = (movie.status || '').toLowerCase();
        const filterVal = currentFilter.toLowerCase();
        matchStatus = movieStatus === filterVal;
      }

      // 2. Lọc theo từ khóa tìm kiếm (tên phim, mô tả)
      let matchSearch = true;
      if (searchQuery) {
        const title = (movie.title || '').toLowerCase();
        const desc = (movie.description || '').toLowerCase();
        matchSearch = title.includes(searchQuery) || desc.includes(searchQuery);
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

    this.renderMovies(filtered);
  },

  renderMovies(list) {
    const grid = document.getElementById('movies-grid');
    if (!grid) return;

    if (!list || list.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full py-16 text-center text-slate-400">
          <div class="inline-flex flex-col items-center gap-3">
            <i class="fa-solid fa-film text-4xl text-slate-600"></i>
            <p class="text-sm font-semibold text-slate-300">Không tìm thấy bộ phim nào phù hợp.</p>
            <p class="text-xs text-slate-500">Hãy thử đổi từ khóa tìm kiếm hoặc chọn bộ lọc trạng thái khác.</p>
          </div>
        </div>
      `;
      return;
    }

    grid.innerHTML = list.map((movie) => {
      const statusNormalized = (movie.status || '').toLowerCase();
      const isNowShowing = statusNormalized === 'now_showing';
      const isComingSoon = statusNormalized === 'coming_soon';

      let statusBadge = `
        <span class="absolute top-3 left-3 bg-slate-700 text-slate-200 text-[10px] font-black px-2 py-0.5 rounded shadow-[0_0_10px_rgba(0,0,0,0.5)]">
          NGỪNG CHIẾU
        </span>
      `;
      if (isNowShowing) {
        statusBadge = `
          <span class="absolute top-3 left-3 bg-[#d4ff00] text-[#0b0d12] text-[10px] font-black px-2 py-0.5 rounded shadow-[0_0_10px_rgba(0,0,0,0.5)]">
            ĐANG CHIẾU
          </span>
        `;
      } else if (isComingSoon) {
        statusBadge = `
          <span class="absolute top-3 left-3 bg-[#ff5e1e] text-white text-[10px] font-black px-2 py-0.5 rounded shadow-[0_0_10px_rgba(0,0,0,0.5)]">
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
        <div class="glass-card rounded-2xl overflow-hidden border border-slate-800 hover:-translate-y-2 transition-all duration-300 flex flex-col group">
          <div class="relative h-[320px] overflow-hidden bg-[#0b0d12]">
            <img src="${poster}" alt="${movie.title}" onerror="this.src='https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600'" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
            ${statusBadge}
          </div>
          <div class="p-4 bg-[#131722] flex-1 flex flex-col justify-between">
            <div>
              <h4 class="text-base font-bold text-white truncate group-hover:text-[#ff5e1e] transition-colors" title="${movie.title}">
                ${movie.title}
              </h4>
              <div class="flex items-center justify-between text-xs text-slate-400 mt-1 mb-2">
                <span><i class="fa-regular fa-clock mr-1 text-[#ff5e1e]"></i> ${durationText}</span>
                <span>${releaseDateText}</span>
              </div>
              <p class="text-xs text-slate-400 line-clamp-2 leading-relaxed">${description}</p>
            </div>
            <div class="flex gap-2 mt-4 pt-3 border-t border-white/5">
              <a href="movie-detail.html?id=${movie.id}" class="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold text-center border border-white/10 transition-colors">
                Chi tiết
              </a>
              <a href="showtimes.html?movieId=${movie.id}" class="flex-1 py-2 rounded-xl bg-gradient-to-r from-[#ff5e1e] to-[#ea580c] hover:brightness-110 text-white text-xs font-bold text-center shadow-[0_0_12px_rgba(255,94,30,0.4)] transition-all">
                Đặt vé
              </a>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
};

// Gán vào window để tương thích tốt với code HTML
window.MoviesPage = MoviesPage;
window.filterMovies = (status, btn) => MoviesPage.filterMovies(status, btn);
window.handleSearch = () => MoviesPage.applyFiltersAndRender();

document.addEventListener('DOMContentLoaded', () => {
  MoviesPage.init();
});
