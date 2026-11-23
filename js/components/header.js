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

  // Tự động bảo đảm Mobile Navigation Toggle và Mobile Dropdown hoạt động trên mọi trang CHUẨN 100% GIỐNG INDEX
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

    mobileMenu.className = 'hidden lg:hidden px-4 pb-4 pt-1 border-t border-white/10 flex flex-col gap-1.5';

    const isIndex = pageKey === 'index';
    const isMovies = pageKey === 'movies';
    const isShowtimes = pageKey === 'showtimes';

    const activeCls = 'px-3 py-2 rounded-xl text-xs font-bold text-[#ff5e1e] bg-[#ff5e1e]/10 border border-[#ff5e1e]/20 flex items-center gap-2';
    const inactiveCls = 'px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 flex items-center gap-2 transition-colors';

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

    // 3. Gắn sự kiện đóng mở menu mobile
    if (toggleBtn && !toggleBtn._hasMobileListener) {
      toggleBtn._hasMobileListener = true;
      toggleBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        const isHidden = mobileMenu.classList.contains('hidden');
        if (isHidden) {
          mobileMenu.classList.remove('hidden');
          mobileMenu.classList.add('flex');
          toggleBtn.innerHTML = '<i class="fa-solid fa-xmark text-xs sm:text-sm text-[#ff5e1e]"></i>';
        } else {
          mobileMenu.classList.add('hidden');
          mobileMenu.classList.remove('flex');
          toggleBtn.innerHTML = '<i class="fa-solid fa-bars text-xs sm:text-sm"></i>';
        }
      });

      document.addEventListener('click', function (e) {
        if (!mobileMenu.contains(e.target) && !toggleBtn.contains(e.target) && !mobileMenu.classList.contains('hidden')) {
          mobileMenu.classList.add('hidden');
          mobileMenu.classList.remove('flex');
          toggleBtn.innerHTML = '<i class="fa-solid fa-bars text-xs sm:text-sm"></i>';
        }
      });
    }
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
        link.classList.add('text-[#ff5e1e]', 'font-semibold');
      } else {
        link.classList.remove('text-[#ff5e1e]', 'font-semibold', 'font-bold');
        link.classList.add('text-slate-300', 'font-medium');
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
        header.glass-panel {
          view-transition-name: main-header;
        }
        ::view-transition-old(root),
        ::view-transition-new(root) {
          animation-duration: 0.18s;
          animation-timing-function: cubic-bezier(0.2, 0, 0.2, 1);
        }
        header nav a {
          transition: color 0.18s ease, transform 0.18s ease;
        }
        header nav a:hover {
          transform: translateY(-1px);
        }
        @keyframes lumenFadeIn {
          from { opacity: 0.92; transform: translateY(2px); }
          to { opacity: 1; transform: translateY(0); }
        }
        main {
          animation: lumenFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `;
      document.head.appendChild(style);
    }

    const links = document.querySelectorAll('header nav a, header a.group, #mobile-nav-menu a');
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

    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href) {
        link.addEventListener('mouseenter', () => prefetchTarget(href), { passive: true });
        link.addEventListener('touchstart', () => prefetchTarget(href), { passive: true });
        link.addEventListener('focus', () => prefetchTarget(href), { passive: true });
      }
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
  };
  window.updateHeaderAuth = window.renderAppHeader;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.renderAppHeader);
  } else {
    window.renderAppHeader();
  }
})();
