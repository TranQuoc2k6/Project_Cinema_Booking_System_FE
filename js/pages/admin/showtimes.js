/**
 * ==========================================================================
 * ADMIN SHOWTIMES MANAGEMENT CONTROLLER (js/pages/admin/showtimes.js)
 * Quản lý Suất chiếu, tạo/sửa/hủy và chặn trùng giờ (thời lượng phim + 15' dọn phòng)
 * ==========================================================================
 */

let showtimesList = [];
let moviesList = [];
let cinemasList = [];
let roomsCache = {}; // cinemaId -> rooms array

// Helper: Lấy URL ảnh poster đầy đủ
function getPosterFullUrl(url) {
  if (!url) return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&auto=format&fit=crop&q=80';
  if (url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const base = (window.API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '');
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${base}${cleanPath}`;
}

// Helper: Toast message
function notify(message, type = 'info') {
  if (typeof window.showToast === 'function') {
    window.showToast(message, type);
  } else if (typeof window.alert === 'function') {
    window.alert(message);
  } else {
    console.log(`[Toast ${type}] ${message}`);
  }
}

// Helper: Format datetime sang chuỗi định dạng cho input type="datetime-local" (YYYY-MM-DDTHH:mm)
function formatForDateTimeLocal(dateObj) {
  if (!dateObj || isNaN(dateObj.getTime())) return '';
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Helper: Parse string date/time thành Date object an toàn
function parseDateTime(dateStr) {
  if (!dateStr) return null;
  const isoStr = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
  const d = new Date(isoStr);
  return isNaN(d.getTime()) ? null : d;
}

// Helper: Format hiển thị giờ HH:mm
function formatHourMinute(dateObj) {
  if (!dateObj) return '--:--';
  return dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

// Helper: Format hiển thị ngày DD/MM/YYYY
function formatDateDisplay(dateObj) {
  if (!dateObj) return '';
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  return `${day}/${month}/${year}`;
}

document.addEventListener('DOMContentLoaded', async function () {
  // 1. Khởi tạo giá trị bộ lọc ngày mặc định (để trống để xem tất cả hoặc chọn hôm nay)
  initFilterEvents();

  // 2. Tải danh mục Phim và Cụm rạp cho Dropdown bộ lọc & modal
  await Promise.all([loadMoviesForDropdowns(), loadCinemasForDropdowns()]);

  // 3. Tải danh sách suất chiếu
  await loadShowtimesFromApi();
});

// Tải danh sách phim từ MovieService
async function loadMoviesForDropdowns() {
  try {
    if (window.MovieService) {
      let res;
      if (typeof window.MovieService.adminGetMovies === 'function') {
        res = await window.MovieService.adminGetMovies({ limit: 100 });
      }
      if (!res || !res.success) {
        res = await window.MovieService.getMovies({ limit: 100 });
      }
      if (res && res.success && res.data) {
        moviesList = Array.isArray(res.data) ? res.data : (res.data.items || []);
      }
    }
  } catch (err) {
    console.warn('[Showtimes Admin] Lỗi tải danh sách phim:', err);
  }

  // Fallback nếu không có phim
  if (!moviesList || moviesList.length === 0) {
    moviesList = [
      { id: 1, title: 'Mai (18+)', duration_minutes: 131 },
      { id: 2, title: 'Lật Mặt 7: Một Điều Ước', duration_minutes: 138 },
      { id: 3, title: 'Dune: Hành Tinh Cát 2', duration_minutes: 166 },
      { id: 4, title: 'Kung Fu Panda 4', duration_minutes: 94 }
    ];
  }

  // Populate Filter Movie Select
  const filterSelect = document.getElementById('showtime-movie-filter');
  if (filterSelect) {
    filterSelect.innerHTML = `<option value="all">🎬 Tất cả tác phẩm phim</option>` +
      moviesList.map(m => `<option value="${m.id}">${m.title}</option>`).join('');
  }

  // Populate Modal Movie Select
  const modalSelect = document.getElementById('showtime-movie-select');
  if (modalSelect) {
    modalSelect.innerHTML = `<option value="">-- Chọn tác phẩm phim --</option>` +
      moviesList.map(m => {
        const dur = m.duration_minutes || m.duration || 120;
        return `<option value="${m.id}">${m.title} (${dur} phút)</option>`;
      }).join('');
  }
}

// Tải danh sách rạp từ CinemaService
async function loadCinemasForDropdowns() {
  try {
    if (window.CinemaService) {
      const res = await window.CinemaService.getCinemas();
      if (res && res.success && Array.isArray(res.data)) {
        cinemasList = res.data;
      }
    }
  } catch (err) {
    console.warn('[Showtimes Admin] Lỗi tải danh sách cụm rạp:', err);
  }

  if (!cinemasList || cinemasList.length === 0) {
    cinemasList = [
      { id: 1, name: 'Cinema Star Vincom Bà Triệu', city: 'Hà Nội' },
      { id: 2, name: 'Cinema Star Landmark 81', city: 'TP. Hồ Chí Minh' },
      { id: 3, name: 'Cinema Star Đà Nẵng Center', city: 'Đà Nẵng' }
    ];
  }

  // Populate Filter Cinema Select
  const filterSelect = document.getElementById('showtime-cinema-filter');
  if (filterSelect) {
    filterSelect.innerHTML = `<option value="all">🏢 Tất cả cụm rạp</option>` +
      cinemasList.map(c => `<option value="${c.id}">${c.name} (${c.city || ''})</option>`).join('');
  }

  // Populate Modal Cinema Select
  const modalSelect = document.getElementById('showtime-cinema-select');
  if (modalSelect) {
    modalSelect.innerHTML = `<option value="">-- Chọn cụm rạp --</option>` +
      cinemasList.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  }
}

// Tải danh sách phòng chiếu khi chọn rạp trong modal
window.onCinemaSelectChange = async function (selectedRoomId = null) {
  const cinemaSelect = document.getElementById('showtime-cinema-select');
  const roomSelect = document.getElementById('showtime-room-select');
  if (!cinemaSelect || !roomSelect) return;

  const cinemaId = parseInt(cinemaSelect.value, 10);
  if (!cinemaId) {
    roomSelect.innerHTML = '<option value="">-- Chọn cụm rạp trước --</option>';
    return;
  }

  roomSelect.innerHTML = '<option value="">-- Đang tải danh sách phòng... --</option>';

  let rooms = roomsCache[cinemaId];
  if (!rooms && window.CinemaService) {
    try {
      const res = await window.CinemaService.getRooms(cinemaId);
      if (res && res.success && Array.isArray(res.data)) {
        rooms = res.data;
        roomsCache[cinemaId] = rooms;
      }
    } catch (err) {
      console.warn('[Showtimes Admin] Lỗi tải phòng:', err);
    }
  }

  if (!rooms || rooms.length === 0) {
    rooms = [
      { id: 1, name: 'Phòng IMAX 01', room_type: 'IMAX', total_seats: 120 },
      { id: 2, name: 'Phòng 02 Digital', room_type: '2D', total_seats: 80 }
    ];
  }

  roomSelect.innerHTML = '<option value="">-- Chọn phòng chiếu --</option>' +
    rooms.map(r => `<option value="${r.id}">${r.name} (${r.room_type || '2D'} - ${r.total_seats || 60} ghế)</option>`).join('');

  if (selectedRoomId) {
    roomSelect.value = selectedRoomId;
  }
};

// Tải danh sách suất chiếu từ API
async function loadShowtimesFromApi() {
  const tbody = document.getElementById('showtimes-table-tbody');
  if (tbody && showtimesList.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-6 text-slate-400" style="text-align: center; padding: 30px;">
          <i class="fa-solid fa-spinner fa-spin mr-2"></i> Đang tải dữ liệu suất chiếu từ hệ thống...
        </td>
      </tr>
    `;
  }

  const dateFilter = document.getElementById('showtime-date-filter');
  const movieFilter = document.getElementById('showtime-movie-filter');
  const cinemaFilter = document.getElementById('showtime-cinema-filter');
  const statusFilter = document.getElementById('showtime-status-filter');
  const searchInput = document.getElementById('showtime-search-input');

  const params = {
    page: 1,
    limit: 100,
    date: dateFilter ? dateFilter.value : '',
    movieId: movieFilter ? movieFilter.value : 'all',
    cinemaId: cinemaFilter ? cinemaFilter.value : 'all',
    status: statusFilter ? statusFilter.value : 'all',
    search: searchInput ? searchInput.value : ''
  };

  try {
    if (window.ShowtimeService && typeof window.ShowtimeService.adminGetShowtimes === 'function') {
      const res = await window.ShowtimeService.adminGetShowtimes(params);
      if (res && res.success && res.data) {
        showtimesList = Array.isArray(res.data) ? res.data : (res.data.items || []);
        renderShowtimes(showtimesList);
        return;
      }
    }
  } catch (err) {
    console.error('[Showtimes Admin] Lỗi gọi API adminGetShowtimes:', err);
  }

  // Fallback nếu API admin chưa có hoặc offline
  renderShowtimes(showtimesList);
}

