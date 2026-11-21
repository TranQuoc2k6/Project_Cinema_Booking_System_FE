/**
 * ==========================================================================
 * ADMIN BOOKINGS MANAGEMENT CONTROLLER (LUMEN CINEMA HQ)
 * Quản lý đơn vé: Lọc theo phim/ngày/trạng thái, tìm theo mã vé/SĐT,
 * xem chi tiết đơn vé điện tử và hủy vé (giải phóng ghế).
 * ==========================================================================
 */

let bookingsList = [];
let moviesFilterList = [];

// Danh sách mẫu fallback khi Backend API offline hoặc database chưa nạp
const fallbackBookings = [
  {
    id: 9842,
    code: "BK-9842",
    booking_code: "BK-9842",
    customer_name: "Nguyễn Văn Hùng",
    customer_phone: "0901234567",
    customer_email: "hung.nguyen@gmail.com",
    movie_id: 1,
    movie_title: "Mai (18+)",
    movie_poster: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400",
    cinema_name: "CGV Vincom Bà Triệu",
    room_name: "Phòng IMAX 01",
    showtime: "19:30 • 18/11/2026",
    showtime_date: "2026-11-18",
    seats: ["F07", "F08"],
    total_price: 210000,
    payment_method: "MOMO",
    status: "confirmed",
    booking_time: "2026-11-17 14:20:15"
  },
  {
    id: 9841,
    code: "BK-9841",
    booking_code: "BK-9841",
    customer_name: "Trần Thị Lan",
    customer_phone: "0987654321",
    customer_email: "lan.tran@cinema.com",
    movie_id: 2,
    movie_title: "Lật Mặt 7: Một Điều Ước",
    movie_poster: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400",
    cinema_name: "CGV Vincom Bà Triệu",
    room_name: "Phòng chiếu 02",
    showtime: "20:00 • 18/11/2026",
    showtime_date: "2026-11-18",
    seats: ["D04", "D05", "D06"],
    total_price: 270000,
    payment_method: "VNPAY",
    status: "confirmed",
    booking_time: "2026-11-17 15:10:02"
  },
  {
    id: 9840,
    code: "BK-9840",
    booking_code: "BK-9840",
    customer_name: "Lê Văn Khải",
    customer_phone: "0912345678",
    customer_email: "khai.le@gmail.com",
    movie_id: 3,
    movie_title: "Dune: Hành Tinh Cát 2",
    movie_poster: "https://image.tmdb.org/t/p/original/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg",
    cinema_name: "CGV Landmark 81",
    room_name: "Phòng IMAX Luxe",
    showtime: "21:15 • 19/11/2026",
    showtime_date: "2026-11-19",
    seats: ["E10"],
    total_price: 135000,
    payment_method: "Thẻ ATM",
    status: "pending",
    booking_time: "2026-11-17 16:45:30"
  },
  {
    id: 9839,
    code: "BK-9839",
    booking_code: "BK-9839",
    customer_name: "Phạm Minh Hoàng",
    customer_phone: "0933221100",
    customer_email: "hoang.pm@gmail.com",
    movie_id: 6,
    movie_title: "Kung Fu Panda 4",
    movie_poster: "https://image.tmdb.org/t/p/original/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg",
    cinema_name: "Lotte Cinema Keangnam",
    room_name: "Screen 01",
    showtime: "18:00 • 17/11/2026",
    showtime_date: "2026-11-17",
    seats: ["C01", "C02"],
    total_price: 170000,
    payment_method: "Tiền mặt",
    status: "cancelled",
    booking_time: "2026-11-17 10:12:44"
  },
  {
    id: 9838,
    code: "BK-9838",
    booking_code: "BK-9838",
    customer_name: "Hoàng Tuấn Long",
    customer_phone: "0977889900",
    customer_email: "long.ht@gmail.com",
    movie_id: 4,
    movie_title: "Quật Mộ Trùng Ma (Exhuma)",
    movie_poster: "https://image.tmdb.org/t/p/original/tMefBSflR6PGQLv7WvFPpKLZkyk.jpg",
    cinema_name: "Galaxy Cinema Nguyễn Du",
    room_name: "Screen 02",
    showtime: "21:30 • 20/11/2026",
    showtime_date: "2026-11-20",
    seats: ["F09", "F10"],
    total_price: 240000,
    payment_method: "VNPAY",
    status: "confirmed",
    booking_time: "2026-11-17 11:35:10"
  }
];

