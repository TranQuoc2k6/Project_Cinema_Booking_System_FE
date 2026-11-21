/**
 * ==========================================================================
 * CUSTOMER ROUTE GUARD (js/utils/customer-guard.js)
 * Chặn truy cập các trang yêu cầu đăng nhập đối với Khách hàng (User Portal):
 * - Chọn ghế / Đặt vé (booking.html)
 * - Thanh toán đơn vé (payment.html)
 * - Vé của tôi (my-tickets.html)
 * - Hồ sơ cá nhân (profile.html)
 *
 * Tự động lưu URL hiện tại (bao gồm cả query parameters như ?showtimeId=... )
 * để sau khi đăng nhập thành công thì chuyển hướng quay lại đúng suất chiếu đó.
 * ==========================================================================
 */

(function () {
  'use strict';

  // 1. Kiểm tra Token xác thực
  function getAccessToken() {
    return (
      (window.StorageService && window.StorageService.getToken()) ||
      sessionStorage.getItem('cinema_access_token') ||
      localStorage.getItem('cinema_access_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('access_token') ||
      null
    );
  }

  // 2. Xác định đường dẫn tương đối đến trang login.html
  function getLoginPath() {
    const pathname = window.location.pathname.replace(/\\/g, '/');
    if (pathname.includes('/pages/admin/')) {
      return '../login.html';
    } else if (pathname.includes('/pages/')) {
      return 'login.html';
    }
    return 'pages/login.html';
  }

  // 3. Xác định thông điệp thông báo tùy theo trang bị chặn
  function getPromptMessage() {
    const href = window.location.href.toLowerCase();
    if (href.includes('booking.html')) {
      return 'Vui lòng đăng nhập để tiếp tục chọn ghế và đặt vé.';
    } else if (href.includes('payment.html')) {
      return 'Vui lòng đăng nhập để thanh toán đơn vé.';
    } else if (href.includes('my-tickets.html')) {
      return 'Vui lòng đăng nhập để xem danh sách vé đã đặt của bạn.';
    } else if (href.includes('profile.html')) {
      return 'Vui lòng đăng nhập để xem và quản lý hồ sơ cá nhân.';
    }
    return 'Vui lòng đăng nhập tài khoản để tiếp tục.';
  }

  const token = getAccessToken();

  if (!token) {
    const currentUrl = window.location.href;

    // Lưu URL hiện tại để chuyển hướng quay lại đúng trang/suất chiếu sau đăng nhập
    try {
      if (window.StorageService && typeof window.StorageService.setRedirectUrl === 'function') {
        window.StorageService.setRedirectUrl(currentUrl);
      }
      sessionStorage.setItem('cinema_redirect_url', currentUrl);
      localStorage.setItem('cinema_redirect_url', currentUrl);

      // Lưu thông báo hiển thị trên alert của trang login
      sessionStorage.setItem('auth_error', getPromptMessage());
    } catch (e) {
      console.warn('[CustomerGuard] Không thể lưu redirect URL vào session:', e);
    }

    // Chuyển hướng ngay lập tức đến login.html
    const loginUrl = getLoginPath();
    console.info('[CustomerGuard] Chưa đăng nhập. Chuyển hướng tới:', loginUrl, 'Lưu redirect:', currentUrl);
    window.location.replace(loginUrl);
  }
})();
