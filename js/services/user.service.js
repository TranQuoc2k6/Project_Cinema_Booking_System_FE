/**
 * ==========================================================================
 * USER SERVICE (js/services/user.service.js)
 * Quản lý gọi API Xem hồ sơ, Cập nhật thông tin cá nhân và Đổi mật khẩu (Task T3C5C51)
 * ==========================================================================
 */

const UserService = {
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
  }
};

window.UserService = UserService;