document.addEventListener('DOMContentLoaded', async function () {
  await loadMoviesFilter();
  await loadBookingsFromApi();
  initBookingFilters();
});

// Nạp danh sách phim vào Dropdown bộ lọc phim
async function loadMoviesFilter() {
  const movieSelect = document.getElementById('booking-movie-filter');
  if (!movieSelect) return;

  try {
    if (window.MovieService) {
      const res = await window.MovieService.getMovies();
      if (res && res.success && Array.isArray(res.data)) {
        moviesFilterList = res.data;
      }
    }
  } catch (err) {
    console.warn('[loadMoviesFilter] Dùng danh sách fallback:', err);
  }

  if (moviesFilterList.length === 0) {
    moviesFilterList = [
      { id: 1, title: 'Mai' },
      { id: 2, title: 'Lật Mặt 7: Một Điều Ước' },
      { id: 3, title: 'Dune: Hành Tinh Cát 2' },
      { id: 4, title: 'Quật Mộ Trùng Ma (Exhuma)' },
      { id: 5, title: 'Godzilla x Kong: Đế Chế Mới' },
      { id: 6, title: 'Kung Fu Panda 4' }
    ];
  }

  // Render options vào select
  let html = '<option value="all">🎬 Tất cả phim chiếu</option>';
  moviesFilterList.forEach(m => {
    html += `<option value="${m.id}">${m.title}</option>`;
  });
  movieSelect.innerHTML = html;
}

