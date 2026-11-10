/**
 * ==========================================================================
 * ADMIN SHOWTIMES MANAGEMENT CONTROLLER
 * ==========================================================================
 */

let showtimesList = [
  {
    id: 1,
    movie_title: "Mai (18+)",
    cinema_name: "Vincom Bà Triệu",
    room_name: "Phòng IMAX 01",
    start_time: "2026-11-09 19:30",
    end_time: "2026-11-09 21:41",
    price: 110000,
    status: "ongoing"
  },
  {
    id: 2,
    movie_title: "Lật Mặt 7: Một Điều Ước",
    cinema_name: "Vincom Bà Triệu",
    room_name: "Phòng chiếu 02",
    start_time: "2026-11-09 20:00",
    end_time: "2026-11-09 22:18",
    price: 90000,
    status: "upcoming"
  },
  {
    id: 3,
    movie_title: "Dune: Hành Tinh Cát 2",
    cinema_name: "Landmark 81",
    room_name: "Phòng IMAX Luxe",
    start_time: "2026-11-09 21:15",
    end_time: "2026-11-10 00:01",
    price: 135000,
    status: "upcoming"
  },
  {
    id: 4,
    movie_title: "Kung Fu Panda 4",
    cinema_name: "Đà Nẵng Center",
    room_name: "Phòng chiếu 01",
    start_time: "2026-11-09 18:00",
    end_time: "2026-11-09 19:34",
    price: 85000,
    status: "finished"
  }
];

document.addEventListener('DOMContentLoaded', function () {
  const dateFilter = document.getElementById('showtime-date-filter');
  if (dateFilter) dateFilter.value = '2026-11-09';

  renderShowtimes(showtimesList);
  initShowtimeFilters();
});

function renderShowtimes(list) {
  const tbody = document.getElementById('showtimes-table-tbody');
  if (!tbody) return;

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          <div class="empty-state-icon">🕒</div>
          <p>Không có suất chiếu nào phù hợp với điều kiện lọc.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(s => {
    let statusBadge = '<span class="badge badge-info">Sắp chiếu</span>';
    if (s.status === 'ongoing') {
      statusBadge = '<span class="badge badge-success">Đang chiếu</span>';
    } else if (s.status === 'finished') {
      statusBadge = '<span class="badge badge-danger">Đã kết thúc</span>';
    }

    return `
      <tr>
        <td>
          <strong style="color: #fff;">${s.start_time.split(' ')[1]}</strong>
          <div style="font-size: 11px; color: var(--text-muted);">${s.start_time.split(' ')[0]}</div>
        </td>
        <td><strong style="font-size: 15px;">${s.movie_title}</strong></td>
        <td>${s.cinema_name}</td>
        <td><span class="badge badge-info">${s.room_name}</span></td>
        <td><strong style="color: var(--color-success);">${Number(s.price).toLocaleString('vi-VN')} đ</strong></td>
        <td>${statusBadge}</td>
        <td style="text-align: right;">
          <button class="btn btn-danger btn-sm" onclick="deleteShowtime(${s.id})">🗑 Xóa</button>
        </td>
      </tr>
    `;
  }).join('');
}

function initShowtimeFilters() {
  const dateFilter = document.getElementById('showtime-date-filter');
  const movieFilter = document.getElementById('showtime-movie-filter');

  function applyFilter() {
    const selectedDate = dateFilter.value;
    const selectedMovie = movieFilter.value;

    const filtered = showtimesList.filter(s => {
      const matchDate = !selectedDate || s.start_time.includes(selectedDate);
      const matchMovie = selectedMovie === 'all' || s.movie_title.toLowerCase().includes(selectedMovie.toLowerCase());
      return matchDate && matchMovie;
    });

    renderShowtimes(filtered);
  }

  if (dateFilter) dateFilter.addEventListener('change', applyFilter);
  if (movieFilter) movieFilter.addEventListener('change', applyFilter);
}

window.openShowtimeModal = function () {
  document.getElementById('showtime-modal').classList.add('show');
};

window.closeShowtimeModal = function () {
  document.getElementById('showtime-modal').classList.remove('show');
};

window.handleShowtimeSubmit = function (e) {
  e.preventDefault();
  const movie_title = document.getElementById('showtime-movie-select').value;
  const cinema_name = document.getElementById('showtime-cinema-select').value;
  const room_name = document.getElementById('showtime-room-select').value;
  const start_time = document.getElementById('showtime-start-time').value.replace('T', ' ');
  const end_time = document.getElementById('showtime-end-time').value.replace('T', ' ');
  const price = parseInt(document.getElementById('showtime-price').value, 10);

  const newId = showtimesList.length > 0 ? Math.max(...showtimesList.map(s => s.id)) + 1 : 1;
  showtimesList.unshift({
    id: newId,
    movie_title,
    cinema_name,
    room_name,
    start_time,
    end_time,
    price,
    status: "upcoming"
  });

  closeShowtimeModal();
  renderShowtimes(showtimesList);
  window.showToast('Đã thêm suất chiếu mới thành công!');
};

window.deleteShowtime = function (id) {
  if (confirm('Bạn có chắc chắn muốn hủy / xóa suất chiếu này?')) {
    showtimesList = showtimesList.filter(x => x.id !== id);
    renderShowtimes(showtimesList);
    window.showToast('Đã xóa suất chiếu!', 'danger');
  }
};
