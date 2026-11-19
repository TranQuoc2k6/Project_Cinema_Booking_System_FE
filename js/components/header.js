/**
 * ==========================================================================
 * HEADER COMPONENT (js/components/header.js)
 * Tự động cập nhật Header theo trạng thái đăng nhập và vai trò người dùng:
 * - Khách (Chưa đăng nhập): Hiển thị nút "Đăng Nhập" & "Đăng Ký"
 * - Khách hàng (User): Hiển thị Avatar, Tên, Badge Thành viên, Menu Hồ sơ & Vé của tôi, Đăng xuất
 * - Quản trị viên (Admin): Hiển thị thêm Huy hiệu / Nút truy cập nhanh "Trang Quản Trị Admin"
 * ==========================================================================
 */

(function () {
  'use strict';

  function getPathPrefixes() {
    const pathname = window.location.pathname.replace(/\\/g, '/');
    const isPagesDir = pathname.includes('/pages/');
    const isAdminDir = pathname.includes('/pages/admin/') || pathname.includes('/admin/');

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
        <div class="flex items-center gap-3">
          <!-- Huy hiệu / Phím tắt Admin (nếu tài khoản là Admin) -->
          ${isAdmin ? `
            <a href="${prefixes.admin}dashboard.html" 
               class="px-3 py-1.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30 transition-all flex items-center gap-1.5 shadow-sm shadow-rose-500/20">
              <i class="fa-solid fa-shield text-xs"></i>
              <span class="hidden sm:inline">Admin Portal</span>
            </a>
          ` : ''}

          <!-- Dropdown Profile Người Dùng -->
          <div class="relative group" id="user-profile-dropdown">
            <button id="user-profile-menu-btn" 
                    type="button"
                    class="flex items-center gap-2.5 p-1 sm:p-1.5 pr-2.5 sm:pr-3 rounded-full glass-panel bg-slate-900/90 border border-slate-700/80 hover:border-[#ff5e1e]/60 transition-all cursor-pointer">
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
      // Khách chưa đăng nhập
      authSection.innerHTML = `
        <div class="flex items-center gap-2.5">
          <a href="${prefixes.pages}login.html" 
             class="px-4 py-2 rounded-full glass-panel text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-700/60 transition-all">
            Đăng Nhập
          </a>
          <a href="${prefixes.pages}register.html" 
             class="relative group p-[1px] rounded-full overflow-hidden focus:outline-none">
            <span class="absolute inset-0 bg-gradient-to-r from-[#ff5e1e] to-[#d4ff00] group-hover:opacity-100 transition-opacity"></span>
            <div class="relative px-4 py-2 rounded-full bg-[#0b0d12] flex items-center gap-2 text-xs font-semibold text-white group-hover:bg-[#131722] transition-colors">
              <i class="fa-solid fa-user-plus text-[#d4ff00]"></i>
              <span class="hidden sm:inline">Đăng Ký</span>
            </div>
          </a>
        </div>
      `;
    }
  }

  // Highlight menu link đang active
  function highlightActiveNav() {
    const pageKey = getCurrentPageKey();
    const navLinks = document.querySelectorAll('header nav a');
    if (!navLinks || navLinks.length === 0) return;

    navLinks.forEach(link => {
      const href = (link.getAttribute('href') || '').toLowerCase();
      let match = false;
      if (pageKey === 'index' && (href.endsWith('index.html') || href === '/' || href === './')) match = true;
      else if (pageKey === 'movies' && href.includes('movies.html')) match = true;
      else if (pageKey === 'showtimes' && href.includes('showtimes.html')) match = true;
      else if (pageKey === 'booking' && href.includes('booking.html')) match = true;
      else if (pageKey === 'my-tickets' && href.includes('my-tickets.html')) match = true;

      if (match) {
        link.classList.remove('text-slate-300', 'font-medium');
        link.classList.add('text-[#ff5e1e]', 'font-bold');
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
    highlightActiveNav();
  };
  window.updateHeaderAuth = window.renderAppHeader;

  document.addEventListener('DOMContentLoaded', window.renderAppHeader);
})();
