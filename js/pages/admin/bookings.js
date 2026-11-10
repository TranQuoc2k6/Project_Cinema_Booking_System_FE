/**
 * ==========================================================================
 * ADMIN BOOKINGS MANAGEMENT CONTROLLER
 * ==========================================================================
 */

let bookingsList = [
  {
    id: 9842,
    code: "BK-9842",
    customer_name: "Nguyễn Văn Hùng",
    customer_phone: "0901234567",
    customer_email: "hung.nguyen@gmail.com",
    movie_title: "Mai (18+)",
    cinema_name: "Vincom Bà Triệu",
    room_name: "Phòng IMAX 01",
    showtime: "19:30 • 09/11/2026",
    seats: ["F7", "F8"],
    total_price: 210000,
    payment_method: "MOMO",
    status: "confirmed",
    booking_time: "2026-11-09 14:20:15"
  },
  {
    id: 9841,
    code: "BK-9841",
    customer_name: "Trần Thị Lan",
    customer_phone: "0987654321",
    customer_email: "lan.tran@cinema.com",
    movie_title: "Lật Mặt 7: Một Điều Ước",
    cinema_name: "Vincom Bà Triệu",
    room_name: "Phòng chiếu 02",
    showtime: "20:00 • 09/11/2026",
    seats: ["D4", "D5", "D6"],
    total_price: 270000,
    payment_method: "VNPAY",
    status: "confirmed",
    booking_time: "2026-11-09 15:10:02"
  },
  {
    id: 9840,
    code: "BK-9840",
    customer_name: "Lê Văn Khải",
    customer_phone: "0912345678",
    customer_email: "khai.le@gmail.com",
    movie_title: "Dune: Hành Tinh Cát 2",
    cinema_name: "Landmark 81",
    room_name: "Phòng IMAX Luxe",
    showtime: "21:15 • 09/11/2026",
    seats: ["G11"],
    total_price: 135000,
    payment_method: "Thẻ ATM",
    status: "pending",
    booking_time: "2026-11-09 16:45:30"
  },
  {
    id: 9839,
    code: "BK-9839",
    customer_name: "Phạm Minh Hoàng",
    customer_phone: "0933221100",
    customer_email: "hoang.pm@gmail.com",
    movie_title: "Kung Fu Panda 4",
    cinema_name: "Đà Nẵng Center",
    room_name: "Phòng chiếu 01",
    showtime: "18:00 • 09/11/2026",
    seats: ["C1", "C2"],
    total_price: 170000,
    payment_method: "Tiền mặt",
    status: "cancelled",
    booking_time: "2026-11-09 10:12:44"
  }
];

document.addEventListener('DOMContentLoaded', function () {
  renderBookings(bookingsList);
  initBookingFilters();
});

function renderBookings(list) {
  const tbody = document.getElementById('bookings-table-tbody');
  if (!tbody) return;

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-state">
          <div class="empty-state-icon">🎟️</div>
          <p>Không tìm thấy đơn vé nào phù hợp với điều kiện tìm kiếm.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(b => {
    let statusBadge = '<span class="badge badge-success">Đã thanh toán</span>';
    if (b.status === 'pending') {
      statusBadge = '<span class="badge badge-warning">Chờ thanh toán</span>';
    } else if (b.status === 'cancelled') {
      statusBadge = '<span class="badge badge-danger">Đã hủy</span>';
    }

    return `
      <tr>
        <td><strong style="color: #fff; font-family: monospace;">#${b.code}</strong></td>
        <td><strong>${b.customer_name}</strong></td>
        <td>${b.customer_phone}</td>
        <td>
          <div style="font-weight: 600;">${b.movie_title}</div>
          <div style="font-size: 11px; color: var(--text-muted);">${b.showtime}</div>
        </td>
        <td>${b.cinema_name} • <span class="badge badge-info">${b.room_name}</span></td>
        <td><span class="badge badge-admin">${b.seats.join(', ')}</span></td>
        <td><strong style="color: var(--color-success);">${Number(b.total_price).toLocaleString('vi-VN')} đ</strong></td>
        <td>${statusBadge}</td>
        <td style="text-align: right;">
          <div class="table-actions" style="justify-content: flex-end;">
            <button class="btn btn-secondary btn-sm" onclick="viewBookingDetail(${b.id})" title="Xem chi tiết">
              👁 Chi tiết
            </button>
            ${b.status !== 'cancelled' ? `
              <button class="btn btn-outline-danger btn-sm" onclick="cancelBooking(${b.id})" title="Hủy vé & giải phóng ghế">
                ✕ Hủy vé
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function initBookingFilters() {
  const searchInput = document.getElementById('booking-search-input');
  const statusFilter = document.getElementById('booking-status-filter');

  function applyFilter() {
    const keyword = searchInput.value.toLowerCase().trim();
    const status = statusFilter.value;

    const filtered = bookingsList.filter(b => {
      const matchKeyword =
        b.code.toLowerCase().includes(keyword) ||
        b.customer_phone.includes(keyword) ||
        b.customer_name.toLowerCase().includes(keyword);
      const matchStatus = status === 'all' || b.status === status;
      return matchKeyword && matchStatus;
    });

    renderBookings(filtered);
  }

  if (searchInput) searchInput.addEventListener('input', applyFilter);
  if (statusFilter) statusFilter.addEventListener('change', applyFilter);
}

window.viewBookingDetail = function (id) {
  const b = bookingsList.find(x => x.id === id);
  if (!b) return;

  const content = document.getElementById('booking-detail-content');
  const title = document.getElementById('booking-detail-title');
  title.textContent = 'Thông tin chi tiết đơn vé: #' + b.code;

  content.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <div style="background: rgba(15,23,42,0.6); padding: 12px; border-radius: 8px;">
        <h4 style="color: var(--color-primary); margin-bottom: 6px;">${b.movie_title}</h4>
        <p style="font-size: 13px;">Suất chiếu: <strong>${b.showtime}</strong></p>
        <p style="font-size: 13px;">Địa điểm: <strong>${b.cinema_name} - ${b.room_name}</strong></p>
        <p style="font-size: 13px;">Ghế ngồi đã đặt: <strong style="color: #38bdf8;">${b.seats.join(', ')}</strong></p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px;">
        <div>Khách hàng: <strong>${b.customer_name}</strong></div>
        <div>Số điện thoại: <strong>${b.customer_phone}</strong></div>
        <div>Email: <strong>${b.customer_email}</strong></div>
        <div>Thời gian đặt: <strong>${b.booking_time}</strong></div>
        <div>Phương thức TT: <strong>${b.payment_method}</strong></div>
        <div>Tổng thanh toán: <strong style="color: var(--color-success); font-size: 15px;">${Number(b.total_price).toLocaleString('vi-VN')} đ</strong></div>
      </div>
    </div>
  `;

  document.getElementById('booking-detail-modal').classList.add('show');
};

window.closeBookingModal = function () {
  document.getElementById('booking-detail-modal').classList.remove('show');
};

// Huỷ vé (đổi trạng thái đơn sang 'cancelled' và giải phóng ghế) (SRS 1.3 & Task 5)
window.cancelBooking = function (id) {
  const b = bookingsList.find(x => x.id === id);
  if (!b) return;

  if (confirm(`Bạn có chắc chắn muốn HỦY đơn vé #${b.code} của khách hàng ${b.customer_name}?\nGhế [${b.seats.join(', ')}] sẽ được giải phóng lập tức.`)) {
    b.status = 'cancelled';
    renderBookings(bookingsList);
    window.showToast(`Đã hủy đơn vé #${b.code} và giải phóng ghế thành công!`, 'danger');
  }
};