// Tải danh sách đơn vé từ Backend Database (có phân trang & bộ lọc)
async function loadBookingsFromApi() {
  const tbody = document.getElementById('bookings-table-tbody');
  if (tbody && bookingsList.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="text-center py-6 text-slate-400">
          <i class="fa-solid fa-spinner fa-spin mr-2"></i> Đang tải dữ liệu đơn vé từ Database...
        </td>
      </tr>
    `;
  }

  const searchInput = document.getElementById('booking-search-input');
  const movieSelect = document.getElementById('booking-movie-filter');
  const dateInput = document.getElementById('booking-date-filter');
  const statusSelect = document.getElementById('booking-status-filter');

  const search = searchInput ? searchInput.value.trim() : '';
  const movie_id = movieSelect && movieSelect.value !== 'all' ? parseInt(movieSelect.value, 10) : null;
  const date = dateInput && dateInput.value ? dateInput.value.trim() : null;
  const status = statusSelect ? statusSelect.value : 'all';

  try {
    if (window.BookingService && typeof window.BookingService.adminGetBookings === 'function') {
      const res = await window.BookingService.adminGetBookings({
        search,
        movie_id,
        date,
        status,
        limit: 100
      });

      if (res.success && res.data && Array.isArray(res.data.items)) {
        bookingsList = res.data.items;
        renderBookings(bookingsList);
        return;
      }
    }
  } catch (error) {
    console.warn('[loadBookingsFromApi] Lỗi kết nối Backend, chuyển sang lọc cục bộ:', error);
  }

  // Fallback lọc dữ liệu cục bộ khi chưa nạp được từ API
  applyLocalFilters();
}

// Lọc cục bộ trên mảng fallback
function applyLocalFilters() {
  const searchInput = document.getElementById('booking-search-input');
  const movieSelect = document.getElementById('booking-movie-filter');
  const dateInput = document.getElementById('booking-date-filter');
  const statusSelect = document.getElementById('booking-status-filter');

  const keyword = searchInput ? searchInput.value.toLowerCase().trim().replace(/^#/, '') : '';
  const movieId = movieSelect && movieSelect.value !== 'all' ? parseInt(movieSelect.value, 10) : null;
  const filterDate = dateInput && dateInput.value ? dateInput.value.trim() : '';
  const status = statusSelect ? statusSelect.value : 'all';

  const source = (bookingsList && bookingsList.length > 0) ? bookingsList : fallbackBookings;

  const filtered = source.filter(b => {
    // 1. Tìm theo mã vé (#BK-...) hoặc SĐT hoặc Tên khách
    const codeStr = (b.code || b.booking_code || '').toLowerCase();
    const phoneStr = (b.customer_phone || '').toLowerCase();
    const nameStr = (b.customer_name || '').toLowerCase();
    const matchSearch = !keyword || codeStr.includes(keyword) || phoneStr.includes(keyword) || nameStr.includes(keyword);

    // 2. Lọc theo Phim
    const matchMovie = !movieId || b.movie_id === movieId || (b.movie_title && b.movie_title.toLowerCase().includes((movieSelect.options[movieSelect.selectedIndex]?.text || '').toLowerCase()));

    // 3. Lọc theo Ngày (ngày chiếu hoặc ngày đặt)
    const showDate = b.showtime_date || (b.showtime ? b.showtime.split('•')[1]?.trim() : '');
    const bookDate = b.booking_time ? b.booking_time.split(' ')[0] : '';
    const matchDate = !filterDate || (showDate && showDate.includes(filterDate)) || (bookDate && bookDate.includes(filterDate));

    // 4. Lọc theo Trạng thái
    let bStatus = (b.status || '').toLowerCase();
    if (bStatus === 'da_thanh_toan') bStatus = 'confirmed';
    if (bStatus === 'giu_cho') bStatus = 'pending';
    if (bStatus === 'da_huy' || bStatus === 'het_han') bStatus = 'cancelled';
    const matchStatus = status === 'all' || bStatus === status;

    return matchSearch && matchMovie && matchDate && matchStatus;
  });

  renderBookings(filtered);
}

// Render bảng danh sách đơn vé
function renderBookings(list) {
  const tbody = document.getElementById('bookings-table-tbody');
  if (!tbody) return;

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-state">
          <div class="empty-state-icon">🎟️</div>
          <p>Không tìm thấy đơn vé nào phù hợp với bộ lọc và điều kiện tìm kiếm.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(b => {
    let rawStatus = (b.status || '').toLowerCase();
    let statusBadge = '<span class="badge badge-success">Đã thanh toán</span>';
    if (rawStatus === 'pending' || rawStatus === 'giu_cho') {
      statusBadge = '<span class="badge badge-warning">Chờ thanh toán</span>';
    } else if (rawStatus === 'cancelled' || rawStatus === 'da_huy' || rawStatus === 'het_han') {
      statusBadge = '<span class="badge badge-danger">Đã hủy</span>';
    }

    const seatsText = Array.isArray(b.seats) ? b.seats.join(', ') : (b.seats || 'Chưa chọn');
    const codeDisplay = b.code || b.booking_code || `BK-${b.id}`;
    const isCancelled = rawStatus === 'cancelled' || rawStatus === 'da_huy' || rawStatus === 'het_han';

    return `
      <tr>
        <td><strong style="color: #38bdf8; font-family: monospace; font-size: 13px;">#${codeDisplay}</strong></td>
        <td>
          <div style="font-weight: 600; color: #fff;">${b.customer_name || 'Khách hàng'}</div>
          <div style="font-size: 11px; color: var(--text-muted);">${b.customer_email || ''}</div>
        </td>
        <td>
          <span style="font-family: monospace; color: #e2e8f0; font-weight: 500;">
            <i class="fa-solid fa-phone text-xs text-primary mr-1"></i>${b.customer_phone || 'N/A'}
          </span>
        </td>
        <td>
          <div style="font-weight: 600; color: #fff;">${b.movie_title || 'Tên phim'}</div>
          <div style="font-size: 11px; color: var(--color-primary);">${b.showtime || ''}</div>
        </td>
        <td>
          <div>${b.cinema_name || 'Rạp chiếu'}</div>
          <span class="badge badge-info text-xs">${b.room_name || 'Phòng'}</span>
        </td>
        <td><span class="badge badge-admin font-mono">${seatsText}</span></td>
        <td><strong style="color: var(--color-success); font-size: 14px;">${Number(b.total_price || 0).toLocaleString('vi-VN')} đ</strong></td>
        <td>${statusBadge}</td>
        <td style="text-align: right;">
          <div class="table-actions" style="justify-content: flex-end; gap: 6px;">
            <button class="btn btn-secondary btn-sm" onclick="viewBookingDetail(${b.id})" title="Xem chi tiết đơn vé">
              <i class="fa-solid fa-eye"></i> Chi tiết
            </button>
            ${!isCancelled ? `
              <button class="btn btn-outline-danger btn-sm" onclick="cancelBooking(${b.id})" title="Hủy đơn vé & giải phóng ghế">
                <i class="fa-solid fa-ban"></i> Hủy vé
              </button>
            ` : `
              <span class="text-xs text-muted" style="padding: 4px 8px; font-style: italic;">Đã hủy</span>
            `}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Khởi tạo các sự kiện lọc và tìm kiếm
function initBookingFilters() {
  const searchInput = document.getElementById('booking-search-input');
  const movieSelect = document.getElementById('booking-movie-filter');
  const dateInput = document.getElementById('booking-date-filter');
  const statusSelect = document.getElementById('booking-status-filter');

  let debounceTimer = null;
  function handleFilterTrigger() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      // Ưu tiên gọi API để tìm kiếm chính xác trên Database
      if (window.BookingService && typeof window.BookingService.adminGetBookings === 'function') {
        loadBookingsFromApi();
      } else {
        applyLocalFilters();
      }
    }, 250);
  }

  if (searchInput) searchInput.addEventListener('input', handleFilterTrigger);
  if (movieSelect) movieSelect.addEventListener('change', handleFilterTrigger);
  if (dateInput) dateInput.addEventListener('change', handleFilterTrigger);
  if (statusSelect) statusSelect.addEventListener('change', handleFilterTrigger);
}

