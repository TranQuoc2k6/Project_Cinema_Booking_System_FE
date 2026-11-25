/**
 * ==========================================================================
 * ADMIN USERS & CUSTOMERS CONTROLLER (LUMEN CINEMA HQ)
 * Quản lý danh sách khách hàng, tìm kiếm, xem chi tiết và Khóa / Mở tài khoản
 * (SRS 1.3 & Task: Danh sách khách hàng, tìm kiếm, khoá/mở tài khoản)
 * ==========================================================================
 */

let usersList = [];

// Danh sách mẫu fallback khi Backend API offline hoặc database chưa nạp
const fallbackUsers = [
  {
    id: 1,
    full_name: "Quan Tri Vien He Thong",
    email: "admin@cinema.com",
    phone: "0901234567",
    role: "admin",
    role_id: 1,
    role_name: "ADMIN",
    is_active: true,
    total_bookings: 3,
    total_spent: 450000,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    created_at: "2026-11-01 08:30:00",
    created_date: "01/11/2026"
  },
  {
    id: 2,
    full_name: "Le Van Hung (Admin Quan Ly)",
    email: "hung.le@cinema.com",
    phone: "0912345678",
    role: "admin",
    role_id: 1,
    role_name: "ADMIN",
    is_active: true,
    total_bookings: 1,
    total_spent: 180000,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    created_at: "2026-11-02 09:15:00",
    created_date: "02/11/2026"
  },
  {
    id: 3,
    full_name: "Nguyen Van Khach Hang",
    email: "customer@cinema.com",
    phone: "0987654321",
    role: "customer",
    role_id: 2,
    role_name: "USER",
    is_active: true,
    total_bookings: 2,
    total_spent: 459000,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
    created_at: "2026-11-05 14:20:00",
    created_date: "05/11/2026"
  },
  {
    id: 4,
    full_name: "Tran Thi Lan",
    email: "lan.tran@cinema.com",
    phone: "0978901234",
    role: "customer",
    role_id: 2,
    role_name: "USER",
    is_active: true,
    total_bookings: 2,
    total_spent: 534000,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    created_at: "2026-11-06 16:40:00",
    created_date: "06/11/2026"
  },
  {
    id: 5,
    full_name: "Nguyen Minh Hoang",
    email: "hoang.nguyen@cinema.com",
    phone: "0933221100",
    role: "customer",
    role_id: 2,
    role_name: "USER",
    is_active: true,
    total_bookings: 0,
    total_spent: 0,
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
    created_at: "2026-11-10 11:00:00",
    created_date: "10/11/2026"
  },
  {
    id: 6,
    full_name: "Pham Van Spam (Tai khoan bi khoa)",
    email: "spam.bot@cinema.com",
    phone: "0911223344",
    role: "customer",
    role_id: 2,
    role_name: "USER",
    is_active: false,
    total_bookings: 0,
    total_spent: 0,
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80",
    created_at: "2026-11-12 18:22:00",
    created_date: "12/11/2026"
  }
];

document.addEventListener('DOMContentLoaded', function () {
  loadUsersFromApi();
  initUserFilters();
});

