/**
 * ==========================================================================
 * CINEMA & ROOM SERVICE (js/services/cinema.service.js)
 * Quản lý gọi API Cụm rạp & Phòng chiếu (Task T3C6880)
 * ==========================================================================
 */

const CinemaService = {
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
   * Lấy danh sách các Cụm rạp (có thể lọc theo thành phố)
   */
  async getCinemas(city = '') {
    try {
      const baseUrl = this._getBaseUrl();
      const url = `${baseUrl}/api/cinemas${city ? `?city=${encodeURIComponent(city)}` : ''}`;
      if (window.apiClient) {
        const res = await window.apiClient.get(url);
        return { success: true, data: res.data };
      }
      const res = await fetch(url, { headers: this._getHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Lỗi tải danh sách cụm rạp');
      return { success: true, data };
    } catch (error) {
      console.warn('[CinemaService.getCinemas]', error.message);
      return { success: false, message: error.response?.data?.detail || error.message };
    }
  },

  /**
   * Lấy chi tiết một cụm rạp kèm danh sách phòng
   */
  async getCinemaDetail(cinemaId) {
    try {
      const baseUrl = this._getBaseUrl();
      const url = `${baseUrl}/api/cinemas/${cinemaId}`;
      if (window.apiClient) {
        const res = await window.apiClient.get(url);
        return { success: true, data: res.data };
      }
      const res = await fetch(url, { headers: this._getHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Lỗi tải chi tiết cụm rạp');
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.response?.data?.detail || error.message };
    }
  },

  /**
   * Tạo cụm rạp mới
   */
  async createCinema(payload) {
    try {
      const baseUrl = this._getBaseUrl();
      const url = `${baseUrl}/api/cinemas`;
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
      if (!res.ok) throw new Error(data.detail || 'Lỗi khi tạo cụm rạp');
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.response?.data?.detail || error.message };
    }
  },

  /**
   * Cập nhật thông tin cụm rạp
   */
  async updateCinema(cinemaId, payload) {
    try {
      const baseUrl = this._getBaseUrl();
      const url = `${baseUrl}/api/cinemas/${cinemaId}`;
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
      if (!res.ok) throw new Error(data.detail || 'Lỗi khi cập nhật cụm rạp');
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.response?.data?.detail || error.message };
    }
  },

  /**
   * Xóa cụm rạp
   */
  async deleteCinema(cinemaId) {
    try {
      const baseUrl = this._getBaseUrl();
      const url = `${baseUrl}/api/cinemas/${cinemaId}`;
      if (window.apiClient) {
        await window.apiClient.delete(url);
        return { success: true };
      }
      const res = await fetch(url, {
        method: 'DELETE',
        headers: this._getHeaders()
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Lỗi khi xóa cụm rạp');
      }
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.detail || error.message };
    }
  },

  /**
   * Lấy danh sách tất cả phòng chiếu (hoặc lọc theo cinemaId, roomType)
   */
  async getRooms(cinemaId = null, roomType = null) {
    try {
      const baseUrl = this._getBaseUrl();
      const params = new URLSearchParams();
      if (cinemaId) params.append('cinema_id', cinemaId);
      if (roomType) params.append('room_type', roomType);
      const url = `${baseUrl}/api/rooms${params.toString() ? '?' + params.toString() : ''}`;

      if (window.apiClient) {
        const res = await window.apiClient.get(url);
        return { success: true, data: res.data };
      }
      const res = await fetch(url, { headers: this._getHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Lỗi tải danh sách phòng chiếu');
      return { success: true, data };
    } catch (error) {
      console.warn('[CinemaService.getRooms]', error.message);
      return { success: false, message: error.response?.data?.detail || error.message };
    }
  },

  /**
   * Lấy chi tiết phòng chiếu
   */
  async getRoomDetail(roomId) {
    try {
      const baseUrl = this._getBaseUrl();
      const url = `${baseUrl}/api/rooms/${roomId}`;
      if (window.apiClient) {
        const res = await window.apiClient.get(url);
        return { success: true, data: res.data };
      }
      const res = await fetch(url, { headers: this._getHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Lỗi tải chi tiết phòng chiếu');
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.response?.data?.detail || error.message };
    }
  },

  /**
   * Tạo phòng chiếu mới
   */
  async createRoom(payload) {
    try {
      const baseUrl = this._getBaseUrl();
      const url = `${baseUrl}/api/rooms`;
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
      if (!res.ok) throw new Error(data.detail || 'Lỗi khi tạo phòng chiếu');
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.response?.data?.detail || error.message };
    }
  },

  /**
   * Cập nhật thông tin phòng chiếu
   */
  async updateRoom(roomId, payload) {
    try {
      const baseUrl = this._getBaseUrl();
      const url = `${baseUrl}/api/rooms/${roomId}`;
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
      if (!res.ok) throw new Error(data.detail || 'Lỗi khi cập nhật phòng chiếu');
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.response?.data?.detail || error.message };
    }
  },

  /**
   * Xóa phòng chiếu
   */
  async deleteRoom(roomId) {
    try {
      const baseUrl = this._getBaseUrl();
      const url = `${baseUrl}/api/rooms/${roomId}`;
      if (window.apiClient) {
        await window.apiClient.delete(url);
        return { success: true };
      }
      const res = await fetch(url, {
        method: 'DELETE',
        headers: this._getHeaders()
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Lỗi khi xóa phòng chiếu');
      }
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.detail || error.message };
    }
  }
};

window.CinemaService = CinemaService;
