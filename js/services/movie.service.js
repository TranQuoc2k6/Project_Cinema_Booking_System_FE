/**
 * ==========================================================================
 * MOVIE SERVICE (js/services/movie.service.js)
 * Cung cấp API tải danh sách phim và chi tiết phim kèm Mock fallback
 * ==========================================================================
 */

const MovieService = {
  _mockMovies: [
    {
      id: 1,
      title: "Mai (18+)",
      original_title: "Mai",
      duration_minutes: 131,
      release_date: "2024-02-10",
      age_rating: "T18",
      genres: ["Tâm Lý", "Tình Cảm"],
      director: "Trấn Thành",
      cast: "Phương Anh Đào, Tuấn Trần, Trấn Thành, Hồng Đào",
      status: "NOW_SHOWING",
      poster_url: "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=800",
      banner_url: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=1400",
      rating: 8.8,
      description: "Câu chuyện xoay quanh Mai, một người phụ nữ làm nghề mát-xa chịu nhiều định kiến, và cuộc gặp gỡ định mệnh với Dương - một chàng trai trẻ đam mê âm nhạc."
    },
    {
      id: 2,
      title: "Lật Mặt 7: Một Điều Ước",
      original_title: "Face Off 7: One Wish",
      duration_minutes: 138,
      release_date: "2024-04-26",
      age_rating: "K",
      genres: ["Gia Đình", "Hài", "Chính Kịch"],
      director: "Lý Hải",
      cast: "Thanh Hiền, Trương Minh Cường, Đinh Y Nhung, Quách Ngọc Tuyên",
      status: "NOW_SHOWING",
      poster_url: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800",
      banner_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1400",
      rating: 9.1,
      description: "Câu chuyện cảm động về người mẹ già 73 tuổi một mình nuôi 5 người con khôn lớn. Khi bà gặp nạn, ai trong số 5 người con sẽ chăm sóc bà?"
    },
    {
      id: 3,
      title: "Dune: Hành Tinh Cát 2",
      original_title: "Dune: Part Two",
      duration_minutes: 166,
      release_date: "2024-03-01",
      age_rating: "T16",
      genres: ["Khoa Học Viễn Tưởng", "Hành Động", "Phiêu Lưu"],
      director: "Denis Villeneuve",
      cast: "Timothée Chalamet, Zendaya, Rebecca Ferguson, Javier Bardem",
      status: "NOW_SHOWING",
      poster_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800",
      banner_url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1400",
      rating: 9.4,
      description: "Paul Atreides liên minh cùng Chani và người Fremen trên hành trình báo thù những kẻ đã hủy diệt gia tộc anh. Đứng trước sự lựa chọn giữa tình yêu và số phận vũ trụ."
    },
    {
      id: 4,
      title: "Kung Fu Panda 4",
      original_title: "Kung Fu Panda 4",
      duration_minutes: 94,
      release_date: "2024-03-08",
      age_rating: "P",
      genres: ["Hoạt Hình", "Hành Động", "Hài"],
      director: "Mike Mitchell",
      cast: "Jack Black, Awkwafina, Viola Davis, Dustin Hoffman",
      status: "NOW_SHOWING",
      poster_url: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?q=80&w=800",
      banner_url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=1400",
      rating: 8.5,
      description: "Gấu Po được định mệnh lựa chọn để trở thành Thủ lĩnh Tinh thần của Thung lũng Bình Yên, và cậu cần tìm và huấn luyện một Thần Long Đại Hiệp mới."
    },
    {
      id: 5,
      title: "Quật Mộ Trùng Ma (Exhuma)",
      original_title: "Exhuma",
      duration_minutes: 134,
      release_date: "2024-03-15",
      age_rating: "T18",
      genres: ["Kinh Dị", "Bí Ẩn", "Giật Gân"],
      director: "Jang Jae-hyun",
      cast: "Choi Min-sik, Kim Go-eun, Yoo Hae-jin, Lee Do-hyun",
      status: "NOW_SHOWING",
      poster_url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800",
      banner_url: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1400",
      rating: 9.0,
      description: "Hai pháp sư trừ tà, một chuyên gia phong thủy và một nhân viên tang lễ khai quật một ngôi mộ bí ẩn để giải cứu một gia đình tài phiệt, giải thoát một ác linh cổ xưa."
    },
    {
      id: 6,
      title: "Godzilla x Kong: Đế Chế Mới",
      original_title: "Godzilla x Kong: The New Empire",
      duration_minutes: 115,
      release_date: "2024-03-29",
      age_rating: "T13",
      genres: ["Hành Động", "Viễn Tưởng", "Quái Vật"],
      director: "Adam Wingard",
      cast: "Rebecca Hall, Brian Tyree Henry, Dan Stevens",
      status: "NOW_SHOWING",
      poster_url: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=800",
      banner_url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1400",
      rating: 8.6,
      description: "Hai quái thú huyền thoại Godzilla và Kong phải hợp lực để đối đầu với một mối đe dọa khổng lồ chưa từng thấy ẩn sâu trong Trái Đất Rỗng."
    }
  ],

  /**
   * Lấy danh sách tất cả phim
   */
  async getMovies() {
    try {
      if (window.apiClient) {
        const res = await window.apiClient.get('/movies');
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          return { success: true, data: res.data };
        }
      }
      const res = await fetch('http://127.0.0.1:8000/api/movies');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return { success: true, data };
      }
    } catch (e) {
      console.info('[MovieService] Sử dụng mock data phim.');
    }
    return { success: true, data: this._mockMovies };
  },

  /**
   * Lấy thông tin chi tiết một phim theo ID
   */
  async getMovieById(id) {
    const numId = parseInt(id, 10);
    try {
      if (window.apiClient) {
        const res = await window.apiClient.get(`/movies/${numId}`);
        if (res.data) return { success: true, data: res.data };
      }
      const res = await fetch(`http://127.0.0.1:8000/api/movies/${numId}`);
      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      }
    } catch (e) {
      // Fallback
    }
    const movie = this._mockMovies.find(m => m.id === numId) || this._mockMovies[0];
    return { success: true, data: movie };
  }
};

window.MovieService = MovieService;
