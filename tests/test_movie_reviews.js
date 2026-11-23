/**
 * ==========================================================================
 * UNIT TESTS: MOVIE REVIEWS & RATINGS (tests/test_movie_reviews.js)
 * Kiểm thử toàn diện chức năng Đánh giá & Bình luận phim (Task T3C7300)
 * ==========================================================================
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Mock môi trường Browser DOM & Storage
global.window = global;
global.localStorage = {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, val) { this.store[key] = String(val); },
  removeItem(key) { delete this.store[key]; },
  clear() { this.store = {}; }
};
global.sessionStorage = {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, val) { this.store[key] = String(val); },
  removeItem(key) { delete this.store[key]; },
  clear() { this.store = {}; }
};

global.document = {
  title: '',
  getElementById: (id) => ({
    id,
    innerHTML: '',
    textContent: '',
    value: '',
    style: {},
    appendChild: () => {},
    classList: {
      add: () => {},
      remove: () => {},
      toggle: () => {},
      contains: () => false
    },
    querySelectorAll: () => [],
    scrollIntoView: () => {}
  }),
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  createElement: (tag) => ({
    tagName: tag,
    innerHTML: '',
    textContent: '',
    style: {},
    classList: {
      add: () => {},
      remove: () => {},
      toggle: () => {}
    },
    appendChild: () => {},
    setAttribute: () => {},
    remove: () => {}
  })
};

// Nạp StorageService mock
global.StorageService = {
  _token: null,
  _user: null,
  isAuthenticated() { return Boolean(this._token); },
  getToken() { return this._token; },
  getUser() { return this._user; }
};

// Nạp ReviewService
const reviewServiceCode = fs.readFileSync(path.join(__dirname, '../js/services/review.service.js'), 'utf8');
eval(reviewServiceCode);

// Nạp MovieDetailPage controller
const movieDetailCode = fs.readFileSync(path.join(__dirname, '../js/pages/movie-detail.js'), 'utf8');
eval(movieDetailCode);

console.log('🧪 BẮT ĐẦU KIỂM THỬ FRONTEND ĐÁNH GIÁ & BÌNH LUẬN PHIM (Task T3C7300)...\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (error) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Chi tiết: ${error.message}\n`);
  }
}

// --------------------------------------------------------------------------
// SUITE 1: ReviewService Interface
// --------------------------------------------------------------------------
runTest('ReviewService được định nghĩa đầy đủ các phương thức API cần thiết', () => {
  assert.ok(global.ReviewService, 'ReviewService phải tồn tại trên window');
  assert.strictEqual(typeof global.ReviewService.getMovieReviews, 'function');
  assert.strictEqual(typeof global.ReviewService.checkEligibility, 'function');
  assert.strictEqual(typeof global.ReviewService.submitReview, 'function');
  assert.strictEqual(typeof global.ReviewService.updateReview, 'function');
  assert.strictEqual(typeof global.ReviewService.getRatingSummary, 'function');
});

runTest('ReviewService.checkEligibility tự phát hiện khách chưa đăng nhập và không ném lỗi', async () => {
  global.StorageService._token = null;
  const res = await global.ReviewService.checkEligibility(1);
  assert.strictEqual(res.success, false);
  assert.strictEqual(res.isAuthError, true);
  assert.strictEqual(res.data.can_review, false);
});

// --------------------------------------------------------------------------
// SUITE 2: Helper Functions của MovieDetailPage
// --------------------------------------------------------------------------
runTest('MovieDetailPage.escapeHtml ngăn chặn tấn công XSS an toàn', () => {
  const unsafe = '<script>alert("hacked")</script> & "quotes" \'single\'';
  const safe = MovieDetailPage.escapeHtml(unsafe);
  assert.ok(!safe.includes('<script>'), 'Không được chứa thẻ HTML thô');
  assert.ok(safe.includes('&lt;script&gt;'));
  assert.ok(safe.includes('&amp;'));
  assert.ok(safe.includes('&quot;'));
  assert.ok(safe.includes('&#039;'));
});

runTest('MovieDetailPage.formatReviewDate định dạng ngày tháng hợp lệ', () => {
  const formatted = MovieDetailPage.formatReviewDate('2026-11-20T10:30:00Z');
  assert.ok(formatted.includes('2026'), 'Phải chứa năm 2026');
  assert.ok(formatted.includes('11'), 'Phải chứa tháng 11');
});

runTest('MovieDetailPage.getRatingLabel trả về mô tả số sao chuẩn xác', () => {
  assert.strictEqual(MovieDetailPage.getRatingLabel(5), '5 sao - Tuyệt tác xuất sắc!');
  assert.strictEqual(MovieDetailPage.getRatingLabel(4), '4 sao - Rất hay, đáng xem');
  assert.strictEqual(MovieDetailPage.getRatingLabel(1), '1 sao - Rất thất vọng');
});

runTest('MovieDetailPage.getQuickRatingText trả về đúng chuỗi điểm trung bình và lượt đánh giá', () => {
  // Khi chưa có đánh giá
  MovieDetailPage.state.reviews.totalReviews = 0;
  MovieDetailPage.state.reviews.averageRating = 0.0;
  assert.strictEqual(MovieDetailPage.getQuickRatingText(), 'Chưa có đánh giá');

  // Khi có đánh giá (4.8 sao, 25 lượt)
  MovieDetailPage.state.reviews.totalReviews = 25;
  MovieDetailPage.state.reviews.averageRating = 4.8;
  assert.strictEqual(MovieDetailPage.getQuickRatingText(), '4.8/5 (25)');
});

runTest('MovieDetailPage.renderStarsHtml sinh đủ 5 icon sao theo điểm số', () => {
  const html5 = MovieDetailPage.renderStarsHtml(5.0);
  const solidCount5 = (html5.match(/fa-solid fa-star/g) || []).length;
  assert.strictEqual(solidCount5, 5, '5 sao phải có 5 ngôi sao đặc vàng');

  const htmlHalf = MovieDetailPage.renderStarsHtml(4.5);
  const halfCount = (htmlHalf.match(/fa-solid fa-star-half-stroke/g) || []).length;
  assert.strictEqual(halfCount, 1, '4.5 sao phải có 1 ngôi sao nửa');
});

// --------------------------------------------------------------------------
// SUITE 3: Render Giao diện theo các trạng thái người dùng
// --------------------------------------------------------------------------
runTest('renderReviewActionAreaHtml hiển thị lời mời đăng nhập khi người dùng chưa đăng nhập', () => {
  global.StorageService._token = null;
  const html = MovieDetailPage.renderReviewActionAreaHtml();
  assert.ok(html.includes('Đăng Nhập Để Đánh Giá'), 'Phải chứa nút đăng nhập');
  assert.ok(html.includes('fa-user-lock'), 'Phải chứa icon yêu cầu xác thực');
});

runTest('renderReviewActionAreaHtml hiển thị cảnh báo khi đã đăng nhập nhưng chưa đủ điều kiện', () => {
  global.StorageService._token = 'valid-token';
  MovieDetailPage.state.reviews.eligibility = {
    checked: true,
    canReview: false,
    reason: 'Bạn chưa mua vé xem phim này.',
    hasReviewed: false,
    existingReview: null
  };
  const html = MovieDetailPage.renderReviewActionAreaHtml();
  assert.ok(html.includes('Chưa Đủ Điều Kiện Đánh Giá Phim'), 'Phải có tiêu đề chưa đủ điều kiện');
  assert.ok(html.includes('Bạn chưa mua vé xem phim này.'), 'Phải giải thích lý do cụ thể');
});

runTest('renderReviewActionAreaHtml hiển thị form gửi nhận xét khi khách hàng đủ điều kiện', () => {
  global.StorageService._token = 'valid-token';
  MovieDetailPage.state.reviews.eligibility = {
    checked: true,
    canReview: true,
    reason: 'Đủ điều kiện',
    hasReviewed: false,
    existingReview: null
  };
  MovieDetailPage.state.reviews.isEditing = false;
  const html = MovieDetailPage.renderReviewActionAreaHtml();
  assert.ok(html.includes('id="movie-review-form"'), 'Phải render form');
  assert.ok(html.includes('id="review-comment-input"'), 'Phải có ô nhập bình luận');
  assert.ok(html.includes('id="star-picker-container"'), 'Phải có bộ chọn số sao');
  assert.ok(html.includes('Gửi Đánh Giá Của Bạn'), 'Phải có nút gửi đánh giá');
});

runTest('renderReviewActionAreaHtml hiển thị thẻ đánh giá đã gửi và nút sửa khi đã có đánh giá', () => {
  global.StorageService._token = 'valid-token';
  MovieDetailPage.state.reviews.eligibility = {
    checked: true,
    canReview: true,
    reason: 'Đã đánh giá',
    hasReviewed: true,
    existingReview: {
      id: 99,
      rating: 5,
      comment: 'Phim cực hay và xúc động!',
      created_at: '2026-11-20T10:00:00Z',
      updated_at: '2026-11-20T10:00:00Z'
    }
  };
  MovieDetailPage.state.reviews.isEditing = false;
  const html = MovieDetailPage.renderReviewActionAreaHtml();
  assert.ok(html.includes('Đánh giá của bạn'), 'Phải có nhãn đánh giá của bạn');
  assert.ok(html.includes('Chỉnh Sửa Đánh Giá'), 'Phải có nút mở form chỉnh sửa');
  assert.ok(html.includes('Phim cực hay và xúc động!'), 'Phải hiển thị nội dung nhận xét');
});

// --------------------------------------------------------------------------
// SUITE 4: Tích hợp HTML & CSS
// --------------------------------------------------------------------------
runTest('File pages/movie-detail.html nạp đúng review.service.js', () => {
  const html = fs.readFileSync(path.join(__dirname, '../pages/movie-detail.html'), 'utf8');
  assert.ok(html.includes('../js/services/review.service.js'), 'Phải nhúng review.service.js');
});

runTest('File css/pages/movie-detail.css chứa đầy đủ class cho Review Components', () => {
  const css = fs.readFileSync(path.join(__dirname, '../css/pages/movie-detail.css'), 'utf8');
  assert.ok(css.includes('.star-rating-select'), 'Phải có class star-rating-select');
  assert.ok(css.includes('.star-interactive-btn'), 'Phải có class star-interactive-btn');
  assert.ok(css.includes('.rating-bar-fill'), 'Phải có class rating-bar-fill');
  assert.ok(css.includes('.review-card-item'), 'Phải có class review-card-item');
  assert.ok(css.includes('.badge-verified-viewer'), 'Phải có class badge-verified-viewer');
  assert.ok(css.includes('.badge-owner-review'), 'Phải có class badge-owner-review');
});

// --------------------------------------------------------------------------
// TỔNG KẾT
// --------------------------------------------------------------------------
console.log(`\n==================================================`);
console.log(`🎯 KẾT QUẢ: Đã vượt qua ${passedTests}/${totalTests} bài kiểm thử.`);
console.log(`==================================================\n`);

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
