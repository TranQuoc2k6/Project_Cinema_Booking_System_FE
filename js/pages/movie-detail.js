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
    errorType: null, // 'NOT_FOUND' | 'NETWORK_ERROR' | 'MISSING_ID'
    reviews: {
      averageRating: 0.0,
      totalReviews: 0,
      ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      items: [],
      currentPage: 1,
      totalPages: 1,
      isLoading: false,
      eligibility: {
        checked: false,
        canReview: false,
        reason: '',
        hasReviewed: false,
        existingReview: null
      },
      selectedRating: 5,
      hoverRating: 0,
      commentText: '',
      isSubmitting: false,
      isEditing: false
    }
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
      if (res.data && res.data.average_rating !== undefined) {
        this.state.reviews.averageRating = Number(res.data.average_rating) || 0.0;
        this.state.reviews.totalReviews = Number(res.data.total_reviews) || 0;
      }
      this.state.isLoading = false;
      this.state.error = null;
      this.renderMovieDetail();
      this.loadReviews(1);
      this.checkReviewEligibility();

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

              <!-- Dải thông tin cơ bản: Thời lượng, Ngày chiếu, Đánh giá, Định dạng -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 p-4 rounded-2xl bg-[#0b0d12]/70 border border-white/5">
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
                <div class="flex flex-col">
                  <span class="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Đánh giá</span>
                  <a href="#movie-reviews-section" id="quick-rating-display" class="text-xs sm:text-sm font-bold text-amber-400 mt-0.5 flex items-center gap-1.5 hover:text-amber-300 transition-colors">
                    <i class="fa-solid fa-star text-amber-400"></i> ${this.getQuickRatingText()}
                  </a>
                </div>
                <div class="flex flex-col">
                  <span class="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Định dạng</span>
                  <span class="text-xs sm:text-sm font-bold text-slate-200 mt-0.5 flex items-center gap-1.5">
                    <i class="fa-solid fa-clapperboard text-[#7c3aed]"></i> 2D / 3D / IMAX
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

        <!-- Section Đánh Giá & Bình Luận Từ Khán Giả (Task T3C7300) -->
        <div id="movie-reviews-section" class="mt-12 pt-10 border-t border-white/10"></div>

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

    // Render khu vực Đánh giá & Bình luận
    this.renderReviewsSection();
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
   * ==========================================================================
   * MOVIE REVIEWS & RATINGS CONTROLLER METHODS (Task T3C7300)
   * ==========================================================================
   */

  /**
   * Escape HTML để ngăn ngừa tấn công XSS trong bình luận
   */
  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  /**
   * Định dạng ngày tạo đánh giá dạng dd/mm/yyyy
   */
  formatReviewDate(dateStr) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  },

  /**
   * Render các ngôi sao đánh giá HTML
   */
  renderStarsHtml(rating, max = 5, sizeClass = 'text-sm') {
    const num = Math.max(0, Math.min(5, Number(rating) || 0));
    let html = `<div class="inline-flex items-center gap-1 ${sizeClass}">`;
    for (let i = 1; i <= max; i++) {
      if (num >= i) {
        html += `<i class="fa-solid fa-star text-amber-400"></i>`;
      } else if (num >= i - 0.5) {
        html += `<i class="fa-solid fa-star-half-stroke text-amber-400"></i>`;
      } else {
        html += `<i class="fa-regular fa-star text-slate-600"></i>`;
      }
    }
    html += `</div>`;
    return html;
  },

  /**
   * Lấy nhãn mô tả số sao
   */
  getRatingLabel(star) {
    const labels = {
      1: '1 sao - Rất thất vọng',
      2: '2 sao - Dưới kỳ vọng',
      3: '3 sao - Xem được, tạm ổn',
      4: '4 sao - Rất hay, đáng xem',
      5: '5 sao - Tuyệt tác xuất sắc!'
    };
    return labels[star] || `${star} sao`;
  },

  /**
   * Hiển thị điểm đánh giá vắn tắt ở header dải thông tin phim
   */
  getQuickRatingText() {
    const { averageRating, totalReviews } = this.state.reviews;
    if (totalReviews > 0) {
      return `${Number(averageRating).toFixed(1)}/5 (${totalReviews})`;
    }
    return 'Chưa có đánh giá';
  },

  /**
   * Cập nhật hiển thị điểm nhanh ở header
   */
  updateQuickRatingDisplay() {
    const quickDisplay = document.getElementById('quick-rating-display');
    if (quickDisplay) {
      quickDisplay.innerHTML = `<i class="fa-solid fa-star text-amber-400"></i> ${this.getQuickRatingText()}`;
    }
  },

  /**
   * Khởi tạo khung giao diện Section Đánh giá & Bình luận
   */
  renderReviewsSection() {
    const section = document.getElementById('movie-reviews-section');
    if (!section) return;

    section.innerHTML = `
      <div class="space-y-8">
        <!-- Tiêu đề Section -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <h2 class="text-xl sm:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2.5">
              <i class="fa-solid fa-comments text-[#ff5e1e]"></i>
              Đánh Giá & Nhận Xét
            </h2>
            <p class="text-xs text-slate-400 mt-1">
              Nhận xét chân thực từ những khán giả đã mua vé và xem phim tại rạp Lumen Cinema
            </p>
          </div>
          <div id="reviews-header-count" class="text-xs text-slate-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 w-fit">
            Tổng cộng: <strong class="text-white">${this.state.reviews.totalReviews}</strong> đánh giá
          </div>
        </div>

        <!-- Khối Thống kê điểm & Biểu đồ phân bổ sao -->
        <div id="reviews-summary-container">
          ${this.renderReviewsSummaryHtml()}
        </div>

        <!-- Khối Quyền & Form gửi đánh giá của khán giả -->
        <div id="review-action-container">
          ${this.renderReviewActionAreaHtml()}
        </div>

        <!-- Khối Danh sách các bình luận -->
        <div id="reviews-list-container">
          ${this.renderReviewsListHtml()}
        </div>
      </div>
    `;

    this.bindStarPickerEvents();
  },

  /**
   * Tạo HTML khối thống kê điểm & phân bổ sao
   */
  renderReviewsSummaryHtml() {
    const { averageRating, totalReviews, ratingBreakdown } = this.state.reviews;
    const avgScore = Number(averageRating) || 0.0;

    let breakdownBarsHtml = '';
    for (let star = 5; star >= 1; star--) {
      const count = (ratingBreakdown && ratingBreakdown[star]) || 0;
      const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
      breakdownBarsHtml += `
        <div class="flex items-center gap-3 text-xs">
          <span class="w-12 text-slate-400 flex items-center gap-1 shrink-0 font-medium">
            ${star} <i class="fa-solid fa-star text-amber-400 text-[10px]"></i>
          </span>
          <div class="flex-1 rating-bar-track">
            <div class="rating-bar-fill" style="width: ${pct}%"></div>
          </div>
          <span class="w-14 text-right text-slate-400 text-[11px] shrink-0 font-medium">
            ${count} <span class="text-slate-500">(${pct}%)</span>
          </span>
        </div>
      `;
    }

    return `
      <div class="glass-panel-cinema p-6 sm:p-8 rounded-2xl border border-white/5">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <!-- Cột trái: Điểm trung bình to -->
          <div class="md:col-span-5 flex flex-col items-center justify-center text-center sm:border-r sm:border-white/10 sm:pr-6">
            <span class="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">Điểm đánh giá trung bình</span>
            <div class="text-5xl sm:text-6xl font-black text-white tracking-tight mb-3 flex items-baseline gap-1">
              <span class="text-amber-400">${avgScore.toFixed(1)}</span>
              <span class="text-2xl text-slate-500 font-semibold">/ 5</span>
            </div>
            <div class="mb-2">
              ${this.renderStarsHtml(avgScore, 5, 'text-lg')}
            </div>
            <span class="text-xs text-slate-400">
              Dựa trên <strong>${totalReviews}</strong> lượt đánh giá từ người xem đã xác thực
            </span>
          </div>

          <!-- Cột phải: Thanh phân bổ sao từ 5 xuống 1 -->
          <div class="md:col-span-7 flex flex-col gap-2.5">
            <span class="text-xs uppercase font-bold text-slate-400 tracking-wider mb-1">Chi tiết phân bổ sao</span>
            ${breakdownBarsHtml}
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Tạo HTML khu vực hành động của người dùng (Đăng nhập, Thông báo lý do, hoặc Form nhập đánh giá)
   */
  renderReviewActionAreaHtml() {
    const isAuth = window.StorageService ? window.StorageService.isAuthenticated() : false;
    const { eligibility, isEditing, selectedRating, commentText, isSubmitting } = this.state.reviews;

    // 1. Khách chưa đăng nhập
    if (!isAuth) {
      const currentUrl = (typeof window !== 'undefined' && window.location && window.location.href) ? window.location.href : '';
      const loginHref = currentUrl ? `login.html?redirect=${encodeURIComponent(currentUrl)}` : 'login.html';
      return `
        <div class="p-6 rounded-2xl bg-[#0b0d12]/70 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-[#ff5e1e]/10 border border-[#ff5e1e]/30 flex items-center justify-center text-[#ff5e1e] text-xl shrink-0">
              <i class="fa-solid fa-user-lock"></i>
            </div>
            <div>
              <h4 class="text-sm font-bold text-white">Bạn đã xem bộ phim này?</h4>
              <p class="text-xs text-slate-400 mt-0.5">Đăng nhập bằng tài khoản đặt vé để gửi cảm nhận và chấm điểm cho phim.</p>
            </div>
          </div>
          <a href="${loginHref}" class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#ff5e1e] to-[#ea580c] text-white text-xs font-bold hover:brightness-110 transition-all shrink-0 flex items-center gap-2 shadow-[0_0_15px_rgba(255,94,30,0.3)]">
            <i class="fa-solid fa-arrow-right-to-bracket"></i> Đăng Nhập Để Đánh Giá
          </a>
        </div>
      `;
    }

    // 2. Đang kiểm tra điều kiện
    if (!eligibility.checked) {
      return `
        <div class="p-5 rounded-2xl bg-[#0b0d12]/60 border border-white/5 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <i class="fa-solid fa-circle-notch fa-spin text-[#ff5e1e]"></i> Đang xác thực điều kiện xem phim của bạn...
        </div>
      `;
    }

    // 3. Người dùng đã từng đánh giá và KHÔNG ở chế độ chỉnh sửa
    if (eligibility.hasReviewed && !isEditing && eligibility.existingReview) {
      const rev = eligibility.existingReview;
      return `
        <div class="p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent border border-emerald-500/30">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div class="flex items-center gap-2">
              <span class="badge-owner-review">
                <i class="fa-solid fa-check"></i> Đánh giá của bạn
              </span>
              <span class="badge-verified-viewer">
                <i class="fa-solid fa-ticket"></i> Đã xem tại rạp
              </span>
            </div>
            <button onclick="MovieDetailPage.startEditReview()" class="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-all w-fit flex items-center gap-1.5 border border-white/10">
              <i class="fa-solid fa-pen-to-square text-[#ff5e1e]"></i> Chỉnh Sửa Đánh Giá
            </button>
          </div>
          <div class="flex items-center gap-3 mb-2">
            ${this.renderStarsHtml(rev.rating, 5, 'text-base')}
            <span class="text-xs font-bold text-amber-400">${this.getRatingLabel(rev.rating)}</span>
            <span class="text-[11px] text-slate-500">• ${this.formatReviewDate(rev.updated_at || rev.created_at)}</span>
          </div>
          <p class="text-xs sm:text-sm text-slate-200 leading-relaxed bg-[#0b0d12]/50 p-4 rounded-xl border border-white/5">
            ${this.escapeHtml(rev.comment)}
          </p>
        </div>
      `;
    }

    // 4. Khách hàng KHÔNG đủ điều kiện đánh giá (chưa mua vé / chưa thanh toán / suất chiếu chưa kết thúc)
    if (!eligibility.canReview && !eligibility.hasReviewed) {
      return `
        <div class="p-5 sm:p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3.5">
          <div class="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 text-base">
            <i class="fa-solid fa-circle-exclamation"></i>
          </div>
          <div class="flex-1">
            <h4 class="text-xs sm:text-sm font-bold text-white mb-1">Chưa Đủ Điều Kiện Đánh Giá Phim</h4>
            <p class="text-xs text-slate-300 leading-relaxed">
              ${eligibility.reason || 'Để đảm bảo tính khách quan và trung thực, hệ thống chỉ cho phép khán giả đã mua vé thành công và đã xem xong phim gửi đánh giá.'}
            </p>
          </div>
        </div>
      `;
    }

    // 5. Đủ điều kiện gửi mới HOẶC đang ở chế độ chỉnh sửa đánh giá
    const currentRating = selectedRating || 5;
    const currentComment = commentText || '';
    const charCount = currentComment.length;
    const btnLabel = isEditing ? 'Cập Nhật Đánh Giá' : 'Gửi Đánh Giá Của Bạn';
    const heading = isEditing ? 'Chỉnh Sửa Đánh Giá Của Bạn' : 'Viết Đánh Giá & Chia Sẻ Cảm Nhận';

    let starButtonsHtml = '';
    for (let s = 1; s <= 5; s++) {
      const activeClass = s <= currentRating ? 'active' : '';
      starButtonsHtml += `
        <button type="button" class="star-interactive-btn ${activeClass}" data-star="${s}" title="${this.getRatingLabel(s)}">
          <i class="fa-solid fa-star"></i>
        </button>
      `;
    }

    return `
      <form id="movie-review-form" onsubmit="MovieDetailPage.handleReviewSubmit(event)" class="glass-panel-cinema p-6 sm:p-8 rounded-2xl border border-[#ff5e1e]/30 space-y-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
          <div class="flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-lg bg-[#ff5e1e]/20 text-[#ff5e1e] flex items-center justify-center text-sm font-bold">
              <i class="fa-solid fa-pen-nib"></i>
            </span>
            <h4 class="text-sm sm:text-base font-bold text-white">${heading}</h4>
          </div>
          <span class="badge-verified-viewer w-fit">
            <i class="fa-solid fa-certificate"></i> Khán giả đã xác thực
          </span>
        </div>

        <!-- Chọn số sao -->
        <div>
          <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Chấm điểm số sao của bạn:
          </label>
          <div class="flex flex-wrap items-center gap-4">
            <div id="star-picker-container" class="star-rating-select">
              ${starButtonsHtml}
            </div>
            <span id="star-rating-label" class="text-xs font-bold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
              ${this.getRatingLabel(currentRating)}
            </span>
          </div>
        </div>

        <!-- Nhập lời bình luận -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label for="review-comment-input" class="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Bình luận nhận xét của bạn:
            </label>
            <span id="review-char-count" class="text-[11px] text-slate-500 font-mono">
              ${charCount} / 1000 ký tự
            </span>
          </div>
          <textarea
            id="review-comment-input"
            rows="4"
            maxlength="1000"
            placeholder="Chia sẻ trải nghiệm xem phim: diễn xuất, cốt truyện, kỹ xảo, âm thanh hoặc cảm xúc của bạn... (Tối thiểu 2 ký tự)"
            oninput="MovieDetailPage.handleCommentInput(this)"
            class="w-full bg-[#0b0d12]/80 border border-white/10 focus:border-[#ff5e1e] focus:ring-1 focus:ring-[#ff5e1e] rounded-xl p-3.5 text-xs sm:text-sm text-slate-200 placeholder-slate-500 outline-none transition-all resize-none"
          >${this.escapeHtml(currentComment)}</textarea>
        </div>

        <!-- Nút gửi & Hủy -->
        <div class="flex items-center justify-end gap-3 pt-2">
          ${isEditing ? `
            <button type="button" onclick="MovieDetailPage.cancelEditReview()" class="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-slate-300 transition-all">
              Hủy Bỏ
            </button>
          ` : ''}
          <button
            type="submit"
            id="submit-review-btn"
            ${isSubmitting ? 'disabled' : ''}
            class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#ff5e1e] to-[#ea580c] hover:brightness-110 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(255,94,30,0.3)] flex items-center gap-2">
            ${isSubmitting ? '<i class="fa-solid fa-circle-notch fa-spin"></i> Đang gửi...' : `<i class="fa-solid fa-paper-plane"></i> ${btnLabel}`}
          </button>
        </div>
      </form>
    `;
  },

  /**
   * Tạo HTML danh sách bình luận kèm phân trang
   */
  renderReviewsListHtml() {
    const { items, isLoading, currentPage, totalPages, totalReviews } = this.state.reviews;

    // Trạng thái đang tải
    if (isLoading) {
      return `
        <div class="space-y-4">
          ${[1, 2, 3].map(() => `
            <div class="review-card-item animate-pulse">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-full bg-slate-800"></div>
                <div class="space-y-1.5 flex-1">
                  <div class="w-28 h-3.5 bg-slate-800 rounded"></div>
                  <div class="w-20 h-2.5 bg-slate-800 rounded"></div>
                </div>
              </div>
              <div class="w-full h-12 bg-slate-800/60 rounded-xl"></div>
            </div>
          `).join('')}
        </div>
      `;
    }

    // Danh sách rỗng
    if (!items || items.length === 0) {
      return `
        <div class="glass-panel-cinema p-8 sm:p-12 rounded-2xl border border-white/5 text-center my-4">
          <div class="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 text-2xl">
            <i class="fa-regular fa-comment-dots"></i>
          </div>
          <h4 class="text-sm sm:text-base font-bold text-white mb-1">Chưa có bình luận nào</h4>
          <p class="text-xs text-slate-400 max-w-md mx-auto">
            Bộ phim này hiện chưa có nhận xét nào từ khán giả. Nếu bạn đã mua vé và xem phim, hãy chia sẻ cảm nhận đầu tiên của mình!
          </p>
        </div>
      `;
    }

    // Danh sách các thẻ bình luận
    const itemsHtml = items.map((rev) => {
      const avatarUrl = rev.user_avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100';
      const displayName = rev.user_name || 'Khán giả';
      const isOwner = rev.is_owner;
      const formattedDate = this.formatReviewDate(rev.created_at);

      return `
        <div class="review-card-item space-y-3">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <!-- Thông tin người dùng -->
            <div class="flex items-center gap-3">
              <img
                src="${avatarUrl}"
                alt="${this.escapeHtml(displayName)}"
                class="w-10 h-10 rounded-full border border-white/10 object-cover shrink-0"
                onerror="this.src='https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'"
              />
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-xs sm:text-sm font-bold text-white">${this.escapeHtml(displayName)}</span>
                  <span class="badge-verified-viewer">
                    <i class="fa-solid fa-check"></i> Đã xem phim
                  </span>
                  ${isOwner ? `
                    <span class="badge-owner-review">
                      <i class="fa-solid fa-user"></i> Của bạn
                    </span>
                  ` : ''}
                </div>
                <div class="flex items-center gap-2 mt-0.5">
                  ${this.renderStarsHtml(rev.rating, 5, 'text-xs')}
                  <span class="text-[11px] text-slate-500">• ${formattedDate}</span>
                </div>
              </div>
            </div>

            <!-- Nút sửa nếu là chủ sở hữu -->
            ${isOwner ? `
              <button onclick="MovieDetailPage.startEditReview()" class="self-end sm:self-center px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-semibold text-slate-300 hover:text-white transition-colors border border-white/10 flex items-center gap-1.5">
                <i class="fa-solid fa-pen-to-square text-[#ff5e1e]"></i> Sửa
              </button>
            ` : ''}
          </div>

          <!-- Nội dung nhận xét -->
          <p class="text-xs sm:text-sm text-slate-300 leading-relaxed pl-1 sm:pl-13 whitespace-pre-line">
            ${this.escapeHtml(rev.comment)}
          </p>
        </div>
      `;
    }).join('');

    // Điều khiển phân trang
    let paginationHtml = '';
    if (totalPages > 1) {
      let pageButtons = '';
      for (let p = 1; p <= totalPages; p++) {
        const isCurrent = p === currentPage;
        const pageBtnClass = isCurrent
          ? 'bg-gradient-to-r from-[#ff5e1e] to-[#ea580c] text-white font-bold'
          : 'bg-white/5 text-slate-300 hover:bg-white/10';
        pageButtons += `
          <button onclick="MovieDetailPage.loadReviews(${p})" class="w-8 h-8 rounded-lg text-xs transition-all ${pageBtnClass}">
            ${p}
          </button>
        `;
      }

      paginationHtml = `
        <div class="flex items-center justify-center gap-2 pt-4">
          <button
            onclick="MovieDetailPage.loadReviews(${currentPage - 1})"
            ${currentPage <= 1 ? 'disabled' : ''}
            class="px-3 h-8 rounded-lg bg-white/5 text-xs text-slate-300 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all">
            <i class="fa-solid fa-chevron-left"></i> Trước
          </button>
          ${pageButtons}
          <button
            onclick="MovieDetailPage.loadReviews(${currentPage + 1})"
            ${currentPage >= totalPages ? 'disabled' : ''}
            class="px-3 h-8 rounded-lg bg-white/5 text-xs text-slate-300 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all">
            Sau <i class="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      `;
    }

    return `
      <div class="space-y-4">
        <div class="flex items-center justify-between text-xs text-slate-400">
          <span>Tất cả đánh giá (${totalReviews})</span>
          <span>Trang ${currentPage} / ${totalPages}</span>
        </div>
        ${itemsHtml}
        ${paginationHtml}
      </div>
    `;
  },

  /**
   * Gắn sự kiện click & hover cho bộ chọn số sao
   */
  bindStarPickerEvents() {
    const container = document.getElementById('star-picker-container');
    if (!container) return;

    const buttons = container.querySelectorAll('.star-interactive-btn');
    buttons.forEach((btn) => {
      const star = parseInt(btn.getAttribute('data-star'), 10);

      btn.addEventListener('click', () => {
        this.setRating(star);
      });

      btn.addEventListener('mouseenter', () => {
        this.hoverRating(star);
      });

      btn.addEventListener('mouseleave', () => {
        this.resetHoverRating();
      });
    });
  },

  /**
   * Chọn số sao
   */
  setRating(star) {
    this.state.reviews.selectedRating = star;
    const label = document.getElementById('star-rating-label');
    if (label) {
      label.textContent = this.getRatingLabel(star);
    }

    const container = document.getElementById('star-picker-container');
    if (container) {
      const buttons = container.querySelectorAll('.star-interactive-btn');
      buttons.forEach((btn) => {
        const s = parseInt(btn.getAttribute('data-star'), 10);
        btn.classList.toggle('active', s <= star);
        btn.classList.remove('hovered');
      });
    }
  },

  /**
   * Hiệu ứng hover số sao
   */
  hoverRating(star) {
    const container = document.getElementById('star-picker-container');
    if (!container) return;

    const label = document.getElementById('star-rating-label');
    if (label) {
      label.textContent = this.getRatingLabel(star);
    }

    const buttons = container.querySelectorAll('.star-interactive-btn');
    buttons.forEach((btn) => {
      const s = parseInt(btn.getAttribute('data-star'), 10);
      btn.classList.toggle('hovered', s <= star);
    });
  },

  /**
   * Khôi phục trạng thái số sao đã chọn khi rê chuột ra ngoài
   */
  resetHoverRating() {
    const star = this.state.reviews.selectedRating || 5;
    const label = document.getElementById('star-rating-label');
    if (label) {
      label.textContent = this.getRatingLabel(star);
    }

    const container = document.getElementById('star-picker-container');
    if (container) {
      const buttons = container.querySelectorAll('.star-interactive-btn');
      buttons.forEach((btn) => {
        const s = parseInt(btn.getAttribute('data-star'), 10);
        btn.classList.remove('hovered');
        btn.classList.toggle('active', s <= star);
      });
    }
  },

  /**
   * Đếm ký tự khi người dùng nhập bình luận
   */
  handleCommentInput(textarea) {
    if (!textarea) return;
    this.state.reviews.commentText = textarea.value;
    const countDisplay = document.getElementById('review-char-count');
    if (countDisplay) {
      countDisplay.textContent = `${textarea.value.length} / 1000 ký tự`;
    }
  },

  /**
   * Bật chế độ chỉnh sửa đánh giá
   */
  startEditReview() {
    const { eligibility } = this.state.reviews;
    if (eligibility && eligibility.existingReview) {
      this.state.reviews.isEditing = true;
      this.state.reviews.selectedRating = eligibility.existingReview.rating || 5;
      this.state.reviews.commentText = eligibility.existingReview.comment || '';
    }
    const actionContainer = document.getElementById('review-action-container');
    if (actionContainer) {
      actionContainer.innerHTML = this.renderReviewActionAreaHtml();
      this.bindStarPickerEvents();
      actionContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  },

  /**
   * Hủy bỏ chế độ chỉnh sửa
   */
  cancelEditReview() {
    this.state.reviews.isEditing = false;
    const actionContainer = document.getElementById('review-action-container');
    if (actionContainer) {
      actionContainer.innerHTML = this.renderReviewActionAreaHtml();
    }
  },

  /**
   * Tải danh sách đánh giá từ API
   */
  async loadReviews(page = 1) {
    if (!this.state.movieId) return;

    this.state.reviews.isLoading = true;
    const listContainer = document.getElementById('reviews-list-container');
    if (listContainer) {
      listContainer.innerHTML = this.renderReviewsListHtml();
    }

    try {
      if (!window.ReviewService || typeof window.ReviewService.getMovieReviews !== 'function') {
        throw new Error('ReviewService chưa được tải');
      }

      const res = await window.ReviewService.getMovieReviews(this.state.movieId, page, 10);
      if (res.success && res.data) {
        this.state.reviews.averageRating = Number(res.data.average_rating) || 0.0;
        this.state.reviews.totalReviews = Number(res.data.total_reviews) || 0;
        this.state.reviews.ratingBreakdown = res.data.rating_breakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        this.state.reviews.items = res.data.items || [];
        this.state.reviews.currentPage = res.data.page || 1;
        this.state.reviews.totalPages = res.data.total_pages || 1;
      }
    } catch (err) {
      console.warn('[MovieDetailPage.loadReviews]', err);
    } finally {
      this.state.reviews.isLoading = false;

      // Cập nhật các khối giao diện liên quan
      this.updateQuickRatingDisplay();

      const summaryContainer = document.getElementById('reviews-summary-container');
      if (summaryContainer) {
        summaryContainer.innerHTML = this.renderReviewsSummaryHtml();
      }

      const headerCount = document.getElementById('reviews-header-count');
      if (headerCount) {
        headerCount.innerHTML = `Tổng cộng: <strong class="text-white">${this.state.reviews.totalReviews}</strong> đánh giá`;
      }

      const listCont = document.getElementById('reviews-list-container');
      if (listCont) {
        listCont.innerHTML = this.renderReviewsListHtml();
      }
    }
  },

  /**
   * Kiểm tra điều kiện người dùng có được phép đánh giá phim không
   */
  async checkReviewEligibility() {
    if (!this.state.movieId) return;

    const isAuth = window.StorageService ? window.StorageService.isAuthenticated() : false;
    if (!isAuth) {
      this.state.reviews.eligibility = {
        checked: true,
        canReview: false,
        reason: 'Vui lòng đăng nhập để đánh giá phim.',
        hasReviewed: false,
        existingReview: null
      };
      const actionContainer = document.getElementById('review-action-container');
      if (actionContainer) {
        actionContainer.innerHTML = this.renderReviewActionAreaHtml();
      }
      return;
    }

    try {
      if (!window.ReviewService || typeof window.ReviewService.checkEligibility !== 'function') {
        return;
      }

      const res = await window.ReviewService.checkEligibility(this.state.movieId);
      if (res.success && res.data) {
        this.state.reviews.eligibility = {
          checked: true,
          canReview: Boolean(res.data.can_review),
          reason: res.data.reason || '',
          hasReviewed: Boolean(res.data.has_reviewed),
          existingReview: res.data.existing_review || null
        };

        if (res.data.existing_review) {
          this.state.reviews.selectedRating = res.data.existing_review.rating || 5;
          this.state.reviews.commentText = res.data.existing_review.comment || '';
        }
      } else {
        this.state.reviews.eligibility = {
          checked: true,
          canReview: false,
          reason: res.data?.reason || res.message || 'Chưa thể xác thực điều kiện đánh giá.',
          hasReviewed: Boolean(res.data?.has_reviewed),
          existingReview: res.data?.existing_review || null
        };
      }
    } catch (err) {
      console.warn('[MovieDetailPage.checkReviewEligibility]', err);
      this.state.reviews.eligibility = {
        checked: true,
        canReview: false,
        reason: 'Không thể kết nối máy chủ để kiểm tra quyền đánh giá.',
        hasReviewed: false,
        existingReview: null
      };
    } finally {
      const actionContainer = document.getElementById('review-action-container');
      if (actionContainer) {
        actionContainer.innerHTML = this.renderReviewActionAreaHtml();
        this.bindStarPickerEvents();
      }
    }
  },

  /**
   * Xử lý gửi đánh giá (Tạo mới hoặc Cập nhật)
   */
  async handleReviewSubmit(event) {
    if (event) event.preventDefault();

    const { selectedRating, isSubmitting, isEditing } = this.state.reviews;
    const commentInput = document.getElementById('review-comment-input');
    const comment = commentInput ? commentInput.value.trim() : (this.state.reviews.commentText || '').trim();

    // 1. Validate rating
    const rating = parseInt(selectedRating, 10);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      this.showToast('Vui lòng chọn số sao đánh giá từ 1 đến 5.', 'warning');
      return;
    }

    // 2. Validate comment
    if (!comment || comment.length < 2) {
      this.showToast('Vui lòng nhập nội dung bình luận tối thiểu 2 ký tự.', 'warning');
      if (commentInput) commentInput.focus();
      return;
    }

    if (comment.length > 1000) {
      this.showToast('Nội dung bình luận không được vượt quá 1000 ký tự.', 'warning');
      return;
    }

    if (isSubmitting) return;

    this.state.reviews.isSubmitting = true;
    const submitBtn = document.getElementById('submit-review-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Đang lưu...';
    }

    try {
      let res;
      if (isEditing) {
        res = await window.ReviewService.updateReview(this.state.movieId, rating, comment);
      } else {
        res = await window.ReviewService.submitReview(this.state.movieId, rating, comment);
      }

      if (!res.success) {
        throw new Error(res.message || 'Gửi đánh giá không thành công.');
      }

      this.showToast(isEditing ? 'Cập nhật đánh giá thành công!' : 'Đã gửi đánh giá thành công! Cảm ơn bạn.', 'success');
      this.state.reviews.isEditing = false;
      this.state.reviews.commentText = '';

      // Tải lại danh sách đánh giá và cập nhật quyền
      await this.loadReviews(1);
      await this.checkReviewEligibility();

    } catch (err) {
      console.error('[MovieDetailPage.handleReviewSubmit]', err);
      this.showToast(err.message || 'Lỗi khi gửi đánh giá. Vui lòng thử lại.', 'error');
    } finally {
      this.state.reviews.isSubmitting = false;
      const btn = document.getElementById('submit-review-btn');
      if (btn) {
        btn.disabled = false;
      }
    }
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
   * Toast notification góc màn hình (ủy quyền cho hệ thống Toast toàn cục)
   */
  showToast(message, type = 'info') {
    if (typeof window.showToast === 'function') {
      window.showToast(message, type);
    }
  }
};

// Gán vào window để truy cập từ HTML
window.MovieDetailPage = MovieDetailPage;

// Khởi chạy khi tài liệu HTML sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
  MovieDetailPage.init();
});
