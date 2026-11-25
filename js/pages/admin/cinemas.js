/**
 * ==========================================================================
 * ADMIN CINEMAS & ROOMS CONTROLLER (js/pages/admin/cinemas.js)
 * Quản lý thêm/sửa rạp, phòng chiếu; Cấu hình sơ đồ ghế & loại ghế (Task T3C6880)
 * ==========================================================================
 */

// Dữ liệu bộ nhớ (mock fallback khi API offline)
let cinemasList = [
  {
    id: 1,
    name: "Cinema Star Vincom Bà Triệu",
    address: "191 Bà Triệu, Phường Lê Đại Hành, Quận Hai Bà Trưng",
    city: "Hà Nội",
    phone: "024.3974.8888",
    room_count: 3
  },
  {
    id: 2,
    name: "Cinema Star Landmark 81",
    address: "720A Điện Biên Phủ, Phường 22, Quận Bình Thạnh",
    city: "TP. Hồ Chí Minh",
    phone: "028.3636.9999",
    room_count: 2
  },
  {
    id: 3,
    name: "Cinema Star Đà Nẵng Center",
    address: "244 Phan Châu Trinh, Quận Hải Châu",
    city: "Đà Nẵng",
    phone: "0236.3888.666",
    room_count: 1
  }
];

let roomsList = [
  { id: 1, cinema_id: 1, cinema_name: "Vincom Bà Triệu", name: "Phòng IMAX 01", room_type: "IMAX Laser", total_seats: 120, is_active: true },
  { id: 2, cinema_id: 1, cinema_name: "Vincom Bà Triệu", name: "Phòng chiếu 02", room_type: "2D Standard", total_seats: 96, is_active: true },
  { id: 3, cinema_id: 1, cinema_name: "Vincom Bà Triệu", name: "Phòng VIP Gold", room_type: "VIP Gold Class", total_seats: 48, is_active: true },
  { id: 4, cinema_id: 2, cinema_name: "Landmark 81", name: "Phòng IMAX Luxe", room_type: "IMAX Laser", total_seats: 144, is_active: true },
  { id: 5, cinema_id: 2, cinema_name: "Landmark 81", name: "Phòng chiếu 02", room_type: "3D Digital", total_seats: 108, is_active: true },
  { id: 6, cinema_id: 3, cinema_name: "Đà Nẵng Center", name: "Phòng chiếu 01", room_type: "2D Standard", total_seats: 90, is_active: true }
];

// Trạng thái cấu hình ghế hiện tại
let currentRoom = null;
let currentSeats = [];
let modifiedSeats = new Map(); // seatId -> { seat_type, is_active }
let selectedSeatIds = new Set();
let currentBrush = 'standard'; // 'standard' | 'vip' | 'couple' | 'disabled'

document.addEventListener('DOMContentLoaded', function () {
  initData();
  initFilters();
});

// ==========================================================================
// 1. TẢI DỮ LIỆU TỪ BACKEND API HOẶC FALLBACK
// ==========================================================================
async function initData() {
  await Promise.all([loadCinemas(), loadRooms()]);
  populateCinemaSelect();
  populateFilterOptions();
}

async function loadCinemas() {
  if (window.CinemaService) {
    const res = await window.CinemaService.getCinemas();
    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      cinemasList = res.data;
    }
  }
  renderCinemas();
}

async function loadRooms() {
  if (window.CinemaService) {
    const res = await window.CinemaService.getRooms();
    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      roomsList = res.data.map(r => {
        const parentCinema = cinemasList.find(c => c.id === r.cinema_id);
        return {
          ...r,
          cinema_name: parentCinema ? parentCinema.name.replace('Cinema Star ', '') : (r.cinema_name || 'Rạp')
        };
      });
    }
  }
  renderRooms();
  updateCinemaRoomCounts();
}

function updateCinemaRoomCounts() {
  cinemasList.forEach(c => {
    c.room_count = roomsList.filter(r => r.cinema_id === c.id).length;
  });
  renderCinemas();
}

