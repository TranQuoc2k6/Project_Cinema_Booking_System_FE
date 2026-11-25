/**
 * ==========================================================================
 * TEST SUITE: HỆ THỐNG ALERT MODAL, CONFIRM MODAL, PROMPT MODAL & TOAST
 * Kiểm tra tĩnh + kiểm thử hành vi thực tế bằng DOM giả lập trong Node.js
 * ==========================================================================
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const feDir = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;

function check(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${message}`);
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
  }
}

async function checkAsync(message, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  ✅ [PASS] ${message}`);
  } catch (err) {
    console.error(`  ❌ [FAIL] ${message}`);
    console.error(`     Chi tiết: ${err.message}`);
  }
}

function collectFiles(dir, exts) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(collectFiles(full, exts));
    } else if (exts.includes(path.extname(entry.name).toLowerCase())) {
      results.push(full);
    }
  }
  return results;
}

// Tạo DOM Mock tối giản đủ để chạy thực tế modal.js và toast.js
function createMockDom() {
  class MockElement {
    constructor(tagName) {
      this.tagName = tagName.toUpperCase();
      this.id = '';
      this.className = '';
      this.children = [];
      this.parentNode = null;
      this.attributes = {};
      this.dataset = {};
      this.style = {};
      this.disabled = false;
      this.value = '';
      this.textContent = '';
      this._innerHTML = '';
      this._listeners = {};
      this.offsetParent = {};
      this.isConnected = true;
      this.classList = {
        _set: new Set(),
        add: (...cls) => {
          cls.forEach(c => this.classList._set.add(c));
          this.className = Array.from(this.classList._set).join(' ');
        },
        remove: (...cls) => {
          cls.forEach(c => this.classList._set.delete(c));
          this.className = Array.from(this.classList._set).join(' ');
        },
        contains: (c) => this.classList._set.has(c)
      };
    }

    set innerHTML(val) {
      this._innerHTML = val;
      this.children = [];
      // Parse các element có id quan trọng trong modal/toast để querySelector tìm được
      const idMatches = [...String(val).matchAll(/id="([^"]+)"/g)];
      for (const m of idMatches) {
        const id = m[1];
        const tag = val.includes(`<input`) && val.indexOf(id) > val.lastIndexOf('<input', val.indexOf(id))
          ? 'input'
          : (val.includes(`<button`) ? 'button' : 'div');
        const el = new MockElement(tag);
        el.id = id;
        if (id.includes('prompt-input')) {
          const valMatch = val.match(/value="([^"]*)"/);
          if (valMatch) el.value = valMatch[1];
        }
        el.parentNode = this;
        this.children.push(el);
      }
      const classMatches = [...String(val).matchAll(/class="([^"]+)"/g)];
      for (const m of classMatches) {
        if (m[1].includes('toast-close-btn') || m[1].includes('toast-progress-bar')) {
          const tag = m[1].includes('toast-close-btn') ? 'button' : 'div';
          const el = new MockElement(tag);
          m[1].split(/\s+/).forEach(c => el.classList.add(c));
          el.parentNode = this;
          this.children.push(el);
        }
      }
    }

    get innerHTML() {
      return this._innerHTML;
    }

    appendChild(child) {
      child.parentNode = this;
      child.isConnected = true;
      this.children.push(child);
      return child;
    }

    removeChild(child) {
      this.children = this.children.filter(c => c !== child);
      child.parentNode = null;
      child.isConnected = false;
      return child;
    }

    remove() {
      if (this.parentNode) this.parentNode.removeChild(this);
    }

    get firstElementChild() {
      return this.children[0] || null;
    }

    setAttribute(k, v) {
      this.attributes[k] = String(v);
      if (k === 'id') this.id = String(v);
    }

    getAttribute(k) {
      return this.attributes[k] || null;
    }

    addEventListener(evt, fn) {
      if (!this._listeners[evt]) this._listeners[evt] = [];
      this._listeners[evt].push(fn);
    }

    dispatchEvent(evtObj) {
      const list = this._listeners[evtObj.type] || [];
      list.forEach(fn => fn(evtObj));
    }

    click() {
      if (this.disabled) return;
      this.dispatchEvent({ type: 'click', target: this, stopPropagation: () => {}, preventDefault: () => {} });
    }

    focus() {
      doc.activeElement = this;
    }

    select() {}

    querySelector(selector) {
      return this.querySelectorAll(selector)[0] || null;
    }

    querySelectorAll(selector) {
      const parts = selector.split(',').map(s => s.trim());
      const out = [];
      const walk = (node) => {
        for (const child of node.children) {
          for (const p of parts) {
            if (p.startsWith('#') && child.id === p.slice(1)) out.push(child);
            else if (p.startsWith('.') && child.classList.contains(p.slice(1))) out.push(child);
            else if (p.startsWith('button') && child.tagName === 'BUTTON' && !child.disabled) out.push(child);
            else if (p.startsWith('input') && child.tagName === 'INPUT' && !child.disabled) out.push(child);
          }
          walk(child);
        }
      };
      walk(this);
      return out;
    }
  }

  const head = new MockElement('head');
  const body = new MockElement('body');
  const docListeners = {};

  const doc = {
    head,
    body,
    documentElement: head,
    activeElement: body,
    createElement: (tag) => new MockElement(tag),
    getElementById: (id) => {
      const findIn = (node) => {
        if (node.id === id) return node;
        for (const c of node.children) {
          const found = findIn(c);
          if (found) return found;
        }
        return null;
      };
      return findIn(head) || findIn(body);
    },
    contains: (el) => Boolean(el && el.isConnected),
    addEventListener: (evt, fn) => {
      if (!docListeners[evt]) docListeners[evt] = [];
      docListeners[evt].push(fn);
    },
    removeEventListener: (evt, fn) => {
      if (!docListeners[evt]) return;
      docListeners[evt] = docListeners[evt].filter(f => f !== fn);
    },
    dispatchKey: (key) => {
      const evt = { type: 'keydown', key, preventDefault: () => {}, stopPropagation: () => {} };
      (docListeners['keydown'] || []).slice().forEach(fn => fn(evt));
    }
  };

  return doc;
}

async function runTests() {
  console.log('🧪 BẮT ĐẦU KIỂM THỬ HỆ THỐNG ALERT, CONFIRM, PROMPT MODAL & TOAST...\n');

  // 1. Kiểm tra tồn tại và bảng màu chuẩn LUMEN CINEMA
  const modalPath = path.join(feDir, 'js', 'components', 'modal.js');
  const toastPath = path.join(feDir, 'js', 'utils', 'toast.js');
  check(fs.existsSync(modalPath), 'File js/components/modal.js tồn tại');
  check(fs.existsSync(toastPath), 'File js/utils/toast.js tồn tại');

  const modalSrc = fs.readFileSync(modalPath, 'utf8');
  const toastSrc = fs.readFileSync(toastPath, 'utf8');

  const requiredColors = ['#211B22', '#2D252D', '#E83E75', '#45404A', '#16A34A', '#DC3545', '#F59E0B', '#FFFFFF'];
  requiredColors.forEach(hex => {
    check(modalSrc.includes(hex), `modal.js tuân thủ màu chuẩn Dark UI: ${hex}`);
  });

  check(toastSrc.includes('activeToastMap'), 'toast.js có cơ chế chống hiển thị thông báo trùng lặp');
  check(toastSrc.includes('MAX_TOASTS'), 'toast.js giới hạn số toast xếp chồng hợp lý');
  check(toastSrc.includes('@media (max-width: 640px)'), 'toast.js có CSS responsive an toàn trên Mobile');

  // 2. Kiểm tra tất cả 18 trang HTML (11 Customer + 7 Admin) đã tích hợp toast.js và modal.js
  const allHtmlPages = [
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
    'pages/ticket-check.html',
    'pages/admin/dashboard.html',
    'pages/admin/movies.html',
    'pages/admin/cinemas.html',
    'pages/admin/showtimes.html',
    'pages/admin/bookings.html',
    'pages/admin/combos.html',
    'pages/admin/users.html'
  ];

  allHtmlPages.forEach(rel => {
    const content = fs.readFileSync(path.join(feDir, rel), 'utf8');
    check(content.includes('utils/toast.js') && content.includes('components/modal.js'), `Trang ${rel} đã nhúng đầy đủ toast.js và modal.js`);
  });

  // 3. Kiểm tra không còn alert(), confirm(), prompt() mặc định trong js/ và pages/
  const sourceFiles = [
    path.join(feDir, 'index.html'),
    ...collectFiles(path.join(feDir, 'pages'), ['.html']),
    ...collectFiles(path.join(feDir, 'js'), ['.js'])
  ];

  const remainingNativeDialogs = [];
  const pattern = /\b(alert|confirm|prompt)\s*\(/g;

  for (const file of sourceFiles) {
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;
      if (pattern.test(line)) {
        remainingNativeDialogs.push(`${path.relative(feDir, file)}:${idx + 1}: ${trimmed}`);
      }
      pattern.lastIndex = 0;
    });
  }

  check(remainingNativeDialogs.length === 0, `Không còn hộp thoại mặc định alert/confirm/prompt nào trong mã nguồn (tìm thấy: ${remainingNativeDialogs.length})`);
  if (remainingNativeDialogs.length > 0) {
    console.error('Danh sách còn sót:', remainingNativeDialogs);
  }

  // 4. Kiểm tra hành vi thực tế trong Mock DOM
  global.window = global;
  global.document = createMockDom();
  global.requestAnimationFrame = (cb) => setTimeout(cb, 0);

  eval(toastSrc);
  eval(modalSrc);

  await checkAsync('showConfirmModal trả về false khi nhấn Hủy và không thực hiện hành động', async () => {
    let executed = false;
    const p = window.showConfirmModal({
      title: 'Xác nhận đăng xuất',
      message: 'Bạn có chắc chắn muốn đăng xuất?',
      cancelText: 'Hủy',
      confirmText: 'Đăng xuất',
      onConfirm: async () => { executed = true; }
    });
    await new Promise(r => setTimeout(r, 20));
    const cancelBtn = document.getElementById('lumen-modal-cancel-btn');
    assert.ok(cancelBtn, 'Phải render nút Hủy');
    cancelBtn.click();
    const res = await p;
    assert.strictEqual(res, false);
    assert.strictEqual(executed, false);
  });

  await checkAsync('showConfirmModal thực hiện hành động, chống nhấn đúp và trả về true khi xác nhận', async () => {
    let execCount = 0;
    const p = window.showConfirmModal({
      title: 'Xác nhận xóa',
      message: 'Xóa dữ liệu?',
      variant: 'danger',
      dangerous: true,
      onConfirm: async () => {
        execCount++;
        await new Promise(r => setTimeout(r, 40));
      }
    });
    await new Promise(r => setTimeout(r, 20));
    const confirmBtn = document.getElementById('lumen-modal-confirm-btn');
    assert.ok(confirmBtn, 'Phải render nút Xác nhận');
    confirmBtn.click();
    confirmBtn.click(); // Nhấn lần 2 liên tiếp phải bị chặn
    const res = await p;
    assert.strictEqual(res, true);
    assert.strictEqual(execCount, 1);
  });

  await checkAsync('showConfirmModal đóng và trả về false khi nhấn ESC', async () => {
    const p = window.showConfirmModal({
      title: 'Xác nhận',
      message: 'Đóng bằng ESC?'
    });
    await new Promise(r => setTimeout(r, 20));
    document.dispatchKey('Escape');
    const res = await p;
    assert.strictEqual(res, false);
  });

  await checkAsync('showPromptModal kiểm tra dữ liệu đầu vào và trả về giá trị hợp lệ', async () => {
    const p = window.showPromptModal({
      title: 'Sinh suất chiếu',
      inputType: 'number',
      defaultValue: '7',
      validator: (v) => (Number(v) >= 1 && Number(v) <= 14 ? null : 'Từ 1 đến 14')
    });
    await new Promise(r => setTimeout(r, 20));
    const input = document.getElementById('lumen-modal-prompt-input');
    const confirmBtn = document.getElementById('lumen-modal-confirm-btn');
    const errEl = document.getElementById('lumen-modal-prompt-error');

    input.value = '99';
    confirmBtn.click();
    assert.ok(errEl.classList.contains('visible'), 'Phải hiện thông báo validation khi nhập sai');

    input.value = '5';
    confirmBtn.click();
    const res = await p;
    assert.strictEqual(res, '5');
  });

  await checkAsync('showAlertModal hiển thị đủ 4 loại và đóng khi bấm xác nhận', async () => {
    for (const t of ['success', 'error', 'warning', 'info']) {
      const p = window.showAlertModal({ type: t, message: `Thông báo ${t}` });
      await new Promise(r => setTimeout(r, 15));
      const confirmBtn = document.getElementById('lumen-modal-confirm-btn');
      assert.ok(confirmBtn, `Alert ${t} phải có nút đóng/xác nhận`);
      confirmBtn.click();
      await p;
    }
  });

  await checkAsync('showToast chống hiển thị trùng lặp và giới hạn số lượng stack', async () => {
    window.showToast('Trùng lặp test', 'info', 3000);
    window.showToast('Trùng lặp test', 'info', 3000);
    const container = document.getElementById('cinema-toast-container');
    assert.strictEqual(container.children.length, 1, 'Không được tạo 2 toast giống hệt nhau cùng lúc');

    window.showToast('Toast 2', 'success', 3000);
    window.showToast('Toast 3', 'warning', 3000);
    window.showToast('Toast 4', 'error', 3000);
    window.showToast('Toast 5', 'info', 3000);
    assert.ok(container.children.length <= 4, 'Số lượng toast hiển thị đồng thời không vượt quá MAX_TOASTS (4)');
  });

  console.log('\n======================================================');
  console.log(`🎉 KẾT QUẢ KIỂM THỬ MODAL & TOAST: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('======================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTests();
