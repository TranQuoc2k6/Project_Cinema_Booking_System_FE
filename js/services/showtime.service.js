/**
 * ==========================================================================
 * SHOWTIME SERVICE (js/services/showtime.service.js)
 * Quản lý lấy danh sách suất chiếu, kiểm tra suất chiếu quá hạn và Fallback Mock
 * ==========================================================================
 */

const ShowtimeService = {
  _getBaseUrl() {
    const raw = window.API_BASE_URL || 'http://127.0.0.1:8000/api/v1';
    return raw.replace(/\/api\/v1\/?$/, '');
  },

  _getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = (window.StorageService && window.StorageService.getToken()) ||
                  localStorage.getItem('cinema_access_token') ||
                  localStorage.getItem('token') ||
                  sessionStorage.getItem('cinema_access_token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  },

  /**
   * Danh sách Cụm rạp mẫu chuẩn
   */
  _mockCinemas: [
    {
      id: 1,
      name: "CGV Vincom Center Bà Triệu",
      brand: "CGV",
      city: "Hà Nội",
      district: "Hai Bà Trưng",
      address: "Tầng 6, Vincom Center, 191 Bà Triệu, P. Lê Đại Hành",
      phone: "1900 6017",
      rating: 4.8,
      rooms: ["Phòng IMAX Laser 01", "Phòng 2D Chiếu 02", "Phòng VIP Lounge 03"]
    },
    {
      id: 2,
      name: "CGV Landmark 81",
      brand: "CGV",
      city: "TP. Hồ Chí Minh",
      district: "Bình Thạnh",
      address: "Tầng B1, Vincom Center Landmark 81, 772 Điện Biên Phủ, P. 22",
      phone: "1900 6017",
      rating: 4.9,
      rooms: ["Phòng IMAX Luxe", "Phòng Gold Class 01", "Phòng Chiếu 04"]
    },
    {
      id: 3,
      name: "BHD Star Cineplex Bitexco",
      brand: "BHD",
      city: "TP. Hồ Chí Minh",
      district: "Quận 1",
      address: "Tầng 3 & 4, TTTM Bitexco, 2 Hải Triều, P. Bến Nghé",
      phone: "1900 2099",
      rating: 4.6,
      rooms: ["Phòng 2D First Class", "Phòng 02 Digital"]
    },
    {
      id: 4,
      name: "Galaxy Cinema Tràng Thi",
      brand: "Galaxy",
      city: "Hà Nội",
      district: "Hoàn Kiếm",
      address: "10B Tràng Thi, P. Hàng Trống",
      phone: "1900 2224",
      rating: 4.7,
      rooms: ["Phòng 01 Dolby Atmos", "Phòng 02 Laser"]
    },
    {
      id: 5,
      name: "Lotte Cinema Đà Nẵng",
      brand: "Lotte",
      city: "Đà Nẵng",
      district: "Hải Châu",
      address: "Tầng 5 TTTM Lotte Mart, P. Hòa Cường Bắc",
      phone: "0236 3679 679",
      rating: 4.7,
      rooms: ["Phòng Superplex", "Phòng 02 3D"]
    }
  ],

  /**
   * Sinh danh sách suất chiếu mẫu đa dạng cho một ngày cụ thể
   */
  generateMockShowtimes(dateStr) {
    const movies = window.MovieService ? window.MovieService._mockMovies : [];
    const showtimes = [];
    let idCounter = 100;

    // Giờ chiếu cố định các ca trong ngày từ sáng tới đêm
    const slotMatrix = [
      { start: "08:30", end: "10:35", room: 0, format: "2D Digital (Phụ đề)", price: 85000 },
      { start: "10:45", end: "13:00", room: 1, format: "2D Digital (Lồng tiếng)", price: 95000 },
      { start: "13:15", end: "15:45", room: 0, format: "IMAX 3D Laser", price: 145000 },
      { start: "15:30", end: "17:40", room: 1, format: "2D Digital (Phụ đề)", price: 100000 },
      { start: "17:45", end: "20:05", room: 0, format: "IMAX 3D Laser", price: 155000 },
      { start: "19:15", end: "21:30", room: 2, format: "VIP Gold Class", price: 210000 },
      { start: "20:30", end: "22:50", room: 0, format: "IMAX 3D Laser", price: 145000 },
      { start: "21:45", end: "23:55", room: 1, format: "2D Digital (Phụ đề)", price: 90000 },
      { start: "22:45", end: "00:55", room: 2, format: "2D Digital (Phụ đề)", price: 85000 },
      { start: "23:15", end: "01:25", room: 0, format: "2D Digital (Phụ đề)", price: 80000 }
    ];

    this._mockCinemas.forEach(cinema => {
      // Mỗi rạp chiếu khoảng 3-4 bộ phim
      const cinemaMovies = movies.filter((_, idx) => (cinema.id + idx) % 2 === 0 || idx < 3);

      cinemaMovies.forEach((movie, mIdx) => {
        // Phân bổ các ca chiếu cho phim tại rạp này
        const slotsForMovie = slotMatrix.filter((_, sIdx) => (sIdx + cinema.id + mIdx) % 3 !== 0);

        slotsForMovie.forEach(slot => {
          idCounter++;
          const roomName = cinema.rooms[slot.room % cinema.rooms.length] || "Phòng Chiếu 01";
          const startDateTime = `${dateStr} ${slot.start}`;
          const endDateTime = `${dateStr} ${slot.end}`;

          // Số ghế ngẫu nhiên có trật tự
          const totalSeats = slot.format.includes("VIP") ? 48 : (slot.format.includes("IMAX") ? 140 : 96);
          const bookedRatio = 0.3 + ((idCounter * 7) % 50) / 100;
          const bookedSeats = Math.floor(totalSeats * bookedRatio);
          const availableSeats = totalSeats - bookedSeats;

          showtimes.push({
            id: idCounter,
            date: dateStr,
            movie_id: movie.id,
            movie_title: movie.title,
            original_title: movie.original_title,
            poster_url: movie.poster_url,
            duration_minutes: movie.duration_minutes,
            age_rating: movie.age_rating,
            genres: movie.genres,
            cinema_id: cinema.id,
            cinema_name: cinema.name,
            cinema_brand: cinema.brand,
            city: cinema.city,
            district: cinema.district,
            cinema_address: cinema.address,
            room_id: (slot.room % cinema.rooms.length) + 1,
            room_name: roomName,
            format: slot.format,
            start_time: startDateTime,
            end_time: endDateTime,
            price: slot.price,
            available_seats: availableSeats,
            total_seats: totalSeats
          });
        });
      });
    });

    return showtimes;
  },

  /**
   * Kiểm tra xem một suất chiếu có giờ bắt đầu đã trôi qua so với hiện tại hay chưa
   * @param {string} startTimeStr Chuỗi dạng "YYYY-MM-DD HH:mm" hoặc ISO string
   * @returns {boolean} true nếu đã qua giờ, false nếu chưa
   */
  isPastShowtime(startTimeStr) {
    if (!startTimeStr) return false;
    const now = new Date();
    const showtime = new Date(startTimeStr.replace(' ', 'T'));
    if (isNaN(showtime.getTime())) return false;
    return showtime <= now;
  },

  /**
   * Lấy danh sách suất chiếu theo bộ lọc
   */
  async getShowtimes({ date, movieId, cinemaId, city, format } = {}) {
    const targetDate = date || (window.FormatUtil ? window.FormatUtil.formatDateToYMD(new Date()) : new Date().toISOString().split('T')[0]);

    try {
      const baseUrl = this._getBaseUrl();
      const params = new URLSearchParams();
      if (targetDate) params.append('date', targetDate);
      if (movieId && movieId !== 'all') {
        params.append('movieId', movieId);
        params.append('movie_id', movieId);
      }
      if (cinemaId && cinemaId !== 'all') {
        params.append('cinemaId', cinemaId);
        params.append('cinema_id', cinemaId);
      }
      if (city && city !== 'all') params.append('city', city);

      const url = `${baseUrl}/api/showtimes${params.toString() ? '?' + params.toString() : ''}`;

      let rawData = null;
      if (window.apiClient) {
        const res = await window.apiClient.get(url);
        rawData = res.data;
      } else {
        const res = await fetch(url);
        if (res.ok) {
          rawData = await res.json();
        }
      }

      if (Array.isArray(rawData)) {
        let flatList = [];
        if (rawData.length > 0 && rawData[0].cinema && Array.isArray(rawData[0].showtimes)) {
          // Backend trả về mảng nhóm theo cinema: [{ cinema: {...}, showtimes: [...] }]
          // Flatten sang danh sách phẳng cho Frontend hiển thị
          rawData.forEach(group => {
            const cinema = group.cinema || {};
            const cinemaName = cinema.name || 'Cinema';
            let brand = 'Cinema';
            const upperName = cinemaName.toUpperCase();
            if (upperName.includes('CGV')) brand = 'CGV';
            else if (upperName.includes('BHD')) brand = 'BHD';
            else if (upperName.includes('LOTTE')) brand = 'LOTTE';
            else if (upperName.includes('GALAXY')) brand = 'GALAXY';

            (group.showtimes || []).forEach(st => {
              const rType = st.room_type || st.format || '2D';
              let formatStr = '2D Digital';
              if (rType.toUpperCase().includes('IMAX')) formatStr = 'IMAX 3D Laser';
              else if (rType.toUpperCase().includes('VIP') || rType.toUpperCase().includes('GOLD')) formatStr = 'VIP Gold Class';
              else if (rType.toUpperCase().includes('3D')) formatStr = '3D Digital';

              flatList.push({
                id: st.id,
                date: targetDate,
                movie_id: st.movie_id,
                movie_title: st.movie_title || '',
                original_title: st.original_title || st.movie_title || '',
                poster_url: st.poster_url || '',
                duration_minutes: st.duration_minutes || 120,
                age_rating: st.age_rating || 'P',
                genres: st.genres || ['Điện ảnh'],
                cinema_id: cinema.id,
                cinema_name: cinema.name,
                cinema_brand: brand,
                city: cinema.city || '',
                district: cinema.district || '',
                cinema_address: cinema.address || '',
                room_id: st.room_id,
                room_name: st.room_name || 'Phòng Chiếu 01',
                format: formatStr,
                start_time: typeof st.start_time === 'string' ? st.start_time.replace('T', ' ').substring(0, 19) : st.start_time,
                end_time: typeof st.end_time === 'string' ? st.end_time.replace('T', ' ').substring(0, 19) : st.end_time,
                price: typeof st.price === 'string' ? parseFloat(st.price) : (st.price || 85000),
                available_seats: st.available_seats !== undefined ? st.available_seats : 60,
                total_seats: st.total_seats !== undefined ? st.total_seats : 100
              });
            });
          });
        } else if (rawData.length > 0 && !rawData[0].cinema) {
          flatList = rawData.map(st => {
            const rType = st.room_type || st.format || '2D';
            let formatStr = st.format || '2D Digital';
            if (rType.toUpperCase().includes('IMAX')) formatStr = 'IMAX 3D Laser';
            else if (rType.toUpperCase().includes('VIP')) formatStr = 'VIP Gold Class';
            return {
              ...st,
              format: formatStr,
              start_time: typeof st.start_time === 'string' ? st.start_time.replace('T', ' ').substring(0, 19) : st.start_time,
              end_time: typeof st.end_time === 'string' ? st.end_time.replace('T', ' ').substring(0, 19) : st.end_time,
              price: typeof st.price === 'string' ? parseFloat(st.price) : (st.price || 85000)
            };
          });
        }

        if (format && format !== 'all') {
          flatList = flatList.filter(s => (s.format || '').toLowerCase().includes(format.toLowerCase()));
        }

        return {
          success: true,
          data: flatList
        };
      }
    } catch (e) {
      console.info('[ShowtimeService] Lỗi kết nối Backend, chuyển sang Mock Data:', targetDate, e);
    }

    // Fallback Mock Data
    let allShowtimes = this.generateMockShowtimes(targetDate);

    // Áp dụng bộ lọc client-side cho mock data
    if (movieId && movieId !== 'all') {
      const mId = parseInt(movieId, 10);
      allShowtimes = allShowtimes.filter(s => s.movie_id === mId);
    }

    if (cinemaId && cinemaId !== 'all') {
      const cId = parseInt(cinemaId, 10);
      allShowtimes = allShowtimes.filter(s => s.cinema_id === cId);
    }

    if (city && city !== 'all') {
      allShowtimes = allShowtimes.filter(s => s.city.toLowerCase() === city.toLowerCase());
    }

    if (format && format !== 'all') {
      allShowtimes = allShowtimes.filter(s => s.format.toLowerCase().includes(format.toLowerCase()));
    }

    return {
      success: true,
      data: allShowtimes
    };
  },

  /**
   * Lấy chi tiết một suất chiếu theo ID
   */
  async getShowtimeById(id) {
    const sId = parseInt(id, 10);
    try {
      const baseUrl = this._getBaseUrl();
      const url = `${baseUrl}/api/showtimes/${sId}`;
      let data = null;
      if (window.apiClient) {
        const res = await window.apiClient.get(url);
        data = res.data;
      } else {
        const res = await fetch(url);
        if (res.ok) data = await res.json();
      }
      if (data) {
        const rType = data.room_type || data.format || '2D';
        let formatStr = data.format || '2D Digital';
        if (rType.toUpperCase().includes('IMAX')) formatStr = 'IMAX 3D Laser';
        else if (rType.toUpperCase().includes('VIP')) formatStr = 'VIP Gold Class';
        return {
          success: true,
          data: {
            ...data,
            format: formatStr,
            start_time: typeof data.start_time === 'string' ? data.start_time.replace('T', ' ').substring(0, 19) : data.start_time,
            end_time: typeof data.end_time === 'string' ? data.end_time.replace('T', ' ').substring(0, 19) : data.end_time,
            price: typeof data.price === 'string' ? parseFloat(data.price) : (data.price || 85000)
          }
        };
      }
    } catch (e) {
      // Fallback
    }

    // Tìm trong mock cho ngày hôm nay và các ngày lân cận
    const todayStr = window.FormatUtil ? window.FormatUtil.formatDateToYMD(new Date()) : new Date().toISOString().split('T')[0];
    const mockList = this.generateMockShowtimes(todayStr);
    const found = mockList.find(s => s.id === sId) || mockList[0];
    return { success: true, data: found };
  },

  /**
   * Lấy danh sách tất cả các cụm rạp
   */
  getCinemasList() {
    return this._mockCinemas;
  },

  /**
   * Admin: Lấy danh sách suất chiếu từ API (có phân trang, tìm kiếm, lọc)
   */
  async adminGetShowtimes({ page = 1, limit = 50, movieId, cinemaId, roomId, date, search, status } = {}) {
    try {
      const baseUrl = this._getBaseUrl();
      const params = new URLSearchParams();
      if (page) params.append('page', page);
      if (limit) params.append('limit', limit);
      if (movieId && movieId !== 'all') params.append('movie_id', movieId);
      if (cinemaId && cinemaId !== 'all') params.append('cinema_id', cinemaId);
      if (roomId && roomId !== 'all') params.append('room_id', roomId);
      if (date && date !== 'all') params.append('date', date);
      if (search && search.trim()) params.append('search', search.trim());
      if (status && status !== 'all') params.append('status', status);

      const url = `${baseUrl}/api/admin/showtimes?${params.toString()}`;
      if (window.apiClient) {
        const res = await window.apiClient.get(url);
        return { success: true, data: res.data };
      }
      const res = await fetch(url, { headers: this._getHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Lỗi tải danh sách suất chiếu');
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.response?.data?.detail || error.message };
    }
  },

  /**
   * Admin: Lấy chi tiết một suất chiếu
   */
  async adminGetShowtimeById(id) {
    try {
      const baseUrl = this._getBaseUrl();
      const url = `${baseUrl}/api/admin/showtimes/${id}`;
      if (window.apiClient) {
        const res = await window.apiClient.get(url);
        return { success: true, data: res.data };
      }
      const res = await fetch(url, { headers: this._getHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Lỗi lấy chi tiết suất chiếu');
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.response?.data?.detail || error.message };
    }
  },

  /**
   * Admin: Thêm mới suất chiếu (chặn trùng giờ kèm 15 phút dọn phòng)
   */
  async adminCreateShowtime(payload) {
    try {
      const baseUrl = this._getBaseUrl();
      const url = `${baseUrl}/api/admin/showtimes`;
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
      if (!res.ok) throw new Error(data.detail || 'Lỗi khi tạo suất chiếu mới');
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.response?.data?.detail || error.message };
    }
  },

  /**
   * Admin: Cập nhật / sửa thông tin suất chiếu
   */
  async adminUpdateShowtime(id, payload) {
    try {
      const baseUrl = this._getBaseUrl();
      const url = `${baseUrl}/api/admin/showtimes/${id}`;
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
      if (!res.ok) throw new Error(data.detail || 'Lỗi khi cập nhật suất chiếu');
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.response?.data?.detail || error.message };
    }
  },

  /**
   * Admin: Hủy / xóa suất chiếu
   */
  async adminDeleteShowtime(id, force = false) {
    try {
      const baseUrl = this._getBaseUrl();
      const url = `${baseUrl}/api/admin/showtimes/${id}${force ? '?force=true' : ''}`;
      if (window.apiClient) {
        const res = await window.apiClient.delete(url);
        return { success: true, data: res.data };
      }
      const res = await fetch(url, {
        method: 'DELETE',
        headers: this._getHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Lỗi khi xóa suất chiếu');
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.response?.data?.detail || error.message };
    }
  }
};

window.ShowtimeService = ShowtimeService;
