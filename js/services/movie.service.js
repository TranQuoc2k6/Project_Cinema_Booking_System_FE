
/**
 * ==========================================================================
 * MOVIE SERVICE (js/services/movie.service.js)
 * Lấy dữ liệu phim từ Backend
 * ==========================================================================
 */

const MovieService = {
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
   * Danh sách phim mẫu fallback khi Backend API offline
   */
  _mockMovies: [
    {
      id: 1,
      title: 'Mai (18+)',
      original_title: 'Mai',
      duration_minutes: 131,
      status: 'now_showing',
      release_date: '2024-02-10',
      poster_url: 'https://upload.wikimedia.org/wikipedia/vi/3/36/Mai_2024_poster.jpg',
      description: 'Câu chuyện tình yêu đầy cảm xúc và trắc trở giữa Mai và Dương.',
      age_rating: 'T18',
      genres: ['Tình Cảm', 'Tâm Lý']
    },
    {
      id: 2,
      title: 'Lật Mặt 7: Một Điều Ước',
      original_title: 'One Wish',
      duration_minutes: 138,
      status: 'now_showing',
      release_date: '2024-04-26',
      poster_url: 'https://image.tmdb.org/t/p/original/1K7pHhCZprfDXB7LkCquIK62yCb.jpg',
      description: 'Tình mẫu tử thiêng liêng và lòng hiếu thảo của những người con.',
      age_rating: 'K',
      genres: ['Gia Đình', 'Tâm Lý']
    },
    {
      id: 3,
      title: 'Dune: Hành Tinh Cát 2',
      original_title: 'Dune: Part Two',
      duration_minutes: 166,
      status: 'now_showing',
      release_date: '2024-03-01',
      poster_url: 'https://image.tmdb.org/t/p/original/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg',
      description: 'Hành trình trả thù và định đoạt tương lai thiên hà của Paul Atreides.',
      age_rating: 'T16',
      genres: ['Hành Động', 'Khoa Học Viễn Tưởng']
    },
    {
      id: 4,
      title: 'Quật Mộ Trùng Ma (Exhuma)',
      original_title: 'Exhuma',
      duration_minutes: 134,
      status: 'now_showing',
      release_date: '2024-03-15',
      poster_url: 'https://image.tmdb.org/t/p/original/tMefBSflR6PGQLv7WvFPpKLZkyk.jpg',
      description: 'Bí ẩn ngôi mộ cổ đe dọa sinh mạng của gia tộc giàu có.',
      age_rating: 'T18',
      genres: ['Kinh Dị', 'Bí Ẩn']
    },
    {
      id: 5,
      title: 'Kung Fu Panda 4',
      original_title: 'Kung Fu Panda 4',
      duration_minutes: 94,
      status: 'now_showing',
      release_date: '2024-03-08',
      poster_url: 'https://image.tmdb.org/t/p/original/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg',
      description: 'Po đối mặt với thử thách mới để trở thành Thủ lĩnh tâm linh.',
      age_rating: 'P',
      genres: ['Hoạt Hình', 'Hài Hước']
    },
    {
      id: 6,
      title: 'Godzilla x Kong: Đế Chế Mới',
      original_title: 'Godzilla x Kong',
      duration_minutes: 115,
      status: 'now_showing',
      release_date: '2024-03-29',
      poster_url: 'https://upload.wikimedia.org/wikipedia/en/b/be/Godzilla_x_kong_the_new_empire_poster.jpg',
      description: 'Trận chiến đỉnh cao giữa Godzilla và Kong chống lại mối đe dọa khổng lồ.',
      age_rating: 'T13',
      genres: ['Hành Động', 'Khoa Học Viễn Tưởng']
    },
    {
      id: 7,
      title: 'Deadpool & Wolverine',
      original_title: 'Deadpool & Wolverine',
      duration_minutes: 128,
      status: 'coming_soon',
      release_date: '2026-11-28',
      poster_url: 'https://image.tmdb.org/t/p/original/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
      description: 'Sự kết hợp bùng nổ và hài hước giữa hai dị nhân biểu tượng của Marvel trong chuyến phiêu lưu đa vũ trụ.',
      age_rating: 'T18',
      genres: ['Hành Động', 'Hài Hước', 'Khoa Học Viễn Tưởng']
    },
    {
      id: 8,
      title: 'Moana 2: Hành Trình Biển Cả',
      original_title: 'Moana 2',
      duration_minutes: 100,
      status: 'coming_soon',
      release_date: '2026-12-05',
      poster_url: 'https://image.tmdb.org/t/p/original/yh64qw9mgXBvlaWDi7Q9tpUBAvH.jpg',
      description: 'Moana cùng á thần Maui bước vào hành trình thám hiểm đại dương bao la đầy hiểm nguy và kỳ vĩ mới.',
      age_rating: 'P',
      genres: ['Hoạt Hình', 'Hài Hước']
    },
    {
      id: 9,
      title: 'Võ Sĩ Giác Đấu II (Gladiator II)',
      original_title: 'Gladiator II',
      duration_minutes: 148,
      status: 'coming_soon',
      release_date: '2026-12-18',
      poster_url: 'https://image.tmdb.org/t/p/original/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg',
      description: 'Trường thiên sử thi rực lửa tại đấu trường La Mã cổ đại nối tiếp huyền thoại đoạt giải Oscar năm 2000.',
      age_rating: 'T18',
      genres: ['Hành Động', 'Tâm Lý']
    }
  ],

  async getMovies() {
    try {
      const baseUrl = this._getBaseUrl();
      let allMovies = [];
      let page = 1;
      let totalPages = 1;

      // Lấy lần lượt các trang dữ liệu phim
      do {
        const url = `${baseUrl}/api/movies?page=${page}&limit=10`;

        let data;

        if (window.apiClient) {
          const res = await window.apiClient.get(url);
          data = res.data;
        } else {
          const res = await fetch(url);

          if (!res.ok) {
            throw new Error('Không thể tải danh sách phim');
          }

          data = await res.json();
        }

        // Backend trả về { items, page, limit, total, total_pages }
        const movies = Array.isArray(data)
          ? data
          : data.items || [];

        allMovies = allMovies.concat(movies);
        totalPages = data.total_pages || 1;
        page++;
      } while (page <= totalPages);

      if (allMovies.length > 0) {
        return {
          success: true,
          data: allMovies
        };
      }
      return {
        success: true,
        data: this._mockMovies
      };
    } catch (error) {
      console.info('[MovieService.getMovies] Sử dụng danh sách phim mẫu fallback.');

      return {
        success: true,
        data: this._mockMovies,
        message: error.response?.data?.detail || error.message
      };
    }
  },

  async getMovieById(id) {
    try {
      const baseUrl = this._getBaseUrl();
      const url = `${baseUrl}/api/movies/${id}`;

      let data;

      if (window.apiClient) {
        const res = await window.apiClient.get(url);
        data = res.data;
      } else {
        const res = await fetch(url);

        if (!res.ok) {
          throw new Error('Không tìm thấy phim');
        }

        data = await res.json();
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      const mId = parseInt(id, 10);
      const fallback = this._mockMovies.find(m => m.id === mId) || this._mockMovies[0];
      return {
        success: true,
        data: fallback,
        message: error.response?.data?.detail || error.message
      };
    }
  },

  // ========================================================================
  // ADMIN APIS (QUẢN TRỊ DANH MỤC PHIM)
  // ========================================================================

  /**
   * Upload ảnh poster phim lên máy chủ (.jpg, .jpeg, .png, tối đa 5MB)
   * Trả về đường dẫn ảnh tĩnh /uploads/posters/...
   */
  async uploadPoster(file) {
    try {
      const baseUrl = this._getBaseUrl();
      const formData = new FormData();
      formData.append('file', file);

      const token = (window.StorageService && window.StorageService.getToken()) ||
                    localStorage.getItem('cinema_access_token') ||
                    localStorage.getItem('token') ||
                    sessionStorage.getItem('cinema_access_token');

      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Thử gọi endpoint admin trước, nếu không được thử endpoint public
      const url = `${baseUrl}/api/admin/movies/upload-poster`;

      if (window.apiClient) {
        try {
          const res = await window.apiClient.post(url, formData, {
            headers: { ...headers, 'Content-Type': 'multipart/form-data' }
          });
          return { success: true, data: res.data };
        } catch (apiErr) {
          // Thử fallback sang public upload router
          const fallbackUrl = `${baseUrl}/api/movies/upload-poster`;
          const res = await window.apiClient.post(fallbackUrl, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          return { success: true, data: res.data };
        }
      }

      let res = await fetch(url, {
        method: 'POST',
        headers,
        body: formData
      });

      if (!res.ok && res.status === 401) {
        // Thử fallback sang public upload router
        const fallbackUrl = `${baseUrl}/api/movies/upload-poster`;
        res = await fetch(fallbackUrl, {
          method: 'POST',
          body: formData
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Không thể upload ảnh poster');
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || error.message
      };
    }
  },

  /**
   * Lấy danh sách phim cho trang Admin (có phân trang, tìm kiếm & lọc trạng thái)
   */
  async adminGetMovies({ page = 1, limit = 100, status = 'all', search = '' } = {}) {
    try {
      const baseUrl = this._getBaseUrl();
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);
      if (status && status !== 'all') params.append('status', status);
      if (search && search.trim()) params.append('search', search.trim());

      const url = `${baseUrl}/api/admin/movies?${params.toString()}`;
      if (window.apiClient) {
        const res = await window.apiClient.get(url);
        return { success: true, data: res.data };
      }
      const res = await fetch(url, { headers: this._getHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Không thể tải danh sách phim quản trị');
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || error.message
      };
    }
  },

  /**
   * Thêm phim mới vào Database
   */
  async adminCreateMovie(payload) {
    try {
      const baseUrl = this._getBaseUrl();
      const url = `${baseUrl}/api/admin/movies`;
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
      if (!res.ok) throw new Error(data.detail || 'Không thể tạo phim mới');
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || error.message
      };
    }
  },

  /**
   * Cập nhật thông tin phim
   */
  async adminUpdateMovie(movieId, payload) {
    try {
      const baseUrl = this._getBaseUrl();
      const url = `${baseUrl}/api/admin/movies/${movieId}`;
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
      if (!res.ok) throw new Error(data.detail || 'Không thể cập nhật phim');
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || error.message
      };
    }
  },

  /**
   * Ngừng chiếu phim (chuyển sang 'ended')
   */
  async adminStopMovie(movieId) {
    try {
      const baseUrl = this._getBaseUrl();
      const url = `${baseUrl}/api/admin/movies/${movieId}/stop`;
      if (window.apiClient) {
        const res = await window.apiClient.patch(url);
        return { success: true, data: res.data };
      }
      const res = await fetch(url, {
        method: 'PATCH',
        headers: this._getHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Không thể ngừng chiếu phim');
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || error.message
      };
    }
  },

  /**
   * Điều chỉnh trạng thái phim (now_showing, coming_soon, ended)
   */
  async adminUpdateStatus(movieId, status) {
    try {
      const baseUrl = this._getBaseUrl();
      const url = `${baseUrl}/api/admin/movies/${movieId}/status`;
      if (window.apiClient) {
        const res = await window.apiClient.patch(url, { status });
        return { success: true, data: res.data };
      }
      const res = await fetch(url, {
        method: 'PATCH',
        headers: this._getHeaders(),
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Không thể cập nhật trạng thái');
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || error.message
      };
    }
  },

  /**
   * Xóa vĩnh viễn phim khỏi hệ thống
   */
  async adminDeleteMovie(movieId) {
    try {
      const baseUrl = this._getBaseUrl();
      const url = `${baseUrl}/api/admin/movies/${movieId}`;
      if (window.apiClient) {
        const res = await window.apiClient.delete(url);
        return { success: true, data: res.data };
      }
      const res = await fetch(url, {
        method: 'DELETE',
        headers: this._getHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Không thể xóa phim');
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || error.message
      };
    }
  }
};

window.MovieService = MovieService;
