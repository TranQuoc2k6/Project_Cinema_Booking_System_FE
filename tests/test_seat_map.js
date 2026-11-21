/**
 * ==========================================================================
 * UNIT TESTS: SEAT MAP & SEAT SELECTION (tests/test_seat_map.js)
 * Kiểm thử tính năng sơ đồ ghế, trạng thái, loại ghế, giới hạn 8 ghế,
 * tính tổng tiền tạm tính và đếm ngược thời gian (Task T3C6AF7)
 * ==========================================================================
 */

const assert = require('assert');

// Mock DOM Environment nếu chạy dưới Node.js
global.window = global;
global.document = {
  querySelector: () => ({
    innerHTML: '',
    querySelectorAll: () => [],
    addEventListener: () => {},
    classList: { add: () => {}, remove: () => {} }
  })
};

// Nạp mã nguồn SeatMap
const fs = require('fs');
const path = require('path');
const seatMapCode = fs.readFileSync(path.join(__dirname, '../js/components/seat-map.js'), 'utf8');
eval(seatMapCode);

console.log('🧪 BẮT ĐẦU KIỂM THỬ MODULE SƠ ĐỒ GHẾ (Task T3C6AF7)...\n');

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
// TEST SUITE 1: Khởi tạo và cấu hình mặc định
// --------------------------------------------------------------------------
runTest('Khởi tạo SeatMap với cấu hình mặc định: maxSeats = 8, holdMinutes = 10', () => {
  const sm = new SeatMap();
  assert.strictEqual(sm.maxSeats, 8, 'Giới hạn mặc định phải là 8 ghế');
  assert.strictEqual(sm.holdMinutes, 10, 'Thời gian giữ ghế mặc định phải là 10 phút');
  assert.strictEqual(sm.timerSeconds, 600, 'Bộ đếm thời gian phải là 600 giây (10 phút)');
  assert.deepStrictEqual(sm.getSelectedSeats(), [], 'Ban đầu danh sách ghế chọn phải rỗng');
});

// --------------------------------------------------------------------------
// TEST SUITE 2: Mock Layout & Phân loại ghế
// --------------------------------------------------------------------------
runTest('Sinh Mock Layout chứa đủ các loại ghế (standard, vip, couple) và trạng thái (available, booked, held)', () => {
  const sm = new SeatMap();
  const layout = sm._getFallbackLayout(101);

  assert.ok(layout.rows, 'Phải có danh sách các hàng ghế');
  assert.ok(layout.rows['A'], 'Phải có hàng A');
  assert.ok(layout.rows['D'], 'Phải có hàng D (VIP)');
  assert.ok(layout.rows['G'], 'Phải có hàng G (Ghế Đôi)');

  // Kiểm tra loại ghế
  assert.strictEqual(layout.rows['A'][0].seat_type, 'standard', 'Hàng A phải là ghế standard');
  assert.strictEqual(layout.rows['D'][0].seat_type, 'vip', 'Hàng D phải là ghế vip');
  assert.strictEqual(layout.rows['G'][0].seat_type, 'couple', 'Hàng G phải là ghế couple');

  // Kiểm tra giá: VIP > Standard, Couple > VIP
  assert.ok(layout.rows['D'][0].price > layout.rows['A'][0].price, 'Giá VIP phải cao hơn Standard');
  assert.ok(layout.rows['G'][0].price > layout.rows['D'][0].price, 'Giá Ghế Đôi phải cao hơn VIP');

  // Kiểm tra có ghế booked và held để test giao diện
  const allSeats = Object.values(layout.rows).flat();
  assert.ok(allSeats.some(s => s.status === 'booked'), 'Phải có ghế trạng thái booked');
  assert.ok(allSeats.some(s => s.status === 'held'), 'Phải có ghế trạng thái held');
  assert.ok(allSeats.some(s => s.status === 'available'), 'Phải có ghế trạng thái available');
});

// --------------------------------------------------------------------------
// TEST SUITE 3: Chọn và bỏ chọn ghế (Select / Unselect)
// --------------------------------------------------------------------------
runTest('Chọn ghế trống (available) thành công và bỏ chọn khi click lần thứ 2', () => {
  const sm = new SeatMap();
  sm.seatData = sm._getFallbackLayout(1);

  const seatA1 = { id: 1, seat_number: 'A1', price: 90000, seat_type: 'standard', status: 'available' };

  // Chọn ghế A1
  sm.toggleSeat(seatA1);
  assert.strictEqual(sm.getSelectedSeats().length, 1, 'Số ghế chọn phải là 1');
  assert.strictEqual(sm.getSelectedSeats()[0].seat_number, 'A1');
  assert.strictEqual(sm.getTotalAmount(), 90000, 'Tổng tiền tạm tính phải là 90.000 đ');

  // Click lại A1 -> Bỏ chọn
  sm.toggleSeat(seatA1);
  assert.strictEqual(sm.getSelectedSeats().length, 0, 'Sau khi bỏ chọn số ghế phải về 0');
  assert.strictEqual(sm.getTotalAmount(), 0, 'Tổng tiền tạm tính phải về 0');
});