// Tải danh sách người dùng từ Backend Database (có phân trang, tìm kiếm & bộ lọc)
async function loadUsersFromApi() {
  const tbody = document.getElementById('users-table-tbody');
  if (tbody && usersList.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="text-center py-6 text-slate-400">
          <i class="fa-solid fa-spinner fa-spin mr-2"></i> Đang tải dữ liệu khách hàng từ Database...
        </td>
      </tr>
    `;
  }

  const searchInput = document.getElementById('user-search-input');
  const roleFilter = document.getElementById('user-role-filter');
  const statusFilter = document.getElementById('user-status-filter');

  const search = searchInput ? searchInput.value.trim() : '';
  const role = roleFilter ? roleFilter.value : 'all';
  const status = statusFilter ? statusFilter.value : 'all';

  try {
    if (window.UserService && typeof window.UserService.adminGetUsers === 'function') {
      const res = await window.UserService.adminGetUsers({
        search,
        role,
        status,
        limit: 100
      });

      if (res && res.success && res.data) {
        const rawItems = Array.isArray(res.data) ? res.data : (res.data.items || []);
        usersList = rawItems;
        renderUsers(usersList);
        return;
      }
    }
  } catch (err) {
    console.warn('[loadUsersFromApi] Dùng dữ liệu fallback:', err);
  }

  // Fallback lọc dữ liệu cục bộ khi API chưa sẵn sàng
  applyLocalFilters();
}

// Lọc cục bộ trên mảng fallback
function applyLocalFilters() {
  const searchInput = document.getElementById('user-search-input');
  const roleFilter = document.getElementById('user-role-filter');
  const statusFilter = document.getElementById('user-status-filter');

  const keyword = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const role = roleFilter ? roleFilter.value : 'all';
  const status = statusFilter ? statusFilter.value : 'all';

  const source = (usersList && usersList.length > 0) ? usersList : fallbackUsers;

  const filtered = source.filter(u => {
    // 1. Tìm theo Họ tên, Email, SĐT
    const nameStr = (u.full_name || '').toLowerCase();
    const emailStr = (u.email || '').toLowerCase();
    const phoneStr = (u.phone || '').toLowerCase();
    const matchKeyword = !keyword || nameStr.includes(keyword) || emailStr.includes(keyword) || phoneStr.includes(keyword);

    // 2. Lọc theo Vai trò
    const uRole = (u.role || (u.role_id === 1 ? 'admin' : 'customer')).toLowerCase();
    const matchRole = role === 'all' || uRole === role;

    // 3. Lọc theo Trạng thái
    const matchStatus =
      status === 'all' ||
      (status === 'active' && u.is_active === true) ||
      (status === 'blocked' && u.is_active === false);

    return matchKeyword && matchRole && matchStatus;
  });

  renderUsers(filtered);
}

// Render bảng danh sách người dùng / khách hàng
function renderUsers(list) {
  const tbody = document.getElementById('users-table-tbody');
  if (!tbody) return;

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-state">
          <div class="empty-state-icon">👥</div>
          <p>Không tìm thấy tài khoản người dùng hoặc khách hàng nào phù hợp.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(u => {
    const isSuperAdmin = (u.role_id === 1 || u.role === 'admin');
    const roleBadge = isSuperAdmin
      ? '<span class="badge badge-admin"><i class="fa-solid fa-shield-halved mr-1"></i>Quản trị viên</span>'
      : '<span class="badge badge-customer"><i class="fa-solid fa-ticket mr-1"></i>Khách hàng</span>';

    const statusBadge = u.is_active
      ? '<span class="badge badge-success"><i class="fa-solid fa-circle-check mr-1"></i>Đang hoạt động</span>'
      : '<span class="badge badge-danger"><i class="fa-solid fa-circle-xmark mr-1"></i>Đã bị khóa</span>';

    const bookingsCount = Number(u.total_bookings || 0);
    const totalSpent = Number(u.total_spent || 0);
    const phoneDisplay = u.phone && u.phone !== 'Chưa cập nhật'
      ? `<span style="font-family: monospace; color: #e2e8f0;"><i class="fa-solid fa-phone text-xs text-primary mr-1"></i>${u.phone}</span>`
      : '<span class="text-muted text-xs">Chưa có SĐT</span>';

    const regDate = u.created_date || (u.created_at ? u.created_at.split(' ')[0] : 'N/A');

    return `
      <tr style="${!u.is_active ? 'opacity: 0.65; background: rgba(239,68,68,0.06);' : ''}">
        <td>
          <img src="${u.avatar}" alt="${u.full_name}" style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover; border: 1.5px solid ${u.is_active ? '#38bdf8' : '#ef4444'}; box-shadow: 0 2px 8px rgba(0,0,0,0.4);">
        </td>
        <td>
          <div style="font-weight: 600; color: #fff; font-size: 14px;">${u.full_name}</div>
          <div style="font-size: 11px; color: var(--text-muted);"><i class="fa-solid fa-envelope mr-1 text-xs"></i>${u.email}</div>
        </td>
        <td>${phoneDisplay}</td>
        <td>${roleBadge}</td>
        <td>
          <span class="badge badge-info" style="font-family: monospace; font-size: 12px;">
            <i class="fa-solid fa-ticket-simple mr-1"></i>${bookingsCount} vé
          </span>
        </td>
        <td>
          <strong style="color: var(--color-success); font-size: 13px;">${totalSpent.toLocaleString('vi-VN')} đ</strong>
        </td>
        <td>${statusBadge}</td>
        <td><span style="font-size: 12px; color: #94a3b8;">${regDate}</span></td>
        <td style="text-align: right;">
          <div class="table-actions" style="justify-content: flex-end; gap: 6px;">
            <button class="btn btn-secondary btn-sm" onclick="viewUserDetail(${u.id})" title="Xem hồ sơ chi tiết và lịch sử đơn vé">
              <i class="fa-solid fa-eye"></i> Chi tiết
            </button>
            ${!isSuperAdmin ? `
              ${u.is_active ? `
                <button class="btn btn-outline-danger btn-sm" onclick="toggleUserStatus(${u.id}, false)" title="Khóa tài khoản này (chặn đăng nhập/đặt vé)">
                  <i class="fa-solid fa-lock"></i> Khóa
                </button>
              ` : `
                <button class="btn btn-outline-success btn-sm" onclick="toggleUserStatus(${u.id}, true)" title="Mở khóa tài khoản này">
                  <i class="fa-solid fa-lock-open"></i> Mở khóa
                </button>
              `}
            ` : `
              <span class="text-xs text-muted" style="padding: 4px 8px; font-style: italic;">Super Admin</span>
            `}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Khởi tạo các sự kiện lọc và tìm kiếm
function initUserFilters() {
  const searchInput = document.getElementById('user-search-input');
  const roleFilter = document.getElementById('user-role-filter');
  const statusFilter = document.getElementById('user-status-filter');

  let debounceTimer = null;
  function handleFilterTrigger() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (window.UserService && typeof window.UserService.adminGetUsers === 'function') {
        loadUsersFromApi();
      } else {
        applyLocalFilters();
      }
    }, 250);
  }

  if (searchInput) searchInput.addEventListener('input', handleFilterTrigger);
  if (roleFilter) roleFilter.addEventListener('change', handleFilterTrigger);
  if (statusFilter) statusFilter.addEventListener('change', handleFilterTrigger);
}

