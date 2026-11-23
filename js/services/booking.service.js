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
   * Lấy chi tiết đơn vé theo ID (Task T3C6D1A)
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
  },

  /**
   * Lấy chi tiết vé điện tử theo mã vé booking_code (Task T3C6D1A)
   * @param {string} bookingCode 
   * @returns {Promise<object>}
   */
  async getBookingByCode(bookingCode) {
    try {
      const baseUrl = this._getBaseUrl();
      const url = `${baseUrl}/api/bookings/code/${encodeURIComponent(bookingCode)}`;
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
  },

  /**
   * Khách hàng hủy vé trước giờ chiếu ít nhất 2 tiếng (Task T3C6D1A)
   * Giải phóng ghế và cập nhật trạng thái đơn vé sang DA_HUY.
   * @param {number|string} bookingId 
   * @returns {Promise<object>}
   */
  async cancelBooking(bookingId) {
    try {
      const baseUrl = this._getBaseUrl();
      const url = `${baseUrl}/api/bookings/${bookingId}/cancel`;
      if (window.apiClient) {
        const res = await window.apiClient.post(url);
        return { success: true, data: res.data };
      }
      const res = await fetch(url, {
        method: 'POST',
        headers: this._getHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Không thể hủy đơn vé');
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || error.message || 'Lỗi khi kết nối máy chủ để hủy vé'
      };
    }
  },

  // ========================================================================
  // ADMIN APIS: QUẢN TRỊ ĐƠN VÉ (SRS 1.3 & TASK: QUẢN LÝ ĐƠN VÉ)
  // ========================================================================

  /**
   * Lấy danh sách toàn bộ đơn vé cho Quản trị viên (Admin)
   * Có hỗ trợ:
   * - Lọc theo phim (movie_id)
   * - Lọc theo ngày (date: YYYY-MM-DD)
   * - Lọc theo trạng thái (status: confirmed, pending, cancelled, all)
   * - Tìm kiếm theo mã vé (#BK-...) hoặc SĐT khách hàng (search)
   * - Phân trang (page, limit)
   */
  async adminGetBookings({ page = 1, limit = 50, movie_id = null, date = null, status = 'all', search = '' } = {}) {
    try {
      const baseUrl = this._getBaseUrl();
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);
      if (movie_id) params.append('movie_id', movie_id);
      if (date && date.trim()) params.append('date', date.trim());
      if (status && status !== 'all') params.append('status', status);
      if (search && search.trim()) params.append('search', search.trim());

      const url = `${baseUrl}/api/admin/bookings?${params.toString()}`;
      if (window.apiClient) {
        const res = await window.apiClient.get(url);
        return { success: true, data: res.data };
      }
      const res = await fetch(url, { headers: this._getHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Không thể tải danh sách đơn vé');
      return { success: true, data };
    } catch (error) {
      console.warn('[BookingService.adminGetBookings]', error.message);
      return {
        success: false,
        message: error.response?.data?.detail || error.message || 'Lỗi kết nối máy chủ'
      };
    }
  },

  /**
   * Xem chi tiết đơn vé cho Quản trị viên
   */
  async adminGetBookingDetail(bookingId) {
    try {
      const baseUrl = this._getBaseUrl();
      const url = `${baseUrl}/api/admin/bookings/${bookingId}`;
      if (window.apiClient) {
        const res = await window.apiClient.get(url);
        return { success: true, data: res.data };
      }
      const res = await fetch(url, { headers: this._getHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Không thể tải chi tiết đơn vé');
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || error.message
      };
    }
  },

  /**
   * Hủy vé và giải phóng ghế cho Quản trị viên
   */
  async adminCancelBooking(bookingId) {
    try {
      const baseUrl = this._getBaseUrl();
      const url = `${baseUrl}/api/admin/bookings/${bookingId}/cancel`;
      if (window.apiClient) {
        const res = await window.apiClient.put(url);
        return { success: true, data: res.data };
      }
      const res = await fetch(url, {
        method: 'PUT',
        headers: this._getHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Không thể hủy đơn vé');
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || error.message
      };
    }
  },
  // ========================================================================
  // QR TICKET VERIFICATION & CHECK-IN (Task T3C72CC: Bonus Mã QR vé điện tử)
  // ========================================================================

  /**
   * Sinh đường dẫn tra cứu / xác thực vé khi quét mã QR
   * @param {string} bookingCode
   * @returns {string}
   */
  generateTicketCheckUrl(bookingCode) {
    if (!bookingCode) return '';
    const origin = (typeof window !== 'undefined' && window.location && window.location.origin)
      ? window.location.origin
      : 'http://127.0.0.1:5500';
    return `${origin}/pages/ticket-check.html?code=${encodeURIComponent(bookingCode)}`;
  },

  /**
   * Sinh URL ảnh mã QR chứa đường dẫn tra cứu vé
   * @param {string} bookingCode
   * @param {number} size
   * @returns {string}
   */
  generateQrCodeImageUrl(bookingCode, size = 260) {
    const checkUrl = this.generateTicketCheckUrl(bookingCode);
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(checkUrl)}`;
  },

  /**
   * Tra cứu thông tin vé điện tử khi quét mã QR (Public / Staff)
   * @param {string} bookingCode
   * @returns {Promise<object>}
   */
  async verifyTicket(bookingCode) {
    try {
      const baseUrl = this._getBaseUrl();
      const cleanCode = (bookingCode || '').trim();
      if (!cleanCode) {
        return { success: false, message: 'Vui lòng nhập hoặc quét mã vé' };
      }

      const url = `${baseUrl}/api/tickets/verify/${encodeURIComponent(cleanCode)}`;
      if (window.apiClient) {
        const res = await window.apiClient.get(url);
        return { success: true, data: res.data };
      }
      const res = await fetch(url, { headers: this._getHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Không tìm thấy vé xem phim');
      return { success: true, data };
    } catch (error) {
      console.warn('[BookingService.verifyTicket]', error.message);
      return {
        success: false,
        message: error.response?.data?.detail || error.message || 'Không thể tra cứu thông tin vé'
      };
    }
  },

  /**
   * Xác nhận vào rạp / Soát vé khi quét QR (Check-in Ticket)
   * @param {string} bookingCode
   * @returns {Promise<object>}
   */
  async checkinTicket(bookingCode) {
    try {
      const baseUrl = this._getBaseUrl();
      const cleanCode = (bookingCode || '').trim();
      if (!cleanCode) {
        return { success: false, message: 'Vui lòng cung cấp mã vé cần soát' };
      }

      const url = `${baseUrl}/api/tickets/verify/${encodeURIComponent(cleanCode)}/checkin`;
      if (window.apiClient) {
        const res = await window.apiClient.post(url);
        return { success: true, data: res.data };
      }
      const res = await fetch(url, {
        method: 'POST',
        headers: this._getHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Không thể xác nhận vào rạp');
      return { success: true, data };
    } catch (error) {
      console.warn('[BookingService.checkinTicket]', error.message);
      return {
        success: false,
        message: error.response?.data?.detail || error.message || 'Lỗi khi soát vé vào rạp'
      };
    }
  }
};

window.BookingService = BookingService;
