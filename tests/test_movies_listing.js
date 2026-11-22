/**
 * ==========================================================================
 * UNIT TESTS: MOVIES LISTING (tests/test_movies_listing.js)
 * Kiểm thử tính năng Trang danh sách phim (Task T3C67E3):
 * 1. API trả về danh sách phim bình thường.
 * 2. API đang tải dữ liệu (Loading Skeleton Shimmer).
 * 3. API trả về danh sách rỗng (Empty Hệ thống).
 * 4. Tìm kiếm không có kết quả (Empty Search + Escape HTML).
 * 5. Lọc phim không có kết quả (Empty Filter Status & Genre).
 * 6. API bị lỗi hoặc mất kết nối (Error Friendly + Nút Thử lại).
 * 7. Kiểm tra bố cục Desktop (Lưới 4 cột, Phân trang 8 items/page).
 * 8. Kiểm tra tương thích Mobile (Lưới 2 cột, Aspect 2/3, Touch target).
 * ==========================================================================
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Mock môi trường Browser DOM
const elements = {};

function createMockElement(id = '', tag = 'div') {
  return {
    id,
    tagName: tag.toUpperCase(),
    innerHTML: '',
    value: '',
    style: {},
    className: '',
    attributes: {},
    getAttribute(name) { return this.attributes[name] || null; },
    setAttribute(name, val) { this.attributes[name] = val; },
    addEventListener() {},
    scrollIntoView() {},
    classList: {
      add(c) { this.className = (this.className + ' ' + c).trim(); },
      remove(c) { this.className = this.className.replace(new RegExp(`\\b${c}\\b`, 'g'), '').trim(); }
    }
  };
}

global.window = global;
global.document = {
  title: '',
  getElementById(id) {
    if (!elements[id]) {
      elements[id] = createMockElement(id);
    }
    return elements[id];
  },
  querySelector(sel) {
    if (sel.startsWith('#')) return this.getElementById(sel.slice(1));
    return createMockElement('', 'div');
  },
  querySelectorAll() {
    return [];
  },
  createElement(tag) {
    return createMockElement('', tag);
  },
  addEventListener() {}
};

// Nạp MovieService
const movieServiceCode = fs.readFileSync(path.join(__dirname, '../js/services/movie.service.js'), 'utf8');
eval(movieServiceCode);

// Nạp MoviesPage controller
const moviesPageCode = fs.readFileSync(path.join(__dirname, '../js/pages/movies.js'), 'utf8');
eval(moviesPageCode);

console.log('🧪 BẮT ĐẦU BỘ KIỂM THỬ TRANG DANH SÁCH PHIM (TASK T3C67E3)...\n');

let totalTests = 0;
let passedTests = 0;

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

// Dữ liệu mẫu phim phục vụ test
const sampleMovies = [
  { id: 1, title: 'Dune: Part Two', status: 'now_showing', duration_minutes: 166, genres: ['Hành Động', 'Khoa Học Viễn Tưởng'] },
  { id: 2, title: 'Mai (18+)', status: 'now_showing', duration_minutes: 131, genres: ['Tình Cảm', 'Tâm Lý'] },
  { id: 3, title: 'Deadpool & Wolverine', status: 'coming_soon', duration_minutes: 128, genres: ['Hành Động', 'Hài Hước'] },
  { id: 4, title: 'Kung Fu Panda 4', status: 'now_showing', duration_minutes: 94, genres: ['Hoạt Hình', 'Hài Hước'] },
  { id: 5, title: 'Moana 2', status: 'coming_soon', duration_minutes: 100, genres: ['Hoạt Hình'] },
  { id: 6, title: 'Exhuma: Quật Mộ Trùng Ma', status: 'now_showing', duration_minutes: 134, genres: ['Kinh Dị'] },
  { id: 7, title: 'Gladiator II', status: 'coming_soon', duration_minutes: 148, genres: ['Hành Động'] },
  { id: 8, title: 'Godzilla x Kong', status: 'now_showing', duration_minutes: 115, genres: ['Hành Động'] },
  { id: 9, title: 'Lật Mặt 7', status: 'now_showing', duration_minutes: 138, genres: ['Gia Đình'] },
  { id: 10, title: 'Avatar 3', status: 'coming_soon', duration_minutes: 190, genres: ['Khoa Học Viễn Tưởng'] }
];

// =============================================================================
// TEST 1: API TRẢ VỀ DANH SÁCH PHIM BÌNH THƯỜNG
// =============================================================================
runTest('1. API trả về danh sách phim bình thường & phân trang', () => {
  const grid = document.getElementById('movies-grid');
  const pagination = document.getElementById('movies-pagination');

  window.MoviesPage.state.allMovies = [...sampleMovies];
  window.MoviesPage.state.currentPage = 1;
  window.MoviesPage.state.currentFilter = 'ALL';
  window.MoviesPage.state.searchQuery = '';
  window.MoviesPage.state.selectedGenre = '';
  window.MoviesPage.applyFiltersAndRender();

  // Kiểm tra 8 phim đầu tiên được render trên trang 1
  assert.ok(grid.innerHTML.includes('Dune: Part Two'), 'Phải render phim trang 1');
  assert.ok(grid.innerHTML.includes('Godzilla x Kong'), 'Phải render phim thứ 8');
  assert.ok(!grid.innerHTML.includes('Lật Mặt 7'), 'Phim thứ 9 phải nằm ở trang 2');

  // Kiểm tra hiển thị thông tin phân trang
  assert.ok(pagination.innerHTML.includes('1 - 8'), 'Phân trang phải ghi nhận hiển thị 1 - 8');
  assert.ok(pagination.innerHTML.includes('10'), 'Tổng số phim phải là 10');
});

// =============================================================================
// TEST 2: API ĐANG TẢI DỮ LIỆU (LOADING SKELETON)
// =============================================================================
runTest('2. Trạng thái Loading Shimmer Skeleton', () => {
  const grid = document.getElementById('movies-grid');
  const pagination = document.getElementById('movies-pagination');

  window.MoviesPage.renderSkeletonLoading();

  assert.ok(grid.innerHTML.includes('skeleton-shimmer'), 'Lưới phải chứa các khối skeleton-shimmer');
  const shimmerCount = (grid.innerHTML.match(/skeleton-shimmer/g) || []).length;
  assert.ok(shimmerCount >= 8, 'Phải có ít nhất 8 khối skeleton shimmer placeholder');
  assert.strictEqual(pagination.innerHTML, '', 'Phân trang phải được xóa khi đang tải');
});

// =============================================================================
// TEST 3: API TRẢ VỀ DANH SÁCH RỖNG (EMPTY HỆ THỐNG)
// =============================================================================
runTest('3. API trả về danh sách rỗng (Empty Hệ thống)', () => {
  const grid = document.getElementById('movies-grid');

  window.MoviesPage.state.allMovies = [];
  window.MoviesPage.state.searchQuery = '';
  window.MoviesPage.state.selectedGenre = '';
  window.MoviesPage.state.currentFilter = 'ALL';
  window.MoviesPage.applyFiltersAndRender();

  assert.ok(grid.innerHTML.includes('Chưa Có Phim Nào Trong Hệ Thống'), 'Phải hiển thị thông báo hệ thống chưa có phim');
  assert.ok(grid.innerHTML.includes('Tải lại dữ liệu'), 'Phải có nút tải lại dữ liệu');
});

// =============================================================================
// TEST 4: TÌM KIẾM KHÔNG CÓ KẾT QUẢ (EMPTY SEARCH)
// =============================================================================
runTest('4. Tìm kiếm không có kết quả & Escape HTML chống XSS', () => {
  const grid = document.getElementById('movies-grid');

  window.MoviesPage.state.allMovies = [...sampleMovies];
  window.MoviesPage.state.searchQuery = '<script>alert(1)</script>';
  window.MoviesPage.state.currentFilter = 'ALL';
  window.MoviesPage.state.selectedGenre = '';
  window.MoviesPage.applyFiltersAndRender();

  assert.ok(grid.innerHTML.includes('Không Tìm Thấy Phim Phù Hợp'), 'Phải hiển thị thông báo tìm kiếm rỗng');
  assert.ok(!grid.innerHTML.includes('<script>'), 'Từ khóa tìm kiếm phải được escape chống XSS');
  assert.ok(grid.innerHTML.includes('&lt;script&gt;'), 'Ký tự script phải chuyển thành html entities');
  assert.ok(grid.innerHTML.includes('Xóa từ khóa tìm kiếm'), 'Phải có nút xóa từ khóa');
});

// =============================================================================
// TEST 5: LỌC PHIM KHÔNG CÓ KẾT QUẢ (EMPTY FILTER STATUS & GENRE)
// =============================================================================
runTest('5. Lọc phim không có kết quả (Status & Thể loại)', () => {
  const grid = document.getElementById('movies-grid');

  // Test 5A: Lọc thể loại không tồn tại
  window.MoviesPage.state.allMovies = [...sampleMovies];
  window.MoviesPage.state.searchQuery = '';
  window.MoviesPage.state.currentFilter = 'ALL';
  window.MoviesPage.state.selectedGenre = 'Phim Tài Liệu Lịch Sử';
  window.MoviesPage.applyFiltersAndRender();

  assert.ok(grid.innerHTML.includes('Chưa Có Phim Thể Loại Này'), 'Phải thông báo không có thể loại yêu cầu');
  assert.ok(grid.innerHTML.includes('Hiển thị tất cả thể loại'), 'Phải có nút khôi phục thể loại');

  // Test 5B: Lọc tab trạng thái khi danh sách không có trạng thái đó
  window.MoviesPage.state.allMovies = [{ id: 99, title: 'Solo Phim', status: 'now_showing' }];
  window.MoviesPage.state.selectedGenre = '';
  window.MoviesPage.state.currentFilter = 'coming_soon';
  window.MoviesPage.applyFiltersAndRender();

  assert.ok(grid.innerHTML.includes('SẮP CHIẾU'), 'Phải thông báo không có phim sắp chiếu');
  assert.ok(grid.innerHTML.includes('Xem tất cả phim'), 'Phải có nút xem tất cả phim');
});

// =============================================================================
// TEST 6: API BỊ LỖI HOẶC MẤT KẾT NỐI (ERROR THÂN THIỆN)
// =============================================================================
runTest('6. API gặp sự cố hoặc mất kết nối (Error thân thiện)', () => {
  const grid = document.getElementById('movies-grid');

  window.MoviesPage.state.error = 'Network Error 500';
  window.MoviesPage.renderErrorState();

  assert.ok(grid.innerHTML.includes('Không Thể Kết Nối Máy Chủ'), 'Phải có tiêu đề lỗi thân thiện');
  assert.ok(grid.innerHTML.includes('Thử Lại'), 'Phải có nút thử lại kết nối');
  assert.ok(!grid.innerHTML.includes('Internal Server Error 500: Database connection pool exhausted'), 'Không hiển thị stack trace kỹ thuật thô');
  assert.ok(grid.innerHTML.includes('Về trang chủ'), 'Phải có liên kết về trang chủ an toàn');
});

// =============================================================================
// TEST 7: KIỂM TRA BỐ CỤC DESKTOP
// =============================================================================
runTest('7. Bố cục Desktop (Lưới 4 cột & Chuyển trang)', () => {
  const htmlContent = fs.readFileSync(path.join(__dirname, '../pages/movies.html'), 'utf8');

  // Kiểm tra cấu hình Tailwind cho lưới 4 cột trên Desktop
  assert.ok(htmlContent.includes('lg:grid-cols-4'), 'Phải hỗ trợ 4 cột trên màn hình Desktop (lg)');
  assert.ok(htmlContent.includes('movies-pagination'), 'Phải có vùng chứa thanh phân trang');

  // Kiểm tra chuyển sang trang 2
  window.MoviesPage.state.allMovies = [...sampleMovies];
  window.MoviesPage.state.currentFilter = 'ALL';
  window.MoviesPage.state.searchQuery = '';
  window.MoviesPage.state.selectedGenre = '';
  window.MoviesPage.goToPage(2);

  const grid = document.getElementById('movies-grid');
  assert.ok(grid.innerHTML.includes('Lật Mặt 7'), 'Trang 2 phải hiển thị phim thứ 9');
  assert.ok(grid.innerHTML.includes('Avatar 3'), 'Trang 2 phải hiển thị phim thứ 10');
  assert.strictEqual(window.MoviesPage.state.currentPage, 2, 'Trạng thái trang hiện tại phải là 2');
});

// =============================================================================
// TEST 8: KIỂM TRA TƯƠNG THÍCH MOBILE
// =============================================================================
runTest('8. Tương thích Mobile (Lưới 2 cột, Poster aspect 2/3 & Touch target)', () => {
  const htmlContent = fs.readFileSync(path.join(__dirname, '../pages/movies.html'), 'utf8');
  const cssContent = fs.readFileSync(path.join(__dirname, '../css/pages/movies.css'), 'utf8');

  // 1. Lưới 2 cột trên Mobile
  assert.ok(htmlContent.includes('grid-cols-2'), 'Phải có class grid-cols-2 cho mobile');

  // 2. Tỉ lệ poster aspect-[2/3]
  const grid = document.getElementById('movies-grid');
  window.MoviesPage.state.allMovies = [sampleMovies[0]];
  window.MoviesPage.renderMovies(window.MoviesPage.state.allMovies);
  assert.ok(grid.innerHTML.includes('aspect-[2/3]'), 'Thẻ phim phải áp dụng tỉ lệ poster aspect-[2/3]');

  // 3. Touch target kích thước tối thiểu cho nút trên mobile
  assert.ok(grid.innerHTML.includes('min-h-[36px]'), 'Nút hành động phải đảm bảo chiều cao tối thiểu cho cảm ứng');

  // 4. Thanh lọc cuộn ngang không tràn màn hình
  assert.ok(htmlContent.includes('no-scrollbar'), 'Tabs filter phải có class no-scrollbar để cuộn mượt');
  assert.ok(cssContent.includes('.no-scrollbar'), 'File CSS phải định nghĩa quy tắc ẩn scrollbar');
});

console.log(`\n======================================================`);
console.log(`KẾT QUẢ KIỂM THỬ: ${passedTests}/${totalTests} BÀI TEST THÀNH CÔNG.`);
console.log(`======================================================\n`);

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
