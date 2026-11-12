/**
 * ==========================================================================
 * API CLIENT & AXIOS INTERCEPTOR (js/config/api.js)
 * Cấu hình Axios instance, tự động gắn Token và bắt lỗi 401 tự động đăng xuất
 * ==========================================================================
 */

const API_BASE_URL = window.API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

// Tạo axios instance tùy chỉnh
const apiClient = (typeof axios !== 'undefined')
  ? axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  : null;

if (apiClient) {
  // 1. REQUEST INTERCEPTOR: Tự động đính kèm Bearer token vào Header
  apiClient.interceptors.request.use(
    (config) => {
      const token = window.StorageService ? window.StorageService.getToken() : localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // 2. RESPONSE INTERCEPTOR: Bắt lỗi 401 Unauthorized -> Tự động đăng xuất
  apiClient.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (error.response && error.response.status === 401) {
        console.warn('[API Client] Nhận mã 401 Unauthorized. Phiên đăng nhập hết hạn hoặc không hợp lệ.');
        
        // Xóa token và user khỏi storage
        if (window.StorageService) {
          window.StorageService.clearAuth();
        } else {
          localStorage.clear();
          sessionStorage.clear();
        }

        // Kiểm tra xem trang hiện tại có phải là login hoặc register không
        const currentPath = window.location.pathname;
        const isAuthPage = currentPath.includes('login.html') || currentPath.includes('register.html');

        if (!isAuthPage) {
          // Lưu lại trang hiện tại để sau khi đăng nhập lại có thể quay lại
          if (window.StorageService) {
            window.StorageService.setRedirectUrl(window.location.href);
          }
          sessionStorage.setItem('auth_error', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          
          // Chuyển hướng về login.html
          const loginUrl = currentPath.includes('/pages/') ? 'login.html?expired=1' : 'pages/login.html?expired=1';
          window.location.href = loginUrl;
        }
      }
      return Promise.reject(error);
    }
  );
} else {
  console.warn('[apiClient] Axios chưa được tải. Đang chạy ở chế độ fallback.');
}

window.apiClient = apiClient;
window.API_BASE_URL = API_BASE_URL;
