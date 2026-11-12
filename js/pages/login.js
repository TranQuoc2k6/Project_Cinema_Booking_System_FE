/**
 * ==========================================================================
 * LOGIN PAGE CONTROLLER (js/pages/login.js)
 * Xử lý xác thực đăng nhập, validate FE, hiện lỗi server, lưu token và redirect
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', function () {
  // 1. Kiểm tra nếu đã đăng nhập thì tự động điều hướng
  if (window.StorageService && window.StorageService.isAuthenticated()) {
    const user = window.StorageService.getUser();
    if (user) {
      redirectAfterLogin(user);
      return;
    }
  }

  // 2. Kiểm tra thông báo từ URL query hoặc session (như thông báo hết hạn token 401)
  checkURLAndSessionNotices();

  // 3. Lắng nghe sự kiện input để xóa lỗi tức thì
  setupRealtimeValidation();
});

function checkURLAndSessionNotices() {
  const urlParams = new URLSearchParams(window.location.search);
  const alertBox = document.getElementById('auth-alert');

  if (urlParams.get('expired') === '1') {
    showAlert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'error');
  } else if (urlParams.get('registered') === '1') {
    showAlert('Đăng ký tài khoản thành công! Vui lòng đăng nhập.', 'success');
  } else {
    const errorMsg = sessionStorage.getItem('auth_error');
    if (errorMsg) {
      showAlert(errorMsg, 'error');
      sessionStorage.removeItem('auth_error');
    }
  }
}

function setupRealtimeValidation() {
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');

  if (emailInput) {
    emailInput.addEventListener('input', () => window.Validation.clearError(emailInput));
  }
  if (passwordInput) {
    passwordInput.addEventListener('input', () => window.Validation.clearError(passwordInput));
  }
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

// Điền nhanh tài khoản Admin mẫu
window.quickFillAdmin = function () {
  document.getElementById('login-email').value = 'admin@cinema.com';
  document.getElementById('login-password').value = 'admin123';
  window.Validation.clearAllErrors('login-form');
};

// Điền nhanh tài khoản Khách hàng mẫu
window.quickFillCustomer = function () {
  document.getElementById('login-email').value = 'customer@cinema.com';
  document.getElementById('login-password').value = 'user123';
  window.Validation.clearAllErrors('login-form');
};

// Xử lý nộp form đăng nhập
window.handleLoginSubmit = async function (e) {
  e.preventDefault();

  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const rememberCheckbox = document.getElementById('login-remember');
  const btn = document.getElementById('btn-login-submit');

  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const rememberMe = rememberCheckbox ? rememberCheckbox.checked : true;

  // Clear previous errors
  window.Validation.clearAllErrors('login-form');
  hideAlert();

  // Validate FE
  let hasError = false;

  if (window.Validation.isEmpty(email)) {
    window.Validation.showError(emailInput, 'Vui lòng nhập email');
    hasError = true;
  } else if (!window.Validation.isValidEmail(email)) {
    window.Validation.showError(emailInput, 'Email không đúng định dạng (vd: user@example.com)');
    hasError = true;
  }

  if (window.Validation.isEmpty(password)) {
    window.Validation.showError(passwordInput, 'Vui lòng nhập mật khẩu');
    hasError = true;
  } else if (password.length < 6) {
    window.Validation.showError(passwordInput, 'Mật khẩu phải có ít nhất 6 ký tự');
    hasError = true;
  }

  if (hasError) return;

  // Bắt đầu gọi API đăng nhập
  btn.disabled = true;
  btn.innerHTML = '<span>⏳</span> Đang đăng nhập...';

  try {
    const result = await window.AuthService.login(email, password, rememberMe);

    if (result.success) {
      showAlert('Đăng nhập thành công! Đang chuyển hướng...', 'success');
      setTimeout(() => {
        redirectAfterLogin(result.data.user);
      }, 700);
    } else {
      // Hiển thị lỗi từ server
      let errorMessage = 'Đăng nhập không thành công.';
      if (result.status === 401) {
        errorMessage = 'Email hoặc mật khẩu không chính xác!';
      } else if (result.status === 403) {
        errorMessage = 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.';
      } else if (result.message) {
        errorMessage = result.message;
      }
      showAlert(errorMessage, 'error');
      btn.disabled = false;
      btn.innerHTML = '<span>🔐</span> Đăng nhập';
    }
  } catch (err) {
    showAlert('Đã có lỗi xảy ra. Vui lòng thử lại sau!', 'error');
    btn.disabled = false;
    btn.innerHTML = '<span>🔐</span> Đăng nhập';
  }
};

function redirectAfterLogin(user) {
  // Kiểm tra xem có URL redirect trước đó không
  const redirectUrl = window.StorageService ? window.StorageService.getAndClearRedirectUrl() : null;
  if (redirectUrl) {
    window.location.href = redirectUrl;
    return;
  }

  const roleName = (typeof user.role === 'string' ? user.role : user.role?.name || '').toUpperCase();
  const isAdmin = roleName === 'ADMIN' || user.role_id === 1;

  if (isAdmin) {
    window.location.replace('admin/dashboard.html');
  } else {
    window.location.replace('../index.html');
  }
}

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
