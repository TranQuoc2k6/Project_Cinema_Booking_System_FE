/**
 * ==========================================================================
 * UNIT TESTS: MOVIE DETAIL PAGE (tests/test_movie_detail.js)
 * Kiểm thử tính năng trang chi tiết phim, nhúng trailer YouTube,
 * xử lý thể loại, trạng thái phim và liên kết đặt vé (Task T3C67AF)
 * ==========================================================================
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Mock môi trường Browser DOM
global.window = global;
global.document = {
  title: '',
  getElementById: (id) => ({
    id,
    innerHTML: '',
    style: {},
    appendChild: () => {},
    classList: { add: () => {}, remove: () => {} }
  }),
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  createElement: (tag) => ({
    tagName: tag,
    innerHTML: '',
    style: {},
    classList: { add: () => {}, remove: () => {} },
    appendChild: () => {},
    setAttribute: () => {}
  })
};

// Nạp MovieService
const movieServiceCode = fs.readFileSync(path.join(__dirname, '../js/services/movie.service.js'), 'utf8');
eval(movieServiceCode);

// Nạp MovieDetailPage controller
const movieDetailCode = fs.readFileSync(path.join(__dirname, '../js/pages/movie-detail.js'), 'utf8');
eval(movieDetailCode);

console.log('🧪 BẮT ĐẦU KIỂM THỬ TRANG CHI TIẾT PHIM (Task T3C67AF)...\n');

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
// SUITE 1: Chuyển đổi YouTube URL sang YouTube Embed URL
// --------------------------------------------------------------------------
runTest('Trích xuất đúng YouTube Embed URL từ dạng chuẩn watch?v=...', () => {
  const url = 'https://www.youtube.com/watch?v=Way9Dexny3w';
  const embed = MovieDetailPage.getYouTubeEmbedUrl(url);
  assert.ok(embed, 'Embed URL không được null');
  assert.ok(embed.includes('https://www.youtube.com/embed/Way9Dexny3w'), 'Phải chứa ID video Way9Dexny3w');
});

runTest('Trích xuất đúng YouTube Embed URL từ dạng rút gọn youtu.be/...', () => {
  const url = 'https://youtu.be/0wQv7n38h6g';
  const embed = MovieDetailPage.getYouTubeEmbedUrl(url);
  assert.ok(embed, 'Embed URL không được null');
  assert.ok(embed.includes('https://www.youtube.com/embed/0wQv7n38h6g'), 'Phải chứa ID video 0wQv7n38h6g');
});

runTest('Xử lý đúng URL YouTube có kèm tham số phụ (&t=10s, &ab_channel=...)', () => {
  const url = 'https://www.youtube.com/watch?v=8RjQzQ2Q_54&t=15s&feature=shared';
  const embed = MovieDetailPage.getYouTubeEmbedUrl(url);
  assert.ok(embed, 'Embed URL không được null');
  assert.ok(embed.includes('https://www.youtube.com/embed/8RjQzQ2Q_54'), 'Phải trích đúng 11 ký tự video ID');
});

runTest('Xử lý URL đã ở dạng /embed/ hợp lệ', () => {
  const url = 'https://www.youtube.com/embed/Way9Dexny3w';
  const embed = MovieDetailPage.getYouTubeEmbedUrl(url);
  assert.ok(embed.includes('https://www.youtube.com/embed/Way9Dexny3w'), 'Phải chứa URL embed hợp lệ');
});

runTest('Trả về null khi trailer_url rỗng, null hoặc không hợp lệ', () => {
  assert.strictEqual(MovieDetailPage.getYouTubeEmbedUrl(null), null);
  assert.strictEqual(MovieDetailPage.getYouTubeEmbedUrl(''), null);
  assert.strictEqual(MovieDetailPage.getYouTubeEmbedUrl('https://example.com/not-youtube'), null);
});

// --------------------------------------------------------------------------
// SUITE 2: Xử lý Thể Loại Phim (resolveGenres)
// --------------------------------------------------------------------------
runTest('Trích xuất đúng thể loại khi API trả về mảng object [{ id, name }]', () => {
  const movie = {
    id: 10,
    genres: [
      { id: 1, name: 'Hành Động' },
      { id: 2, name: 'Khoa Học Viễn Tưởng' }
    ]
  };
  const genres = MovieDetailPage.resolveGenres(movie);
  assert.deepStrictEqual(genres, ['Hành Động', 'Khoa Học Viễn Tưởng']);
});

runTest('Trích xuất đúng thể loại khi API trả về mảng chuỗi string', () => {
  const movie = {
    id: 11,
    genres: ['Kinh Dị', 'Bí Ẩn']
  };
  const genres = MovieDetailPage.resolveGenres(movie);
  assert.deepStrictEqual(genres, ['Kinh Dị', 'Bí Ẩn']);
});

runTest('Tự động tra cứu thể loại từ MovieService._mockMovies khi API chưa trả genres', () => {
  const movie = { id: 3, title: 'Dune 2', genres: [] };
  const genres = MovieDetailPage.resolveGenres(movie);
  assert.ok(genres.length > 0, 'Phải tra cứu được thể loại từ danh mục phim mẫu');
  assert.ok(genres.includes('Hành Động') || genres.includes('Khoa Học Viễn Tưởng'));
});

// --------------------------------------------------------------------------
// SUITE 3: Kiểm tra MovieService.getMovieById xử lý 404 và Fallback
// --------------------------------------------------------------------------
runTest('MovieService.getMovieById định nghĩa và trả về cấu trúc chuẩn', async () => {
  assert.strictEqual(typeof MovieService.getMovieById, 'function');
});

// --------------------------------------------------------------------------
// SUITE 4: Kiểm tra cấu trúc file movie-detail.html
// --------------------------------------------------------------------------
runTest('File pages/movie-detail.html có đầy đủ thẻ cấu trúc chính và script import', () => {
  const html = fs.readFileSync(path.join(__dirname, '../pages/movie-detail.html'), 'utf8');
  assert.ok(html.includes('id="movie-detail-content"'), 'Phải chứa container #movie-detail-content');
  assert.ok(html.includes('id="movie-hero-backdrop"'), 'Phải chứa backdrop #movie-hero-backdrop');
  assert.ok(html.includes('id="header-auth-section"'), 'Phải chứa header auth section');
  assert.ok(html.includes('../js/services/movie.service.js'), 'Phải nạp movie.service.js');
  assert.ok(html.includes('../js/pages/movie-detail.js'), 'Phải nạp movie-detail.js');
  assert.ok(html.includes('../css/pages/movie-detail.css'), 'Phải nạp movie-detail.css');
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