// ==========================================================================
// 2. RENDER BẢNG CỤM RẠP & PHÒNG CHIẾU
// ==========================================================================
function renderCinemas(listToRender = null) {
  const tbody = document.getElementById('cinemas-table-tbody');
  if (!tbody) return;

  const data = listToRender || cinemasList;
  const countBadge = document.getElementById('cinema-count-badge');
  if (countBadge) countBadge.textContent = `${data.length} cụm rạp`;

  if (data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          <div class="empty-state-icon">🏛️</div>
          <p>Không tìm thấy cụm rạp nào.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = data.map(c => `
    <tr>
      <td>
        <strong style="color: #fff; font-size: 15px;">${c.name}</strong>
      </td>
      <td>${c.address}</td>
      <td><span class="badge badge-info">${c.city}</span></td>
      <td>${c.phone || '<span style="color: var(--text-muted);">(Chưa có)</span>'}</td>
      <td><strong>${c.room_count || 0}</strong> phòng</td>
      <td style="text-align: right;">
        <div class="table-actions" style="justify-content: flex-end;">
          <button class="btn btn-secondary btn-sm" onclick="editCinema(${c.id})" title="Chỉnh sửa thông tin rạp">
            ✏️ Sửa
          </button>
          <button class="btn btn-danger btn-sm" onclick="deleteCinema(${c.id})" title="Xóa cụm rạp">
            🗑 Xóa
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function renderRooms(listToRender = null) {
  const tbody = document.getElementById('rooms-table-tbody');
  if (!tbody) return;

  const data = listToRender || roomsList;
  const countBadge = document.getElementById('room-count-badge');
  if (countBadge) countBadge.textContent = `${data.length} phòng`;

  if (data.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          <div class="empty-state-icon">🚪</div>
          <p>Không tìm thấy phòng chiếu nào.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = data.map(r => {
    let badgeClass = 'badge-info';
    const typeStr = (r.room_type || '').toUpperCase();
    if (typeStr.includes('IMAX')) badgeClass = 'badge-admin';
    else if (typeStr.includes('VIP')) badgeClass = 'badge-warning';
    else if (typeStr.includes('3D')) badgeClass = 'badge-primary';

    return `
      <tr>
        <td><strong style="color: #fff; font-size: 14px;">${r.name}</strong></td>
        <td>${r.cinema_name || 'Rạp #' + r.cinema_id}</td>
        <td><span class="badge ${badgeClass}">${r.room_type || '2D Standard'}</span></td>
        <td><strong>${r.total_seats || 0}</strong> ghế</td>
        <td><span class="badge badge-success">Sẵn sàng chiếu</span></td>
        <td style="text-align: right;">
          <div class="table-actions" style="justify-content: flex-end;">
            <button class="btn btn-primary btn-sm" onclick="openSeatMapModal(${r.id})" title="Cấu hình sơ đồ và loại ghế">
              💺 Cấu hình ghế
            </button>
            <button class="btn btn-secondary btn-sm" onclick="editRoom(${r.id})" title="Chỉnh sửa phòng">
              ✏️ Sửa
            </button>
            <button class="btn btn-danger btn-sm" onclick="deleteRoom(${r.id})" title="Xóa phòng">
              🗑 Xóa
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ==========================================================================
// 3. BỘ LỌC VÀ TÌM KIẾM
// ==========================================================================
function initFilters() {
  const cinemaSearch = document.getElementById('cinema-search-input');
  const cityFilter = document.getElementById('cinema-city-filter');

  function applyCinemaFilter() {
    const key = (cinemaSearch?.value || '').toLowerCase().trim();
    const city = cityFilter?.value || 'all';

    const filtered = cinemasList.filter(c => {
      const matchKey = c.name.toLowerCase().includes(key) || c.address.toLowerCase().includes(key);
      const matchCity = city === 'all' || c.city === city;
      return matchKey && matchCity;
    });
    renderCinemas(filtered);
  }

  if (cinemaSearch) cinemaSearch.addEventListener('input', applyCinemaFilter);
  if (cityFilter) cityFilter.addEventListener('change', applyCinemaFilter);

  const roomSearch = document.getElementById('room-search-input');
  const roomCinemaFilter = document.getElementById('room-cinema-filter');
  const roomTypeFilter = document.getElementById('room-type-filter');

  function applyRoomFilter() {
    const key = (roomSearch?.value || '').toLowerCase().trim();
    const cinemaId = roomCinemaFilter?.value || 'all';
    const roomType = roomTypeFilter?.value || 'all';

    const filtered = roomsList.filter(r => {
      const matchKey = r.name.toLowerCase().includes(key);
      const matchCinema = cinemaId === 'all' || r.cinema_id == cinemaId;
      const matchType = roomType === 'all' || (r.room_type && r.room_type.toUpperCase().includes(roomType.toUpperCase()));
      return matchKey && matchCinema && matchType;
    });
    renderRooms(filtered);
  }

  if (roomSearch) roomSearch.addEventListener('input', applyRoomFilter);
  if (roomCinemaFilter) roomCinemaFilter.addEventListener('change', applyRoomFilter);
  if (roomTypeFilter) roomTypeFilter.addEventListener('change', applyRoomFilter);
}

function populateFilterOptions() {
  const cityFilter = document.getElementById('cinema-city-filter');
  if (cityFilter) {
    const cities = Array.from(new Set(cinemasList.map(c => c.city).filter(Boolean)));
    cityFilter.innerHTML = '<option value="all">Tất cả thành phố</option>' +
      cities.map(c => `<option value="${c}">${c}</option>`).join('');
  }

  const roomCinemaFilter = document.getElementById('room-cinema-filter');
  if (roomCinemaFilter) {
    roomCinemaFilter.innerHTML = '<option value="all">Tất cả cụm rạp</option>' +
      cinemasList.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  }
}

function populateCinemaSelect() {
  const select = document.getElementById('room-cinema-select');
  if (!select) return;
  select.innerHTML = cinemasList.map(c => `<option value="${c.id}">${c.name} (${c.city})</option>`).join('');
}

// ==========================================================================
// 4. QUẢN LÝ CỤM RẠP (THÊM / SỬA / XÓA)
// ==========================================================================
window.openCinemaModal = function (editObj = null) {
  const modal = document.getElementById('cinema-modal');
  const title = document.getElementById('modal-cinema-title');
  const submitBtn = document.getElementById('cinema-submit-btn');
  const editId = document.getElementById('cinema-edit-id');

  if (editObj) {
    title.textContent = `Chỉnh sửa Cụm rạp: ${editObj.name}`;
    submitBtn.textContent = 'Cập nhật cụm rạp';
    editId.value = editObj.id;
    document.getElementById('cinema-name').value = editObj.name;
    document.getElementById('cinema-address').value = editObj.address;
    document.getElementById('cinema-city').value = editObj.city;
    document.getElementById('cinema-phone').value = editObj.phone || '';
  } else {
    title.textContent = 'Thêm Cụm rạp mới';
    submitBtn.textContent = 'Lưu cụm rạp';
    editId.value = '';
    document.getElementById('cinema-name').value = '';
    document.getElementById('cinema-address').value = '';
    document.getElementById('cinema-city').value = '';
    document.getElementById('cinema-phone').value = '';
  }

  modal.classList.add('show');
};

window.closeCinemaModal = function () {
  document.getElementById('cinema-modal').classList.remove('show');
};

window.editCinema = function (id) {
  const cinema = cinemasList.find(c => c.id === id);
  if (cinema) {
    window.openCinemaModal(cinema);
  }
};

window.handleCinemaSubmit = async function (e) {
  e.preventDefault();
  const editId = document.getElementById('cinema-edit-id').value;
  const name = document.getElementById('cinema-name').value.trim();
  const address = document.getElementById('cinema-address').value.trim();
  const city = document.getElementById('cinema-city').value.trim();
  const phone = document.getElementById('cinema-phone').value.trim();

  if (!name) {
    showToast('Vui lòng nhập tên cụm rạp!', 'warning');
    document.getElementById('cinema-name')?.focus();
    return;
  }

  const payload = { name, address, city, phone };

  if (editId) {
    // Chỉnh sửa rạp
    if (window.CinemaService) {
      const res = await window.CinemaService.updateCinema(editId, payload);
      if (!res.success) {
        showToast(res.message || 'Cập nhật cụm rạp thất bại', 'danger');
        return;
      }
    }
    const target = cinemasList.find(c => c.id == editId);
    if (target) Object.assign(target, payload);
    showToast(`Đã cập nhật cụm rạp: ${name}`);
  } else {
    // Thêm mới rạp
    if (window.CinemaService) {
      const res = await window.CinemaService.createCinema(payload);
      if (res.success && res.data) {
        cinemasList.push(res.data);
      } else {
        const newId = cinemasList.length > 0 ? Math.max(...cinemasList.map(c => c.id)) + 1 : 1;
        cinemasList.push({ id: newId, ...payload, room_count: 0 });
      }
    } else {
      const newId = cinemasList.length > 0 ? Math.max(...cinemasList.map(c => c.id)) + 1 : 1;
      cinemasList.push({ id: newId, ...payload, room_count: 0 });
    }
    showToast(`Đã thêm cụm rạp: ${name}`);
  }

  closeCinemaModal();
  renderCinemas();
  populateCinemaSelect();
  populateFilterOptions();
};

window.deleteCinema = async function (id) {
  const c = cinemasList.find(x => x.id === id);
  if (!c) return;

  if (typeof window.showConfirmModal !== 'function') return;

  await window.showConfirmModal({
    type: 'danger',
    title: 'Xác nhận xóa cụm rạp',
    message: `Xóa cụm rạp "${c.name}" sẽ xóa tất cả phòng chiếu và dữ liệu ghế của rạp này. Hành động này không thể khôi phục.`,
    cancelText: 'Hủy',
    confirmText: 'Xóa',
    variant: 'danger',
    dangerous: true,
    loadingText: 'Đang xóa...',
    onConfirm: async () => {
      if (window.CinemaService) {
        const res = await window.CinemaService.deleteCinema(id);
        if (!res.success) {
          showToast(res.message || 'Xóa cụm rạp thất bại', 'error');
          return;
        }
      }
      cinemasList = cinemasList.filter(x => x.id !== id);
      roomsList = roomsList.filter(x => x.cinema_id !== id);
      renderCinemas();
      renderRooms();
      populateCinemaSelect();
      populateFilterOptions();
      showToast(`Đã xóa cụm rạp "${c.name}" thành công!`, 'success');
    }
  });
};

// ==========================================================================
// 5. QUẢN LÝ PHÒNG CHIẾU (THÊM / SỬA / XÓA)
// ==========================================================================
window.openRoomModal = function (editObj = null) {
  populateCinemaSelect();
  const modal = document.getElementById('room-modal');
  const title = document.getElementById('modal-room-title');
  const submitBtn = document.getElementById('room-submit-btn');
  const editId = document.getElementById('room-edit-id');

  if (editObj) {
    title.textContent = `Chỉnh sửa Phòng chiếu: ${editObj.name}`;
    submitBtn.textContent = 'Cập nhật phòng chiếu';
    editId.value = editObj.id;
    document.getElementById('room-cinema-select').value = editObj.cinema_id;
    document.getElementById('room-name').value = editObj.name;
    document.getElementById('room-type').value = editObj.room_type || '2D Standard';
    document.getElementById('room-seats').value = editObj.total_seats || 120;
  } else {
    title.textContent = 'Thêm Phòng chiếu mới';
    submitBtn.textContent = 'Lưu phòng chiếu';
    editId.value = '';
    document.getElementById('room-name').value = '';
    document.getElementById('room-type').value = '2D Standard';
    document.getElementById('room-seats').value = 120;
  }

  modal.classList.add('show');
};

window.closeRoomModal = function () {
  document.getElementById('room-modal').classList.remove('show');
};

window.editRoom = function (id) {
  const room = roomsList.find(r => r.id === id);
  if (room) {
    window.openRoomModal(room);
  }
};

window.handleRoomSubmit = async function (e) {
  e.preventDefault();
  const editId = document.getElementById('room-edit-id').value;
  const cinema_id = parseInt(document.getElementById('room-cinema-select').value, 10);
  const cinema = cinemasList.find(c => c.id === cinema_id);
  const name = document.getElementById('room-name').value.trim();
  const room_type = document.getElementById('room-type').value;
  const total_seats = parseInt(document.getElementById('room-seats').value, 10);

  if (!cinema_id || !name) {
    showToast('Vui lòng chọn cụm rạp và nhập tên phòng chiếu!', 'warning');
    document.getElementById('room-name')?.focus();
    return;
  }
  if (isNaN(total_seats) || total_seats <= 0) {
    showToast('Tổng số ghế phòng chiếu phải lớn hơn 0!', 'warning');
    document.getElementById('room-seats')?.focus();
    return;
  }

  const payload = { cinema_id, name, room_type, total_seats };

  if (editId) {
    // Sửa phòng chiếu
    if (window.CinemaService) {
      const res = await window.CinemaService.updateRoom(editId, payload);
      if (!res.success) {
        showToast(res.message || 'Cập nhật phòng chiếu thất bại', 'danger');
        return;
      }
    }
    const target = roomsList.find(r => r.id == editId);
    if (target) {
      Object.assign(target, payload);
      target.cinema_name = cinema ? cinema.name.replace('Cinema Star ', '') : 'Rạp';
    }
    showToast(`Đã cập nhật phòng chiếu: ${name}`);
  } else {
    // Thêm phòng chiếu mới
    if (window.CinemaService) {
      const res = await window.CinemaService.createRoom(payload);
      if (res.success && res.data) {
        roomsList.push({
          ...res.data,
          cinema_name: cinema ? cinema.name.replace('Cinema Star ', '') : 'Rạp'
        });
      } else {
        const newId = roomsList.length > 0 ? Math.max(...roomsList.map(r => r.id)) + 1 : 1;
        roomsList.push({
          id: newId,
          ...payload,
          cinema_name: cinema ? cinema.name.replace('Cinema Star ', '') : 'Rạp',
          is_active: true
        });
      }
    } else {
      const newId = roomsList.length > 0 ? Math.max(...roomsList.map(r => r.id)) + 1 : 1;
      roomsList.push({
        id: newId,
        ...payload,
        cinema_name: cinema ? cinema.name.replace('Cinema Star ', '') : 'Rạp',
        is_active: true
      });
    }
    showToast(`Đã thêm phòng chiếu: ${name}`);
  }

  closeRoomModal();
  updateCinemaRoomCounts();
  renderRooms();
};

window.deleteRoom = async function (id) {
  const room = roomsList.find(x => x.id === id);
  if (typeof window.showConfirmModal !== 'function') return;

  await window.showConfirmModal({
    type: 'danger',
    title: 'Xác nhận xóa phòng chiếu',
    message: `Bạn có chắc chắn muốn xóa phòng chiếu ${room ? `"${room.name}"` : 'này'} kèm toàn bộ sơ đồ ghế không? Hành động này có thể không khôi phục được.`,
    cancelText: 'Hủy',
    confirmText: 'Xóa',
    variant: 'danger',
    dangerous: true,
    loadingText: 'Đang xóa...',
    onConfirm: async () => {
      if (window.CinemaService) {
        const res = await window.CinemaService.deleteRoom(id);
        if (!res.success) {
          showToast(res.message || 'Xóa phòng chiếu thất bại', 'error');
          return;
        }
      }
      roomsList = roomsList.filter(x => x.id !== id);
      updateCinemaRoomCounts();
      renderRooms();
      showToast('Đã xóa phòng chiếu thành công!', 'success');
    }
  });
};

// ==========================================================================
// 6. CẤU HÌNH SƠ ĐỒ GHẾ & LOẠI GHẾ (SEAT MAP CONFIGURATION)
// ==========================================================================
window.openSeatMapModal = async function (roomId) {
  const room = roomsList.find(r => r.id === roomId);
  if (!room) return;

  currentRoom = room;
  modifiedSeats.clear();
  selectedSeatIds.clear();
  currentBrush = 'standard';
  updateBrushButtonUI('standard');

  document.getElementById('seat-modal-title').textContent = `Cấu hình Sơ đồ & Loại ghế - ${room.name}`;
  document.getElementById('seat-modal-subtitle').textContent = `Thuộc cụm rạp: ${room.cinema_name} | Định dạng: ${room.room_type || '2D'}`;

  switchSeatTab('visual');
  document.getElementById('seat-map-modal').classList.add('show');

  // Tải danh sách ghế từ Backend
  const matrixContainer = document.getElementById('seat-matrix-container');
  matrixContainer.innerHTML = '<div style="color: var(--text-muted); padding: 2rem;">Đang tải cấu hình sơ đồ ghế...</div>';

  let loaded = false;
  if (window.SeatService) {
    const res = await window.SeatService.getRoomSeats(roomId);
    if (res.success && res.data && Array.isArray(res.data.seats) && res.data.seats.length > 0) {
      currentSeats = res.data.seats;
      loaded = true;
    }
  }

  // Nếu phòng chưa có ghế, tự sinh mock preview 10x12
  if (!loaded || currentSeats.length === 0) {
    currentSeats = generateMockSeats(10, 12, 3, 1, roomId);
  }

  renderSeatMatrix();
  updateSeatStatsDisplay();
};

window.closeSeatMapModal = async function () {
  if (modifiedSeats.size > 0 && typeof window.showConfirmModal === 'function') {
    const confirmed = await window.showConfirmModal({
      type: 'warning',
      title: 'Thay đổi chưa được lưu',
      message: 'Bạn có các thay đổi loại ghế chưa lưu. Bạn có chắc muốn đóng mà không lưu không?',
      cancelText: 'Tiếp tục sửa',
      confirmText: 'Đóng không lưu',
      variant: 'primary',
      closeOnBackdrop: true
    });
    if (!confirmed) return;
  }
  document.getElementById('seat-map-modal').classList.remove('show');
  currentRoom = null;
  currentSeats = [];
  modifiedSeats.clear();
  selectedSeatIds.clear();
};

window.switchSeatTab = function (tab) {
  const visualTabBtn = document.getElementById('tab-btn-visual');
  const genTabBtn = document.getElementById('tab-btn-generator');
  const visualContent = document.getElementById('tab-content-visual');
  const genContent = document.getElementById('tab-content-generator');

  if (tab === 'visual') {
    visualTabBtn.classList.add('active');
    genTabBtn.classList.remove('active');
    visualContent.style.display = 'block';
    genContent.style.display = 'none';
  } else {
    visualTabBtn.classList.remove('active');
    genTabBtn.classList.add('active');
    visualContent.style.display = 'none';
    genContent.style.display = 'block';
  }
};

window.selectBrush = function (brush) {
  currentBrush = brush;
  updateBrushButtonUI(brush);
};

function updateBrushButtonUI(brush) {
  document.querySelectorAll('.brush-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-brush') === brush);
  });
}

