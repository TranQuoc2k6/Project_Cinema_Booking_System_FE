/**
 * ==========================================================================
 * MOVIE DETAIL PAGE CONTROLLER (js/pages/movie-detail.js)
 * Hiển thị chi tiết phim, nhúng trailer YouTube, liên kết chọn suất chiếu
 * ==========================================================================
 */

const MovieDetailPage = {
  state: {
    movieId: null,
    movie: null,
    isLoading: true,
    error: null,
    errorType: null // 'NOT_FOUND' | 'NETWORK_ERROR' | 'MISSING_ID'
  },

  /**
   * Khởi tạo trang chi tiết phim
   */
  init() {
    this.updateAuthHeader();
    this.parseMovieId();
    if (this.state.movieId) {
      this.loadMovie();
    } else {
      this.renderMissingIdState();
    }
  },

  /**
   * Cập nhật thông tin đăng nhập trên Header
   */
  updateAuthHeader() {
    if (typeof window.renderAppHeader === 'function') {
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

  /**
   * Lấy Movie ID từ URL parameters (?id=... hoặc ?movieId=...)
   */
  parseMovieId() {
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get('id') || params.get('movieId');
    if (idParam && !isNaN(parseInt(idParam, 10))) {
      this.state.movieId = parseInt(idParam, 10);
    } else {
      this.state.movieId = null;
    }
  },

  /**
   * Gọi API tải thông tin chi tiết phim
   */
  async loadMovie() {
    const container = document.getElementById('movie-detail-content');
    if (!container) return;

    this.state.isLoading = true;
    this.renderLoadingState();

    try {
      if (!window.MovieService || typeof window.MovieService.getMovieById !== 'function') {
        throw new Error('MovieService chưa sẵn sàng');
      }

      const res = await window.MovieService.getMovieById(this.state.movieId);

      if (!res.success) {
        if (res.status === 404) {
          this.state.errorType = 'NOT_FOUND';
          this.state.error = 'Không tìm thấy bộ phim yêu cầu trong hệ thống.';
          this.renderNotFoundState();
          return;
        }
        throw new Error(res.message || 'Không thể tải thông tin bộ phim.');
      }

      this.state.movie = res.data;
      this.state.isLoading = false;
      this.state.error = null;
      this.renderMovieDetail();

    } catch (err) {
      console.error('[MovieDetailPage.loadMovie]', err);
      this.state.errorType = 'NETWORK_ERROR';
      this.state.error = err.message || 'Lỗi kết nối tới máy chủ API.';
      this.renderErrorState();
    }
  },

  /**
   * Chuyển đổi YouTube Watch URL sang YouTube Embed URL
   */
  getYouTubeEmbedUrl(url) {
    if (!url || typeof url !== 'string') return null;
    const trimmed = url.trim();
    if (!trimmed) return null;

    // Các định dạng YouTube phổ biến:
    // https://www.youtube.com/watch?v=VIDEO_ID
    // https://youtu.be/VIDEO_ID
    // https://www.youtube.com/embed/VIDEO_ID
    // https://m.youtube.com/watch?v=VIDEO_ID
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = trimmed.match(regExp);

    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1`;
    }

    if (trimmed.includes('youtube.com/embed/')) {
      return trimmed;
    }

    return null;
  },

  /**
   * Lấy danh sách thể loại phim (ưu tiên dữ liệu API, fallback mock data)
   */
  resolveGenres(movie) {
    // 1. Nếu API trả về mảng genres
    if (Array.isArray(movie.genres) && movie.genres.length > 0) {
      return movie.genres.map(g => (typeof g === 'string' ? g : g.name)).filter(Boolean);
    }

    // 2. Tra cứu danh sách fallback trong MovieService._mockMovies
    if (window.MovieService && Array.isArray(window.MovieService._mockMovies)) {
      const match = window.MovieService._mockMovies.find(m => m.id === movie.id);
      if (match && Array.isArray(match.genres) && match.genres.length > 0) {
        return match.genres;
      }
    }

    // 3. Fallback mặc định nếu chưa cập nhật
    return ['Điện Ảnh', 'Đặc Sắc'];
  },

  /**
   * Hiển thị trạng thái đang tải (Skeleton Loader)
   */
  renderLoadingState() {
    const container = document.getElementById('movie-detail-content');
    if (!container) return;

    container.innerHTML = `
      <div class="glass-panel-cinema p-6 sm:p-10 rounded-3xl border border-white/10 flex flex-col lg:flex-row gap-8 items-start animate-pulse">
        <!-- Skeleton Poster -->
        <div class="w-full lg:w-1/3 aspect-[2/3] max-w-[360px] mx-auto rounded-2xl skeleton-shimmer"></div>

        <!-- Skeleton Info -->
        <div class="w-full lg:w-2/3 flex flex-col gap-4">
          <div class="h-6 w-32 skeleton-shimmer rounded-md"></div>
          <div class="h-10 w-3/4 skeleton-shimmer rounded-xl"></div>
          <div class="flex gap-4">
            <div class="h-5 w-24 skeleton-shimmer rounded-md"></div>
            <div class="h-5 w-32 skeleton-shimmer rounded-md"></div>
          </div>
          <div class="flex gap-2 my-2">
            <div class="h-7 w-20 skeleton-shimmer rounded-lg"></div>
            <div class="h-7 w-24 skeleton-shimmer rounded-lg"></div>
            <div class="h-7 w-20 skeleton-shimmer rounded-lg"></div>
          </div>
          <div class="h-24 w-full skeleton-shimmer rounded-xl mt-2"></div>
          <div class="h-12 w-48 skeleton-shimmer rounded-xl mt-4"></div>
        </div>
      </div>
    `;
  },

  /**
   * Hiển thị giao diện chi tiết phim đầy đủ
   */
  renderMovieDetail() {
    const container = document.getElementById('movie-detail-content');
    if (!container || !this.state.movie) return;

    const movie = this.state.movie;

    // 1. Cập nhật tiêu đề trang
    document.title = `${movie.title} - Chi Tiết Phim | LUMEN CINEMA`;

    // 2. Cập nhật backdrop mờ phía sau
    const backdropEl = document.getElementById('movie-hero-backdrop');
    if (backdropEl && movie.poster_url) {
      backdropEl.style.backgroundImage = `url('${movie.poster_url}')`;
      backdropEl.style.opacity = '0.45';
    }

    // 3. Chuẩn hóa trạng thái phim
    const statusNormalized = (movie.status || '').toLowerCase();
    const isNowShowing = statusNormalized === 'now_showing' || statusNormalized === 'dang_chieu';
    const isComingSoon = statusNormalized === 'coming_soon' || statusNormalized === 'sap_chieu';
    const isEnded = statusNormalized === 'ended' || statusNormalized === 'ngung_chieu';

    let statusBadgeHtml = `
      <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black uppercase bg-slate-800 text-slate-300 border border-slate-700">
        <span class="w-2 h-2 rounded-full bg-slate-400"></span> Đã ngừng chiếu
      </span>
    `;
    let bookingBtnText = 'ĐÃ NGỪNG CHIẾU';
    let bookingBtnClass = 'opacity-60 cursor-not-allowed bg-slate-800 text-slate-400 border border-slate-700';
    let bookingBtnHref = 'javascript:void(0)';
    let bookingBtnDisabled = true;

    if (isNowShowing) {
      statusBadgeHtml = `
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black uppercase bg-[#d4ff00] text-[#0b0d12] shadow-[0_0_12px_rgba(212,255,0,0.5)]">
          <span class="w-2 h-2 rounded-full bg-[#0b0d12] animate-ping"></span> ĐANG CHIẾU RẠP
        </span>
      `;
      bookingBtnText = 'ĐẶT VÉ NGAY';
      bookingBtnClass = 'btn-book-tickets';
      bookingBtnHref = `showtimes.html?movieId=${movie.id}`;
      bookingBtnDisabled = false;
    } else if (isComingSoon) {
      statusBadgeHtml = `
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black uppercase bg-[#ff5e1e] text-white shadow-[0_0_12px_rgba(255,94,30,0.5)]">
          <i class="fa-solid fa-clock"></i> SẮP KHỞI CHIẾU
        </span>
      `;
      bookingBtnText = 'XEM LỊCH CHIẾU DỰ KIẾN';
      bookingBtnClass = 'btn-book-tickets bg-gradient-to-r from-[#ff5e1e] to-[#7c3aed]';
      bookingBtnHref = `showtimes.html?movieId=${movie.id}`;
      bookingBtnDisabled = false;
    }

    // 4. Định dạng thời lượng & ngày khởi chiếu
    const durationText = movie.duration_minutes
      ? (window.FormatUtil ? `${movie.duration_minutes} phút (${window.FormatUtil.duration(movie.duration_minutes)})` : `${movie.duration_minutes} phút`)
      : '120 phút';

    let releaseDateText = 'Đang cập nhật';
    if (movie.release_date) {
      releaseDateText = window.FormatUtil && typeof window.FormatUtil.formatDateDisplay === 'function'
        ? window.FormatUtil.formatDateDisplay(movie.release_date)
        : movie.release_date;
    }

    // 5. Thể loại phim
    const genres = this.resolveGenres(movie);
    const genreBadgesHtml = genres.map(g => `<span class="genre-badge">${g}</span>`).join('');

    // 6. Poster phim
    const posterUrl = movie.poster_url || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800';

    // 7. Nhúng Trailer YouTube qua iframe
    const embedTrailerUrl = this.getYouTubeEmbedUrl(movie.trailer_url);
    let trailerSectionHtml = '';

    if (embedTrailerUrl) {
      trailerSectionHtml = `
        <div class="mt-12 pt-10 border-t border-white/10" id="trailer-section">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl sm:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
              <span class="w-2.5 h-6 bg-gradient-to-b from-[#ff5e1e] to-[#d4ff00] rounded-full inline-block"></span>
              Trailer Chính Thức
            </h2>
            <span class="text-xs text-slate-400 flex items-center gap-1.5">
              <i class="fa-brands fa-youtube text-red-500 text-sm"></i> YouTube HD Embed
            </span>
          </div>

          <div class="trailer-frame-wrapper">
            <iframe 
              src="${embedTrailerUrl}" 
              title="Trailer phim ${movie.title}" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              allowfullscreen>
            </iframe>
          </div>
        </div>
      `;
    } else {
      trailerSectionHtml = `
        <div class="mt-12 pt-10 border-t border-white/10" id="trailer-section">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl sm:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
              <span class="w-2.5 h-6 bg-gradient-to-b from-[#ff5e1e] to-[#d4ff00] rounded-full inline-block"></span>
              Trailer Chính Thức
            </h2>
          </div>

          <div class="glass-card-cinema rounded-2xl p-8 sm:p-12 text-center border border-white/5 text-slate-400">
            <div class="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 text-2xl">
              <i class="fa-brands fa-youtube"></i>
            </div>
            <h4 class="text-sm font-bold text-slate-200">Trailer đang được cập nhật</h4>
            <p class="text-xs text-slate-500 mt-1">Video trailer chính thức của tác phẩm này sẽ sớm được tải lên hệ thống.</p>
          </div>
        </div>
      `;
    }

    // 8. Mô tả phim
    const movieDescription = movie.description || 'Nội dung chi tiết của bộ phim đang được ban biên tập LUMEN CINEMA cập nhật.';

    // 9. Render toàn bộ trang
    container.innerHTML = `
      <!-- Breadcrumb Navigation -->
      <nav class="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-6 flex-wrap">
        <a href="../index.html" class="hover:text-[#ff5e1e] transition-colors flex items-center gap-1">
          <i class="fa-solid fa-house text-[10px]"></i> Trang chủ
        </a>
        <span class="text-slate-600">/</span>
        <a href="movies.html" class="hover:text-[#ff5e1e] transition-colors">Phim Chiếu Rạp</a>
        <span class="text-slate-600">/</span>
        <span class="text-white truncate max-w-[200px] sm:max-w-none">${movie.title}</span>
      </nav>

      <!-- Main Movie Detail Panel -->
      <div class="glass-panel-cinema p-6 sm:p-10 rounded-3xl border border-white/10 relative z-10">
        <div class="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          
          <!-- Cột Trái: Poster phim & Nút hành động nhanh -->
          <div class="w-full lg:w-1/3 max-w-[380px] mx-auto shrink-0 flex flex-col gap-4">
            <div class="poster-container aspect-[2/3] bg-[#0b0d12]">
              <img 
                src="${posterUrl}" 
                alt="Poster phim ${movie.title}" 
                class="w-full h-full object-cover" 
                onerror="this.src='https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800'">
            </div>

            <!-- Nút Đặt Vé Chính (Desktop & Mobile) -->
            <a 
              href="${bookingBtnHref}" 
              id="btn-main-booking"
              class="w-full py-4 px-6 rounded-2xl text-center text-xs sm:text-sm font-black flex items-center justify-center gap-2.5 transition-all ${bookingBtnClass}"
              ${bookingBtnDisabled ? 'onclick="return false;"' : ''}>
              <i class="fa-solid fa-ticket text-base"></i>
              <span>${bookingBtnText}</span>
            </a>

            <!-- Nút phụ: Cuộn tới trailer & Chia sẻ -->
            <div class="flex gap-2">
              ${embedTrailerUrl ? `
                <a href="#trailer-section" class="flex-1 py-2.5 px-4 rounded-xl glass-card-cinema text-center text-xs font-bold text-slate-300 hover:text-white hover:border-[#ff5e1e]/50 transition-all flex items-center justify-center gap-2">
                  <i class="fa-solid fa-circle-play text-red-500"></i> Xem Trailer
                </a>
              ` : ''}
              <button 
                onclick="MovieDetailPage.shareMovie()" 
                class="px-4 py-2.5 rounded-xl glass-card-cinema text-center text-xs font-bold text-slate-300 hover:text-white hover:border-[#ff5e1e]/50 transition-all flex items-center justify-center gap-2"
                title="Sao chép liên kết chia sẻ">
                <i class="fa-solid fa-share-nodes text-cyan-400"></i>
                <span class="hidden sm:inline">Chia sẻ</span>
              </button>
            </div>
          </div>

          <!-- Cột Phải: Thông tin chi tiết phim -->
          <div class="w-full lg:w-2/3 flex flex-col justify-between">
            <div>
              <!-- Trạng thái & Phân loại định dạng -->
              <div class="flex items-center gap-3 mb-4 flex-wrap">
                ${statusBadgeHtml}
                <span class="px-2.5 py-1 rounded-md bg-[#7c3aed]/20 border border-[#7c3aed]/40 text-[#c4b5fd] text-[11px] font-black uppercase">
                  IMAX Laser 3D
                </span>
                <span class="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-slate-300 text-[11px] font-bold">
                  Phụ Đề & Lồng Tiếng
                </span>
              </div>

              <!-- Tên phim -->
              <h1 class="text-2xl sm:text-4xl lg:text-5xl font-black text-white uppercase tracking-tight mb-4 leading-tight">
                ${movie.title}
              </h1>

              <!-- Dải thông tin cơ bản: Thời lượng, Ngày chiếu, Đánh giá -->
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 p-4 rounded-2xl bg-[#0b0d12]/70 border border-white/5">
                <div class="flex flex-col">
                  <span class="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Thời lượng</span>
                  <span class="text-xs sm:text-sm font-bold text-slate-200 mt-0.5 flex items-center gap-1.5">
                    <i class="fa-regular fa-clock text-[#ff5e1e]"></i> ${durationText}
                  </span>
                </div>
                <div class="flex flex-col">
                  <span class="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Khởi chiếu</span>
                  <span class="text-xs sm:text-sm font-bold text-slate-200 mt-0.5 flex items-center gap-1.5">
                    <i class="fa-regular fa-calendar text-[#d4ff00]"></i> ${releaseDateText}
                  </span>
                </div>
                <div class="flex flex-col col-span-2 sm:col-span-1">
                  <span class="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Định dạng chiếu</span>
                  <span class="text-xs sm:text-sm font-bold text-slate-200 mt-0.5 flex items-center gap-1.5">
                    <i class="fa-solid fa-clapperboard text-[#7c3aed]"></i> 2D / 3D / ScreenX
                  </span>
                </div>
              </div>

              <!-- Thể loại phim -->
              <div class="mb-6">
                <span class="block text-[11px] uppercase font-bold text-slate-400 tracking-wider mb-2">
                  <i class="fa-solid fa-tags mr-1 text-[#ff5e1e]"></i> Thể loại
                </span>
                <div class="flex flex-wrap gap-2">
                  ${genreBadgesHtml}
                </div>
              </div>

              <!-- Mô tả / Tóm tắt nội dung phim -->
              <div class="mb-8">
                <span class="block text-[11px] uppercase font-bold text-slate-400 tracking-wider mb-2">
                  <i class="fa-solid fa-align-left mr-1 text-[#d4ff00]"></i> Nội dung phim
                </span>
                <p class="text-sm text-slate-300 leading-relaxed font-normal whitespace-pre-line bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                  ${movieDescription}
                </p>
              </div>

              <!-- Tiện ích & Trải nghiệm tại rạp -->
              <div class="p-4 rounded-2xl border border-white/5 bg-gradient-to-r from-white/[0.03] to-transparent flex items-center gap-4">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#ff5e1e] to-[#d4ff00] p-[2px] shrink-0">
                  <div class="w-full h-full bg-[#0b0d12] rounded-[10px] flex items-center justify-center">
                    <i class="fa-solid fa-volume-high text-[#d4ff00] text-sm"></i>
                  </div>
                </div>
                <div>
                  <h4 class="text-xs font-bold text-white">Âm thanh Dolby Atmos & Màn chiếu Cực đại</h4>
                  <p class="text-[11px] text-slate-400 mt-0.5">Trải nghiệm rạp chiếu chuẩn quốc tế với hệ thống ghế bọc da cao cấp và phục vụ bắp nước tại chỗ.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Section Nhúng Trailer YouTube -->
        ${trailerSectionHtml}

        <!-- Thanh Kêu Gọi Đặt Vé Cuối Trang -->
        <div class="mt-12 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#ff5e1e]/15 via-transparent to-[#7c3aed]/15 border border-[#ff5e1e]/30 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div class="text-center sm:text-left">
            <h3 class="text-base sm:text-lg font-black text-white uppercase">Sẵn sàng đắm chìm trong tác phẩm?</h3>
            <p class="text-xs text-slate-400 mt-1">Chọn suất chiếu phù hợp tại rạp gần bạn nhất và đặt giữ chỗ ngay hôm nay.</p>
          </div>
          <a 
            href="${bookingBtnHref}" 
            class="px-8 py-3.5 rounded-xl text-xs sm:text-sm font-black uppercase text-center shrink-0 ${bookingBtnClass}"
            ${bookingBtnDisabled ? 'onclick="return false;"' : ''}>
            <i class="fa-solid fa-ticket mr-1.5"></i> ${bookingBtnText}
          </a>
        </div>
      </div>
    `;
  },

  /**
   * Hiển thị giao diện khi không tìm thấy phim (404)
   */
  renderNotFoundState() {
    const container = document.getElementById('movie-detail-content');
    if (!container) return;

    document.title = 'Không Tìm Thấy Phim - LUMEN CINEMA';

    container.innerHTML = `
      <div class="glass-panel-cinema p-8 sm:p-14 rounded-3xl border border-white/10 text-center max-w-xl mx-auto my-10">
        <div class="w-20 h-20 mx-auto mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 text-3xl shadow-[0_0_25px_rgba(244,63,94,0.2)]">
          <i class="fa-solid fa-film"></i>
        </div>
        <h2 class="text-2xl font-black text-white uppercase tracking-tight mb-2">Không Tìm Thấy Phim</h2>
        <p class="text-xs sm:text-sm text-slate-400 mb-8 leading-relaxed">
          Bộ phim có mã <strong>#${this.state.movieId || ''}</strong> không tồn tại trong hệ thống hoặc đã bị gỡ khỏi danh mục chiếu rạp.
        </p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="movies.html" class="px-6 py-3 rounded-xl bg-gradient-to-r from-[#ff5e1e] to-[#ea580c] hover:brightness-110 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(255,94,30,0.4)] flex items-center justify-center gap-2">
            <i class="fa-solid fa-arrow-left"></i> Quay lại danh sách phim
          </a>
          <a href="../index.html" class="px-6 py-3 rounded-xl glass-card-cinema hover:bg-slate-800 text-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-2">
            <i class="fa-solid fa-house"></i> Về trang chủ
          </a>
        </div>
      </div>
    `;
  },

  /**
   * Hiển thị giao diện khi URL thiếu ID phim
   */
  renderMissingIdState() {
    const container = document.getElementById('movie-detail-content');
    if (!container) return;

    document.title = 'Chưa Chọn Phim - LUMEN CINEMA';

    container.innerHTML = `
      <div class="glass-panel-cinema p-8 sm:p-14 rounded-3xl border border-white/10 text-center max-w-xl mx-auto my-10">
        <div class="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#ff5e1e]/10 border border-[#ff5e1e]/30 flex items-center justify-center text-[#ff5e1e] text-3xl shadow-[0_0_25px_rgba(255,94,30,0.2)]">
          <i class="fa-solid fa-clapperboard"></i>
        </div>
        <h2 class="text-2xl font-black text-white uppercase tracking-tight mb-2">Chưa Chọn Bộ Phim Nào</h2>
        <p class="text-xs sm:text-sm text-slate-400 mb-8 leading-relaxed">
          Vui lòng chọn một bộ phim từ danh mục để xem thông tin chi tiết, trailer và lịch chiếu tương ứng.
        </p>
        <a href="movies.html" class="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#ff5e1e] to-[#ea580c] hover:brightness-110 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(255,94,30,0.4)]">
          <i class="fa-solid fa-film"></i> Khám phá danh sách phim
        </a>
      </div>
    `;
  },

  /**
   * Hiển thị giao diện khi API gặp sự cố kết nối
   */
  renderErrorState() {
    const container = document.getElementById('movie-detail-content');
    if (!container) return;

    document.title = 'Lỗi Kết Nối - LUMEN CINEMA';

    container.innerHTML = `
      <div class="glass-panel-cinema p-8 sm:p-14 rounded-3xl border border-[#ff5e1e]/30 text-center max-w-xl mx-auto my-10">
        <div class="w-20 h-20 mx-auto mb-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 text-3xl shadow-[0_0_25px_rgba(245,158,11,0.2)]">
          <i class="fa-solid fa-triangle-exclamation"></i>
        </div>
        <h2 class="text-2xl font-black text-white uppercase tracking-tight mb-2">Không Thể Kết Nối Máy Chủ</h2>
        <p class="text-xs sm:text-sm text-slate-400 mb-8 leading-relaxed">
          ${this.state.error || 'Đã có lỗi xảy ra khi kết nối tới máy chủ dữ liệu phim. Vui lòng kiểm tra lại dịch vụ Backend.'}
        </p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <button onclick="MovieDetailPage.loadMovie()" class="px-6 py-3 rounded-xl bg-gradient-to-r from-[#ff5e1e] to-[#ea580c] hover:brightness-110 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(255,94,30,0.4)] flex items-center justify-center gap-2">
            <i class="fa-solid fa-rotate-right"></i> Thử Lại
          </button>
          <a href="movies.html" class="px-6 py-3 rounded-xl glass-card-cinema hover:bg-slate-800 text-slate-300 text-xs font-bold transition-all flex items-center justify-center gap-2">
            <i class="fa-solid fa-arrow-left"></i> Về danh sách phim
          </a>
        </div>
      </div>
    `;
  },

  /**
   * Sao chép đường dẫn chia sẻ bộ phim vào Clipboard
   */
  shareMovie() {
    const shareUrl = window.location.href;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        this.showToast('Đã sao chép liên kết chia sẻ bộ phim!', 'success');
      }).catch(() => {
        this.showToast('Không thể sao chép liên kết.', 'warning');
      });
    } else {
      // Fallback cho môi trường không hỗ trợ Clipboard API
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      this.showToast('Đã sao chép liên kết chia sẻ bộ phim!', 'success');
    }
  },

  /**
   * Toast notification góc màn hình (không dùng alert())
   */
  showToast(message, type = 'info') {
    let container = document.getElementById('cinema-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'cinema-toast-container';
      container.className = 'fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const isSuccess = type === 'success';
    const isWarning = type === 'warning';
    const borderColor = isSuccess ? 'border-emerald-500/40' : isWarning ? 'border-amber-500/40' : 'border-[#ff5e1e]/40';
    const bgColor = 'bg-[#131722]/95';
    const icon = isSuccess ? 'fa-check text-emerald-400' : isWarning ? 'fa-triangle-exclamation text-amber-400' : 'fa-circle-info text-[#ff5e1e]';

    toast.className = `pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border ${borderColor} ${bgColor} text-xs font-semibold text-white shadow-xl backdrop-blur-md transform transition-all duration-300 translate-y-4 opacity-0`;
    toast.innerHTML = `
      <i class="fa-solid ${icon} text-sm shrink-0"></i>
      <span class="flex-1">${message}</span>
    `;

    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-4', 'opacity-0');
    });

    setTimeout(() => {
      toast.classList.add('translate-y-2', 'opacity-0');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
};

// Gán vào window để truy cập từ HTML
window.MovieDetailPage = MovieDetailPage;

// Khởi chạy khi tài liệu HTML sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
  MovieDetailPage.init();
});
