/**
 * ==========================================================================
 * REGISTER PAGE CONTROLLER (js/pages/register.js)
 * Xử lý đăng ký tài khoản mới, validate form FE, bắt lỗi server và điều hướng
 * Hỗ trợ hiệu ứng 3D Flip Card tương thích với form Đăng nhập
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', function () {
  // 1. Nếu đã đăng nhập, chuyển về trang chủ
  if (window.StorageService && window.StorageService.isAuthenticated()) {
    window.location.replace('../index.html');
    return;
  }

  // 2. Lắng nghe sự kiện để xóa thông báo lỗi khi gõ phím
  setupRegisterRealtimeValidation();

  // 3. Nếu là trang register.html độc lập có flipper, mặc định lật sang mặt đăng ký
  const flipper = document.getElementById('auth-flipper');
  if (flipper && window.location.pathname.includes('register.html')) {
    if (!window.location.hash || window.location.hash.toLowerCase() !== '#login') {
      flipper.classList.add('is-flipped');
    }
    setTimeout(() => {
      if (typeof window.flipAuthCard === 'function') {
        const front = document.querySelector('.auth-face-front');
        const back = document.querySelector('.auth-face-back');
        if (back) flipper.style.minHeight = (back.offsetHeight || back.scrollHeight) + 'px';
      }
    }, 100);
  }
});

function setupRegisterRealtimeValidation() {
  const fields = ['reg-fullname', 'reg-email', 'reg-phone', 'reg-password', 'reg-confirm-password'];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el && window.Validation) {
      el.addEventListener('input', () => window.Validation.clearError(el));
    }
  });
}

// Đảm bảo togglePasswordVisibility luôn khả dụng
if (!window.togglePasswordVisibility) {
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
}

// Đảm bảo flipAuthCard luôn có sẵn trên trang register.html
if (!window.flipAuthCard) {
  window.flipAuthCard = function (showRegister) {
    const flipper = document.getElementById('auth-flipper');
    if (!flipper) return;

    if (typeof showRegister === 'boolean') {
      if (showRegister) {
        flipper.classList.add('is-flipped');
      } else {
        flipper.classList.remove('is-flipped');
      }
    } else {
      flipper.classList.toggle('is-flipped');
    }

    const isFlipped = flipper.classList.contains('is-flipped');
    const front = document.querySelector('.auth-face-front');
    const back = document.querySelector('.auth-face-back');
    if (front && back) {
      const targetFace = isFlipped ? back : front;
      const targetHeight = targetFace.offsetHeight || targetFace.scrollHeight;
      if (targetHeight > 0) flipper.style.minHeight = targetHeight + 'px';
    }
  };
}

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

  const fullName = fullnameInput ? fullnameInput.value.trim() : '';
  const email = emailInput ? emailInput.value.trim() : '';
  const phone = phoneInput ? phoneInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value : '';
  const confirmPassword = confirmInput ? confirmInput.value : '';

  // Xóa toàn bộ lỗi cũ
  if (window.Validation) window.Validation.clearAllErrors('register-form');
  hideRegisterAlert();

  let hasError = false;

  // 1. Validate Họ và tên
  if (window.Validation) {
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
  }

  // 6. Checkbox điều khoản
  if (termsInput && !termsInput.checked) {
    showRegisterAlert('Vui lòng đồng ý với Điều khoản sử dụng và Chính sách bảo mật!', 'error');
    hasError = true;
  }

  if (hasError) return;

  // Bắt đầu gọi API đăng ký
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tạo tài khoản...';

  try {
    const payload = {
      full_name: fullName,
      email: email,
      password: password,
      phone: phone ? phone : null
    };

    const result = await window.AuthService.register(payload);

    if (result.success) {
      showRegisterAlert('Đăng ký tài khoản thành công! Đang chuyển đến đăng nhập...', 'success');
      
      // Nếu có sẵn form đăng nhập trên cùng trang (3D Flip), lật về và điền sẵn email
      const flipper = document.getElementById('auth-flipper');
      const loginEmailInput = document.getElementById('login-email');
      
      if (flipper && typeof window.flipAuthCard === 'function') {
        setTimeout(() => {
          if (loginEmailInput) loginEmailInput.value = email;
          window.flipAuthCard(false);
          if (typeof window.showLoginAlert === 'function') {
            window.showLoginAlert('Đăng ký tài khoản thành công! Vui lòng đăng nhập.', 'success');
          }
        }, 1000);
      } else {
        setTimeout(() => {
          window.location.href = 'login.html?registered=1';
        }, 1200);
      }
    } else {
      let errorMsg = 'Đăng ký không thành công.';
      if (typeof result.message === 'string') {
        errorMsg = result.message;
      } else if (Array.isArray(result.message)) {
        errorMsg = result.message.map(m => m.msg || m).join(', ');
      }

      if (window.Validation) {
        if (errorMsg.toLowerCase().includes('email')) {
          window.Validation.showError(emailInput, errorMsg);
        } else if (errorMsg.toLowerCase().includes('phone') || errorMsg.toLowerCase().includes('số điện thoại')) {
          window.Validation.showError(phoneInput, errorMsg);
        }
      }

      showRegisterAlert(errorMsg, 'error');
      btn.disabled = false;
      btn.innerHTML = '✨ TẠO TÀI KHOẢN';
    }
  } catch (err) {
    showRegisterAlert('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại!', 'error');
    btn.disabled = false;
    btn.innerHTML = '✨ TẠO TÀI KHOẢN';
  }
};

window.showRegisterAlert = function (msg, type = 'error') {
  const alertBox = document.getElementById('auth-alert-reg') || document.getElementById('auth-alert');
  if (alertBox) {
    alertBox.textContent = msg;
    alertBox.className = 'auth-alert-box ' + (type === 'success' ? 'success' : 'error');
    alertBox.style.display = 'block';
  }
  if (typeof window.showToast === 'function') {
    window.showToast(msg, type === 'success' ? 'success' : 'error');
  }
};

window.hideRegisterAlert = function () {
  const alertBox = document.getElementById('auth-alert-reg') || document.getElementById('auth-alert');
  if (alertBox) {
    alertBox.style.display = 'none';
  }
};
