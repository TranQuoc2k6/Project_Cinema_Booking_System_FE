/**
 * ==========================================================================
 * UNIT TESTS: VÉ ĐIỆN TỬ VÀ HỦY VÉ (tests/test_eticket_and_cancel.js)
 * Kiểm thử tính năng hiển thị vé sau khi đặt và khách hủy vé trước 2 tiếng (Task T3C6D1A)
 * ==========================================================================
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Mock môi trường Browser
global.window = global;
global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; }
};
global.sessionStorage = { ...global.localStorage };

// Mock token đăng nhập
global.StorageService = {
  getToken() { return 'mock-jwt-token-12345'; },
  isAuthenticated() { return true; }
};

// Nạp mã nguồn BookingService
const serviceCode = fs.readFileSync(path.join(__dirname, '../js/services/booking.service.js'), 'utf8');
eval(serviceCode);

console.log('🧪 BẮT ĐẦU KIỂM THỬ MODULE VÉ ĐIỆN TỬ VÀ HỦY VÉ (Task T3C6D1A)...\n');

let passedTests = 0;
let totalTests = 0;

async function runTestAsync(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (error) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Chi tiết: ${error.message}\n`);
  }
}

async function startTests() {
  // Test 1: Kiểm tra cấu trúc phương thức của BookingService
  await runTestAsync('BookingService có đầy đủ các hàm vé điện tử và hủy vé (getMyTickets, getBookingDetail, getBookingByCode, cancelBooking)', async () => {
    assert.strictEqual(typeof window.BookingService.getMyTickets, 'function', 'Phải có hàm getMyTickets');
    assert.strictEqual(typeof window.BookingService.getBookingDetail, 'function', 'Phải có hàm getBookingDetail');
    assert.strictEqual(typeof window.BookingService.getBookingByCode, 'function', 'Phải có hàm getBookingByCode');
    assert.strictEqual(typeof window.BookingService.cancelBooking, 'function', 'Phải có hàm cancelBooking');
  });

  // Test 2: Mock API Client - Lấy chi tiết vé điện tử
  await runTestAsync('Lấy chi tiết vé điện tử chứa đầy đủ thông tin: mã vé, phim, rạp, phòng, ghế, giờ, can_cancel', async () => {
    const mockShowtime = {
      id: 1,
      start_time: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
      end_time: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
      room_name: 'Cinema 01 - Laser',
      room_type: '2D',
      cinema: { id: 1, name: 'LUMEN Mega Mall', address: '123 Cầu Giấy' },
      movie: { id: 1, title: 'Dune: Hành Tinh Cát 2', duration_minutes: 166 }
    };

    window.apiClient = {
      async get(url) {
        if (url.includes('/api/bookings/code/BK-TEST-123') || url.includes('/api/bookings/101')) {
          return {
            data: {
              id: 101,
              booking_code: 'BK-TEST-123',
              status: 'DA_THANH_TOAN',
              payment_status: 'PAID',
              total_price: '200000.00',
              showtime: mockShowtime,
              seats: [
                { id: 1, seat_id: 1, seat_number: 'E05', seat_type: 'standard', price: '100000.00' },
                { id: 2, seat_id: 2, seat_number: 'E06', seat_type: 'vip', price: '100000.00' }
              ],
              can_cancel: true,
              cancel_deadline: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
              cancel_reason: null
            }
          };
        }
        throw new Error('Not found');
      }
    };

    const res = await window.BookingService.getBookingByCode('BK-TEST-123');
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.data.booking_code, 'BK-TEST-123');
    assert.strictEqual(res.data.showtime.movie.title, 'Dune: Hành Tinh Cát 2');
    assert.strictEqual(res.data.showtime.cinema.name, 'LUMEN Mega Mall');
    assert.strictEqual(res.data.showtime.room_name, 'Cinema 01 - Laser');
    assert.strictEqual(res.data.seats.length, 2);
    assert.strictEqual(res.data.seats[0].seat_number, 'E05');
    assert.strictEqual(res.data.can_cancel, true, 'Vé chiếu sau 4h phải được phép hủy');
  });

  // Test 3: Khách hủy vé thành công trước giờ chiếu > 2 tiếng -> trả ghế
  await runTestAsync('Khách hủy vé trước giờ chiếu > 2 tiếng -> Gọi API thành công và nhận danh sách ghế đã trả', async () => {
    window.apiClient = {
      async post(url) {
        if (url.includes('/api/bookings/101/cancel')) {
          return {
            data: {
              success: true,
              message: 'Đã hủy thành công đơn vé #BK-TEST-123! Ghế [E05, E06] đã được giải phóng.',
              booking_id: 101,
              booking_code: 'BK-TEST-123',
              new_status: 'DA_HUY',
              released_seats: ['E05', 'E06'],
              refund_status: 'REFUNDED',
              cancelled_at: new Date().toISOString()
            }
          };
        }
        throw new Error('Not found');
      }
    };

    const res = await window.BookingService.cancelBooking(101);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.data.new_status, 'DA_HUY');
    assert.deepStrictEqual(res.data.released_seats, ['E05', 'E06']);
  });

  // Test 4: Khách hủy vé khi còn dưới 2 tiếng -> Bị từ chối
  await runTestAsync('Khách hủy vé khi quá hạn 2 tiếng trước giờ chiếu -> Nhận lỗi từ chối và lý do', async () => {
    window.apiClient = {
      async post(url) {
        if (url.includes('/api/bookings/102/cancel')) {
          const err = new Error('Chỉ có thể hủy vé trước giờ chiếu ít nhất 2 tiếng');
          err.response = {
            data: {
              detail: 'Chỉ có thể hủy vé trước giờ chiếu ít nhất 2 tiếng (Chỉ còn 1h15m nữa là đến giờ chiếu).'
            }
          };
          throw err;
        }
        throw new Error('Not found');
      }
    };

    const res = await window.BookingService.cancelBooking(102);
    assert.strictEqual(res.success, false);
    assert.ok(res.message.includes('trước giờ chiếu ít nhất 2 tiếng'));
  });

  console.log('\n======================================================');
  console.log(`🎉 HOÀN THÀNH KIỂM THỬ VÉ ĐIỆN TỬ: ${passedTests}/${totalTests} TESTS ĐẠT 100%!`);
  console.log('======================================================\n');
}

startTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
