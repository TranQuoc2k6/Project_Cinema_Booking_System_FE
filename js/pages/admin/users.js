/**
 * ==========================================================================
 * ADMIN USERS MANAGEMENT CONTROLLER
 * Quản lý thành viên, tìm kiếm và Khóa / Mở tài khoản (SRS 1.3 & Task 8)
 * ==========================================================================
 */

let usersList = [
  {
    id: 1,
    full_name: "Quan Tri Vien He Thong",
    email: "admin@cinema.com",
    phone: "0901234567",
    role: "admin",
    role_id: 1,
    is_active: true,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    created_at: "2026-11-01"
  },
  {
    id: 2,
    full_name: "Le Van Hung (Admin Quan Ly)",
    email: "hung.le@cinema.com",
    phone: "0912345678",
    role: "admin",
    role_id: 1,
    is_active: true,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    created_at: "2026-11-02"
  },
  {
    id: 3,
    full_name: "Nguyen Van Khach Hang",
    email: "customer@cinema.com",
    phone: "0987654321",
    role: "customer",
    role_id: 2,
    is_active: true,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
    created_at: "2026-11-05"
  },
  {
    id: 4,
    full_name: "Tran Thi Lan",
    email: "lan.tran@cinema.com",
    phone: "0978901234",
    role: "customer",
    role_id: 2,
    is_active: true,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    created_at: "2026-11-06"
  },
  {
    id: 5,
    full_name: "Hoang Van Spam",
    email: "spam.bot@test.com",
    phone: "0911223344",
    role: "customer",
    role_id: 2,
    is_active: false,
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
    created_at: "2026-11-08"
  }
];

document.addEventListener('DOMContentLoaded', function () {
  loadUsersFromApi();
  initUserFilters();
});

async function loadUsersFromApi() {
  const token = window.AdminAuth ? window.AdminAuth.getToken() : null;
  if (!token) {
    renderUsers(usersList);
    return;
  }

  try {
    const res = await fetch('http://127.0.0.1:8000/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        usersList = data.map(u => ({
          id: u.id,
          full_name: u.full_name,
          email: u.email,
          phone: u.phone || 'Chưa cập nhật',
          role: u.role_id === 1 ? 'admin' : 'customer',
          role_id: u.role_id,
          is_active: u.is_active,
          avatar: u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
          created_at: u.created_at ? u.created_at.split('T')[0] : '2026-11-01'
        }));
      }
    }
  } catch (e) {
    console.log('[Users] Sử dụng danh sách người dùng mẫu.');
  }

  renderUsers(usersList);
}

function renderUsers(list) {
  const tbody = document.getElementById('users-table-tbody');
  if (!tbody) return;

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">
          <div class="empty-state-icon">👥</div>
          <p>Không tìm thấy tài khoản người dùng nào.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(u => {
    const roleBadge = u.role === 'admin'
      ? '<span class="badge badge-admin">Quản trị viên</span>'
      : '<span class="badge badge-customer">Khách hàng</span>';

    const statusBadge = u.is_active
      ? '<span class="badge badge-success">● Đang hoạt động</span>'
      : '<span class="badge badge-danger">● Đã bị khóa</span>';

    return `
      <tr style="${!u.is_active ? 'opacity: 0.65; background: rgba(239,68,68,0.05);' : ''}">
        <td>
          <img src="${u.avatar}" alt="${u.full_name}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border-color);">
        </td>
        <td><strong style="color: #fff;">${u.full_name}</strong></td>
        <td>${u.email}</td>
        <td>${u.phone}</td>
        <td>${roleBadge}</td>
        <td>${statusBadge}</td>
        <td>${u.created_at}</td>
        <td style="text-align: right;">
          ${u.role_id !== 1 ? `
            ${u.is_active ? `
              <button class="btn btn-outline-danger btn-sm" onclick="toggleUserStatus(${u.id}, false)" title="Khóa tài khoản này">
                🔒 Khóa tài khoản
              </button>
            ` : `
              <button class="btn btn-outline-primary btn-sm" onclick="toggleUserStatus(${u.id}, true)" title="Mở khóa tài khoản">
                🔓 Mở khóa
              </button>
            `}
          ` : `
            <span style="font-size: 11px; color: var(--text-sub);">Toàn quyền</span>
          `}
        </td>
      </tr>
    `;
  }).join('');
}

function initUserFilters() {
  const searchInput = document.getElementById('user-search-input');
  const roleFilter = document.getElementById('user-role-filter');
  const statusFilter = document.getElementById('user-status-filter');

  function applyFilter() {
    const keyword = searchInput.value.toLowerCase().trim();
    const role = roleFilter.value;
    const status = statusFilter.value;

    const filtered = usersList.filter(u => {
      const matchKeyword =
        u.full_name.toLowerCase().includes(keyword) ||
        u.email.toLowerCase().includes(keyword) ||
        u.phone.includes(keyword);

      const matchRole = role === 'all' || u.role === role;
      const matchStatus =
        status === 'all' ||
        (status === 'active' && u.is_active === true) ||
        (status === 'blocked' && u.is_active === false);

      return matchKeyword && matchRole && matchStatus;
    });

    renderUsers(filtered);
  }

  if (searchInput) searchInput.addEventListener('input', applyFilter);
  if (roleFilter) roleFilter.addEventListener('change', applyFilter);
  if (statusFilter) statusFilter.addEventListener('change', applyFilter);
}

// Khóa / Mở tài khoản người dùng (SRS 1.3 & Task 8)
window.toggleUserStatus = async function (userId, newStatus) {
  const u = usersList.find(x => x.id === userId);
  if (!u) return;

  const actionName = newStatus ? 'MỞ KHÓA' : 'KHÓA';
  if (!confirm(`Bạn có chắc chắn muốn ${actionName} tài khoản "${u.email}"?`)) {
    return;
  }

  // Thử gọi API Backend nếu online
  const token = window.AdminAuth ? window.AdminAuth.getToken() : null;
  if (token) {
    try {
      await fetch(`http://127.0.0.1:8000/api/admin/users/${userId}/status?is_active=${newStatus}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (err) {
      console.log('[Users] Cập nhật offline.');
    }
  }

  u.is_active = newStatus;
  renderUsers(usersList);
  window.showToast(
    `Đã ${newStatus ? 'mở khóa' : 'khóa'} tài khoản ${u.email} thành công!`,
    newStatus ? 'success' : 'danger'
  );
};
