/**
 * ==========================================================================
 * STORAGE SERVICE (js/utils/storage.js)
 * Quản lý lưu trữ Token và Thông tin người dùng vào localStorage/sessionStorage
 * ==========================================================================
 */

const STORAGE_KEYS = {
  TOKEN: 'cinema_access_token',
  USER: 'cinema_user_info',
  REDIRECT_URL: 'cinema_redirect_url'
};

const StorageService = {
  /**
   * Lưu Access Token
   * @param {string} token 
   * @param {boolean} rememberMe - Nếu true lưu vào localStorage (lâu dài), false lưu vào sessionStorage
   */
  setToken(token, rememberMe = true) {
    if (!token) return;
    if (rememberMe) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
    } else {
      sessionStorage.setItem(STORAGE_KEYS.TOKEN, token);
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
    }
    // Đồng bộ với các key cũ nếu có module khác đọc
    localStorage.setItem('token', token);
    localStorage.setItem('access_token', token);
  },

  /**
   * Lấy Access Token (ưu tiên sessionStorage trước, sau đó localStorage)
   * @returns {string|null}
   */
  getToken() {
    return sessionStorage.getItem(STORAGE_KEYS.TOKEN) ||
           localStorage.getItem(STORAGE_KEYS.TOKEN) ||
           localStorage.getItem('token') ||
           localStorage.getItem('access_token') ||
           null;
  },

  /**
   * Lưu thông tin người dùng
   * @param {object} user 
   * @param {boolean} rememberMe 
   */
  setUser(user, rememberMe = true) {
    if (!user) return;
    const userStr = JSON.stringify(user);
    if (rememberMe) {
      localStorage.setItem(STORAGE_KEYS.USER, userStr);
      sessionStorage.removeItem(STORAGE_KEYS.USER);
    } else {
      sessionStorage.setItem(STORAGE_KEYS.USER, userStr);
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
    localStorage.setItem('user', userStr);
  },

  /**
   * Lấy thông tin người dùng
   * @returns {object|null}
   */
  getUser() {
    const raw = sessionStorage.getItem(STORAGE_KEYS.USER) ||
                localStorage.getItem(STORAGE_KEYS.USER) ||
                localStorage.getItem('user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error('[StorageService] Lỗi parse user data:', e);
      return null;
    }
  },

  /**
   * Kiểm tra người dùng đã đăng nhập chưa
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!this.getToken();
  },

  /**
   * Kiểm tra có phải quản trị viên không
   * @returns {boolean}
   */
  isAdmin() {
    const user = this.getUser();
    if (!user) return false;
    const roleName = (typeof user.role === 'string' ? user.role : user.role?.name || '').toUpperCase();
    return roleName === 'ADMIN' || user.role_id === 1;
  },

  /**
   * Xóa toàn bộ dữ liệu phiên đăng nhập
   */
  clearAuth() {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('cinema_token');
    localStorage.removeItem('cinema_user');
    sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.USER);
  },

  /**
   * Lưu URL cần chuyển hướng sau khi đăng nhập
   * @param {string} url 
   */
  setRedirectUrl(url) {
    sessionStorage.setItem(STORAGE_KEYS.REDIRECT_URL, url);
  },

  /**
   * Lấy và xóa URL redirect đã lưu
   * @returns {string|null}
   */
  getAndClearRedirectUrl() {
    const url = sessionStorage.getItem(STORAGE_KEYS.REDIRECT_URL);
    sessionStorage.removeItem(STORAGE_KEYS.REDIRECT_URL);
    return url;
  }
};

// Đăng ký toàn cục để các trang có thể gọi trực tiếp
window.StorageService = StorageService;
