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
      if (movieId) params.append('movie_id', movieId);
      if (cinemaId) params.append('cinema_id', cinemaId);
      if (city) params.append('city', city);

      const url = `${baseUrl}/api/showtimes${params.toString() ? '?' + params.toString() : ''}`;

      if (window.apiClient) {
        const res = await window.apiClient.get(url);
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          return { success: true, data: res.data };
        }
      } else {
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            return { success: true, data };
          }
        }
      }
    } catch (e) {
      console.info('[ShowtimeService] Sử dụng mock data suất chiếu cho ngày:', targetDate);
    }

    // Fallback Mock Data
    let allShowtimes = this.generateMockShowtimes(targetDate);

    // Áp dụng bộ lọc client-side cho mock data
    if (movieId) {
      const mId = parseInt(movieId, 10);
      allShowtimes = allShowtimes.filter(s => s.movie_id === mId);
    }

    if (cinemaId) {
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
      if (window.apiClient) {
        const res = await window.apiClient.get(url);
        if (res.data) return { success: true, data: res.data };
      } else {
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          return { success: true, data };
        }
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
  }
};

window.ShowtimeService = ShowtimeService;
