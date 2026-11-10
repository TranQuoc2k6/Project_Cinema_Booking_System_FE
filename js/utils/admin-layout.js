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
 * Toast Thông báo nhanh góc màn hình
 */
window.showToast = function (message, type = 'success') {
  let toastContainer = document.getElementById('admin-toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'admin-toast-container';
    toastContainer.style.cssText =
      'position: fixed; top: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px; pointer-events: none;';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  const bgColor = type === 'success' ? '#10b981' : type === 'danger' ? '#ef4444' : '#3b82f6';
  toast.style.cssText = `background: #1e293b; border-left: 4px solid ${bgColor}; color: #fff; padding: 12px 18px; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 8px; pointer-events: auto; animation: toastIn 0.3s ease;`;
  toast.innerHTML = `<span>${type === 'success' ? '✓' : type === 'danger' ? '✕' : 'ℹ'}</span> <span>${message}</span>`;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
};