// --------------------------------------------------------------------------
// TEST SUITE 4: Không cho phép chọn ghế Đã Bán hoặc Đang Giữ
// --------------------------------------------------------------------------
runTest('Không cho phép chọn ghế đã bán (booked) hoặc đang giữ (held)', () => {
  const sm = new SeatMap();
  sm.seatData = sm._getFallbackLayout(1);

  const bookedSeat = { id: 2, seat_number: 'B4', price: 90000, seat_type: 'standard', status: 'booked' };
  const heldSeat = { id: 3, seat_number: 'D5', price: 120000, seat_type: 'vip', status: 'held' };

  sm.toggleSeat(bookedSeat);
  assert.strictEqual(sm.getSelectedSeats().length, 0, 'Không được chọn ghế booked');

  sm.toggleSeat(heldSeat);
  assert.strictEqual(sm.getSelectedSeats().length, 0, 'Không được chọn ghế held');
});

// --------------------------------------------------------------------------
// TEST SUITE 5: Ràng buộc tối đa 8 ghế/lần (Task T3C6902 & T3C6AF7)
// --------------------------------------------------------------------------
runTest('Chặn người dùng khi chọn vượt quá 8 ghế và kích hoạt callback onMaxExceeded', () => {
  let exceededCalled = false;
  let reportedLimit = 0;

  const sm = new SeatMap({
    maxSeats: 8,
    onMaxExceeded: (limit) => {
      exceededCalled = true;
      reportedLimit = limit;
    }
  });
  sm.seatData = sm._getFallbackLayout(1);

  // Chọn 8 ghế liên tiếp
  for (let i = 1; i <= 8; i++) {
    sm.toggleSeat({
      id: i,
      seat_number: `A${i}`,
      price: 90000,
      seat_type: 'standard',
      status: 'available'
    });
  }

  assert.strictEqual(sm.getSelectedSeats().length, 8, 'Đã chọn đủ 8 ghế');
  assert.strictEqual(exceededCalled, false, 'Chưa vượt quá thì không kích hoạt callback');

  // Thử chọn ghế thứ 9
  sm.toggleSeat({
    id: 9,
    seat_number: 'A9',
    price: 90000,
    seat_type: 'standard',
    status: 'available'
  });

  assert.strictEqual(sm.getSelectedSeats().length, 8, 'Vẫn chỉ dừng lại ở 8 ghế, không cho chọn ghế 9');
  assert.strictEqual(exceededCalled, true, 'Callback onMaxExceeded phải được kích hoạt');
  assert.strictEqual(reportedLimit, 8, 'Limit truyền vào callback phải là 8');
});

// --------------------------------------------------------------------------
// TEST SUITE 6: Tính tổng tiền tạm tính chính xác
// --------------------------------------------------------------------------
runTest('Tính tổng tiền tạm tính chính xác khi chọn phối hợp các loại ghế Standard, VIP và Couple', () => {
  const sm = new SeatMap();
  sm.seatData = sm._getFallbackLayout(1);

  // 1 ghế Standard: 90.000 đ
  sm.toggleSeat({ id: 1, seat_number: 'A1', price: 90000, seat_type: 'standard', status: 'available' });
  // 1 ghế VIP: 121.500 đ
  sm.toggleSeat({ id: 2, seat_number: 'D1', price: 121500, seat_type: 'vip', status: 'available' });
  // 1 ghế Couple: 198.000 đ
  sm.toggleSeat({ id: 3, seat_number: 'G1', price: 198000, seat_type: 'couple', status: 'available' });

  assert.strictEqual(sm.getSelectedSeats().length, 3);
  assert.strictEqual(sm.getTotalAmount(), 90000 + 121500 + 198000, 'Tổng tiền phải bằng 409.500 đ');
});

// --------------------------------------------------------------------------
// TEST SUITE 7: Đồng hồ đếm ngược và tự động hủy giữ chỗ khi hết 10 phút
// --------------------------------------------------------------------------
runTest('Đồng hồ đếm ngược tự động giải phóng ghế khi hết thời gian giữ chỗ', () => {
  let expiredTriggered = false;

  const sm = new SeatMap({
    holdMinutes: 10,
    onExpired: () => {
      expiredTriggered = true;
    }
  });

  sm.toggleSeat({ id: 1, seat_number: 'A1', price: 90000, seat_type: 'standard', status: 'available' });
  assert.strictEqual(sm.getSelectedSeats().length, 1);

  // Giả lập hết giờ đếm ngược
  sm.timerSeconds = 0;
  sm._handleTimerExpired();

  assert.strictEqual(sm.getSelectedSeats().length, 0, 'Ghế chọn phải tự động bị xóa rỗng khi hết giờ');
  assert.strictEqual(expiredTriggered, true, 'Callback onExpired phải được gọi');
});

// --------------------------------------------------------------------------
// TỔNG KẾT KẾT QUẢ
// --------------------------------------------------------------------------
console.log('\n======================================================');
console.log(`🎉 HOÀN THÀNH KIỂM THỬ: ${passedTests}/${totalTests} TESTS ĐẠT YÊU CẦU 100%!`);
console.log('======================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
