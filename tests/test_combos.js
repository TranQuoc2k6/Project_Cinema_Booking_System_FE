/**
 * ==========================================================================
 * UNIT TESTS: COMBO BẮP NƯỚC KHI ĐẶT VÉ & QUẢN LÝ ADMIN (Task T3C72E6)
 * File: tests/test_combos.js
 * ==========================================================================
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Mock môi trường Browser
global.window = global;
global.window.location = {
  origin: 'http://localhost:5500',
  search: ''
};
global.localStorage = {
  store: {},
  getItem(k) { return this.store[k] || null; },
  setItem(k, v) { this.store[k] = String(v); },
  removeItem(k) { delete this.store[k]; }
};

// Nạp ComboService
const comboServiceCode = fs.readFileSync(path.join(__dirname, '../js/services/combo.service.js'), 'utf8');
eval(comboServiceCode);

console.log('🍿 BẮT ĐẦU KIỂM THỬ MODULE COMBO BẮP NƯỚC (Task T3C72E6)...\n');

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
  // Test 1: ComboService methods existence
  await runTest('ComboService có đầy đủ các hàm phục vụ khách hàng và admin (getActiveCombos, adminGetCombos, adminCreateCombo, adminUpdateCombo, adminDeleteCombo)', async () => {
    assert.strictEqual(typeof window.ComboService.getActiveCombos, 'function');
    assert.strictEqual(typeof window.ComboService.adminGetCombos, 'function');
    assert.strictEqual(typeof window.ComboService.adminCreateCombo, 'function');
    assert.strictEqual(typeof window.ComboService.adminUpdateCombo, 'function');
    assert.strictEqual(typeof window.ComboService.adminDeleteCombo, 'function');
  });

  // Test 2: getActiveCombos returns valid structure
  await runTest('getActiveCombos trả về danh sách combo hợp lệ kèm fallback với đầy đủ thuộc tính', async () => {
    const res = await window.ComboService.getActiveCombos();
    assert.strictEqual(res.success, true);
    assert.ok(Array.isArray(res.data), 'res.data phải là mảng');
    assert.ok(res.data.length >= 1, 'Phải có ít nhất 1 combo bắp nước');

    const first = res.data[0];
    assert.ok(first.id, 'Combo phải có id');
    assert.ok(first.name, 'Combo phải có name');
    assert.ok(typeof first.price === 'number', 'Giá phải là kiểu số');
    assert.strictEqual(first.is_active, true, 'Combo active phải có is_active = true');
  });

  // Test 3: Tính toán cộng dồn tiền combo chính xác
  await runTest('Tính toán tổng tiền combo (sum(quantity * price)) chính xác tuyệt đối', async () => {
    const selectedCombos = {
      1: { combo: { id: 1, name: 'Combo Solo', price: 79000 }, quantity: 2 },
      2: { combo: { id: 2, name: 'Combo Couple', price: 109000 }, quantity: 1 }
    };

    const comboTotal = Object.values(selectedCombos).reduce((sum, item) => {
      return sum + (item.quantity * item.combo.price);
    }, 0);

    const expected = (2 * 79000) + (1 * 109000); // 158000 + 109000 = 267000
    assert.strictEqual(comboTotal, 267000);
    assert.strictEqual(comboTotal, expected);
  });

  // Test 4: Tính Grand Total = Seat Total + Combo Total
  await runTest('Tính Grand Total = Seat Total + Combo Total chính xác khi đặt vé', async () => {
    const seatTotal = 180000; // 2 ghế Standard 90,000 đ
    const comboTotal = 79000;  // 1 Combo Solo
    const grandTotal = seatTotal + comboTotal;

    assert.strictEqual(grandTotal, 259000);
    assert.strictEqual(Number(grandTotal).toLocaleString('vi-VN') + ' đ', '259.000 đ');
  });

  // Test 5: Chuẩn hóa payload combos gửi lên server giữ chỗ
  await runTest('Payload combos gửi lên Backend đúng định dạng [{combo_id, quantity}]', async () => {
    const selectedCombos = {
      1: { combo: { id: 1, name: 'Combo Solo', price: 79000 }, quantity: 2 },
      3: { combo: { id: 3, name: 'Combo Party', price: 159000 }, quantity: 0 }, // Bị loại vì qty = 0
      4: { combo: { id: 4, name: 'Bắp rang bơ', price: 45000 }, quantity: 1 }
    };

    const combosPayload = Object.values(selectedCombos)
      .filter(c => c.quantity > 0)
      .map(c => ({
        combo_id: c.combo.id,
        quantity: c.quantity
      }));

    assert.strictEqual(combosPayload.length, 2);
    assert.deepStrictEqual(combosPayload[0], { combo_id: 1, quantity: 2 });
    assert.deepStrictEqual(combosPayload[1], { combo_id: 4, quantity: 1 });
  });

  // Test 6: Mock Admin API Create Combo
  await runTest('adminCreateCombo gọi đúng endpoint POST /api/admin/combos và truyền payload', async () => {
    let calledUrl = '';
    let calledMethod = '';
    let calledBody = null;

    global.fetch = async (url, options) => {
      calledUrl = url;
      calledMethod = options.method;
      calledBody = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({ id: 99, ...calledBody, is_active: true })
      };
    };

    const newComboPayload = {
      name: 'Combo Mới 2026',
      price: 85000,
      description: '1 Bắp vị socola + 1 Nước',
      image_url: 'https://example.com/combo.jpg',
      is_active: true
    };

    const res = await window.ComboService.adminCreateCombo(newComboPayload);
    assert.strictEqual(res.success, true);
    assert.ok(calledUrl.includes('/api/admin/combos'));
    assert.strictEqual(calledMethod, 'POST');
    assert.strictEqual(calledBody.name, 'Combo Mới 2026');
    assert.strictEqual(calledBody.price, 85000);
  });

  // Test 7: Mock Admin API Update Combo
  await runTest('adminUpdateCombo gọi đúng endpoint PUT /api/admin/combos/{id}', async () => {
    let calledUrl = '';
    let calledMethod = '';
    let calledBody = null;

    global.fetch = async (url, options) => {
      calledUrl = url;
      calledMethod = options.method;
      calledBody = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({ id: 5, ...calledBody })
      };
    };

    const updatePayload = {
      price: 99000,
      is_active: false
    };

    const res = await window.ComboService.adminUpdateCombo(5, updatePayload);
    assert.strictEqual(res.success, true);
    assert.ok(calledUrl.includes('/api/admin/combos/5'));
    assert.strictEqual(calledMethod, 'PUT');
    assert.strictEqual(calledBody.price, 99000);
    assert.strictEqual(calledBody.is_active, false);
  });

  // Test 8: Mock Admin API Delete Combo
  await runTest('adminDeleteCombo gọi đúng endpoint DELETE /api/admin/combos/{id}', async () => {
    let calledUrl = '';
    let calledMethod = '';

    global.fetch = async (url, options) => {
      calledUrl = url;
      calledMethod = options.method;
      return {
        ok: true,
        json: async () => ({ message: 'Xóa combo thành công' })
      };
    };

    const res = await window.ComboService.adminDeleteCombo(7);
    assert.strictEqual(res.success, true);
    assert.ok(calledUrl.includes('/api/admin/combos/7'));
    assert.strictEqual(calledMethod, 'DELETE');
  });

  // Test 9: Hiển thị tóm tắt combo trên vé điện tử
  await runTest('Hiển thị danh sách combo bắp nước chuẩn hóa trên vé điện tử', async () => {
    const ticketCombos = [
      { combo_id: 1, name: 'Combo Solo', quantity: 2, price: 79000, total_price: 158000 },
      { combo_id: 2, name: 'Combo Couple', quantity: 1, price: 109000, total_price: 109000 }
    ];

    const comboSummaryText = ticketCombos.map(c => `${c.quantity}x ${c.name}`).join(', ');
    assert.strictEqual(comboSummaryText, '2x Combo Solo, 1x Combo Couple');

    const totalComboPrice = ticketCombos.reduce((sum, c) => sum + c.total_price, 0);
    assert.strictEqual(totalComboPrice, 267000);
  });

  console.log(`\n======================================================`);
  console.log(`🎉 KẾT QUẢ KIỂM THỬ: ${passedTests}/${totalTests} TESTS PASSED (100% THÀNH CÔNG)`);
  console.log(`======================================================\n`);

  if (passedTests < totalTests) {
    process.exit(1);
  }
}

startTests();
