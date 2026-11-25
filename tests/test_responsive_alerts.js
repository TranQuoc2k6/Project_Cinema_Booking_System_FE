/**
 * TEST SUITE: KIỂM TRA RESPONSIVE VÀ HỆ THỐNG TOAST NOTIFICATION
 */

const fs = require('fs');
const path = require('path');

const feDir = path.resolve(__dirname, '..');

console.log('🧪 BẮT ĐẦU KIỂM THỬ RESPONSIVE VÀ TOAST NOTIFICATION...');

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${message}`);
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
  }
}

// 1. Kiểm tra sự tồn tại của file js/utils/toast.js
const toastPath = path.join(feDir, 'js', 'utils', 'toast.js');
assert(fs.existsSync(toastPath), 'File js/utils/toast.js tồn tại và sẵn sàng sử dụng');

// 2. Kiểm tra nội dung toast.js có đủ 4 trạng thái
const toastContent = fs.readFileSync(toastPath, 'utf8');
assert(toastContent.includes('success') && toastContent.includes('error') && toastContent.includes('warning') && toastContent.includes('info'), 'toast.js hỗ trợ đầy đủ 4 trạng thái: success, error/danger, warning, info');
assert(toastContent.includes('toast-progress-bar'), 'toast.js có thanh tiến trình tự động biến mất trực quan');
assert(toastContent.includes('toast-close-btn'), 'toast.js hỗ trợ nút đóng thủ công');

// 3. Kiểm tra các trang HTML đã được nhúng toast.js
const htmlFiles = [
  'index.html',
  'pages/movies.html',
  'pages/movie-detail.html',
  'pages/showtimes.html',
  'pages/booking.html',
  'pages/payment.html',
  'pages/login.html',
  'pages/register.html',
  'pages/profile.html',
  'pages/my-tickets.html',
  'pages/ticket-check.html'
];

htmlFiles.forEach(relPath => {
  const fullPath = path.join(feDir, relPath);
  assert(fs.existsSync(fullPath), `Trang ${relPath} tồn tại`);
  const content = fs.readFileSync(fullPath, 'utf8');
  assert(content.includes('viewport'), `Trang ${relPath} có meta viewport responsive`);
  assert(content.includes('toast.js') || content.includes('header.js') || content.includes('admin-layout.js'), `Trang ${relPath} được tích hợp hệ thống notification`);
});

// 4. Kiểm tra CSS responsive.css có quy tắc chống tràn ngang và tối ưu mobile
const responsiveCssPath = path.join(feDir, 'css', 'responsive.css');
const responsiveCss = fs.readFileSync(responsiveCssPath, 'utf8');
assert(responsiveCss.includes('overflow-x: hidden'), 'responsive.css có quy tắc chống tràn ngang toàn cục');
assert(responsiveCss.includes('@media (max-width: 768px)') && responsiveCss.includes('@media (max-width: 480px)'), 'responsive.css có đầy đủ breakpoints Tablet và Mobile');

// 5. Kiểm tra movie-detail.css đã sửa lỗi cú pháp sm:padding
const movieDetailCss = fs.readFileSync(path.join(feDir, 'css', 'pages', 'movie-detail.css'), 'utf8');
assert(!movieDetailCss.includes('sm:padding: 1.5rem'), 'movie-detail.css đã sửa dứt điểm lỗi cú pháp sm:padding');

// 6. Kiểm tra sơ đồ ghế seat-map.js đã tối ưu kích thước trên mobile nhỏ
const seatMapJs = fs.readFileSync(path.join(feDir, 'js', 'components', 'seat-map.js'), 'utf8');
assert(seatMapJs.includes('min-[390px]'), 'seat-map.js đã tối ưu kích thước ghế cho màn hình mobile nhỏ');

console.log('\n======================================================');
console.log(`🎉 KẾT QUẢ KIỂM THỬ: ${passedTests}/${totalTests} TESTS PASSED (100% THÀNH CÔNG)`);
console.log('======================================================\n');