// Render bảng danh sách suất chiếu
function renderShowtimes(list) {
  const tbody = document.getElementById('showtimes-table-tbody');
  if (!tbody) return;

  if (!list || list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state" style="text-align: center; padding: 40px; color: var(--text-muted);">
          <div style="font-size: 32px; margin-bottom: 8px;">🕒</div>
          <p>Không có suất chiếu nào phù hợp với điều kiện tìm kiếm và bộ lọc.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(s => {
    const startDate = parseDateTime(s.start_time);
    const endDate = parseDateTime(s.end_time);

    // Thời gian dọn phòng 15 phút sau khi kết thúc
    const cleanDate = endDate ? new Date(endDate.getTime() + 15 * 60 * 1000) : null;

    const startHour = startDate ? formatHourMinute(startDate) : '--:--';
    const endHour = endDate ? formatHourMinute(endDate) : '--:--';
    const cleanHour = cleanDate ? formatHourMinute(cleanDate) : '--:--';
    const dateStr = startDate ? formatDateDisplay(startDate) : '';

    // Trạng thái badge
    let statusBadge = '<span class="badge badge-info"><i class="fa-solid fa-clock mr-1"></i> Sắp chiếu</span>';
    if (s.status === 'ongoing') {
      statusBadge = '<span class="badge badge-success"><i class="fa-solid fa-play mr-1"></i> Đang chiếu</span>';
    } else if (s.status === 'finished') {
      statusBadge = '<span class="badge badge-secondary" style="opacity: 0.7;"><i class="fa-solid fa-check mr-1"></i> Đã kết thúc</span>';
    }

    const posterUrl = getPosterFullUrl(s.poster_url);
    const dur = s.duration_minutes || 120;
    const rType = s.room_type || '2D';

    let rTypeBadge = '<span class="badge badge-info">2D</span>';
    if (rType.toUpperCase().includes('IMAX')) rTypeBadge = '<span class="badge badge-warning" style="background: rgba(234, 179, 8, 0.2); color: #fde047; border: 1px solid rgba(234, 179, 8, 0.4);">IMAX 3D</span>';
    else if (rType.toUpperCase().includes('VIP')) rTypeBadge = '<span class="badge badge-accent" style="background: rgba(168, 85, 247, 0.2); color: #d8b4fe; border: 1px solid rgba(168, 85, 247, 0.4);">VIP Gold</span>';

    const bookingsCount = s.total_bookings || 0;

    return `
      <tr>
        <td>
          <div style="font-weight: 700; font-size: 15px; color: #fff;">
            ${startHour} &rarr; ${endHour}
          </div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
            <i class="fa-solid fa-calendar text-primary mr-1"></i> ${dateStr}
          </div>
          <div style="font-size: 10.5px; color: #60a5fa; margin-top: 3px;" title="15 phút dọn phòng đến ${cleanHour}">
            <i class="fa-solid fa-broom mr-1"></i> Dọn phòng đến ${cleanHour}
          </div>
        </td>
        <td>
          <div class="d-flex align-center gap-sm">
            <img src="${posterUrl}" alt="${s.movie_title}" style="width: 38px; height: 52px; object-fit: cover; border-radius: 4px; box-shadow: 0 2px 6px rgba(0,0,0,0.4);" onerror="this.src='https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&auto=format&fit=crop&q=80'">
            <div>
              <strong style="font-size: 14px; display: block; color: #fff;">${s.movie_title}</strong>
              <span style="font-size: 11px; color: var(--text-muted);"><i class="fa-solid fa-stopwatch mr-1"></i> ${dur} phút</span>
            </div>
          </div>
        </td>
        <td>
          <div style="font-weight: 500;">${s.cinema_name}</div>
          <div style="font-size: 11px; color: var(--text-muted);">${s.city || ''}</div>
        </td>
        <td>
          <div><strong>${s.room_name}</strong></div>
          <div style="margin-top: 4px;">${rTypeBadge}</div>
        </td>
        <td>
          <strong style="color: var(--color-success); font-size: 14px;">${Number(s.price).toLocaleString('vi-VN')} đ</strong>
        </td>
        <td>${statusBadge}</td>
        <td style="text-align: center;">
          <span class="badge" style="background: rgba(255,255,255,0.06); font-weight: 600;">
            <i class="fa-solid fa-ticket mr-1"></i> ${bookingsCount}
          </span>
        </td>
        <td style="text-align: right; white-space: nowrap;">
          <button class="btn btn-secondary btn-sm" onclick="editShowtime(${s.id})" title="Chỉnh sửa suất chiếu" style="margin-right: 4px;">
            <i class="fa-solid fa-pen-to-square"></i> Sửa
          </button>
          <button class="btn btn-danger btn-sm" onclick="deleteShowtime(${s.id})" title="Hủy / Xóa suất chiếu">
            <i class="fa-solid fa-trash-can"></i> Hủy
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Khởi tạo các sự kiện bộ lọc
function initFilterEvents() {
  const dateFilter = document.getElementById('showtime-date-filter');
  const movieFilter = document.getElementById('showtime-movie-filter');
  const cinemaFilter = document.getElementById('showtime-cinema-filter');
  const statusFilter = document.getElementById('showtime-status-filter');
  const searchInput = document.getElementById('showtime-search-input');

  let debounceTimer = null;

  if (dateFilter) dateFilter.addEventListener('change', () => loadShowtimesFromApi());
  if (movieFilter) movieFilter.addEventListener('change', () => loadShowtimesFromApi());
  if (cinemaFilter) cinemaFilter.addEventListener('change', () => loadShowtimesFromApi());
  if (statusFilter) statusFilter.addEventListener('change', () => loadShowtimesFromApi());

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => loadShowtimesFromApi(), 350);
    });
  }
}

// Nút lọc nhanh: Hôm nay
window.setFilterToday = function () {
  const dateFilter = document.getElementById('showtime-date-filter');
  if (dateFilter) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dateFilter.value = `${yyyy}-${mm}-${dd}`;
    loadShowtimesFromApi();
  }
};

// Nút xóa lọc ngày: Xem tất cả
window.clearDateFilter = function () {
  const dateFilter = document.getElementById('showtime-date-filter');
  if (dateFilter) {
    dateFilter.value = '';
    loadShowtimesFromApi();
  }
};

// Helper: Tìm thời lượng phim đang chọn trong modal
function getSelectedMovieDuration() {
  const movieSelect = document.getElementById('showtime-movie-select');
  if (!movieSelect || !movieSelect.value) return 120;
  const mId = parseInt(movieSelect.value, 10);
  const found = moviesList.find(m => m.id === mId);
  return found ? (found.duration_minutes || found.duration || 120) : 120;
}

// Xử lý khi thay đổi phim chiếu trong modal
window.onMovieSelectChange = function () {
  recalculateEndTimeAndBuffer();
};

// Xử lý khi thay đổi thời điểm bắt đầu
window.onStartTimeChange = function () {
  recalculateEndTimeAndBuffer(true);
};

// Xử lý khi người dùng tự chỉnh thời điểm kết thúc
window.onEndTimeChange = function () {
  recalculateEndTimeAndBuffer(false);
};

// Tự động tính toán giờ kết thúc và cập nhật hộp thoại thông báo dọn phòng
function recalculateEndTimeAndBuffer(autoUpdateEndTime = false) {
  const startInput = document.getElementById('showtime-start-time');
  const endInput = document.getElementById('showtime-end-time');
  const bufferText = document.getElementById('showtime-buffer-text');
  const alertBox = document.getElementById('showtime-modal-alert');
  if (alertBox) alertBox.style.display = 'none';

  if (!startInput || !startInput.value) {
    if (bufferText) {
      bufferText.innerHTML = 'Quy tắc chặn trùng giờ: Hệ thống tự động tính thời lượng phim + <strong>15 phút dọn phòng</strong> sau khi chiếu. Suất chiếu tiếp theo trong cùng phòng phải bắt đầu sau thời điểm dọn phòng xong.';
    }
    return;
  }

  const duration = getSelectedMovieDuration();
  const startDate = new Date(startInput.value);
  if (isNaN(startDate.getTime())) return;

  const minEndDate = new Date(startDate.getTime() + duration * 60 * 1000);

  // Nếu người dùng chọn start_time mới hoặc yêu cầu auto update, gán end_time mặc định
  if (autoUpdateEndTime || !endInput.value) {
    endInput.value = formatForDateTimeLocal(minEndDate);
  }

  const currentEndDate = endInput.value ? new Date(endInput.value) : minEndDate;

  // Kiểm tra nếu end_time < minEndDate
  if (currentEndDate < minEndDate) {
    if (bufferText) {
      bufferText.innerHTML = `<span style="color: #f87171;"><i class="fa-solid fa-triangle-exclamation"></i> Thời gian kết thúc sớm hơn thời lượng phim (${duration} phút). Vui lòng điều chỉnh lại!</span>`;
    }
    return;
  }

  // Tính thời gian dọn phòng 15 phút
  const cleanEndDate = new Date(currentEndDate.getTime() + 15 * 60 * 1000);

  const startHour = formatHourMinute(startDate);
  const endHour = formatHourMinute(currentEndDate);
  const cleanHour = formatHourMinute(cleanEndDate);

  if (bufferText) {
    bufferText.innerHTML = `
      <div>
        <strong>Khung giờ chiếm dụng phòng:</strong>
        ${startHour} &rarr; ${endHour} (Chiếu phim: ${duration} phút)
        + <strong>15 phút dọn phòng</strong> &rarr; Hoàn tất lúc <strong>${cleanHour}</strong>.
      </div>
      <div style="font-size: 11.5px; opacity: 0.9; margin-top: 3px;">
        Suất chiếu tiếp theo trong cùng phòng chỉ được bắt đầu từ <strong>${cleanHour}</strong> trở đi để tránh trùng lịch.
      </div>
    `;
  }
}

// Mở modal thêm suất chiếu mới
window.openShowtimeModal = function () {
  const form = document.getElementById('showtime-form');
  if (form) form.reset();

  document.getElementById('showtime-id').value = '';
  document.getElementById('showtime-modal-title').innerHTML = `
    <i class="fa-solid fa-calendar-plus text-primary mr-2"></i>
    <span>Thêm Suất chiếu mới</span>
  `;
  document.getElementById('showtime-submit-btn').innerHTML = `
    <i class="fa-solid fa-floppy-disk mr-1"></i> <span>Lưu suất chiếu</span>
  `;

  // Ẩn alert lỗi cũ
  const alertBox = document.getElementById('showtime-modal-alert');
  if (alertBox) alertBox.style.display = 'none';

  // Khởi tạo thời gian bắt đầu mặc định: Giờ tròn tiếp theo hôm nay/ngày mai
  const now = new Date();
  now.setHours(now.getHours() + 1, 0, 0, 0);
  const startInput = document.getElementById('showtime-start-time');
  if (startInput) {
    startInput.value = formatForDateTimeLocal(now);
  }

  // Giá mặc định
  const priceInput = document.getElementById('showtime-price');
  if (priceInput) priceInput.value = 95000;

  // Chọn phim đầu tiên mặc định và tính end time
  const movieSelect = document.getElementById('showtime-movie-select');
  if (movieSelect && movieSelect.options.length > 1) {
    movieSelect.selectedIndex = 1;
  }

  // Chọn rạp đầu tiên mặc định
  const cinemaSelect = document.getElementById('showtime-cinema-select');
  if (cinemaSelect && cinemaSelect.options.length > 1) {
    cinemaSelect.selectedIndex = 1;
    onCinemaSelectChange();
  }

  recalculateEndTimeAndBuffer(true);
  document.getElementById('showtime-modal').classList.add('show');
};

// Đóng modal
window.closeShowtimeModal = function () {
  document.getElementById('showtime-modal').classList.remove('show');
};

// Mở modal chỉnh sửa suất chiếu
window.editShowtime = async function (id) {
  const showtime = showtimesList.find(s => s.id === id);
  if (!showtime) {
    notify('Không tìm thấy thông tin suất chiếu cần sửa!', 'danger');
    return;
  }

  document.getElementById('showtime-id').value = showtime.id;
  document.getElementById('showtime-modal-title').innerHTML = `
    <i class="fa-solid fa-pen-to-square text-primary mr-2"></i>
    <span>Chỉnh sửa Suất chiếu #${showtime.id}</span>
  `;
  document.getElementById('showtime-submit-btn').innerHTML = `
    <i class="fa-solid fa-floppy-disk mr-1"></i> <span>Cập nhật suất chiếu</span>
  `;

  const alertBox = document.getElementById('showtime-modal-alert');
  if (alertBox) alertBox.style.display = 'none';

  // Điền Phim
  const movieSelect = document.getElementById('showtime-movie-select');
  if (movieSelect) movieSelect.value = showtime.movie_id;

  // Điền Cụm rạp & tải phòng
  const cinemaSelect = document.getElementById('showtime-cinema-select');
  if (cinemaSelect) {
    cinemaSelect.value = showtime.cinema_id;
    await onCinemaSelectChange(showtime.room_id);
  }

  // Điền thời gian bắt đầu & kết thúc
  const startInput = document.getElementById('showtime-start-time');
  const endInput = document.getElementById('showtime-end-time');
  if (startInput) {
    const sDate = parseDateTime(showtime.start_time);
    startInput.value = formatForDateTimeLocal(sDate);
  }
  if (endInput) {
    const eDate = parseDateTime(showtime.end_time);
    endInput.value = formatForDateTimeLocal(eDate);
  }

  // Điền giá
  const priceInput = document.getElementById('showtime-price');
  if (priceInput) priceInput.value = showtime.price;

  recalculateEndTimeAndBuffer(false);
  document.getElementById('showtime-modal').classList.add('show');
};

// Submit form thêm hoặc sửa suất chiếu (gọi API + chặn trùng giờ)
window.handleShowtimeSubmit = async function (e) {
  e.preventDefault();

  const id = document.getElementById('showtime-id').value;
  const movieId = document.getElementById('showtime-movie-select').value;
  const roomId = document.getElementById('showtime-room-select').value;
  const startTime = document.getElementById('showtime-start-time').value;
  const endTime = document.getElementById('showtime-end-time').value;
  const price = document.getElementById('showtime-price').value;

  const alertBox = document.getElementById('showtime-modal-alert');
  const alertMsg = document.getElementById('showtime-modal-alert-msg');
  const submitBtn = document.getElementById('showtime-submit-btn');

  if (!movieId || !roomId || !startTime || !endTime) {
    if (alertBox && alertMsg) {
      alertMsg.textContent = 'Vui lòng điền đầy đủ tất cả các trường bắt buộc!';
      alertBox.style.display = 'block';
    }
    return;
  }

  const startDate = new Date(startTime);
  const endDate = new Date(endTime);
  const duration = getSelectedMovieDuration();
  const minEndDate = new Date(startDate.getTime() + duration * 60 * 1000);

  if (endDate < minEndDate) {
    if (alertBox && alertMsg) {
      alertMsg.textContent = `Thời gian kết thúc không hợp lệ! Phim có thời lượng ${duration} phút, nên kết thúc sớm nhất lúc ${formatHourMinute(minEndDate)} ${formatDateDisplay(minEndDate)}.`;
      alertBox.style.display = 'block';
    }
    return;
  }

  const payload = {
    movie_id: parseInt(movieId, 10),
    room_id: parseInt(roomId, 10),
    start_time: startDate.toISOString(),
    end_time: endDate.toISOString(),
    price: parseFloat(price)
  };

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Đang lưu...';
    }

    let res;
    if (id) {
      // Cập nhật suất chiếu
      res = await window.ShowtimeService.adminUpdateShowtime(id, payload);
    } else {
      // Tạo suất chiếu mới
      res = await window.ShowtimeService.adminCreateShowtime(payload);
    }

    if (res && res.success) {
      closeShowtimeModal();
      notify(id ? `Đã cập nhật suất chiếu #${id} thành công!` : 'Đã thêm suất chiếu mới thành công!', 'success');
      await loadShowtimesFromApi();
    } else {
      // Hiển thị thông báo lỗi (đặc biệt là lỗi chặn trùng giờ kèm 15' dọn phòng)
      const errorText = res ? res.message : 'Có lỗi xảy ra khi lưu suất chiếu';
      if (alertBox && alertMsg) {
        alertMsg.textContent = errorText;
        alertBox.style.display = 'block';
      }
      notify(errorText, 'danger');
    }
  } catch (err) {
    console.error('[Showtimes Admin] Submit error:', err);
    if (alertBox && alertMsg) {
      alertMsg.textContent = err.message || 'Lỗi không xác định khi kết nối Backend';
      alertBox.style.display = 'block';
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<i class="fa-solid fa-floppy-disk mr-1"></i> <span>${id ? 'Cập nhật suất chiếu' : 'Lưu suất chiếu'}</span>`;
    }
  }
};

// Hủy / Xóa suất chiếu
window.deleteShowtime = async function (id) {
  if (!confirm(`Bạn có chắc chắn muốn hủy / xóa suất chiếu #${id} khỏi hệ thống?`)) {
    return;
  }

  try {
    const res = await window.ShowtimeService.adminDeleteShowtime(id, false);
    if (res && res.success) {
      notify(res.data?.message || `Đã xóa suất chiếu #${id} thành công!`, 'success');
      await loadShowtimesFromApi();
    } else {
      // Nếu có vé đã thanh toán, hỏi xem có muốn force delete không
      const errMsg = res ? res.message : 'Lỗi khi xóa suất chiếu';
      if (errMsg.includes('vé đã thanh toán') || errMsg.includes('vé được thanh toán')) {
        const forceConfirm = confirm(`${errMsg}\n\nBạn có muốn BẮT BUỘC hủy (force delete) suất chiếu này không?`);
        if (forceConfirm) {
          const forceRes = await window.ShowtimeService.adminDeleteShowtime(id, true);
          if (forceRes && forceRes.success) {
            notify(`Đã bắt buộc xóa suất chiếu #${id} thành công!`, 'warning');
            await loadShowtimesFromApi();
            return;
          }
        }
      }
      notify(errMsg, 'danger');
    }
  } catch (err) {
    console.error('[Showtimes Admin] Delete error:', err);
    notify(err.message || 'Không thể xóa suất chiếu', 'danger');
  }
};
