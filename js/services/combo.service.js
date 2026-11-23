/**
 * ==========================================================================
 * COMBO SERVICE (js/services/combo.service.js)
 * Quản lý Combo bắp nước dành cho Khách hàng & Quản trị viên (Task T3C72E6)
 * ==========================================================================
 */

const ComboService = {
  _getBaseUrl() {
    const raw = (typeof window !== 'undefined' && window.API_BASE_URL) || 'http://127.0.0.1:8000/api/v1';
    return raw.replace(/\/api\/v1\/?$/, '');
  },

  _getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = (typeof window !== 'undefined' && window.StorageService)
      ? window.StorageService.getToken()
      : (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  },

  /**
   * Lấy danh sách combo bắp nước đang mở bán cho khách hàng
   * @returns {Promise<object>}
   */
  async getActiveCombos() {
    try {
      const baseUrl = this._getBaseUrl();
      const url = `${baseUrl}/api/combos`;
      if (typeof window !== 'undefined' && window.apiClient) {
        const res = await window.apiClient.get(url);
        return { success: true, data: res.data };
      }
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Không thể tải danh sách combo');
      return { success: true, data };
    } catch (error) {
      console.warn('[ComboService.getActiveCombos]', error.message);
      // Fallback danh sách combo mẫu đẹp mắt nếu offline
      return {
        success: true,
        data: [
          {
            id: 1,
            name: 'Combo Solo',
            description: '1 Bắp ngọt lớn (64oz) + 1 Nước ngọt có gas (32oz)',
            price: 79000,
            image_url: 'https://images.unsplash.com/photo-1572177191856-3cde618dee1f?w=300',
            is_active: true
          },
          {
            id: 2,
            name: 'Combo Couple',
            description: '1 Bắp phô mai lớn (64oz) + 2 Nước ngọt có gas (32oz)',
            price: 109000,
            image_url: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=300',
            is_active: true
          },
          {
            id: 3,
            name: 'Combo Party Siêu Tiết Kiệm',
            description: '2 Bắp caramel giòn rụm + 3 Nước ngọt lớn + 1 Snack',
            price: 159000,
            image_url: 'https://images.unsplash.com/photo-1512149177596-f817c7ef5d4c?w=300',
            is_active: true
          },
          {
            id: 4,
            name: 'Bắp Rang Bơ Truyền Thống',
            description: 'Bắp bơ vàng ươm, giòn tan cỡ lớn 64oz',
            price: 45000,
            image_url: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=300',
            is_active: true
          }
        ]
      };
    }
  },

  // ========================================================================
  // ADMIN APIS: QUẢN LÝ COMBO BẮP NƯỚC (CRUD)
  // ========================================================================

  /**
   * Admin lấy danh sách toàn bộ combo (hỗ trợ tìm kiếm, lọc active)
   */
  async adminGetCombos({ search = '', is_active = null } = {}) {
    try {
      const baseUrl = this._getBaseUrl();
      const params = new URLSearchParams();
      if (search && search.trim()) params.append('search', search.trim());
      if (is_active !== null) params.append('is_active', is_active);

      const url = `${baseUrl}/api/admin/combos?${params.toString()}`;
      if (typeof window !== 'undefined' && window.apiClient) {
        const res = await window.apiClient.get(url);
        return { success: true, data: res.data };
      }
      const res = await fetch(url, { headers: this._getHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Lỗi tải danh sách combo');
      return { success: true, data };
    } catch (error) {
      console.warn('[ComboService.adminGetCombos]', error.message);
      return {
        success: false,
        message: error.response?.data?.detail || error.message || 'Lỗi kết nối máy chủ'
      };
    }
  },

  /**
   * Admin tạo combo bắp nước mới
   */
  async adminCreateCombo(payload) {
    try {
      const baseUrl = this._getBaseUrl();
      const url = `${baseUrl}/api/admin/combos`;
      if (typeof window !== 'undefined' && window.apiClient) {
        const res = await window.apiClient.post(url, payload);
        return { success: true, data: res.data };
      }
      const res = await fetch(url, {
        method: 'POST',
        headers: this._getHeaders(),
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Không thể tạo combo');
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || error.message
      };
    }
  },

  /**
   * Admin cập nhật combo
   */
  async adminUpdateCombo(comboId, payload) {
    try {
      const baseUrl = this._getBaseUrl();
      const url = `${baseUrl}/api/admin/combos/${comboId}`;
      if (typeof window !== 'undefined' && window.apiClient) {
        const res = await window.apiClient.put(url, payload);
        return { success: true, data: res.data };
      }
      const res = await fetch(url, {
        method: 'PUT',
        headers: this._getHeaders(),
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Không thể cập nhật combo');
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || error.message
      };
    }
  },

  /**
   * Admin xóa combo
   */
  async adminDeleteCombo(comboId) {
    try {
      const baseUrl = this._getBaseUrl();
      const url = `${baseUrl}/api/admin/combos/${comboId}`;
      if (typeof window !== 'undefined' && window.apiClient) {
        const res = await window.apiClient.delete(url);
        return { success: true, data: res.data };
      }
      const res = await fetch(url, {
        method: 'DELETE',
        headers: this._getHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Không thể xóa combo');
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || error.message
      };
    }
  }
};

if (typeof window !== 'undefined') {
  window.ComboService = ComboService;
}
if (typeof module !== 'undefined') {
  module.exports = ComboService;
}
