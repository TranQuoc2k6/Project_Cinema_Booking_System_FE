/**
 * ==========================================================================
 * SEAT CONFIGURATION SERVICE (js/services/seat.service.js)
 * Cấu hình sơ đồ ghế, tự động sinh layout và loại ghế (Task T3C6880)
 * ==========================================================================
 */

const SeatService = {
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
   * Lấy sơ đồ ghế chi tiết của phòng chiếu (kèm thống kê tổng ghế, hàng, cột, loại ghế)
   */
  async getRoomSeats(roomId) {
    try {
      const baseUrl = this._getBaseUrl();
      const url = `${baseUrl}/api/rooms/${roomId}/seats`;
      if (window.apiClient) {
        const res = await window.apiClient.get(url);
        return { success: true, data: res.data };
      }
      const res = await fetch(url, { headers: this._getHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Lỗi khi tải sơ đồ ghế phòng chiếu');
      return { success: true, data };
    } catch (error) {
      console.warn('[SeatService.getRoomSeats]', error.message);
      return { success: false, message: error.response?.data?.detail || error.message };
    }
  },

  /**
   * Sinh sơ đồ ghế tự động cho phòng chiếu
   * @param {number} roomId 
   * @param {object} layout { rows, columns, vip_rows, couple_rows, overwrite }
   */
  async generateSeatMap(roomId, layout) {
    try {
      const baseUrl = this._getBaseUrl();
      const url = `${baseUrl}/api/rooms/${roomId}/seats/generate`;
      if (window.apiClient) {
        const res = await window.apiClient.post(url, layout);
        return { success: true, data: res.data };
      }
      const res = await fetch(url, {
        method: 'POST',
        headers: this._getHeaders(),
        body: JSON.stringify(layout)
      });
      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          status: res.status,
          message: data.detail || 'Lỗi khi sinh sơ đồ ghế'
        };
      }
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        status: error.response?.status,
        message: error.response?.data?.detail || error.message || 'Lỗi khi sinh sơ đồ ghế'
      };
    }
  },

  /**
   * Cập nhật loại ghế hoặc trạng thái hàng loạt ghế trong phòng chiếu
   * @param {number} roomId 
   * @param {object} payload { seat_ids: number[], seat_type?: string, is_active?: boolean }
   */
  async batchUpdateSeats(roomId, payload) {
    try {
      const baseUrl = this._getBaseUrl();
      const url = `${baseUrl}/api/rooms/${roomId}/seats/batch`;
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
      if (!res.ok) throw new Error(data.detail || 'Lỗi khi cập nhật ghế hàng loạt');
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.response?.data?.detail || error.message };
    }
  },

  /**
   * Cập nhật thông tin một ghế đơn lẻ
   * @param {number} roomId 
   * @param {number} seatId 
   * @param {object} payload { seat_type?: string, is_active?: boolean }
   */
  async updateSeat(roomId, seatId, payload) {
    try {
      const baseUrl = this._getBaseUrl();
      const url = `${baseUrl}/api/rooms/${roomId}/seats/${seatId}`;
      if (window.apiClient) {
        const res = await window.apiClient.patch(url, payload);
        return { success: true, data: res.data };
      }
      const res = await fetch(url, {
        method: 'PATCH',
        headers: this._getHeaders(),
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Lỗi khi cập nhật ghế');
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.response?.data?.detail || error.message };
    }
  },

  /**
   * Xóa toàn bộ sơ đồ ghế của phòng chiếu
   * @param {number} roomId 
   */
  async clearRoomSeats(roomId) {
    try {
      const baseUrl = this._getBaseUrl();
      const url = `${baseUrl}/api/rooms/${roomId}/seats`;
      if (window.apiClient) {
        const res = await window.apiClient.delete(url);
        return { success: true, data: res.data };
      }
      const res = await fetch(url, {
        method: 'DELETE',
        headers: this._getHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Lỗi khi xóa sơ đồ ghế');
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.response?.data?.detail || error.message };
    }
  }
};

window.SeatService = SeatService;
