/**
 * ==========================================================================
 * LOGIN PAGE CONTROLLER (js/pages/login.js)
 * Xử lý xác thực đăng nhập, validate FE, hiện lỗi server, lưu token và redirect
 * Hỗ trợ hiệu ứng 3D Flip Card chuyển đổi mượt mà giữa Đăng nhập & Đăng ký
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

  // 2. Kiểm tra thông báo từ URL query hoặc session (như token hết hạn 401)
  checkURLAndSessionNotices();

  // 3. Lắng nghe sự kiện input để xóa lỗi tức thì
  setupLoginRealtimeValidation();

  // 4. Khởi tạo 3D Flip Card và đồng bộ chiều cao
  initAuthFlipCard();
});

/**
 * Điều khiển hiệu ứng 3D Flip Card
 * @param {boolean|null} showRegister - true: lật sang Đăng ký, false: lật về Đăng nhập
 */
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

  // Cập nhật URL hash nhẹ nhàng không reload trang
  const isFlipped = flipper.classList.contains('is-flipped');
  const targetHash = isFlipped ? '#register' : '#login';
  if (window.history && window.history.replaceState) {
    window.history.replaceState(null, '', targetHash);
  }

  // Đồng bộ chiều cao khung lật để không bị giật trang
  syncFlipperHeight();
};

/**
 * Tính toán và đồng bộ chiều cao auth-flipper khớp với mặt đang hiển thị
 */
function syncFlipperHeight() {
  const flipper = document.getElementById('auth-flipper');
  if (!flipper) return;

  const front = document.querySelector('.auth-face-front');
  const back = document.querySelector('.auth-face-back');
  if (!front || !back) return;

  const isFlipped = flipper.classList.contains('is-flipped');
  const targetFace = isFlipped ? back : front;
  const targetHeight = targetFace.offsetHeight || targetFace.scrollHeight;

  if (targetHeight > 0) {
    flipper.style.minHeight = targetHeight + 'px';
  }
}

/**
 * Khởi tạo trạng thái ban đầu của Flip Card dựa trên URL hash
 */
function initAuthFlipCard() {
  const flipper = document.getElementById('auth-flipper');
  if (!flipper) return;

  // Nếu URL có #register hoặc ?mode=register thì lật sang đăng ký
  const hash = window.location.hash.toLowerCase();
  const params = new URLSearchParams(window.location.search);
  const isRegisterMode = hash === '#register' || params.get('mode') === 'register';

  if (isRegisterMode) {
    flipper.classList.add('is-flipped');
  }

  // Cập nhật chiều cao ban đầu và khi resize
  setTimeout(syncFlipperHeight, 50);
  setTimeout(syncFlipperHeight, 300);
  window.addEventListener('resize', syncFlipperHeight);
}

function checkURLAndSessionNotices() {
  const urlParams = new URLSearchParams(window.location.search);

  if (urlParams.get('expired') === '1') {
    showLoginAlert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'error');
  } else if (urlParams.get('registered') === '1') {
    showLoginAlert('Đăng ký tài khoản thành công! Vui lòng đăng nhập.', 'success');
  } else {
    const errorMsg = sessionStorage.getItem('auth_error');
    if (errorMsg) {
      showLoginAlert(errorMsg, 'error');
      sessionStorage.removeItem('auth_error');
    }
  }
}

function setupLoginRealtimeValidation() {
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');

  if (emailInput && window.Validation) {
    emailInput.addEventListener('input', () => window.Validation.clearError(emailInput));
  }
  if (passwordInput && window.Validation) {
    passwordInput.addEventListener('input', () => window.Validation.clearError(passwordInput));
  }
}

// Ẩn/Hiện mật khẩu chung
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
  const email = document.getElementById('login-email');
  const pass = document.getElementById('login-password');
  if (email) email.value = 'admin@cinema.com';
  if (pass) pass.value = 'admin123';
  if (window.Validation) window.Validation.clearAllErrors('login-form');
};

// Điền nhanh tài khoản Khách hàng mẫu
window.quickFillCustomer = function () {
  const email = document.getElementById('login-email');
  const pass = document.getElementById('login-password');
  if (email) email.value = 'customer@cinema.com';
  if (pass) pass.value = 'user123';
  if (window.Validation) window.Validation.clearAllErrors('login-form');
};

// Xử lý nộp form đăng nhập
window.handleLoginSubmit = async function (e) {
  e.preventDefault();

  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const rememberCheckbox = document.getElementById('login-remember');
  const btn = document.getElementById('btn-login-submit');

  const email = emailInput ? emailInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value : '';
  const rememberMe = rememberCheckbox ? rememberCheckbox.checked : true;

  // Clear previous errors
  if (window.Validation) window.Validation.clearAllErrors('login-form');
  hideLoginAlert();

  // Validate FE
  let hasError = false;

  if (window.Validation) {
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
  }

  if (hasError) return;

  // Bắt đầu gọi API đăng nhập
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang đăng nhập...';

  try {
    const result = await window.AuthService.login(email, password, rememberMe);

    if (result.success) {
      showLoginAlert('Đăng nhập thành công! Đang chuyển hướng...', 'success');
      setTimeout(() => {
        redirectAfterLogin(result.data.user);
      }, 700);
    } else {
      let errorMessage = 'Đăng nhập không thành công.';
      if (result.status === 401) {
        errorMessage = 'Email hoặc mật khẩu không chính xác!';
      } else if (result.status === 403) {
        errorMessage = 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.';
      } else if (result.message) {
        errorMessage = result.message;
      }
      showLoginAlert(errorMessage, 'error');
      btn.disabled = false;
      btn.innerHTML = '🔐 ĐĂNG NHẬP';
    }
  } catch (err) {
    showLoginAlert('Đã có lỗi xảy ra. Vui lòng thử lại sau!', 'error');
    btn.disabled = false;
    btn.innerHTML = '🔐 ĐĂNG NHẬP';
  }
};

function redirectAfterLogin(user) {
  const redirectUrl =
    (window.StorageService && window.StorageService.getAndClearRedirectUrl()) ||
    sessionStorage.getItem('cinema_redirect_url') ||
    localStorage.getItem('cinema_redirect_url') ||
    null;

  if (redirectUrl) {
    sessionStorage.removeItem('cinema_redirect_url');
    localStorage.removeItem('cinema_redirect_url');
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

// Thông báo alert cho Login Form
window.showLoginAlert = function (msg, type = 'error') {
  const alertBox = document.getElementById('auth-alert-login') || document.getElementById('auth-alert');
  if (alertBox) {
    alertBox.textContent = msg;
    alertBox.className = 'auth-alert-box ' + (type === 'success' ? 'success' : 'error');
    alertBox.style.display = 'block';
  }
  if (typeof window.showToast === 'function') {
    window.showToast(msg, type === 'success' ? 'success' : 'error');
  }
};

window.hideLoginAlert = function () {
  const alertBox = document.getElementById('auth-alert-login') || document.getElementById('auth-alert');
  if (alertBox) {
    alertBox.style.display = 'none';
  }
};

// Aliases cho tương thích ngược
window.showAlert = window.showLoginAlert;
window.hideAlert = window.hideLoginAlert;
