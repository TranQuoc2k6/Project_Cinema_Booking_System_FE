/**
 * ==========================================================================
 * ADMIN LAYOUT SHARED CONTROLLER
 * Quản lý Sidebar cố định, Top Header, Admin Profile & Navigation
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', function () {
  initAdminProfile();
  highlightActiveMenu();
  initMobileSidebar();
  initLogoutButtons();
  initModalDismissHandlers();
});

/**
 * 1. Nạp thông tin Admin đang đăng nhập vào Header và Sidebar
 */
function initAdminProfile() {
  const user = window.AdminAuth ? window.AdminAuth.getUser() : null;
  const adminNameElements = document.querySelectorAll('.admin-display-name, .admin-name');
  const adminAvatarElements = document.querySelectorAll('.admin-avatar');
  const adminRoleElements = document.querySelectorAll('.admin-role-badge');

  if (user) {
    const displayName = user.full_name || user.email || 'Quản trị viên';
    const avatarUrl = user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80';

    adminNameElements.forEach(el => {
      el.textContent = displayName;
    });

    adminAvatarElements.forEach(img => {
      img.src = avatarUrl;
      img.alt = displayName;
    });

    adminRoleElements.forEach(badge => {
      badge.textContent = 'Quản trị viên (Admin)';
    });
  }
}

/**
 * 2. Tự động highlight mục menu hiện tại trên Sidebar
 */
function highlightActiveMenu() {
  const currentPath = window.location.pathname.toLowerCase();
  const navLinks = document.querySelectorAll('.admin-sidebar .nav-item');

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href) {
      const pageName = href.split('/').pop().toLowerCase();
      if (currentPath.includes(pageName)) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    }
  });
}

/**
 * 3. Hỗ trợ đóng mở Sidebar trên thiết bị di động
 */
function initMobileSidebar() {
  const toggleBtn = document.querySelector('.mobile-menu-toggle');
  const sidebar = document.querySelector('.admin-sidebar');
  let backdrop = document.querySelector('.sidebar-backdrop');

  if (!backdrop && sidebar) {
    backdrop = document.createElement('div');
    backdrop.className = 'sidebar-backdrop';
    document.body.appendChild(backdrop);
  }

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', function () {
      sidebar.classList.toggle('show');
      if (backdrop) backdrop.classList.toggle('show');
    });
  }

  if (backdrop && sidebar) {
    backdrop.addEventListener('click', function () {
      sidebar.classList.remove('show');
      backdrop.classList.remove('show');
    });
  }
}

/**
 * 4. Bắt sự kiện Đăng xuất (Logout)
 */
function initLogoutButtons() {
  const logoutButtons = document.querySelectorAll('.btn-admin-logout, .btn-sidebar-logout');
  logoutButtons.forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      if (window.AdminAuth) {
        window.AdminAuth.logout();
      }
    });
  });
}

/**
 * 5. Tự động đóng Modal khi bấm phím ESC hoặc bấm ra ngoài Backdrop/Overlay
 */
function initModalDismissHandlers() {
  document.addEventListener('click', function (e) {
    if (e.target.classList.contains('modal-backdrop') || e.target.classList.contains('modal-overlay')) {
      e.target.classList.remove('show');
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      const openModals = document.querySelectorAll('.modal-backdrop.show, .modal-overlay.show');
      openModals.forEach(m => m.classList.remove('show'));
    }
  });
}

/**
 * Toast Thông báo nhanh góc màn hình:
 * Sử dụng hệ thống chuẩn toàn cục từ js/utils/toast.js (window.showToast).
 */
if (typeof window.showToast !== 'function') {
  window.showToast = function (message, type = 'info') {
    console.log(`[Toast ${type}] ${message}`);
  };
}
