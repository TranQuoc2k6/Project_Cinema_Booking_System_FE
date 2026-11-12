/**
 * ==========================================================================
 * AUTHENTICATION SERVICE (js/services/auth.service.js)
 * Gọi các API Đăng ký, Đăng nhập, Đăng xuất, Lấy Profile thông qua apiClient
 * ==========================================================================
 */

const AuthService = {
  /**
   * Đăng ký tài khoản khách hàng mới
   * @param {object} payload { full_name, email, password, phone }
   * @returns {Promise<object>}
   */
  async register(payload) {
    try {
      if (window.apiClient) {
        const response = await window.apiClient.post('/auth/register', payload);
        return { success: true, data: response.data };
      } else {
        // Fallback fetch nếu chưa nạp axios
        const res = await fetch(`${window.API_BASE_URL || 'http://127.0.0.1:8000/api/v1'}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) {
          return { success: false, status: res.status, message: data.detail || 'Đăng ký thất bại' };
        }
        return { success: true, data };
      }
    } catch (error) {
      const message = error.response?.data?.detail || error.message || 'Lỗi kết nối máy chủ';
      return { success: false, status: error.response?.status, message };
    }
  },

  /**
   * Đăng nhập hệ thống
   * @param {string} email 
   * @param {string} password 
   * @param {boolean} rememberMe 
   * @returns {Promise<object>}
   */
  async login(email, password, rememberMe = true) {
    try {
      if (window.apiClient) {
        const response = await window.apiClient.post('/auth/login', { email, password });
        const { access_token, user } = response.data;
        
        // Lưu vào Storage
        if (window.StorageService) {
          window.StorageService.setToken(access_token, rememberMe);
          window.StorageService.setUser(user, rememberMe);
        }

        return { success: true, data: response.data };
      } else {
        const res = await fetch(`${window.API_BASE_URL || 'http://127.0.0.1:8000/api/v1'}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) {
          return { success: false, status: res.status, message: data.detail || 'Email hoặc mật khẩu không chính xác' };
        }
        if (window.StorageService) {
          window.StorageService.setToken(data.access_token, rememberMe);
          window.StorageService.setUser(data.user, rememberMe);
        }
        return { success: true, data };
      }
    } catch (error) {
      const message = error.response?.data?.detail || error.message || 'Không thể kết nối đến máy chủ';
      return { success: false, status: error.response?.status, message };
    }
  },

  /**
   * Lấy thông tin tài khoản hiện tại từ Server (/auth/me)
   */
  async getProfile() {
    try {
      if (window.apiClient) {
        const response = await window.apiClient.get('/auth/me');
        if (window.StorageService && response.data) {
          window.StorageService.setUser(response.data);
        }
        return { success: true, data: response.data };
      }
      return { success: false, message: 'API client chưa sẵn sàng' };
    } catch (error) {
      return {
        success: false,
        status: error.response?.status,
        message: error.response?.data?.detail || 'Lỗi khi tải thông tin'
      };
    }
  },

  /**
   * Đăng xuất khỏi hệ thống
   * @param {string} redirectUrl - URL chuyển hướng sau khi đăng xuất (mặc định về trang chủ hoặc login)
   */
  logout(redirectUrl = null) {
    if (window.StorageService) {
      window.StorageService.clearAuth();
    } else {
      localStorage.clear();
      sessionStorage.clear();
    }

    if (redirectUrl) {
      window.location.href = redirectUrl;
    } else {
      // Xác định đường dẫn tương đối
      const isPagesDir = window.location.pathname.includes('/pages/');
      const target = isPagesDir ? 'login.html' : 'pages/login.html';
      window.location.href = target;
    }
  }
};

window.AuthService = AuthService;
