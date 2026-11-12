/**
 * ==========================================================================
 * REGISTER PAGE CONTROLLER (js/pages/register.js)
 * Xử lý đăng ký tài khoản mới, validate form FE, bắt lỗi server và điều hướng
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', function () {
  // 1. Nếu đã đăng nhập, chuyển về trang chủ
  if (window.StorageService && window.StorageService.isAuthenticated()) {
    window.location.replace('../index.html');
    return;
  }

  // 2. Lắng nghe sự kiện để xóa thông báo lỗi khi gõ phím
  setupRealtimeValidation();
});

function setupRealtimeValidation() {
  const fields = ['reg-fullname', 'reg-email', 'reg-phone', 'reg-password', 'reg-confirm-password'];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => window.Validation.clearError(el));
    }
  });
}

// Ẩn/Hiện mật khẩu
window.togglePasswordVisibility = function (inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁️';
  }
};

// Xử lý nộp form đăng ký
window.handleRegisterSubmit = async function (e) {
  e.preventDefault();

  const fullnameInput = document.getElementById('reg-fullname');
  const emailInput = document.getElementById('reg-email');
  const phoneInput = document.getElementById('reg-phone');
  const passwordInput = document.getElementById('reg-password');
  const confirmInput = document.getElementById('reg-confirm-password');
  const termsInput = document.getElementById('reg-terms');
  const btn = document.getElementById('btn-register-submit');

  const fullName = fullnameInput.value.trim();
  const email = emailInput.value.trim();
  const phone = phoneInput.value.trim();
  const password = passwordInput.value;
  const confirmPassword = confirmInput.value;

  // Xóa toàn bộ lỗi cũ
  window.Validation.clearAllErrors('register-form');
  hideAlert();

  let hasError = false;

  // 1. Validate Họ và tên
  if (window.Validation.isEmpty(fullName)) {
    window.Validation.showError(fullnameInput, 'Vui lòng nhập họ và tên');
    hasError = true;
  } else if (fullName.length < 2) {
    window.Validation.showError(fullnameInput, 'Họ và tên tối thiểu 2 ký tự');
    hasError = true;
  }

  // 2. Validate Email
  if (window.Validation.isEmpty(email)) {
    window.Validation.showError(emailInput, 'Vui lòng nhập email');
    hasError = true;
  } else if (!window.Validation.isValidEmail(email)) {
    window.Validation.showError(emailInput, 'Email không hợp lệ (ví dụ: nguyenvana@gmail.com)');
    hasError = true;
  }

  // 3. Validate Số điện thoại (nếu có nhập)
  if (!window.Validation.isEmpty(phone) && !window.Validation.isValidPhone(phone)) {
    window.Validation.showError(phoneInput, 'Số điện thoại không đúng chuẩn (10 chữ số, ví dụ 0987654321)');
    hasError = true;
  }

  // 4. Validate Mật khẩu
  if (window.Validation.isEmpty(password)) {
    window.Validation.showError(passwordInput, 'Vui lòng nhập mật khẩu');
    hasError = true;
  } else if (password.length < 6) {
    window.Validation.showError(passwordInput, 'Mật khẩu phải có ít nhất 6 ký tự');
    hasError = true;
  }

  // 5. Validate Xác nhận mật khẩu
  if (window.Validation.isEmpty(confirmPassword)) {
    window.Validation.showError(confirmInput, 'Vui lòng xác nhận mật khẩu');
    hasError = true;
  } else if (password !== confirmPassword) {
    window.Validation.showError(confirmInput, 'Mật khẩu xác nhận không khớp');
    hasError = true;
  }

  // 6. Checkbox điều khoản
  if (termsInput && !termsInput.checked) {
    showAlert('Vui lòng đồng ý với Điều khoản sử dụng và Chính sách bảo mật!', 'error');
    hasError = true;
  }

  if (hasError) return;

  // Bắt đầu gọi API đăng ký
  btn.disabled = true;
  btn.innerHTML = '<span>⏳</span> Đang tạo tài khoản...';

  try {
    const payload = {
      full_name: fullName,
      email: email,
      password: password,
      phone: phone ? phone : null
    };

    const result = await window.AuthService.register(payload);

    if (result.success) {
      showAlert('Đăng ký tài khoản thành công! Đang chuyển đến trang đăng nhập...', 'success');
      setTimeout(() => {
        window.location.href = 'login.html?registered=1';
      }, 1200);
    } else {
      // Bắt lỗi từ server
      let errorMsg = 'Đăng ký không thành công.';
      if (typeof result.message === 'string') {
        errorMsg = result.message;
      } else if (Array.isArray(result.message)) {
        // Lỗi validation của Pydantic (FastAPI 422)
        errorMsg = result.message.map(m => m.msg || m).join(', ');
      }
      
      // Kiểm tra cụ thể trường bị lỗi
      if (errorMsg.toLowerCase().includes('email')) {
        window.Validation.showError(emailInput, errorMsg);
      } else if (errorMsg.toLowerCase().includes('phone') || errorMsg.toLowerCase().includes('số điện thoại')) {
        window.Validation.showError(phoneInput, errorMsg);
      }

      showAlert(errorMsg, 'error');
      btn.disabled = false;
      btn.innerHTML = '<span>✨</span> Đăng ký tài khoản';
    }
  } catch (err) {
    showAlert('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại!', 'error');
    btn.disabled = false;
    btn.innerHTML = '<span>✨</span> Đăng ký tài khoản';
  }
};

function showAlert(msg, type = 'error') {
  const alertBox = document.getElementById('auth-alert');
  if (alertBox) {
    alertBox.textContent = msg;
    alertBox.className = 'auth-alert-box ' + (type === 'success' ? 'success' : '');
    alertBox.style.display = 'block';
  }
}

function hideAlert() {
  const alertBox = document.getElementById('auth-alert');
  if (alertBox) {
    alertBox.style.display = 'none';
  }
}
