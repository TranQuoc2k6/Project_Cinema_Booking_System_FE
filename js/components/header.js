/**
 * ==========================================================================
 * HEADER COMPONENT (js/components/header.js)
 * Tự động render Header, hiển thị trạng thái đăng nhập, profile & nút đăng xuất
 * ==========================================================================
 */

function renderAppHeader() {
  const headerContainer = document.getElementById('app-header') || document.querySelector('.home-navbar');
  if (!headerContainer) return;

  const isAuth = window.StorageService ? window.StorageService.isAuthenticated() : false;
  const user = window.StorageService ? window.StorageService.getUser() : null;
  const isAdmin = window.StorageService ? window.StorageService.isAdmin() : false;

  // Xác định tiền tố đường dẫn tương đối (đang ở trang gốc hay thư mục pages/)
  const isPagesDir = window.location.pathname.includes('/pages/');
  const rootPrefix = isPagesDir ? '../' : './';
  const pagesPrefix = isPagesDir ? './' : 'pages/';

  let authHtml = '';

  if (isAuth && user) {
    const avatar = user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80';
    const displayName = user.full_name || user.email || 'Người dùng';
    const roleBadge = isAdmin ? '<span class="badge badge-danger" style="font-size: 10px; margin-left: 4px;">ADMIN</span>' : '';

    authHtml = `
      <div style="display: flex; align-items: center; gap: 14px;">
        ${isAdmin ? `
          <a href="${pagesPrefix}admin/dashboard.html" class="btn btn-outline-primary btn-sm">
            <span>🛡️</span> Quản trị Admin
          </a>
        ` : ''}

        <div class="user-profile-menu" style="display: flex; align-items: center; gap: 10px; position: relative;">
          <img src="${avatar}" alt="Avatar" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border-light);">
          <div style="display: flex; flex-direction: column;">
            <div style="font-size: 13px; font-weight: 600; color: #fff; display: flex; align-items: center;">
              ${displayName} ${roleBadge}
            </div>
            <span style="font-size: 11px; color: var(--text-muted);">${user.email}</span>
          </div>

          <button type="button" class="btn btn-secondary btn-sm" onclick="handleUserLogout()" title="Đăng xuất" style="margin-left: 6px; padding: 6px 12px;">
            <span>🚪</span> Đăng xuất
          </button>
        </div>
      </div>
    `;
  } else {
    authHtml = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <a href="${pagesPrefix}login.html" class="btn btn-secondary btn-sm">
          <span>🔐</span> Đăng nhập
        </a>
        <a href="${pagesPrefix}register.html" class="btn btn-primary btn-sm">
          <span>✨</span> Đăng ký
        </a>
      </div>
    `;
  }

  headerContainer.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
      <a href="${rootPrefix}index.html" style="text-decoration: none; display: flex; align-items: center; gap: 10px;">
        <div style="font-size: 26px;">🎬</div>
        <div>
          <strong style="font-size: 18px; color: #fff; letter-spacing: 0.5px;">CINEMA BOOKING</strong>
          <span style="font-size: 11px; color: var(--color-primary); display: block; font-weight: 600;">HỆ THỐNG ĐẶT VÉ TRỰC TUYẾN</span>
        </div>
      </a>
    </div>

    <div style="display: flex; align-items: center; gap: 16px;">
      ${authHtml}
    </div>
  `;
}

// Xử lý sự kiện bấm Đăng xuất
window.handleUserLogout = function () {
  if (confirm('Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?')) {
    if (window.AuthService) {
      window.AuthService.logout();
    } else if (window.StorageService) {
      window.StorageService.clearAuth();
      window.location.reload();
    }
  }
};

document.addEventListener('DOMContentLoaded', renderAppHeader);