// Đặt lại toàn bộ bộ lọc về mặc định
window.resetUserFilters = function () {
  const searchInput = document.getElementById('user-search-input');
  const roleFilter = document.getElementById('user-role-filter');
  const statusFilter = document.getElementById('user-status-filter');

  if (searchInput) searchInput.value = '';
  if (roleFilter) roleFilter.value = 'all';
  if (statusFilter) statusFilter.value = 'all';

  loadUsersFromApi();
};

// Modal Xem Chi Tiết Khách Hàng (Hồ sơ & Lịch sử đặt vé)
window.viewUserDetail = async function (id) {
  let u = (usersList || []).find(x => x.id === id) || fallbackUsers.find(x => x.id === id);

  // Thử nạp chi tiết kèm lịch sử đơn vé từ API
  try {
    if (window.UserService && typeof window.UserService.adminGetUserDetail === 'function') {
      const res = await window.UserService.adminGetUserDetail(id);
      if (res && res.success && res.data) {
        u = res.data.data || res.data;
      }
    }
  } catch (e) {
    console.warn('[viewUserDetail]', e);
  }

  if (!u) return;

  const content = document.getElementById('user-detail-content');
  const title = document.getElementById('user-detail-title');
  const toggleBtnWrapper = document.getElementById('modal-user-toggle-wrapper');

  if (title) {
    title.innerHTML = `<i class="fa-solid fa-id-card text-primary"></i> Hồ sơ khách hàng: ${u.full_name} (#ID ${u.id})`;
  }

  const isSuperAdmin = (u.role_id === 1 || u.role === 'admin');
  const roleBadge = isSuperAdmin
    ? '<span class="badge badge-admin"><i class="fa-solid fa-shield-halved mr-1"></i>Quản trị viên</span>'
    : '<span class="badge badge-customer"><i class="fa-solid fa-ticket mr-1"></i>Khách hàng</span>';

  const statusBadge = u.is_active
    ? '<span class="badge badge-success"><i class="fa-solid fa-circle-check mr-1"></i>Đang hoạt động</span>'
    : '<span class="badge badge-danger"><i class="fa-solid fa-circle-xmark mr-1"></i>Đã bị khóa</span>';

  const recentBookings = u.recent_bookings || [];

  if (content) {
    content.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <!-- Card Thông Tin Khách Hàng -->
        <div style="display: flex; gap: 16px; background: rgba(15,23,42,0.7); border: 1px solid rgba(255,255,255,0.1); padding: 16px; border-radius: 8px; align-items: center;">
          <img src="${u.avatar}" alt="${u.full_name}" style="width: 76px; height: 76px; border-radius: 50%; object-fit: cover; border: 2px solid #38bdf8; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
          <div style="flex: 1;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
              <h4 style="color: #fff; font-size: 17px; font-weight: 700; margin: 0;">${u.full_name}</h4>
              <div style="display: flex; gap: 6px;">${roleBadge} ${statusBadge}</div>
            </div>
            <div style="font-size: 13px; color: #94a3b8; margin-bottom: 4px;">
              <i class="fa-solid fa-envelope mr-1 text-primary"></i> ${u.email}
            </div>
            <div style="font-size: 13px; color: #94a3b8;">
              <i class="fa-solid fa-phone mr-1 text-primary"></i> ${u.phone || 'Chưa cập nhật'} • Tham gia: ${u.created_date || u.created_at || 'N/A'}
            </div>
          </div>
        </div>

        <!-- KPI Tóm Tắt Chi Tiêu -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div style="background: rgba(15,23,42,0.5); padding: 12px 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); text-align: center;">
            <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Tổng số đơn vé</div>
            <div style="font-size: 20px; font-weight: 700; color: #38bdf8; font-family: monospace;">${u.total_bookings || 0} vé</div>
          </div>
          <div style="background: rgba(15,23,42,0.5); padding: 12px 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); text-align: center;">
            <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Tổng tiền chi tiêu</div>
            <div style="font-size: 20px; font-weight: 700; color: var(--color-success); font-family: monospace;">${Number(u.total_spent || 0).toLocaleString('vi-VN')} đ</div>
          </div>
        </div>

        <!-- Lịch Sử Các Đơn Vé Gần Nhất -->
        <div>
          <h5 style="color: #fff; font-size: 14px; font-weight: 600; margin-bottom: 8px;">
            <i class="fa-solid fa-clock-rotate-left mr-1 text-primary"></i> Lịch sử đơn vé gần nhất
          </h5>
          ${recentBookings.length > 0 ? `
            <div style="max-height: 180px; overflow-y: auto; border: 1px solid rgba(255,255,255,0.08); border-radius: 6px;">
              <table class="admin-table" style="font-size: 12px; margin: 0;">
                <thead>
                  <tr>
                    <th>Mã vé</th>
                    <th>Phim</th>
                    <th>Suất chiếu</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  ${recentBookings.map(b => `
                    <tr>
                      <td><strong style="color: #38bdf8; font-family: monospace;">#${b.booking_code}</strong></td>
                      <td>${b.movie_title}</td>
                      <td>${b.showtime}</td>
                      <td><strong style="color: var(--color-success);">${Number(b.total_price || 0).toLocaleString('vi-VN')} đ</strong></td>
                      <td><span class="badge ${b.status === 'DA_THANH_TOAN' ? 'badge-success' : (b.status === 'GIU_CHO' ? 'badge-warning' : 'badge-danger')}">${b.status}</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : `
            <div style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 13px; background: rgba(15,23,42,0.3); border-radius: 6px;">
              Khách hàng này chưa có giao dịch đặt vé nào.
            </div>
          `}
        </div>
      </div>
    `;
  }

  // Nút Khóa / Mở khóa bên trong Modal
  if (toggleBtnWrapper) {
    if (!isSuperAdmin) {
      if (u.is_active) {
        toggleBtnWrapper.innerHTML = `
          <button type="button" class="btn btn-outline-danger btn-sm" onclick="toggleUserStatus(${u.id}, false, true)">
            <i class="fa-solid fa-lock"></i> Khóa tài khoản này
          </button>
        `;
      } else {
        toggleBtnWrapper.innerHTML = `
          <button type="button" class="btn btn-outline-success btn-sm" onclick="toggleUserStatus(${u.id}, true, true)">
            <i class="fa-solid fa-lock-open"></i> Mở khóa tài khoản này
          </button>
        `;
      }
    } else {
      toggleBtnWrapper.innerHTML = `<span class="text-xs text-muted" style="font-style: italic;"><i class="fa-solid fa-shield"></i> Tài khoản Super Admin không thể khóa</span>`;
    }
  }

  const modal = document.getElementById('user-detail-modal');
  if (modal) modal.classList.add('show');
};

window.closeUserModal = function () {
  const modal = document.getElementById('user-detail-modal');
  if (modal) modal.classList.remove('show');
};

// Khóa hoặc Mở khóa tài khoản (SRS 1.3 & Task: Khóa / Mở tài khoản)
window.toggleUserStatus = async function (userId, targetStatus, fromModal = false) {
  let u = (usersList || []).find(x => x.id === userId) || fallbackUsers.find(x => x.id === userId);
  if (!u || typeof window.showConfirmModal !== 'function') return;

  const modalTitle = targetStatus ? 'Xác nhận mở khóa tài khoản' : 'Xác nhận khóa tài khoản';
  const confirmMsg = targetStatus
    ? `Bạn có chắc chắn muốn mở khóa tài khoản "${u.email}" không? Khách hàng sẽ có thể đăng nhập và đặt vé xem phim bình thường.`
    : `Bạn có chắc chắn muốn khóa tài khoản "${u.email}" không? Người dùng này sẽ bị chặn đăng nhập và không thể thực hiện giao dịch đặt vé.`;

  await window.showConfirmModal({
    type: targetStatus ? 'info' : 'danger',
    title: modalTitle,
    message: confirmMsg,
    cancelText: 'Hủy',
    confirmText: targetStatus ? 'Mở khóa' : 'Khóa tài khoản',
    variant: targetStatus ? 'success' : 'danger',
    dangerous: !targetStatus,
    loadingText: 'Đang cập nhật...',
    onConfirm: async () => {
      try {
        if (window.UserService && typeof window.UserService.adminToggleUserStatus === 'function') {
          const res = await window.UserService.adminToggleUserStatus(userId, targetStatus);
          if (res && res.success) {
            const successMsg = res.data?.message || `Đã ${targetStatus ? 'mở khóa' : 'khóa'} tài khoản ${u.email} thành công!`;
            if (window.showToast) {
              window.showToast(successMsg, 'success');
            }
            u.is_active = targetStatus;
            if (fromModal) {
              closeUserModal();
            }
            await loadUsersFromApi();
            return;
          }
          if (window.showToast) {
            window.showToast('Lỗi: ' + (res?.message || 'Không thể cập nhật trạng thái tài khoản.'), 'error');
          }
          return;
        }
      } catch (err) {
        console.error('[toggleUserStatus error]', err);
        if (window.showToast) {
          window.showToast('Lỗi kết nối máy chủ: ' + err.message, 'error');
        }
        return;
      }

      // Fallback cập nhật cục bộ nếu UserService chưa sẵn sàng
      u.is_active = targetStatus;
      renderUsers(usersList.length > 0 ? usersList : fallbackUsers);
      if (fromModal) closeUserModal();
      if (window.showToast) {
        window.showToast(`Đã ${targetStatus ? 'mở khóa' : 'khóa'} tài khoản ${u.email}!`, 'success');
      }
    }
  });
};