function renderSeatMatrix() {
  const container = document.getElementById('seat-matrix-container');
  if (!container) return;

  if (currentSeats.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding: 3rem 1rem;">
        <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">💺</div>
        <p style="font-size: 14px;">Phòng chiếu này chưa có sơ đồ ghế.</p>
        <button class="btn btn-primary btn-sm" onclick="switchSeatTab('generator')" style="margin-top: 1rem;">
          ⚙️ Sinh sơ đồ ghế tự động ngay
        </button>
      </div>
    `;
    return;
  }

  // Nhóm ghế theo dòng seat_row
  const rowGroups = {};
  currentSeats.forEach(seat => {
    const row = seat.seat_row;
    if (!rowGroups[row]) rowGroups[row] = [];
    rowGroups[row].push(seat);
  });

  const sortedRows = Object.keys(rowGroups).sort();

  let html = '';
  sortedRows.forEach(rowLetter => {
    const seatsInRow = rowGroups[rowLetter].sort((a, b) => a.seat_column - b.seat_column);

    html += `
      <div class="seat-row-wrapper">
        <button type="button" class="seat-row-label-btn" onclick="onRowClick('${rowLetter}')" title="Nhấp để áp dụng cọ cho toàn bộ hàng ${rowLetter}">
          ${rowLetter}
        </button>
        <div class="seat-row-seats">
    `;

    seatsInRow.forEach(seat => {
      const type = (seat.seat_type || 'standard').toLowerCase();
      const isDisabled = seat.is_active === false;
      const isSelected = selectedSeatIds.has(seat.id);

      html += `
        <div 
          class="admin-seat-cell type-${type} ${isDisabled ? 'is-disabled' : ''} ${isSelected ? 'is-selected' : ''}"
          id="seat-cell-${seat.id}"
          onclick="onSeatClick(${seat.id})"
          title="${seat.seat_number} - Loại: ${type.toUpperCase()}${isDisabled ? ' (Đang khóa)' : ''}"
        >
          ${seat.seat_column}
        </div>
      `;
    });

    html += `
        </div>
        <button type="button" class="seat-row-label-btn" onclick="onRowClick('${rowLetter}')" title="Hàng ${rowLetter}">
          ${rowLetter}
        </button>
      </div>
    `;
  });

  container.innerHTML = html;
}

window.onSeatClick = function (seatId) {
  const seat = currentSeats.find(s => s.id === seatId);
  if (!seat) return;

  if (currentBrush === 'disabled') {
    // Đổi trạng thái khóa/mở ghế
    seat.is_active = seat.is_active === false ? true : false;
    modifiedSeats.set(seatId, { seat_type: seat.seat_type, is_active: seat.is_active });
  } else {
    // Đổi loại ghế theo chổi cọ đã chọn
    seat.seat_type = currentBrush;
    seat.is_active = true;
    modifiedSeats.set(seatId, { seat_type: currentBrush, is_active: true });
  }

  // Cập nhật DOM trực tiếp để mượt mà
  const el = document.getElementById(`seat-cell-${seatId}`);
  if (el) {
    el.className = `admin-seat-cell type-${(seat.seat_type || 'standard').toLowerCase()} ${seat.is_active === false ? 'is-disabled' : ''} ${selectedSeatIds.has(seatId) ? 'is-selected' : ''}`;
    el.title = `${seat.seat_number} - Loại: ${(seat.seat_type || 'standard').toUpperCase()}${seat.is_active === false ? ' (Đang khóa)' : ''}`;
  }

  updateSeatStatsDisplay();
};

window.onRowClick = function (rowLetter) {
  const seatsInRow = currentSeats.filter(s => s.seat_row === rowLetter);
  seatsInRow.forEach(s => {
    if (currentBrush === 'disabled') {
      s.is_active = false;
      modifiedSeats.set(s.id, { seat_type: s.seat_type, is_active: false });
    } else {
      s.seat_type = currentBrush;
      s.is_active = true;
      modifiedSeats.set(s.id, { seat_type: currentBrush, is_active: true });
    }
  });

  renderSeatMatrix();
  updateSeatStatsDisplay();
  showToast(`Đã áp dụng loại "${currentBrush.toUpperCase()}" cho toàn bộ hàng ${rowLetter}`);
};

window.selectAllSeats = function () {
  currentSeats.forEach(s => selectedSeatIds.add(s.id));
  renderSeatMatrix();
};

window.deselectAllSeats = function () {
  selectedSeatIds.clear();
  renderSeatMatrix();
};

window.applyBrushToSelected = function () {
  if (selectedSeatIds.size === 0) {
    showToast('Vui lòng chọn ít nhất 1 ghế hoặc nhấp vào hàng ghế để áp dụng', 'danger');
    return;
  }

  selectedSeatIds.forEach(id => {
    const s = currentSeats.find(x => x.id === id);
    if (s) {
      if (currentBrush === 'disabled') {
        s.is_active = false;
        modifiedSeats.set(id, { seat_type: s.seat_type, is_active: false });
      } else {
        s.seat_type = currentBrush;
        s.is_active = true;
        modifiedSeats.set(id, { seat_type: currentBrush, is_active: true });
      }
    }
  });

  const count = selectedSeatIds.size;
  selectedSeatIds.clear();
  renderSeatMatrix();
  updateSeatStatsDisplay();
  showToast(`Đã đổi loại ${count} ghế thành "${currentBrush.toUpperCase()}"`);
};

function updateSeatStatsDisplay() {
  const total = currentSeats.length;
  const std = currentSeats.filter(s => (s.seat_type || 'standard').toLowerCase() === 'standard' && s.is_active !== false).length;
  const vip = currentSeats.filter(s => (s.seat_type || '').toLowerCase() === 'vip' && s.is_active !== false).length;
  const cpl = currentSeats.filter(s => (s.seat_type || '').toLowerCase() === 'couple' && s.is_active !== false).length;
  const disabled = currentSeats.filter(s => s.is_active === false).length;

  document.getElementById('stat-total-seats').textContent = total;
  document.getElementById('stat-std-seats').textContent = std;
  document.getElementById('stat-vip-seats').textContent = vip;
  document.getElementById('stat-cpl-seats').textContent = cpl;
  document.getElementById('stat-disabled-seats').textContent = disabled;
}

// Lưu thay đổi cấu hình loại ghế xuống Backend
window.handleSaveSeatChanges = async function () {
  if (!currentRoom) return;

  const btn = document.getElementById('btn-save-seats');
  btn.disabled = true;
  btn.textContent = '⏳ Đang lưu...';

  try {
    if (window.SeatService && modifiedSeats.size > 0) {
      // Phân nhóm theo seat_type và is_active để gọi batch update hiệu quả
      const groups = {};
      modifiedSeats.forEach((val, seatId) => {
        const key = `${val.seat_type}_${val.is_active}`;
        if (!groups[key]) groups[key] = { seat_type: val.seat_type, is_active: val.is_active, seat_ids: [] };
        groups[key].seat_ids.push(seatId);
      });

      for (const key of Object.keys(groups)) {
        const g = groups[key];
        await window.SeatService.batchUpdateSeats(currentRoom.id, {
          seat_ids: g.seat_ids,
          seat_type: g.seat_type,
          is_active: g.is_active
        });
      }
    }

    modifiedSeats.clear();
    showToast(`Đã lưu cấu hình loại ghế thành công cho ${currentRoom.name}!`);

    // Đồng bộ số ghế phòng
    currentRoom.total_seats = currentSeats.length;
    renderRooms();
  } catch (err) {
    showToast('Lỗi khi lưu cấu hình ghế: ' + err.message, 'danger');
  } finally {
    btn.disabled = false;
    btn.textContent = '💾 Lưu cấu hình loại ghế';
  }
};

// Sinh sơ đồ ghế tự động
window.handleGenerateSeatMap = async function (e) {
  e.preventDefault();
  if (!currentRoom) return;

  const rows = parseInt(document.getElementById('gen-rows').value, 10);
  const columns = parseInt(document.getElementById('gen-cols').value, 10);
  const vip_rows = parseInt(document.getElementById('gen-vip-rows').value, 10) || 0;
  const couple_rows = parseInt(document.getElementById('gen-couple-rows').value, 10) || 0;
  const overwrite = document.getElementById('gen-overwrite').checked;

  const btn = document.getElementById('btn-submit-generate');
  btn.disabled = true;
  btn.textContent = '⏳ Đang sinh sơ đồ...';

  try {
    const layout = { rows, columns, vip_rows, couple_rows, overwrite };
    let success = false;

    if (window.SeatService) {
      const res = await window.SeatService.generateSeatMap(currentRoom.id, layout);
      if (res.success && res.data && Array.isArray(res.data.seats)) {
        currentSeats = res.data.seats;
        success = true;
      } else if (res.status === 409) {
        showToast(res.message || 'Phòng đã có sơ đồ ghế. Hãy tích "Ghi đè" để tạo mới!', 'danger');
        return;
      } else {
        showToast(res.message || 'Lỗi khi sinh sơ đồ ghế', 'danger');
      }
    }

    if (!success) {
      // Mock generate fallback
      currentSeats = generateMockSeats(rows, columns, vip_rows, couple_rows, currentRoom.id);
    }

    modifiedSeats.clear();
    selectedSeatIds.clear();
    currentRoom.total_seats = currentSeats.length;

    switchSeatTab('visual');
    renderSeatMatrix();
    updateSeatStatsDisplay();
    renderRooms();
    showToast(`Đã tạo sơ đồ ma trận ${currentSeats.length} ghế thành công!`);
  } catch (err) {
    showToast('Lỗi khi sinh sơ đồ: ' + err.message, 'danger');
  } finally {
    btn.disabled = false;
    btn.textContent = '⚡ Sinh sơ đồ ghế ngay';
  }
};

// Xóa toàn bộ sơ đồ ghế
window.handleClearRoomSeats = async function () {
  if (!currentRoom || typeof window.showConfirmModal !== 'function') return;

  await window.showConfirmModal({
    type: 'danger',
    title: 'Xác nhận xóa sơ đồ ghế',
    message: `Bạn có chắc chắn muốn xóa toàn bộ ${currentSeats.length} ghế của "${currentRoom.name}" không? Thao tác này không thể hoàn tác.`,
    cancelText: 'Hủy',
    confirmText: 'Xóa toàn bộ',
    variant: 'danger',
    dangerous: true,
    loadingText: 'Đang xóa ghế...',
    onConfirm: async () => {
      if (window.SeatService) {
        const res = await window.SeatService.clearRoomSeats(currentRoom.id);
        if (!res.success) {
          showToast(res.message || 'Không thể xóa sơ đồ ghế', 'error');
          return;
        }
      }

      currentSeats = [];
      modifiedSeats.clear();
      selectedSeatIds.clear();
      currentRoom.total_seats = 0;

      renderSeatMatrix();
      updateSeatStatsDisplay();
      renderRooms();
      showToast('Đã xóa trắng sơ đồ ghế phòng chiếu!', 'success');
    }
  });
};

// Hàm tiện ích tạo mock seats khi offline
function generateMockSeats(rows, cols, vipRows, coupleRows, roomId) {
  const seats = [];
  const coupleStart = rows - coupleRows;
  const vipStart = coupleStart - vipRows;

  let idCounter = 1;
  for (let r = 0; r < rows; r++) {
    const rowLetter = String.fromCharCode(65 + r);
    let type = 'standard';
    if (r >= coupleStart) type = 'couple';
    else if (r >= vipStart) type = 'vip';

    for (let c = 1; c <= cols; c++) {
      seats.push({
        id: (roomId * 1000) + idCounter++,
        room_id: roomId,
        seat_number: `${rowLetter}${c.toString().padStart(2, '0')}`,
        seat_row: rowLetter,
        seat_column: c,
        seat_type: type,
        is_active: true
      });
    }
  }
  return seats;
}

// Toast helper: sử dụng hệ thống Toast toàn cục (js/utils/toast.js)
function showToast(message, type = 'success') {
  if (typeof window.showToast === 'function') {
    window.showToast(message, type);
  }
}
