/**
 * ==========================================================================
 * ADMIN CINEMAS & ROOMS CONTROLLER
 * ==========================================================================
 */

let cinemasList = [
  {
    id: 1,
    name: "Cinema Star Vincom Bà Triệu",
    address: "191 Bà Triệu, Phường Lê Đại Hành, Quận Hai Bà Trưng",
    city: "Hà Nội",
    phone: "024.3974.8888",
    room_count: 5
  },
  {
    id: 2,
    name: "Cinema Star Landmark 81",
    address: "720A Điện Biên Phủ, Phường 22, Quận Bình Thạnh",
    city: "TP. Hồ Chí Minh",
    phone: "028.3636.9999",
    room_count: 6
  },
  {
    id: 3,
    name: "Cinema Star Đà Nẵng Center",
    address: "244 Phan Châu Trinh, Quận Hải Châu",
    city: "Đà Nẵng",
    phone: "0236.3888.666",
    room_count: 4
  }
];

let roomsList = [
  { id: 1, cinema_id: 1, cinema_name: "Vincom Bà Triệu", name: "Phòng IMAX 01", room_type: "IMAX Laser", total_seats: 180, is_active: true },
  { id: 2, cinema_id: 1, cinema_name: "Vincom Bà Triệu", name: "Phòng chiếu 02", room_type: "2D Standard", total_seats: 120, is_active: true },
  { id: 3, cinema_id: 1, cinema_name: "Vincom Bà Triệu", name: "Phòng VIP Gold", room_type: "VIP Gold Class", total_seats: 48, is_active: true },
  { id: 4, cinema_id: 2, cinema_name: "Landmark 81", name: "Phòng IMAX Luxe", room_type: "IMAX Laser", total_seats: 220, is_active: true },
  { id: 5, cinema_id: 2, cinema_name: "Landmark 81", name: "Phòng chiếu 02", room_type: "3D Digital", total_seats: 140, is_active: true },
  { id: 6, cinema_id: 3, cinema_name: "Đà Nẵng Center", name: "Phòng chiếu 01", room_type: "2D Standard", total_seats: 110, is_active: true }
];

document.addEventListener('DOMContentLoaded', function () {
  renderCinemas();
  renderRooms();
  populateCinemaSelect();
});

function renderCinemas() {
  const tbody = document.getElementById('cinemas-table-tbody');
  if (!tbody) return;

  const countBadge = document.getElementById('cinema-count-badge');
  if (countBadge) countBadge.textContent = cinemasList.length + ' cụm rạp';

  tbody.innerHTML = cinemasList.map(c => `
    <tr>
      <td><strong style="color: #fff; font-size: 15px;">${c.name}</strong></td>
      <td>${c.address}</td>
      <td><span class="badge badge-info">${c.city}</span></td>
      <td>${c.phone}</td>
      <td><strong>${c.room_count}</strong> phòng</td>
      <td style="text-align: right;">
        <button class="btn btn-danger btn-sm" onclick="deleteCinema(${c.id})">🗑 Xóa</button>
      </td>
    </tr>
  `).join('');
}

function renderRooms() {
  const tbody = document.getElementById('rooms-table-tbody');
  if (!tbody) return;

  tbody.innerHTML = roomsList.map(r => `
    <tr>
      <td><strong>${r.name}</strong></td>
      <td>${r.cinema_name}</td>
      <td><span class="badge ${r.room_type.includes('IMAX') ? 'badge-admin' : 'badge-info'}">${r.room_type}</span></td>
      <td><strong>${r.total_seats}</strong> ghế</td>
      <td><span class="badge badge-success">Sẵn sàng chiếu</span></td>
      <td style="text-align: right;">
        <button class="btn btn-danger btn-sm" onclick="deleteRoom(${r.id})">🗑 Xóa</button>
      </td>
    </tr>
  `).join('');
}

function populateCinemaSelect() {
  const select = document.getElementById('room-cinema-select');
  if (!select) return;
  select.innerHTML = cinemasList.map(c => `<option value="${c.id}">${c.name} (${c.city})</option>`).join('');
}

window.openCinemaModal = function () {
  document.getElementById('cinema-modal').classList.add('show');
};

window.closeCinemaModal = function () {
  document.getElementById('cinema-modal').classList.remove('show');
};

window.openRoomModal = function () {
  populateCinemaSelect();
  document.getElementById('room-modal').classList.add('show');
};

window.closeRoomModal = function () {
  document.getElementById('room-modal').classList.remove('show');
};

window.handleCinemaSubmit = function (e) {
  e.preventDefault();
  const name = document.getElementById('cinema-name').value.trim();
  const address = document.getElementById('cinema-address').value.trim();
  const city = document.getElementById('cinema-city').value.trim();
  const phone = document.getElementById('cinema-phone').value.trim();

  const newId = cinemasList.length > 0 ? Math.max(...cinemasList.map(c => c.id)) + 1 : 1;
  cinemasList.push({ id: newId, name, address, city, phone, room_count: 0 });
  closeCinemaModal();
  renderCinemas();
  populateCinemaSelect();
  window.showToast('Đã thêm cụm rạp: ' + name);
};

window.handleRoomSubmit = function (e) {
  e.preventDefault();
  const cinema_id = parseInt(document.getElementById('room-cinema-select').value, 10);
  const cinema = cinemasList.find(c => c.id === cinema_id);
  const name = document.getElementById('room-name').value.trim();
  const room_type = document.getElementById('room-type').value;
  const total_seats = parseInt(document.getElementById('room-seats').value, 10);

  const newId = roomsList.length > 0 ? Math.max(...roomsList.map(r => r.id)) + 1 : 1;
  roomsList.push({
    id: newId,
    cinema_id,
    cinema_name: cinema ? cinema.name.replace('Cinema Star ', '') : 'Rạp',
    name,
    room_type,
    total_seats,
    is_active: true
  });

  if (cinema) cinema.room_count += 1;

  closeRoomModal();
  renderRooms();
  renderCinemas();
  window.showToast('Đã thêm phòng chiếu: ' + name);
};

window.deleteCinema = function (id) {
  const c = cinemasList.find(x => x.id === id);
  if (c && confirm(`Xóa cụm rạp "${c.name}" sẽ xóa tất cả phòng chiếu thuộc rạp này. Tiếp tục?`)) {
    cinemasList = cinemasList.filter(x => x.id !== id);
    roomsList = roomsList.filter(x => x.cinema_id !== id);
    renderCinemas();
    renderRooms();
    populateCinemaSelect();
    window.showToast('Đã xóa cụm rạp!', 'danger');
  }
};

window.deleteRoom = function (id) {
  if (confirm('Bạn có chắc chắn muốn xóa phòng chiếu này?')) {
    roomsList = roomsList.filter(x => x.id !== id);
    renderRooms();
    window.showToast('Đã xóa phòng chiếu!', 'danger');
  }
};
