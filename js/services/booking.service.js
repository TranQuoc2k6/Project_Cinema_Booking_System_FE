/**
 * ==========================================================================
 * BOOKING SERVICE (js/services/booking.service.js)
 * Quản lý các cuộc gọi API Đặt vé, Danh sách đơn vé và Hủy đơn vé (Task T3C5D0B)
 * ==========================================================================
 */

const BookingService = {
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
   * Tạo đơn đặt vé mới (giữ ghế)
   * @param {object} payload { showtime_id, seat_ids: number[] }
   * @returns {Promise<object>}
   */
  async createBooking(payload) {
    try {
      const baseUrl = this._getBaseUrl();
      const url = `${baseUrl}/api/bookings/hold`;
      if (window.apiClient) {
        const res = await window.apiClient.post(url, payload);
        return { success: true, data: res.data };
      }
      const res = await fetch(url, {
        method: 'POST',
        headers: this._getHeaders(),
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Lỗi khi tạo đơn đặt vé');
      return { success: true, data };
    } catch (error) {
      console.warn('[BookingService.createBooking]', error.message);
      return {
        success: false,
        message: error.response?.data?.detail || error.message || 'Lỗi kết nối máy chủ'
      };
    }
  },

  /**
   * Lấy lịch sử vé của tôi kèm lọc trạng thái (Task T3C5D0B)
   * @param {string|null} statusFilter - 'upcoming' | 'watched' | 'cancelled' | null
   * @returns {Promise<object>}
   */
  async getMyTickets(statusFilter = null) {
    try {
      const baseUrl = this._getBaseUrl();
      let url = `${baseUrl}/api/bookings/my-tickets`;
      if (statusFilter && statusFilter !== 'all') {
        url += `?status_filter=${encodeURIComponent(statusFilter)}`;
      }
      if (window.apiClient) {
        const res = await window.apiClient.get(url);
        return { success: true, data: res.data };
      }
      const res = await fetch(url, { headers: this._getHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Lỗi tải lịch sử vé');
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || error.message || 'Lỗi kết nối máy chủ'
      };
    }
  },

  /**
   * Alias tương thích
   */
  async getMyBookings(statusFilter = null) {
    return this.getMyTickets(statusFilter);
  },

  /**
   * Lấy chi tiết đơn vé theo ID
   * @param {number|string} bookingId 
   * @returns {Promise<object>}
   */
  async getBookingDetail(bookingId) {
    try {
      const baseUrl = this._getBaseUrl();
      const url = `${baseUrl}/api/bookings/${bookingId}`;
      if (window.apiClient) {
        const res = await window.apiClient.get(url);
        return { success: true, data: res.data };
      }
      const res = await fetch(url, { headers: this._getHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Không tìm thấy đơn vé');
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || error.message
      };
    }
  }
};

window.BookingService = BookingService;
