/**
 * ==========================================================================
 * REVIEW SERVICE (js/services/review.service.js)
 * Quản lý gọi API Đánh giá & Bình luận phim (Task T3C7300)
 * ==========================================================================
 */

const ReviewService = {
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
   * Lấy danh sách đánh giá của phim (kèm điểm trung bình & phân bổ sao)
   */
  async getMovieReviews(movieId, page = 1, limit = 10) {
    try {
      const baseUrl = this._getBaseUrl();
      const url = `${baseUrl}/api/movies/${movieId}/reviews?page=${page}&limit=${limit}`;

      let data;
      if (window.apiClient) {
        const res = await window.apiClient.get(url);
        data = res.data;
      } else {
        const res = await fetch(url, { headers: this._getHeaders() });
        if (!res.ok) {
          throw new Error('Không thể tải danh sách đánh giá');
        }
        data = await res.json();
      }

      return {
        success: true,
        data
      };
    } catch (err) {
      console.warn('[ReviewService.getMovieReviews]', err);
      return {
        success: false,
        message: err.response?.data?.detail || err.message || 'Lỗi khi tải đánh giá phim',
        data: {
          average_rating: 0.0,
          total_reviews: 0,
          rating_breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          items: [],
          page: 1,
          limit: 10,
          total_pages: 1
        }
      };
    }
  },

  /**
   * Kiểm tra điều kiện khách hàng đã xem phim để đánh giá
   */
  async checkEligibility(movieId) {
    try {
      const token = (window.StorageService && window.StorageService.getToken()) ||
                    localStorage.getItem('cinema_access_token') ||
                    localStorage.getItem('token') ||
                    sessionStorage.getItem('cinema_access_token');
      if (!token) {
        return {
          success: false,
          isAuthError: true,
          data: {
            can_review: false,
            reason: 'Vui lòng đăng nhập để đánh giá phim.',
            has_reviewed: false,
            existing_review: null
          }
        };
      }

      const baseUrl = this._getBaseUrl();
      const url = `${baseUrl}/api/movies/${movieId}/reviews/eligibility`;

      let data;
      if (window.apiClient) {
        const res = await window.apiClient.get(url);
        data = res.data;
      } else {
        const res = await fetch(url, { headers: this._getHeaders() });
        if (!res.ok) {
          if (res.status === 401) {
            return {
              success: false,
              isAuthError: true,
              data: { can_review: false, reason: 'Vui lòng đăng nhập để đánh giá phim.', has_reviewed: false }
            };
          }
          throw new Error('Lỗi kiểm tra quyền đánh giá');
        }
        data = await res.json();
      }

      return {
        success: true,
        data
      };
    } catch (err) {
      const status = err.response?.status;
      return {
        success: false,
        isAuthError: status === 401,
        message: err.response?.data?.detail || err.message || 'Không thể kiểm tra điều kiện đánh giá',
        data: {
          can_review: false,
          reason: err.response?.data?.detail || 'Chưa xác thực quyền đánh giá',
          has_reviewed: false,
          existing_review: null
        }
      };
    }
  },

  /**
   * Gửi đánh giá mới hoặc cập nhật đánh giá cũ
   */
  async submitReview(movieId, rating, comment) {
    try {
      const baseUrl = this._getBaseUrl();
      const url = `${baseUrl}/api/movies/${movieId}/reviews`;
      const payload = { rating: parseInt(rating, 10), comment: comment ? comment.trim() : '' };

      let data;
      if (window.apiClient) {
        const res = await window.apiClient.post(url, payload);
        data = res.data;
      } else {
        const res = await fetch(url, {
          method: 'POST',
          headers: this._getHeaders(),
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || 'Không thể gửi đánh giá');
        }
        data = await res.json();
      }

      return {
        success: true,
        data
      };
    } catch (err) {
      console.error('[ReviewService.submitReview]', err);
      return {
        success: false,
        message: err.response?.data?.detail || err.message || 'Gửi đánh giá thất bại.'
      };
    }
  },

  /**
   * Cập nhật đánh giá hiện tại
   */
  async updateReview(movieId, rating, comment) {
    try {
      const baseUrl = this._getBaseUrl();
      const url = `${baseUrl}/api/movies/${movieId}/reviews`;
      const payload = { rating: parseInt(rating, 10), comment: comment ? comment.trim() : '' };

      let data;
      if (window.apiClient) {
        const res = await window.apiClient.put(url, payload);
        data = res.data;
      } else {
        const res = await fetch(url, {
          method: 'PUT',
          headers: this._getHeaders(),
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || 'Không thể cập nhật đánh giá');
        }
        data = await res.json();
      }

      return {
        success: true,
        data
      };
    } catch (err) {
      console.error('[ReviewService.updateReview]', err);
      return {
        success: false,
        message: err.response?.data?.detail || err.message || 'Cập nhật đánh giá thất bại.'
      };
    }
  },

  /**
   * Lấy tóm tắt điểm đánh giá
   */
  async getRatingSummary(movieId) {
    try {
      const baseUrl = this._getBaseUrl();
      const url = `${baseUrl}/api/movies/${movieId}/rating-summary`;

      let data;
      if (window.apiClient) {
        const res = await window.apiClient.get(url);
        data = res.data;
      } else {
        const res = await fetch(url, { headers: this._getHeaders() });
        data = await res.json();
      }

      return {
        success: true,
        data
      };
    } catch (err) {
      return {
        success: false,
        data: { average_rating: 0.0, total_reviews: 0, rating_breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } }
      };
    }
  }
};

window.ReviewService = ReviewService;
