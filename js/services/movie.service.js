
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

      return {
        success: true,
        data: allMovies
      };
    } catch (error) {
      console.error('[MovieService.getMovies]', error);

      return {
        success: false,
        data: [],
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
      return {
        success: false,
        data: null,
        message: error.response?.data?.detail || error.message
      };
    }
  }
};

window.MovieService = MovieService;
