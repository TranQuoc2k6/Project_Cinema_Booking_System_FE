/**
 * ==========================================================================
 * LOGIN PAGE CONTROLLER
 * Xử lý xác thực người dùng, lưu trữ token/role và điều hướng phân quyền
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', function () {
  checkAuthErrorFromGuard();
});

// Kiểm tra xem có thông báo bị chặn từ FE Route Guard chuyển sang không
function checkAuthErrorFromGuard() {
  const errorMsg = sessionStorage.getItem('auth_error');
  if (errorMsg) {
    const alertBox = document.getElementById('auth-alert');
    if (alertBox) {
      alertBox.textContent = errorMsg;
      alertBox.style.display = 'block';
    }
    sessionStorage.removeItem('auth_error');
  }
}

// Điền nhanh tài khoản Admin mẫu
window.quickFillAdmin = function () {
  document.getElementById('login-email').value = 'admin@cinema.com';
  document.getElementById('login-password').value = 'admin123';
};

// Điền nhanh tài khoản Khách hàng mẫu để test chặn quyền
window.quickFillCustomer = function () {
  document.getElementById('login-email').value = 'customer@cinema.com';
  document.getElementById('login-password').value = 'user123';
};

// Xử lý gửi biểu mẫu đăng nhập
window.handleLoginSubmit = async function (e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();
  const btn = document.getElementById('btn-login-submit');

  btn.disabled = true;
  btn.innerHTML = '<span>⏳</span> Đang xác thực...';

  try {
    // 1. Thử gọi API Backend thực tế
    const response = await fetch('http://127.0.0.1:8000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (response.ok) {
      const data = await response.json();
      saveAuthSession(data.access_token, data.user);
      handleRoleRedirect(data.user);
      return;
    } else {
      const errData = await response.json().catch(() => null);
      if (response.status === 401) {
        showError(errData?.detail || 'Email hoặc mật khẩu không chính xác!');
        btn.disabled = false;
        btn.innerHTML = '<span>🔐</span> Đăng nhập';
        return;
      }
    }
  } catch (error) {
    console.warn('[Login] API Backend chưa bật hoặc CORS. Chuyển sang xác thực thông minh dự phòng.');
  }

  // 2. Fallback mô phỏng xác thực tài khoản mẫu nếu backend chưa khởi chạy
  if (email === 'admin@cinema.com' && password === 'admin123') {
    const adminUser = {
      id: 1,
      full_name: 'Quan Tri Vien He Thong',
      email: 'admin@cinema.com',
      phone: '0901234567',
      role: 'admin',
      role_id: 1,
      is_active: true,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
    };
    saveAuthSession('mock_jwt_token_admin_cinema_2026', adminUser);
    handleRoleRedirect(adminUser);
    return;
  }

  if (email === 'customer@cinema.com' && password === 'user123') {
    const customerUser = {
      id: 2,
      full_name: 'Nguyen Van Khach Hang',
      email: 'customer@cinema.com',
      phone: '0987654321',
      role: 'customer',
      role_id: 2,
      is_active: true,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80'
    };
    saveAuthSession('mock_jwt_token_customer_cinema_2026', customerUser);
    handleRoleRedirect(customerUser);
    return;
  }

  showError('Email hoặc mật khẩu không đúng! Hãy dùng tài khoản mẫu bên dưới.');
  btn.disabled = false;
  btn.innerHTML = '<span>🔐</span> Đăng nhập';
};

function saveAuthSession(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('access_token', token);
  localStorage.setItem('cinema_token', token);

  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('cinema_user', JSON.stringify(user));
}

function handleRoleRedirect(user) {
  const role = typeof user.role === 'string' ? user.role.toLowerCase() : (user.role?.name || '').toLowerCase();
  const isAdmin = role === 'admin' || user.role_id === 1;

  if (isAdmin) {
    // Quản trị viên -> chuyển thẳng tới Dashboard
    window.location.replace('admin/dashboard.html');
  } else {
    // Khách hàng thường -> thông báo và chuyển hướng
    alert('Đăng nhập thành công với vai trò Khách hàng (User)!\nBạn sẽ được đưa về Trang chủ.\nNếu cố tình truy cập /pages/admin/*, FE Route Guard sẽ lập tức chặn quyền truy cập!');
    window.location.replace('../index.html');
  }
}

function showError(msg) {
  const alertBox = document.getElementById('auth-alert');
  if (alertBox) {
    alertBox.textContent = msg;
    alertBox.style.display = 'block';
  } else {
    alert(msg);
  }
}
