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
 * Toast Thông báo nhanh góc màn hình (Đồng bộ LUMEN CINEMA Design System)
 */
window.showToast = function (message, type = 'success', duration = 3500) {
  let toastContainer = document.getElementById('admin-toast-container') || document.getElementById('cinema-toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'admin-toast-container';
    toastContainer.style.cssText =
      'position: fixed; top: 20px; right: 20px; z-index: 999999; display: flex; flex-direction: column; gap: 10px; max-width: 420px; width: calc(100% - 40px); pointer-events: none;';
    document.body.appendChild(toastContainer);
  }

  const normalizedType = (type || 'success').toLowerCase();
  const theme = {
    success: { color: '#10b981', border: 'rgba(16, 185, 129, 0.6)', glow: 'rgba(16, 185, 129, 0.25)', icon: 'fa-solid fa-circle-check', title: 'Thành công' },
    danger: { color: '#f43f5e', border: 'rgba(244, 63, 94, 0.65)', glow: 'rgba(244, 63, 94, 0.25)', icon: 'fa-solid fa-circle-xmark', title: 'Lỗi' },
    error: { color: '#f43f5e', border: 'rgba(244, 63, 94, 0.65)', glow: 'rgba(244, 63, 94, 0.25)', icon: 'fa-solid fa-circle-xmark', title: 'Lỗi' },
    warning: { color: '#f59e0b', border: 'rgba(245, 158, 11, 0.65)', glow: 'rgba(245, 158, 11, 0.25)', icon: 'fa-solid fa-triangle-exclamation', title: 'Chú ý' },
    info: { color: '#ff5e1e', border: 'rgba(255, 94, 30, 0.6)', glow: 'rgba(255, 94, 30, 0.25)', icon: 'fa-solid fa-circle-info', title: 'Thông tin' }
  }[normalizedType] || { color: '#ff5e1e', border: 'rgba(255, 94, 30, 0.6)', glow: 'rgba(255, 94, 30, 0.25)', icon: 'fa-solid fa-circle-info', title: 'Thông báo' };

  const toast = document.createElement('div');
  toast.style.cssText = `background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid ${theme.border}; box-shadow: 0 16px 36px -8px rgba(0, 0, 0, 0.8), 0 0 20px ${theme.glow}; color: #f8fafc; padding: 12px 16px; border-radius: 14px; font-size: 13px; font-weight: 500; display: flex; align-items: flex-start; gap: 10px; pointer-events: auto; transform: translateY(-12px); opacity: 0; transition: all 0.26s cubic-bezier(0.16, 1, 0.3, 1); width: 100%; box-sizing: border-box;`;
  
  toast.innerHTML = `
    <div style="flex-shrink: 0; color: ${theme.color}; font-size: 1.1rem; margin-top: 1px;">
      <i class="${theme.icon}"></i>
    </div>
    <div style="flex: 1; min-width: 0;">
      <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: ${theme.color}; margin-bottom: 2px;">
        ${theme.title}
      </div>
      <div style="color: #cbd5e1; line-height: 1.4; word-break: break-word;">
        ${message}
      </div>
    </div>
    <button type="button" aria-label="Đóng" style="background: transparent; border: 0; color: #94a3b8; font-size: 13px; cursor: pointer; padding: 0 4px;" onclick="this.parentElement.remove()">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;

  toastContainer.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 260);
  }, duration);
};
