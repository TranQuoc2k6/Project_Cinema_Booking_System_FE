/**
 * ==========================================================================
 * HEADER COMPONENT (js/components/header.js)
 * Tự động cập nhật Header theo trạng thái đăng nhập và vai trò người dùng:
 * - Khách (Chưa đăng nhập): Hiển thị nút "Đăng Nhập" & "Đăng Ký"
 * - Khách hàng (User): Hiển thị Avatar, Tên, Badge Thành viên, Menu Hồ sơ & Vé của tôi, Đăng xuất
 * - Quản trị viên (Admin): Hiển thị thêm Huy hiệu / Nút truy cập nhanh "Trang Quản Trị Admin"
 * - Thanh navbar responsive trên Mobile chuẩn 100% giống index.html
 * ==========================================================================
 */

(function () {
  'use strict';

  function getPathPrefixes() {
    const pathname = window.location.pathname.replace(/\\/g, '/').toLowerCase();
    const isAdminDir = pathname.includes('/pages/admin/') || pathname.includes('/admin/');
    const isPagesDir = pathname.includes('/pages/');

    if (isAdminDir) {
      return {
        root: '../../',
        pages: '../',
        admin: './'
      };
    } else if (isPagesDir) {
      return {
        root: '../',
        pages: './',
        admin: './admin/'
      };
    }
    return {
      root: './',
      pages: 'pages/',
      admin: 'pages/admin/'
    };
  }

  function getCurrentPageKey() {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('movies.html')) return 'movies';
    if (path.includes('showtimes.html')) return 'showtimes';
    if (path.includes('booking.html')) return 'booking';
    if (path.includes('my-tickets.html')) return 'my-tickets';
    if (path.includes('payment.html')) return 'payment';
    if (path.includes('profile.html')) return 'profile';
    return 'index';
  }

  function renderHeaderAuth() {
    const authSection = document.getElementById('header-auth-section');
    if (!authSection) return;

    const prefixes = getPathPrefixes();
    const isAuth = window.StorageService ? window.StorageService.isAuthenticated() : !!(localStorage.getItem('cinema_access_token') || localStorage.getItem('token'));
    const user = window.StorageService ? window.StorageService.getUser() : null;
    const isAdmin = window.StorageService ? window.StorageService.isAdmin() : false;

    if (isAuth && user) {
      const avatar = user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80';
      const displayName = user.full_name || user.email || 'Thành viên';
      const roleLabel = isAdmin ? 'Quản Trị Viên' : 'Thành Viên LUMEN';

      authSection.innerHTML = `
        <div class="flex items-center gap-2 sm:gap-3">
          <!-- Huy hiệu / Phím tắt Admin (nếu tài khoản là Admin) -->
          ${isAdmin ? `
            <a href="${prefixes.admin}dashboard.html" 
               class="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30 transition-all flex items-center gap-1.5 shadow-sm shadow-rose-500/20">
              <i class="fa-solid fa-shield text-xs"></i>
              <span class="hidden sm:inline">Admin</span>
            </a>
          ` : ''}

          <!-- Dropdown Profile Người Dùng -->
          <div class="relative group" id="user-profile-dropdown">
            <button id="user-profile-menu-btn" 
                    type="button"
                    class="flex items-center gap-2 p-1 sm:p-1.5 pr-2 sm:pr-3 rounded-full glass-panel bg-slate-900/90 border border-slate-700/80 hover:border-[#ff5e1e]/60 transition-all cursor-pointer">
              <img src="${avatar}" 
                   alt="${displayName}" 
                   class="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-[#ff5e1e]/60 shadow-sm"
                   onerror="this.src='https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'">
              
              <div class="hidden sm:flex flex-col text-left">
                <span class="text-xs font-bold text-white max-w-[120px] truncate leading-tight">${displayName}</span>
                <span class="text-[9px] text-[#d4ff00] font-semibold tracking-wider uppercase">${roleLabel}</span>
              </div>
              
              <i class="fa-solid fa-chevron-down text-[10px] text-slate-400 group-hover:text-[#ff5e1e] group-hover:rotate-180 transition-transform"></i>
            </button>

            <!-- Menu Dropdown -->
            <div class="absolute right-0 mt-2 w-56 py-2 rounded-2xl glass-panel bg-[#0b0f19]/95 border border-slate-800 shadow-2xl backdrop-blur-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <!-- Header info trong dropdown -->
              <div class="px-4 py-2.5 border-b border-slate-800/80">
                <p class="text-xs font-bold text-white truncate">${displayName}</p>
                <p class="text-[11px] text-slate-400 truncate font-mono mt-0.5">${user.email || ''}</p>
              </div>

              <!-- Menu Items -->
              ${isAdmin ? `
                <a href="${prefixes.admin}dashboard.html" 
                   class="flex items-center gap-2.5 px-4 py-2.5 text-xs text-rose-400 hover:bg-rose-500/10 font-bold transition-colors">
                  <i class="fa-solid fa-chart-line w-4 text-center"></i>
                  <span>Trang Quản Trị Admin</span>
                </a>
              ` : ''}

              <a href="${prefixes.pages}profile.html" 
                 class="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800/50 font-medium transition-colors">
                <i class="fa-regular fa-user w-4 text-center text-[#d4ff00]"></i>
                <span>Hồ Sơ Cá Nhân</span>
              </a>

              <a href="${prefixes.pages}my-tickets.html" 
                 class="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800/50 font-medium transition-colors">
                <i class="fa-solid fa-ticket w-4 text-center text-[#ff5e1e]"></i>
                <span>Vé Của Tôi</span>
              </a>

              <a href="${prefixes.pages}ticket-check.html" 
                 class="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800/50 font-medium transition-colors">
                <i class="fa-solid fa-qrcode w-4 text-center text-[#d4ff00]"></i>
                <span>Soát Vé QR</span>
              </a>

              <div class="my-1 border-t border-slate-800/80"></div>

              <button type="button" 
                      onclick="window.handleUserLogout()" 
                      class="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 font-medium transition-colors text-left cursor-pointer">
                <i class="fa-solid fa-arrow-right-from-bracket w-4 text-center"></i>
                <span>Đăng Xuất</span>
              </button>
            </div>
          </div>
        </div>
      `;
    } else {
      // Khách chưa đăng nhập (Mobile: icon button viền gradient neon, sm+: pill có chữ)
      authSection.innerHTML = `
        <div class="flex items-center gap-1.5 sm:gap-2.5">
          <!-- Nút Đăng Nhập -->
          <a href="${prefixes.pages}login.html" 
             class="relative group p-[1px] rounded-full overflow-hidden focus:outline-none shrink-0" 
             title="Đăng Nhập">
            <span class="absolute inset-0 bg-gradient-to-r from-[#d4ff00] to-[#ff5e1e] opacity-80 group-hover:opacity-100 transition-opacity"></span>
            <div class="relative w-7 h-7 sm:w-auto sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-[#030508] flex items-center justify-center gap-1.5 text-xs font-semibold text-white group-hover:bg-[#0b0f19] transition-colors">
              <i class="fa-solid fa-arrow-right-to-bracket text-[#ff5e1e] text-xs"></i>
              <span class="hidden sm:inline whitespace-nowrap">Đăng Nhập</span>
            </div>
          </a>

          <!-- Nút Đăng Ký -->
          <a href="${prefixes.pages}register.html" 
             class="relative group p-[1px] rounded-full overflow-hidden focus:outline-none shrink-0" 
             title="Đăng Ký">
            <span class="absolute inset-0 bg-gradient-to-r from-[#ff5e1e] to-[#d4ff00] group-hover:opacity-100 transition-opacity"></span>
            <div class="relative w-7 h-7 sm:w-auto sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-[#030508] flex items-center justify-center gap-1.5 text-xs font-semibold text-white group-hover:bg-[#0b0f19] transition-colors">
              <i class="fa-solid fa-user-plus text-[#d4ff00] text-xs"></i>
              <span class="hidden sm:inline whitespace-nowrap">Đăng Ký</span>
            </div>
          </a>
        </div>
      `;
    }
  }

  // Âm thanh phản hồi xúc giác nhẹ (Audio Micro-UI Haptic Tone - Cinema Dual Harmonics)
  let navAudioCtx = null;
  function playNavSound() {
    try {
      if (!navAudioCtx) {
        navAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (navAudioCtx.state === 'suspended') {
        navAudioCtx.resume();
      }
      const now = navAudioCtx.currentTime;
      const osc1 = navAudioCtx.createOscillator();
      const osc2 = navAudioCtx.createOscillator();
      const gain = navAudioCtx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(540, now);
      osc1.frequency.exponentialRampToValueAtTime(720, now + 0.05);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(810, now);
      osc2.frequency.exponentialRampToValueAtTime(1080, now + 0.05);

      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.05);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(navAudioCtx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.05);
      osc2.stop(now + 0.05);
    } catch (e) {}
  }

  // Hiệu ứng sóng nước ánh sáng lan tỏa từ tọa độ ngón tay / chuột (Click Ripple Wave)
  function createRipple(e, target) {
    if (!target) return;
    try {
      const rect = target.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'nav-ripple-wave';

      const size = Math.max(rect.width, rect.height) * 2.2;
      const clickX = e && e.clientX ? e.clientX : (rect.left + rect.width / 2);
      const clickY = e && e.clientY ? e.clientY : (rect.top + rect.height / 2);
      const x = clickX - rect.left - size / 2;
      const y = clickY - rect.top - size / 2;

      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;

      target.appendChild(ripple);
      setTimeout(() => {
        if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
      }, 450);
    } catch (err) {}
  }

  // Đốm sáng trượt đa tầng dưới thanh điều hướng Desktop (Magnetic Sliding Pill)
  function setupMagneticNavPill() {
    const nav = document.querySelector('header nav');
    if (!nav) return;

    let pill = document.getElementById('nav-magnetic-pill');
    if (!pill) {
      pill = document.createElement('div');
      pill.id = 'nav-magnetic-pill';
      nav.style.position = 'relative';
      nav.insertBefore(pill, nav.firstChild);
    }

    const links = nav.querySelectorAll('a');
    let activeLink = nav.querySelector('a.nav-active') || nav.querySelector('a.font-semibold') || links[0];

    function movePillTo(target, isHover = false) {
      if (!target || !pill) return;
      const navRect = nav.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();

      if (targetRect.width === 0 || targetRect.height === 0) return;

      pill.style.opacity = '1';
      pill.style.width = `${targetRect.width}px`;
      pill.style.height = `${targetRect.height}px`;
      pill.style.left = `${targetRect.left - navRect.left}px`;
      pill.style.top = `${targetRect.top - navRect.top}px`;

      if (isHover) {
        pill.classList.add('pill-hover');
      } else {
        pill.classList.remove('pill-hover');
      }
    }

    if (activeLink) {
      requestAnimationFrame(() => movePillTo(activeLink, false));
      setTimeout(() => movePillTo(activeLink, false), 80);
      setTimeout(() => movePillTo(activeLink, false), 280);
    }

    links.forEach(link => {
      link.addEventListener('mouseenter', () => movePillTo(link, true));
    });

    nav.addEventListener('mouseleave', () => {
      activeLink = nav.querySelector('a.nav-active') || nav.querySelector('a.font-semibold') || links[0];
      if (activeLink) {
        movePillTo(activeLink, false);
      }
    });

    window.addEventListener('resize', () => {
      activeLink = nav.querySelector('a.nav-active') || nav.querySelector('a.font-semibold') || links[0];
      if (activeLink) movePillTo(activeLink, false);
    });
  }

  // Tải trước siêu tốc trong nền (Speculation Rules API - 0ms Prerendering)
  function initSpeculationRules() {
    try {
      if (HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules')) {
        if (document.getElementById('lumen-speculation-rules')) return;
        const prefixes = getPathPrefixes();
        const specScript = document.createElement('script');
        specScript.id = 'lumen-speculation-rules';
        specScript.type = 'speculationrules';
        specScript.textContent = JSON.stringify({
          prerender: [
            {
              source: 'list',
              urls: [
                `${prefixes.root}index.html`,
                `${prefixes.pages}movies.html`,
                `${prefixes.pages}showtimes.html`
              ],
              eagerness: 'immediate'
            }
          ]
        });
        document.head.appendChild(specScript);
      }
    } catch (e) {}
  }

  // Thanh tiến trình tải trang Neon (Lumen Top Progress Bar)
  function showProgressBar() {
    let bar = document.getElementById('lumen-nav-progress');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'lumen-nav-progress';
      document.body.appendChild(bar);
    }
    bar.className = '';
    void bar.offsetWidth; // Force reflow
    bar.className = 'loading';
  }

  function completeProgressBar() {
    const bar = document.getElementById('lumen-nav-progress');
    if (bar) {
      bar.className = 'complete';
      setTimeout(() => {
        if (bar && bar.parentNode) {
          bar.parentNode.removeChild(bar);
        }
      }, 350);
    }
  }

  const prefetchedUrls = new Set();
  function prefetchTarget(href) {
    if (!href || prefetchedUrls.has(href) || href.startsWith('#') || href.startsWith('javascript:')) return;
    prefetchedUrls.add(href);
    const prefetchLink = document.createElement('link');
    prefetchLink.rel = 'prefetch';
    prefetchLink.href = href;
    prefetchLink.as = 'document';
    document.head.appendChild(prefetchLink);
  }

  // Tự động bảo đảm Mobile Navigation Toggle và Mobile Dropdown hoạt động mượt mà trên mọi trang
  function setupMobileNavigation() {
    const headerEl = document.querySelector('header');
    if (!headerEl) return;

    const prefixes = getPathPrefixes();
    const pageKey = getCurrentPageKey();

    // 1. Kiểm tra hoặc chèn nút Hamburger toggle
    let toggleBtn = document.getElementById('mobile-nav-toggle');
    const authSection = document.getElementById('header-auth-section');

    if (!toggleBtn && authSection) {
      toggleBtn = document.createElement('button');
      toggleBtn.id = 'mobile-nav-toggle';
      toggleBtn.type = 'button';
      toggleBtn.setAttribute('aria-label', 'Mở menu');
      toggleBtn.className = 'lg:hidden flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl glass-pill text-slate-300 hover:text-white border border-white/10 hover:border-[#ff5e1e]/50 transition-colors shrink-0 cursor-pointer';
      toggleBtn.innerHTML = '<i class="fa-solid fa-bars text-xs sm:text-sm"></i>';
      authSection.parentNode.appendChild(toggleBtn);
    }

    // 2. Kiểm tra hoặc chèn Mobile Menu Dropdown (Chuẩn 100% 3 mục như index.html)
    let mobileMenu = document.getElementById('mobile-nav-menu');
    if (!mobileMenu) {
      mobileMenu = document.createElement('div');
      mobileMenu.id = 'mobile-nav-menu';
      headerEl.appendChild(mobileMenu);
    }

    mobileMenu.classList.remove('hidden');
    if (!mobileMenu.classList.contains('menu-open')) {
      mobileMenu.classList.add('menu-closed');
    }
    mobileMenu.className = 'menu-closed lg:hidden px-4 border-t border-white/10 flex flex-col gap-1.5';

    const isIndex = pageKey === 'index';
    const isMovies = pageKey === 'movies';
    const isShowtimes = pageKey === 'showtimes';

    const activeCls = 'px-3 py-2 rounded-xl text-xs font-bold text-[#ff5e1e] bg-[#ff5e1e]/10 border border-[#ff5e1e]/20 flex items-center gap-2 nav-active';
    const inactiveCls = 'px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 flex items-center gap-2 transition-all';

    mobileMenu.innerHTML = `
      <a href="${prefixes.root}index.html" class="${isIndex ? activeCls : inactiveCls}">
        <i class="fa-solid fa-house w-4 text-center"></i> Trang chủ
      </a>
      <a href="${prefixes.pages}movies.html" class="${isMovies ? activeCls : inactiveCls}">
        <i class="fa-solid fa-film w-4 text-center text-cyan-400"></i> Phim Chiếu Rạp
      </a>
      <a href="${prefixes.pages}showtimes.html" class="${isShowtimes ? activeCls : inactiveCls}">
        <i class="fa-solid fa-calendar-days w-4 text-center text-[#d4ff00]"></i> Lịch Chiếu Phim
      </a>
    `;

    function openMobileMenu() {
      mobileMenu.classList.remove('menu-closed');
      mobileMenu.classList.add('menu-open');
      if (toggleBtn) {
        toggleBtn.innerHTML = '<i class="fa-solid fa-xmark text-xs sm:text-sm text-[#ff5e1e] transition-transform duration-300 rotate-90 scale-110"></i>';
      }
    }

    function closeMobileMenu() {
      mobileMenu.classList.remove('menu-open');
      mobileMenu.classList.add('menu-closed');
      if (toggleBtn) {
        toggleBtn.innerHTML = '<i class="fa-solid fa-bars text-xs sm:text-sm text-slate-300 transition-transform duration-300 rotate-0"></i>';
      }
    }

    // 3. Gắn sự kiện đóng mở menu mobile mượt mà
    if (toggleBtn && !toggleBtn._hasMobileListener) {
      toggleBtn._hasMobileListener = true;
      toggleBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        playNavSound();
        const isOpen = mobileMenu.classList.contains('menu-open');
        if (isOpen) {
          closeMobileMenu();
        } else {
          openMobileMenu();
        }
      });

      document.addEventListener('click', function (e) {
        if (!mobileMenu.contains(e.target) && !toggleBtn.contains(e.target) && mobileMenu.classList.contains('menu-open')) {
          closeMobileMenu();
        }
      });

      window.addEventListener('resize', function () {
        if (window.innerWidth >= 1024 && mobileMenu.classList.contains('menu-open')) {
          closeMobileMenu();
        }
      });
    }

    window._closeLumenMobileMenu = closeMobileMenu;
  }

  function highlightActiveNav() {
    const pageKey = getCurrentPageKey();
    
    // Highlight trên desktop nav
    const desktopLinks = document.querySelectorAll('header nav a');
    desktopLinks.forEach(link => {
      const href = (link.getAttribute('href') || '').toLowerCase();
      let match = false;
      if (pageKey === 'index' && (href.endsWith('index.html') || href === './' || href === '../index.html' || href === 'index.html')) match = true;
      else if (pageKey === 'movies' && href.includes('movies.html')) match = true;
      else if (pageKey === 'showtimes' && href.includes('showtimes.html')) match = true;
      else if (pageKey === 'booking' && href.includes('booking.html')) match = true;
      else if (pageKey === 'my-tickets' && href.includes('my-tickets.html')) match = true;
      else if (pageKey === 'profile' && href.includes('profile.html')) match = true;

      if (match) {
        link.classList.remove('text-slate-300', 'font-medium');
        link.classList.add('text-[#ff5e1e]', 'font-semibold', 'nav-active');
      } else {
        link.classList.remove('text-[#ff5e1e]', 'font-semibold', 'font-bold', 'nav-active');
        link.classList.add('text-slate-300', 'font-medium');
      }
    });

    // Highlight trên mobile nav
    const mobileLinks = document.querySelectorAll('#mobile-nav-menu a');
    mobileLinks.forEach(link => {
      const href = (link.getAttribute('href') || '').toLowerCase();
      let match = false;
      if (pageKey === 'index' && (href.endsWith('index.html') || href === './' || href === '../index.html' || href === 'index.html')) match = true;
      else if (pageKey === 'movies' && href.includes('movies.html')) match = true;
      else if (pageKey === 'showtimes' && href.includes('showtimes.html')) match = true;

      if (match) {
        link.classList.add('nav-active');
      } else {
        link.classList.remove('nav-active');
      }
    });
  }

  // Tối ưu hóa chuyển đổi mượt mà giữa các trang (Smooth Navigation & Instant Prefetching)
  function setupSmoothNavigation() {
    if (!document.getElementById('lumen-view-transition-meta')) {
      const meta = document.createElement('meta');
      meta.id = 'lumen-view-transition-meta';
      meta.name = 'view-transition';
      meta.content = 'same-origin';
      document.head.appendChild(meta);
    }

    const prefixes = getPathPrefixes();
    if (!document.querySelector('link[rel="icon"]')) {
      const fav = document.createElement('link');
      fav.rel = 'icon';
      fav.type = 'image/png';
      fav.href = `${prefixes.root}assets/images/logo/favicon.png`;
      document.head.appendChild(fav);
    }

    if (!document.getElementById('lumen-nav-transition-styles')) {
      const style = document.createElement('style');
      style.id = 'lumen-nav-transition-styles';
      style.textContent = `
        @view-transition {
          navigation: auto;
        }
        header.glass-panel, #main-header, header {
          view-transition-name: main-header;
        }
        #main-footer, footer {
          view-transition-name: main-footer;
        }
        ::view-transition-old(root) {
          animation: 0.16s cubic-bezier(0.2, 0, 0.2, 1) both lumenFadeOut;
        }
        ::view-transition-new(root) {
          animation: 0.22s cubic-bezier(0.16, 1, 0.3, 1) both lumenFadeIn;
        }
        @keyframes lumenFadeOut {
          from { opacity: 1; transform: scale(1); }
          to { opacity: 0; transform: scale(0.992); }
        }
        @keyframes lumenFadeIn {
          from { opacity: 0; transform: scale(1.008); }
          to { opacity: 1; transform: scale(1); }
        }

        /* Thanh tiến trình Neon phát sáng chạy trên đỉnh màn hình khi bấm chuyển trang */
        #lumen-nav-progress {
          position: fixed;
          top: 0;
          left: 0;
          width: 0%;
          height: 3px;
          background: linear-gradient(90deg, #ff5e1e 0%, #ea580c 50%, #d4ff00 100%);
          box-shadow: 0 0 14px rgba(255, 94, 30, 0.95), 0 0 28px rgba(212, 255, 0, 0.8);
          z-index: 999999;
          pointer-events: none;
          opacity: 1;
          transition: width 0.28s cubic-bezier(0.12, 0.85, 0.25, 1), opacity 0.2s ease;
        }
        #lumen-nav-progress.loading {
          width: 85%;
        }
        #lumen-nav-progress.complete {
          width: 100%;
          opacity: 0;
        }

        /* Sóng nước xúc giác lan tỏa khi chạm/click */
        .nav-ripple-wave {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 94, 30, 0.5) 0%, rgba(212, 255, 0, 0.25) 45%, transparent 70%);
          transform: scale(0);
          animation: navRippleScale 0.45s cubic-bezier(0.1, 0.8, 0.25, 1) forwards;
          pointer-events: none;
          z-index: 10;
        }
        @keyframes navRippleScale {
          0% {
            transform: scale(0);
            opacity: 0.9;
          }
          100% {
            transform: scale(3);
            opacity: 0;
          }
        }

        /* Magnetic Sliding Pill (Đốm sáng trượt đa tầng dưới thanh điều hướng Desktop) */
        #nav-magnetic-pill {
          position: absolute;
          border-radius: 9999px;
          background: linear-gradient(90deg, rgba(255, 94, 30, 0.18), rgba(212, 255, 0, 0.12));
          border: 1px solid rgba(255, 94, 30, 0.35);
          box-shadow: 0 0 16px rgba(255, 94, 30, 0.22), inset 0 0 8px rgba(255, 94, 30, 0.12);
          pointer-events: none;
          z-index: 1;
          opacity: 0;
          transition: left 0.26s cubic-bezier(0.16, 1, 0.3, 1),
                      top 0.26s cubic-bezier(0.16, 1, 0.3, 1),
                      width 0.26s cubic-bezier(0.16, 1, 0.3, 1),
                      height 0.26s cubic-bezier(0.16, 1, 0.3, 1),
                      opacity 0.2s ease,
                      border-color 0.2s ease;
        }
        #nav-magnetic-pill.pill-hover {
          background: linear-gradient(90deg, rgba(255, 94, 30, 0.24), rgba(212, 255, 0, 0.16));
          border-color: rgba(255, 94, 30, 0.55);
          box-shadow: 0 0 20px rgba(255, 94, 30, 0.35), inset 0 0 12px rgba(255, 94, 30, 0.18);
        }

        /* Menu Mobile mở/đóng bằng Accordion trượt mượt mà kèm Fade và Scale */
        #mobile-nav-menu {
          display: flex !important;
          flex-direction: column;
          transition: max-height 0.35s cubic-bezier(0.16, 1, 0.3, 1),
                      opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1),
                      transform 0.32s cubic-bezier(0.16, 1, 0.3, 1),
                      padding 0.25s ease,
                      border-color 0.25s ease !important;
          overflow: hidden;
          will-change: max-height, opacity, transform;
        }
        #mobile-nav-menu.menu-closed {
          max-height: 0 !important;
          opacity: 0 !important;
          transform: translateY(-10px) scale(0.97) !important;
          pointer-events: none !important;
          padding-top: 0 !important;
          padding-bottom: 0 !important;
          border-top-color: transparent !important;
        }
        #mobile-nav-menu.menu-open {
          max-height: 280px !important;
          opacity: 1 !important;
          transform: translateY(0) scale(1) !important;
          pointer-events: auto !important;
          padding-top: 0.35rem !important;
          padding-bottom: 1rem !important;
          border-top-color: rgba(255, 255, 255, 0.1) !important;
        }
        @media (min-width: 1024px) {
          #mobile-nav-menu {
            display: none !important;
          }
        }

        /* Tinh chỉnh nút menu Desktop sang trọng */
        header nav a {
          position: relative;
          z-index: 2;
          padding: 6px 14px;
          border-radius: 9999px;
          transition: color 0.2s ease, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          display: inline-flex;
          align-items: center;
          gap: 6px;
          user-select: none;
          cursor: pointer;
          overflow: hidden;
        }
        header nav a:hover {
          color: #ffffff;
          transform: translateY(-1px);
        }
        header nav a:active,
        header nav a.nav-clicked {
          transform: scale(0.93);
        }
        header nav a.nav-active {
          color: #ff5e1e !important;
          font-weight: 700;
        }

        /* Nút menu Mobile phản hồi xúc giác mượt mà khi nhấn */
        #mobile-nav-menu a {
          position: relative;
          overflow: hidden;
          transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1),
                      background-color 0.2s ease,
                      border-color 0.2s ease,
                      box-shadow 0.2s ease;
          user-select: none;
          cursor: pointer;
        }
        #mobile-nav-menu a:hover {
          transform: translateX(4px);
        }
        #mobile-nav-menu a:active,
        #mobile-nav-menu a.nav-clicked {
          transform: scale(0.96);
          background: rgba(255, 94, 30, 0.25) !important;
          border-color: rgba(255, 94, 30, 0.5) !important;
        }
        #mobile-nav-menu a.nav-active {
          color: #ff5e1e !important;
          background: rgba(255, 94, 30, 0.14) !important;
          border: 1px solid rgba(255, 94, 30, 0.3) !important;
          box-shadow: 0 0 15px rgba(255, 94, 30, 0.18);
          font-weight: 700;
        }

        /* Chuyển động nhẹ nhàng khi tải trang mới */
        @keyframes lumenFadeIn {
          from { opacity: 0.88; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        main {
          animation: lumenFadeIn 0.26s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `;
      document.head.appendChild(style);
    }

    // Hoàn thành thanh tiến trình nếu có từ lần tải trước
    completeProgressBar();

    // Gắn hiệu ứng mượt khi nhấp vào menu Phim Chiếu, Lịch Chiếu, Trang Chủ
    const pageKey = getCurrentPageKey();
    const navLinks = document.querySelectorAll('header nav a, #mobile-nav-menu a, #btn-hud-book');

    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href) {
        link.addEventListener('mouseenter', () => prefetchTarget(href), { passive: true });
        link.addEventListener('touchstart', () => prefetchTarget(href), { passive: true });
        link.addEventListener('focus', () => prefetchTarget(href), { passive: true });
      }

      if (link._hasSmoothClick) return;
      link._hasSmoothClick = true;

      link.addEventListener('click', function (e) {
        if (e.ctrlKey || e.metaKey || e.shiftKey) return;

        const targetHref = link.getAttribute('href');
        if (!targetHref || targetHref.startsWith('#') || targetHref.startsWith('javascript:')) return;

        const lowerHref = targetHref.toLowerCase();
        let isCurrentPage = false;

        if (pageKey === 'movies' && lowerHref.includes('movies.html')) isCurrentPage = true;
        else if (pageKey === 'showtimes' && lowerHref.includes('showtimes.html')) isCurrentPage = true;
        else if (pageKey === 'index' && (lowerHref.endsWith('index.html') || lowerHref === './' || lowerHref === 'index.html')) isCurrentPage = true;

        playNavSound();
        createRipple(e, link);
        link.classList.add('nav-clicked');
        setTimeout(() => link.classList.remove('nav-clicked'), 300);

        // Nếu người dùng đang đứng ở chính trang đó: cuộn êm lên đầu trang (Smooth Scroll)
        if (isCurrentPage) {
          e.preventDefault();
          if (window._closeLumenMobileMenu) {
            window._closeLumenMobileMenu();
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }

        // Chuyển trang mượt mà tức thì 0ms độ trễ
        e.preventDefault();
        showProgressBar();

        if (window._closeLumenMobileMenu) {
          window._closeLumenMobileMenu();
        }

        requestAnimationFrame(() => {
          window.location.href = targetHref;
        });
      });
    });
  }

  // Xử lý sự kiện đăng xuất người dùng
  window.handleUserLogout = function () {
    if (confirm('Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?')) {
      if (window.AuthService && typeof window.AuthService.logout === 'function') {
        const prefixes = getPathPrefixes();
        window.AuthService.logout(`${prefixes.root}index.html`);
      } else if (window.StorageService) {
        window.StorageService.clearAuth();
        const prefixes = getPathPrefixes();
        window.location.href = `${prefixes.root}index.html`;
      } else {
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
      }
    }
  };

  // Xuất API toàn cục
  window.renderAppHeader = function () {
    renderHeaderAuth();
    setupMobileNavigation();
    highlightActiveNav();
    setupSmoothNavigation();
    setupMagneticNavPill();
    initSpeculationRules();
  };
  window.updateHeaderAuth = window.renderAppHeader;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.renderAppHeader);
  } else {
    window.renderAppHeader();
  }
})();