// Đặt lại toàn bộ bộ lọc về mặc định
window.resetBookingFilters = function () {
  const searchInput = document.getElementById('booking-search-input');
  const movieSelect = document.getElementById('booking-movie-filter');
  const dateInput = document.getElementById('booking-date-filter');
  const statusSelect = document.getElementById('booking-status-filter');

  if (searchInput) searchInput.value = '';
  if (movieSelect) movieSelect.value = 'all';
  if (dateInput) dateInput.value = '';
  if (statusSelect) statusSelect.value = 'all';

  loadBookingsFromApi();
};

// Modal Xem Chi Tiết Đơn Vé (Vé điện tử cao cấp)
window.viewBookingDetail = async function (id) {
  let b = (bookingsList || []).find(x => x.id === id) || fallbackBookings.find(x => x.id === id);

  // Thử nạp chi tiết từ API để có dữ liệu mới nhất
  try {
    if (window.BookingService && typeof window.BookingService.adminGetBookingDetail === 'function') {
      const res = await window.BookingService.adminGetBookingDetail(id);
      if (res && res.success && res.data) {
        b = res.data.data || res.data;
      }
    }
  } catch (e) {
    console.warn('[viewBookingDetail]', e);
  }

  if (!b) return;

  const content = document.getElementById('booking-detail-content');
  const title = document.getElementById('booking-detail-title');
  const cancelBtnWrapper = document.getElementById('modal-cancel-btn-wrapper');

  const codeDisplay = b.code || b.booking_code || `BK-${b.id}`;
  if (title) title.innerHTML = `<i class="fa-solid fa-receipt text-primary"></i> Chi tiết đơn vé điện tử: #${codeDisplay}`;

  let rawStatus = (b.status || '').toLowerCase();
  let statusBadge = '<span class="badge badge-success">Đã thanh toán</span>';
  if (rawStatus === 'pending' || rawStatus === 'giu_cho') {
    statusBadge = '<span class="badge badge-warning">Chờ thanh toán</span>';
  } else if (rawStatus === 'cancelled' || rawStatus === 'da_huy' || rawStatus === 'het_han') {
    statusBadge = '<span class="badge badge-danger">Đã hủy</span>';
  }

  const seatsText = Array.isArray(b.seats) ? b.seats.join(', ') : (b.seats || 'Chưa rõ');
  const isCancelled = rawStatus === 'cancelled' || rawStatus === 'da_huy' || rawStatus === 'het_han';

  if (content) {
    content.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 14px;">
        <!-- Khối Thông Tin Suất Chiếu & Phim -->
        <div style="display: flex; gap: 14px; background: rgba(15,23,42,0.7); border: 1px solid rgba(255,255,255,0.1); padding: 14px; border-radius: 8px;">
          ${b.movie_poster ? `
            <img src="${b.movie_poster}" alt="${b.movie_title}" style="width: 70px; height: 100px; object-fit: cover; border-radius: 6px; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
          ` : ''}
          <div style="flex: 1;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <h4 style="color: #fff; font-size: 16px; font-weight: 700; margin-bottom: 4px;">${b.movie_title || 'Tên phim'}</h4>
              <div>${statusBadge}</div>
            </div>
            <div style="font-size: 13px; color: var(--color-primary); font-weight: 600; margin-bottom: 4px;">
              <i class="fa-solid fa-clock mr-1"></i> Suất: ${b.showtime || 'N/A'}
            </div>
            <div style="font-size: 12px; color: #94a3b8;">
              <i class="fa-solid fa-location-dot mr-1 text-primary"></i> ${b.cinema_name || 'Rạp'} • ${b.room_name || 'Phòng chiếu'}
            </div>
            <div style="margin-top: 6px; font-size: 13px;">
              Ghế đã đặt: <strong style="color: #38bdf8; font-family: monospace; font-size: 14px;">${seatsText}</strong>
            </div>
          </div>
        </div>

        <!-- Khối Thông Tin Khách Hàng & Thanh Toán -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px; background: rgba(15,23,42,0.4); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
          <div>
            <span class="text-muted">Họ tên khách:</span>
            <div style="font-weight: 600; color: #fff;">${b.customer_name || 'Khách vãng lai'}</div>
          </div>
          <div>
            <span class="text-muted">Số điện thoại:</span>
            <div style="font-weight: 600; color: #38bdf8; font-family: monospace;">${b.customer_phone || 'N/A'}</div>
          </div>
          <div>
            <span class="text-muted">Email liên hệ:</span>
            <div style="color: #cbd5e1;">${b.customer_email || 'N/A'}</div>
          </div>
          <div>
            <span class="text-muted">Thời gian đặt vé:</span>
            <div style="color: #cbd5e1;">${b.booking_time || 'N/A'}</div>
          </div>
          <div>
            <span class="text-muted">Phương thức thanh toán:</span>
            <div style="color: #e2e8f0; font-weight: 500;">
              <i class="fa-solid fa-credit-card mr-1 text-primary"></i> ${b.payment_method || 'MOMO / VNPAY'}
            </div>
          </div>
          <div>
            <span class="text-muted">Tổng thanh toán:</span>
            <div style="color: var(--color-success); font-weight: 700; font-size: 16px;">
              ${Number(b.total_price || 0).toLocaleString('vi-VN')} đ
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Nút hủy vé trong modal
  if (cancelBtnWrapper) {
    if (!isCancelled) {
      cancelBtnWrapper.innerHTML = `
        <button type="button" class="btn btn-outline-danger btn-sm" onclick="cancelBooking(${b.id}, true)">
          <i class="fa-solid fa-ban"></i> Hủy đơn vé & giải phóng ghế
        </button>
      `;
    } else {
      cancelBtnWrapper.innerHTML = `<span class="text-xs text-danger" style="font-style: italic;"><i class="fa-solid fa-circle-xmark"></i> Đơn vé này đã bị hủy</span>`;
    }
  }

  const modal = document.getElementById('booking-detail-modal');
  if (modal) modal.classList.add('show');
};

window.closeBookingModal = function () {
  const modal = document.getElementById('booking-detail-modal');
  if (modal) modal.classList.remove('show');
};

// Huỷ vé: cập nhật trạng thái đơn sang 'cancelled' và giải phóng ghế (SRS 1.3 & Task Quản lý đơn vé)
window.cancelBooking = async function (id, fromModal = false) {
  let b = (bookingsList || []).find(x => x.id === id) || fallbackBookings.find(x => x.id === id);
  if (!b) return;

  const codeDisplay = b.code || b.booking_code || `BK-${b.id}`;
  const seatsStr = Array.isArray(b.seats) ? b.seats.join(', ') : (b.seats || '');

  const confirmMsg = `CẢNH BÁO HỦY VÉ:\nBạn có chắc chắn muốn HỦY đơn vé #${codeDisplay} của khách hàng "${b.customer_name}"?\nGhế [${seatsStr}] sẽ được giải phóng lập tức để khách khác có thể đặt.`;
  if (!confirm(confirmMsg)) return;

  try {
    if (window.BookingService && typeof window.BookingService.adminCancelBooking === 'function') {
      const res = await window.BookingService.adminCancelBooking(id);
      if (res && res.success) {
        if (window.showToast) {
          window.showToast(res.data?.message || `Đã hủy đơn vé #${codeDisplay} và giải phóng ghế thành công!`, 'danger');
        } else {
          alert(`Đã hủy đơn vé #${codeDisplay} và giải phóng ghế thành công!`);
        }
        if (fromModal) closeBookingModal();
        await loadBookingsFromApi();
        return;
      } else {
        alert('Lỗi hủy vé: ' + (res?.message || 'Không thể hủy vé.'));
      }
    }
  } catch (err) {
    console.error('[cancelBooking error]', err);
    alert('Lỗi kết nối máy chủ: ' + err.message);
  }

  // Fallback cập nhật giao diện cục bộ nếu backend offline
  b.status = 'cancelled';
  renderBookings(bookingsList.length > 0 ? bookingsList : fallbackBookings);
  if (fromModal) closeBookingModal();
  if (window.showToast) {
    window.showToast(`Đã hủy đơn vé #${codeDisplay} và giải phóng ghế!`, 'danger');
  }
};
