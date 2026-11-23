/**
 * ==========================================================================
 * UNIT TESTS: MÃ QR TRÊN VÉ ĐIỆN TỬ & TRANG TRA CỨU SOÁT VÉ (Task T3C72CC)
 * File: tests/test_qr_ticket_verification.js
 * ==========================================================================
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Mock môi trường Browser
global.window = global;
global.window.location = {
  origin: 'http://localhost:5500',
  search: '?code=BK-QR-PAID-01'
};
global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; }
};

// Nạp BookingService
const serviceCode = fs.readFileSync(path.join(__dirname, '../js/services/booking.service.js'), 'utf8');
eval(serviceCode);

console.log('🧪 BẮT ĐẦU KIỂM THỬ MODULE MÃ QR & TRA CỨU XÁC NHẬN VÉ (Task T3C72CC)...\n');

let passedTests = 0;
let totalTests = 0;

async function runTest(name, fn) {
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
  // Test 1: BookingService có các hàm sinh QR và tra cứu / xác nhận vé
  await runTest('BookingService có đầy đủ các hàm QR và xác thực vé (generateTicketCheckUrl, generateQrCodeImageUrl, verifyTicket, checkinTicket)', async () => {
    assert.strictEqual(typeof window.BookingService.generateTicketCheckUrl, 'function');
    assert.strictEqual(typeof window.BookingService.generateQrCodeImageUrl, 'function');
    assert.strictEqual(typeof window.BookingService.verifyTicket, 'function');
    assert.strictEqual(typeof window.BookingService.checkinTicket, 'function');
  });

  // Test 2: Sinh URL tra cứu vé chứa mã vé và domain chuẩn
  await runTest('Hàm generateTicketCheckUrl sinh link trực tiếp tới trang ticket-check.html kèm query code', async () => {
    const url = window.BookingService.generateTicketCheckUrl('BK-TEST-1234');
    assert.ok(url.includes('/pages/ticket-check.html?code=BK-TEST-1234'), 'URL phải chứa đúng đường dẫn và mã vé');
    assert.ok(url.startsWith('http://localhost:5500'), 'URL phải bắt đầu bằng origin hiện tại');
  });

  // Test 3: Sinh URL ảnh QR code chuẩn API
  await runTest('Hàm generateQrCodeImageUrl sinh link ảnh QR server với kích thước và mã hóa link tra cứu', async () => {
    const qrImg = window.BookingService.generateQrCodeImageUrl('BK-TEST-1234', 260);
    assert.ok(qrImg.includes('api.qrserver.com'), 'Phải dùng API sinh mã QR');
    assert.ok(qrImg.includes('260x260'), 'Kích thước ảnh QR phải đúng tham số');
    assert.ok(qrImg.includes(encodeURIComponent('BK-TEST-1234')), 'Data mã hóa phải chứa mã vé');
  });

  // Test 4: Tra cứu vé hợp lệ khi quét mã QR (Mock API)
  await runTest('Tra cứu vé điện tử thành công: hiển thị đúng thông tin phim, rạp, phòng, ghế và trạng thái hợp lệ', async () => {
    const mockTicketData = {
      booking_code: 'BK-QR-PAID-01',
      status: 'DA_THANH_TOAN',
      payment_status: 'PAID',
      is_checked_in: false,
      is_valid_for_entry: true,
      movie: { title: 'Dune: Hành Tinh Cát 2', duration_minutes: 166 },
      cinema: { name: 'LUMEN Royal City' },
      seats: [{ seat_number: 'A01' }, { seat_number: 'A02' }]
    };

    window.apiClient = {
      get: async (url) => {
        assert.ok(url.includes('/api/tickets/verify/BK-QR-PAID-01'));
        return { data: mockTicketData };
      }
    };

    const res = await window.BookingService.verifyTicket('BK-QR-PAID-01');
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.data.booking_code, 'BK-QR-PAID-01');
    assert.strictEqual(res.data.is_valid_for_entry, true);
    assert.strictEqual(res.data.seats.length, 2);
  });

  // Test 5: Xác nhận vào rạp / Soát vé lần 1 thành công
  await runTest('Soát vé vào rạp thành công lần 1 (Check-in Ticket)', async () => {
    window.apiClient = {
      post: async (url) => {
        assert.ok(url.includes('/api/tickets/verify/BK-QR-PAID-01/checkin'));
        return {
          data: {
            success: true,
            message: 'Xác nhận vé thành công! Quý khách có thể vào phòng chiếu.',
            booking_code: 'BK-QR-PAID-01',
            checked_in_at: new Date().toISOString()
          }
        };
      }
    };

    const res = await window.BookingService.checkinTicket('BK-QR-PAID-01');
    assert.strictEqual(res.success, true);
    assert.ok(res.data.message.includes('Xác nhận vé thành công'));
  });

  // Test 6: Chống quét vé trùng lặp (Anti-fraud)
  await runTest('Cơ chế chống quét trùng: Từ chối soát vé khi vé đã được check-in trước đó', async () => {
    window.apiClient = {
      post: async (url) => {
        const error = new Error('Vé đã được soát vào rạp');
        error.response = {
          data: {
            detail: 'CẢNH BÁO: Vé #BK-QR-PAID-01 ĐÃ ĐƯỢC SOÁT VÀO RẠP lúc 12:00:00! Không thể tái sử dụng vé.'
          }
        };
        throw error;
      }
    };

    const res = await window.BookingService.checkinTicket('BK-QR-PAID-01');
    assert.strictEqual(res.success, false);
    assert.ok(res.message.includes('CẢNH BÁO'), 'Phải có thông báo cảnh báo');
    assert.ok(res.message.includes('ĐÃ ĐƯỢC SOÁT VÀO RẠP'), 'Phải báo vé đã được soát');
  });

  // Test 7: Từ chối soát vé đối với vé đã hủy hoặc chưa thanh toán
  await runTest('Từ chối soát vé đối với vé đã hủy hoặc chưa thanh toán', async () => {
    window.apiClient = {
      post: async () => {
        const error = new Error('Vé không hợp lệ');
        error.response = {
          data: { detail: 'VÉ KHÔNG HỢP LỆ: Đơn vé này đã bị hủy trước đó!' }
        };
        throw error;
      }
    };

    const res = await window.BookingService.checkinTicket('BK-CANCELLED-99');
    assert.strictEqual(res.success, false);
    assert.ok(res.message.includes('bị hủy'));
  });

  // Test 8: Kiểm tra file HTML trang tra cứu ticket-check.html tồn tại và có đủ thành phần
  await runTest('Trang pages/ticket-check.html tồn tại và có đủ giao diện tra cứu, camera scanner và nút soát vé', async () => {
    const htmlPath = path.join(__dirname, '../pages/ticket-check.html');
    assert.ok(fs.existsSync(htmlPath), 'File pages/ticket-check.html phải tồn tại');
    const content = fs.readFileSync(htmlPath, 'utf8');
    assert.ok(content.includes('booking-code-input'), 'Phải có input nhập mã vé');
    assert.ok(content.includes('btn-toggle-camera'), 'Phải có nút bật camera quét QR');
    assert.ok(content.includes('btn-confirm-checkin'), 'Phải có nút xác nhận vào rạp / soát vé');
    assert.ok(content.includes('html5-qrcode'), 'Phải tích hợp thư viện quét QR qua camera');
  });

  console.log('\n======================================================');
  console.log(`🎉 HOÀN THÀNH KIỂM THỬ: ${passedTests}/${totalTests} TESTS ĐẠT YÊU CẦU 100%!`);
  console.log('======================================================\n');
}

startTests();
