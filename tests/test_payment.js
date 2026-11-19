/**
 * ==========================================================================
 * UNIT TESTS: PAYMENT SIMULATION & SANDBOX (tests/test_payment.js)
 * Kiểm thử tính năng thanh toán mô phỏng, chọn phương thức,
 * kết quả thành công / thất bại cập nhật trạng thái vé (Task T3C6D00)
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

// Nạp mã nguồn PaymentService
const serviceCode = fs.readFileSync(path.join(__dirname, '../js/services/payment.service.js'), 'utf8');
eval(serviceCode);

console.log('🧪 BẮT ĐẦU KIỂM THỬ MODULE THANH TOÁN MÔ PHỎNG (Task T3C6D00)...\n');

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
  // Test 1: Lấy danh sách các phương thức thanh toán
  await runTestAsync('Lấy danh sách các phương thức thanh toán hỗ trợ (MoMo, VNPAY, Thẻ Quốc Tế, ZaloPay)', async () => {
    const res = await PaymentService.getPaymentMethods();
    assert.strictEqual(res.success, true, 'Kết quả gọi phải thành công');
    assert.ok(Array.isArray(res.data), 'Dữ liệu trả về phải là một mảng');
    const codes = res.data.map(m => m.code);
    assert.ok(codes.includes('MOMO'), 'Phải hỗ trợ cổng MoMo');
    assert.ok(codes.includes('VNPAY'), 'Phải hỗ trợ cổng VNPAY');
    assert.ok(codes.includes('VISA'), 'Phải hỗ trợ Thẻ Quốc Tế Visa');
    assert.ok(codes.includes('ZALOPAY'), 'Phải hỗ trợ ví ZaloPay');
  });

  // Test 2: Mô phỏng thanh toán thành công (SUCCESS)
  await runTestAsync('Mô phỏng thanh toán THÀNH CÔNG -> cập nhật trạng thái vé sang DA_THANH_TOAN', async () => {
    const payload = {
      booking_id: 101,
      booking_code: 'BK-LUMEN-999',
      payment_method: 'MOMO',
      status: 'SUCCESS',
      amount: 180000
    };

    const res = await PaymentService.processSandboxPayment(payload);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.data.status, 'SUCCESS', 'Trạng thái giao dịch phải là SUCCESS');
    assert.strictEqual(res.data.booking_status, 'DA_THANH_TOAN', 'Trạng thái vé phải được cập nhật sang DA_THANH_TOAN');
    assert.ok(res.data.transaction_id.includes('SANDBOX-MOMO'), 'Phải có mã giao dịch sandbox hợp lệ');
  });

  // Test 3: Mô phỏng thanh toán thất bại (FAILED)
  await runTestAsync('Mô phỏng thanh toán THẤT BẠI -> ghi nhận lý do và giữ vé ở GIU_CHO để khách thử lại', async () => {
    const payload = {
      booking_id: 102,
      booking_code: 'BK-LUMEN-888',
      payment_method: 'VNPAY',
      status: 'FAILED',
      failure_reason: 'Tài khoản không đủ số dư',
      amount: 250000
    };

    const res = await PaymentService.processSandboxPayment(payload);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.data.status, 'FAILED', 'Trạng thái giao dịch phải là FAILED');
    assert.strictEqual(res.data.booking_status, 'GIU_CHO', 'Vé phải được giữ ở GIU_CHO để người dùng có thể thử lại');
    assert.ok(res.data.message.includes('Tài khoản không đủ số dư'), 'Thông báo phải chứa lý do thất bại');
  });

  // Test 4: Mô phỏng thanh toán qua thẻ quốc tế VISA
  await runTestAsync('Mô phỏng thanh toán qua cổng Thẻ Quốc Tế VISA thành công', async () => {
    const payload = {
      booking_id: 103,
      booking_code: 'BK-LUMEN-777',
      payment_method: 'VISA',
      status: 'SUCCESS',
      amount: 320000
    };

    const res = await PaymentService.processSandboxPayment(payload);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.data.payment_method, 'VISA');
    assert.strictEqual(res.data.status, 'SUCCESS');
    assert.strictEqual(res.data.booking_status, 'DA_THANH_TOAN');
  });

  console.log('\n======================================================');
  console.log(`🎉 HOÀN THÀNH KIỂM THỬ THANH TOÁN: ${passedTests}/${totalTests} TESTS ĐẠT 100%!`);
  console.log('======================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

startTests();
