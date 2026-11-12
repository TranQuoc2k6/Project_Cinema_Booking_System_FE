/**
 * ==========================================================================
 * FRONTEND ROUTE GUARD - CHẶN NGƯỜI DÙNG KHÔNG PHẢI ADMIN (NON-ADMIN)
 * Cinema Booking System - Admin Portal
 * ==========================================================================
 * Script này được nạp ngay ở đầu trang (<head>) của toàn bộ các trang Admin.
 * Tác dụng:
 * 1. Ngăn chặn tuyệt đối việc người dùng thường hoặc khách vãng lai truy cập.
 * 2. Kiểm tra JWT Token và Vai trò (Role) trong localStorage/sessionStorage.
 * 3. Nếu không phải Admin -> Ngay lập tức redirect về trang Đăng nhập kèm thông báo.
 */

(function () {
  'use strict';

  // Hàm xác định đường dẫn trang login phù hợp dựa theo URL hiện tại
  function getLoginUrl() {
    const pathname = window.location.pathname.replace(/\\/g, '/');
    if (pathname.includes('/pages/admin/')) {
      return '../login.html';
    } else if (pathname.includes('/admin/')) {
      return '../login.html';
    } else if (pathname.includes('/pages/')) {
      return './login.html';
    }
    return 'pages/login.html';
  }

  // Hàm chuyển hướng về Login và dọn dẹp phiên không hợp lệ
  function blockAndRedirect(errorMessage) {
    console.warn('[FE ROUTE GUARD] Access Denied:', errorMessage);
    
    // Lưu thông báo vào sessionStorage để trang login hiển thị alert box đẹp mắt
    sessionStorage.setItem('auth_error', errorMessage);

    // Chuyển hướng ngay lập tức (KHÔNG dùng alert() chặn luồng để tránh vòng lặp popup của trình duyệt)
    window.location.replace(getLoginUrl());
  }

  // 1. Kiểm tra Token
  const token =
    (window.StorageService && window.StorageService.getToken()) ||
    localStorage.getItem('cinema_access_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('access_token') ||
    sessionStorage.getItem('cinema_access_token');

  // 2. Kiểm tra thông tin User
  const userJson =
    (window.StorageService && JSON.stringify(window.StorageService.getUser())) ||
    localStorage.getItem('cinema_user_info') ||
    localStorage.getItem('user') ||
    localStorage.getItem('cinema_user') ||
    sessionStorage.getItem('cinema_user_info');

  if (!token || !userJson) {
    blockAndRedirect('Vui lòng đăng nhập với tài khoản Quản trị viên (Admin) để tiếp tục!');
    return;
  }

  let user = null;
  try {
    user = typeof userJson === 'object' ? userJson : JSON.parse(userJson);
  } catch (err) {
    if (window.StorageService) window.StorageService.clearAuth();
    blockAndRedirect('Dữ liệu phiên đăng nhập bị lỗi. Vui lòng đăng nhập lại.');
    return;
  }

  if (!user) {
    blockAndRedirect('Không tìm thấy thông tin tài khoản.');
    return;
  }

  // 3. Chuẩn hóa kiểm tra vai trò (Role)
  let userRole = '';
  if (typeof user.role === 'string') {
    userRole = user.role.trim().toLowerCase();
  } else if (user.role && typeof user.role === 'object' && user.role.name) {
    userRole = user.role.name.trim().toLowerCase();
  }

  const roleId = Number(user.role_id);
  const isAdmin = userRole === 'admin' || roleId === 1;

  // 4. Chặn tuyệt đối nếu không phải admin (FE Chặn Non-Admin)
  if (!isAdmin) {
    blockAndRedirect(
      'Quyền truy cập bị từ chối! Tài khoản "' +
        (user.email || 'này') +
        '" không có quyền truy cập vào Khu vực Quản trị hệ thống (Admin Portal).'
    );
    return;
  }

  // 5. Kiểm tra tài khoản có bị khóa không
  if (user.is_active === false) {
    if (window.StorageService) window.StorageService.clearAuth();
    blockAndRedirect('Tài khoản Quản trị viên này hiện đang bị khóa.');
    return;
  }

  // Nếu pass qua toàn bộ các kiểm tra -> Cho phép tiếp tục render giao diện
  console.log('[FE ROUTE GUARD] Xác thực thành công: Xin chào Admin', user.full_name || user.email);
})();

/**
 * Tiện ích dùng chung cho các trang Admin
 */
window.AdminAuth = {
  getToken: function () {
    return (
      (window.StorageService && window.StorageService.getToken()) ||
      localStorage.getItem('cinema_access_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('access_token')
    );
  },
  getUser: function () {
    if (window.StorageService && window.StorageService.getUser()) {
      return window.StorageService.getUser();
    }
    try {
      const u = localStorage.getItem('cinema_user_info') || localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  },
  logout: function () {
    if (confirm('Bạn có chắc chắn muốn đăng xuất khỏi trang Quản trị viên?')) {
      if (window.StorageService) {
        window.StorageService.clearAuth();
      } else {
        localStorage.clear();
        sessionStorage.clear();
      }
      window.location.replace('../login.html');
    }
  }
};
