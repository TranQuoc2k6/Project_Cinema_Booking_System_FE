/**
 * ==========================================================================
 * USER SERVICE (js/services/user.service.js)
 * Quản lý gọi API Xem hồ sơ cá nhân và Quản trị khách hàng/người dùng:
 * - Xem hồ sơ, cập nhật thông tin cá nhân và đổi mật khẩu (Task T3C5C51)
 * - Quản trị viên: Danh sách khách hàng, tìm kiếm, xem chi tiết, khóa/mở tài khoản
 * ==========================================================================
 */

const UserService = {
  _getBaseUrl() {
    const raw = window.API_BASE_URL || 'http://127.0.0.1:8000/api/v1';
    return raw.replace(/\/api\/v1\/?$/, '');
  },

  _getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = window.StorageService ? window.StorageService.getToken() : localStorage.getItem('token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  },

  /**
   * Lấy thông tin hồ sơ của người dùng hiện tại
   * @returns {Promise<object>}
   */
  async getProfile() {
    try {
      if (window.apiClient) {
        const response = await window.apiClient.get('/users/me');
        if (window.StorageService && response.data) {
          window.StorageService.setUser(response.data);
        }
        return { success: true, data: response.data };
      }
      return { success: false, message: 'API Client chưa sẵn sàng' };
    } catch (error) {
      const message = error.response?.data?.detail || error.message || 'Lỗi khi tải thông tin hồ sơ';
      return { success: false, status: error.response?.status, message };
    }
  },

  /**
   * Cập nhật thông tin hồ sơ cá nhân (Họ tên, SĐT, Avatar)
   * @param {object} payload { full_name, phone, avatar }
   * @returns {Promise<object>}
   */
  async updateProfile(payload) {
    try {
      if (window.apiClient) {
        const response = await window.apiClient.put('/users/me', payload);
        if (window.StorageService && response.data) {
          window.StorageService.setUser(response.data);
        }
        return { success: true, data: response.data };
      }
      return { success: false, message: 'API Client chưa sẵn sàng' };
    } catch (error) {
      const message = error.response?.data?.detail || error.message || 'Lỗi khi cập nhật hồ sơ';
      return { success: false, status: error.response?.status, message };
    }
  },

  /**
   * Đổi mật khẩu tài khoản (yêu cầu mật khẩu cũ)
   * @param {string} oldPassword 
   * @param {string} newPassword 
   * @returns {Promise<object>}
   */
  async changePassword(oldPassword, newPassword) {
    try {
      if (window.apiClient) {
        const response = await window.apiClient.post('/users/change-password', {
          old_password: oldPassword,
          new_password: newPassword
        });
        return { success: true, data: response.data };
      }
      return { success: false, message: 'API Client chưa sẵn sàng' };
    } catch (error) {
      const message = error.response?.data?.detail || error.message || 'Lỗi khi đổi mật khẩu';
      return { success: false, status: error.response?.status, message };
    }
  },

  // ========================================================================
  // ADMIN PORTAL APIS: QUẢN TRỊ KHÁCH HÀNG & NGƯỜI DÙNG
  // ========================================================================

  /**
   * Lấy danh sách người dùng / khách hàng cho Quản trị viên
   * Có hỗ trợ:
   * - Tìm kiếm theo Họ tên, Email, Số điện thoại (search)
   * - Lọc theo Vai trò (role: all, customer, admin)
   * - Lọc theo Trạng thái (status: all, active, blocked)
   * - Phân trang (page, limit)
   */
  async adminGetUsers({ page = 1, limit = 50, search = '', role = 'all', status = 'all' } = {}) {
    try {
      const baseUrl = this._getBaseUrl();
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);
      if (search && search.trim()) params.append('search', search.trim());
      if (role && role !== 'all') params.append('role', role);
      if (status && status !== 'all') params.append('status', status);

      const url = `${baseUrl}/api/admin/users?${params.toString()}`;
      if (window.apiClient) {
        const res = await window.apiClient.get(url);
        return { success: true, data: res.data };
      }
      const res = await fetch(url, { headers: this._getHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Không thể tải danh sách khách hàng');
      return { success: true, data };
    } catch (error) {
      console.warn('[UserService.adminGetUsers]', error.message);
      return {
        success: false,
        message: error.response?.data?.detail || error.message || 'Lỗi kết nối máy chủ'
      };
    }
  },

  /**
   * Xem chi tiết thông tin khách hàng và lịch sử đơn vé
   */
  async adminGetUserDetail(userId) {
    try {
      const baseUrl = this._getBaseUrl();
      const url = `${baseUrl}/api/admin/users/${userId}`;
      if (window.apiClient) {
        const res = await window.apiClient.get(url);
        return { success: true, data: res.data };
      }
      const res = await fetch(url, { headers: this._getHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Không thể tải chi tiết người dùng');
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || error.message || 'Lỗi kết nối máy chủ'
      };
    }
  },

  /**
   * Khóa hoặc Mở khóa tài khoản khách hàng/người dùng
   * @param {number|string} userId
   * @param {boolean} isActive
   */
  async adminToggleUserStatus(userId, isActive) {
    try {
      const baseUrl = this._getBaseUrl();
      const url = `${baseUrl}/api/admin/users/${userId}/status?is_active=${isActive}`;
      const payload = { is_active: isActive };

      if (window.apiClient) {
        const res = await window.apiClient.put(url, payload);
        return { success: true, data: res.data };
      }
      const res = await fetch(url, {
        method: 'PUT',
        headers: this._getHeaders(),
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Không thể cập nhật trạng thái tài khoản');
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || error.message || 'Lỗi kết nối máy chủ'
      };
    }
  }
};

window.UserService = UserService;
