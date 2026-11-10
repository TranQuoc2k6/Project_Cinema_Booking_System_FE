/**
 * ==========================================================================
 * ADMIN MOVIES MANAGEMENT CONTROLLER
 * Xử lý thêm, sửa, đổi trạng thái, ngừng chiếu, tìm kiếm phim và live preview
 * ==========================================================================
 */

let moviesList = [
  {
    id: 1,
    title: "Mai (18+)",
    duration: 131,
    release_date: "2026-02-10",
    genres: ["Tâm lý", "Tình cảm"],
    status: "now_showing",
    poster_url: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&auto=format&fit=crop&q=80",
    description: "Câu chuyện về số phận và tình yêu của một phụ nữ làm nghề massage trị liệu tên Mai."
  },
  {
    id: 2,
    title: "Lật Mặt 7: Một Điều Ước",
    duration: 138,
    release_date: "2026-04-26",
    genres: ["Gia đình", "Hài", "Chính kịch"],
    status: "now_showing",
    poster_url: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&auto=format&fit=crop&q=80",
    description: "Tác phẩm cảm động về tình mẫu tử của người mẹ già ở vùng cao Tây Bắc và những người con."
  },
  {
    id: 3,
    title: "Dune: Hành Tinh Cát - Phần Hai",
    duration: 166,
    release_date: "2026-03-01",
    genres: ["Khoa học viễn tưởng", "Hành động"],
    status: "now_showing",
    poster_url: "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=400&auto=format&fit=crop&q=80",
    description: "Hành trình báo thù và định đoạt vận mệnh vũ trụ của Paul Atreides giữa sa mạc Arrakis."
  },
  {
    id: 4,
    title: "Kung Fu Panda 4",
    duration: 94,
    release_date: "2026-03-08",
    genres: ["Hoạt hình", "Võ thuật", "Hài"],
    status: "coming_soon",
    poster_url: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=400&auto=format&fit=crop&q=80",
    description: "Gấu Po lên đường tìm kiếm truyền nhân Thần Long Đại Hiệp mới và đối đầu với Tắc Kè Bông."
  },
  {
    id: 5,
    title: "Đất Rừng Phương Nam",
    duration: 110,
    release_date: "2025-10-20",
    genres: ["Phiêu lưu", "Lịch sử"],
    status: "ended",
    poster_url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=80",
    description: "Hành trình tìm cha của bé An giữa bối cảnh lục tỉnh Nam Kỳ đầu thế kỷ 20."
  }
];

document.addEventListener('DOMContentLoaded', function () {
  loadMoviesFromApi();
  initMovieFilterEvents();
});

// Tải danh sách phim từ Backend (nếu có API) hoặc dùng mock data
async function loadMoviesFromApi() {
  try {
    const res = await fetch('http://127.0.0.1:8000/api/movies');
    if (res.ok) {
      const apiMovies = await res.json();
      if (Array.isArray(apiMovies) && apiMovies.length > 0) {
        // Hợp nhất dữ liệu API với thông tin hiển thị
        apiMovies.forEach(m => {
          const existing = moviesList.find(x => x.id === m.id);
          if (existing) {
            Object.assign(existing, m);
          } else {
            moviesList.push({
              id: m.id,
              title: m.title,
              duration: m.duration || 120,
              release_date: m.release_date || '2026-05-01',
              genres: m.genres || ['Điện ảnh'],
              status: m.status || 'now_showing',
              poster_url: m.poster_url || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&auto=format&fit=crop&q=80',
              description: m.description || ''
            });
          }
        });
      }
    }
  } catch (e) {
    console.log('[Movies] Đang sử dụng danh sách phim mẫu.');
  }

  renderMoviesTable(moviesList);
}

// Render bảng danh sách phim
function renderMoviesTable(list) {
  const tbody = document.getElementById('movies-table-tbody');
  if (!tbody) return;

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          <div class="empty-state-icon">🎬</div>
          <p>Không tìm thấy bộ phim nào phù hợp với bộ lọc.</p>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(movie => {
    let statusBadge = '<span class="badge badge-success">Đang chiếu</span>';
    if (movie.status === 'coming_soon') {
      statusBadge = '<span class="badge badge-warning">Sắp chiếu</span>';
    } else if (movie.status === 'ended') {
      statusBadge = '<span class="badge badge-danger">Đã kết thúc</span>';
    }

    const genresStr = Array.isArray(movie.genres) ? movie.genres.join(', ') : (movie.genres || 'Chưa phân loại');

    return `
      <tr>
        <td>
          <img src="${movie.poster_url}" alt="${movie.title}" style="width: 46px; height: 64px; object-fit: cover; border-radius: 4px; box-shadow: 0 2px 6px rgba(0,0,0,0.5);">
        </td>
        <td>
          <div style="font-weight: 700; color: #fff; font-size: 15px;">${movie.title}</div>
          <div style="font-size: 12px; color: var(--text-muted);">${(movie.description || '').substring(0, 50)}...</div>
        </td>
        <td><span class="badge badge-info">${genresStr}</span></td>
        <td><strong>${movie.duration}</strong> phút</td>
        <td>${movie.release_date}</td>
        <td>${statusBadge}</td>
        <td style="text-align: right;">
          <div class="table-actions" style="justify-content: flex-end;">
            <button class="btn btn-secondary btn-sm" onclick="editMovie(${movie.id})" title="Chỉnh sửa">
              ✏️ Sửa
            </button>
            ${movie.status !== 'ended' ? `
              <button class="btn btn-outline-danger btn-sm" onclick="endMovieShowing(${movie.id})" title="Ngừng chiếu phim">
                ⏹ Ngừng chiếu
              </button>
            ` : `
              <button class="btn btn-outline-primary btn-sm" onclick="restartMovieShowing(${movie.id})" title="Chiếu lại">
                ▶ Chiếu lại
              </button>
            `}
            <button class="btn btn-danger btn-sm" onclick="deleteMovie(${movie.id})" title="Xóa phim">
              🗑
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Bộ lọc & Tìm kiếm phim
function initMovieFilterEvents() {
  const searchInput = document.getElementById('movie-search-input');
  const statusFilter = document.getElementById('movie-status-filter');

  function applyFilter() {
    const keyword = searchInput.value.toLowerCase().trim();
    const status = statusFilter.value;

    const filtered = moviesList.filter(m => {
      const matchKey = m.title.toLowerCase().includes(keyword) || (m.description && m.description.toLowerCase().includes(keyword));
      const matchStatus = status === 'all' || m.status === status;
      return matchKey && matchStatus;
    });

    renderMoviesTable(filtered);
  }

  if (searchInput) searchInput.addEventListener('input', applyFilter);
  if (statusFilter) statusFilter.addEventListener('change', applyFilter);
}

// Modal Thêm / Sửa phim
window.openMovieModal = function (editMovieObj = null) {
  const modal = document.getElementById('movie-modal');
  const titleEl = document.getElementById('modal-movie-title');
  const editId = document.getElementById('movie-edit-id');
  const form = document.getElementById('movie-form');

  form.reset();
  updatePosterPreview('');

  if (editMovieObj) {
    titleEl.textContent = 'Chỉnh sửa thông tin phim: ' + editMovieObj.title;
    editId.value = editMovieObj.id;
    document.getElementById('movie-title').value = editMovieObj.title;
    document.getElementById('movie-duration').value = editMovieObj.duration;
    document.getElementById('movie-release-date').value = editMovieObj.release_date;
    document.getElementById('movie-genres-input').value = Array.isArray(editMovieObj.genres) ? editMovieObj.genres.join(', ') : editMovieObj.genres;
    document.getElementById('movie-status').value = editMovieObj.status;
    document.getElementById('movie-poster-url').value = editMovieObj.poster_url;
    document.getElementById('movie-description').value = editMovieObj.description || '';
    updatePosterPreview(editMovieObj.poster_url);
  } else {
    titleEl.textContent = 'Thêm phim mới vào hệ thống';
    editId.value = '';
    document.getElementById('movie-release-date').value = new Date().toISOString().split('T')[0];
  }

  modal.classList.add('show');
};

window.closeMovieModal = function () {
  document.getElementById('movie-modal').classList.remove('show');
};

// Live Image Preview (SRS Task 4)
window.updatePosterPreview = function (url) {
  const img = document.getElementById('poster-preview-img');
  const placeholder = document.getElementById('poster-preview-placeholder');

  if (url && url.trim().length > 5) {
    img.src = url;
    img.style.display = 'block';
    placeholder.style.display = 'none';
    img.onerror = function () {
      img.style.display = 'none';
      placeholder.style.display = 'flex';
      placeholder.innerHTML = '<span>⚠️ Không thể nạp ảnh từ đường dẫn này</span>';
    };
  } else {
    img.style.display = 'none';
    placeholder.style.display = 'flex';
    placeholder.innerHTML = '<span>🖼️</span><span>Xem trước hình ảnh Poster (Live Image Preview)</span>';
  }
};

// Xử lý lưu form phim
window.handleMovieSubmit = function (e) {
  e.preventDefault();
  const editId = document.getElementById('movie-edit-id').value;
  const title = document.getElementById('movie-title').value.trim();
  const duration = parseInt(document.getElementById('movie-duration').value, 10);
  const release_date = document.getElementById('movie-release-date').value;
  const genresStr = document.getElementById('movie-genres-input').value;
  const status = document.getElementById('movie-status').value;
  const poster_url = document.getElementById('movie-poster-url').value.trim() || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&auto=format&fit=crop&q=80';
  const description = document.getElementById('movie-description').value.trim();

  // Validation ràng buộc nghiêm ngặt (SRS 1.2)
  if (duration <= 0) {
    alert('Thời lượng phim bắt buộc phải lớn hơn 0 phút!');
    return;
  }
  if (!release_date) {
    alert('Vui lòng chọn ngày khởi chiếu đúng định dạng YYYY-MM-DD!');
    return;
  }

  const genres = genresStr.split(',').map(g => g.trim()).filter(Boolean);

  if (editId) {
    // Chỉnh sửa phim
    const target = moviesList.find(m => m.id === parseInt(editId, 10));
    if (target) {
      Object.assign(target, { title, duration, release_date, genres, status, poster_url, description });
      window.showToast('Cập nhật thông tin phim "' + title + '" thành công!');
    }
  } else {
    // Thêm mới
    const newId = moviesList.length > 0 ? Math.max(...moviesList.map(m => m.id)) + 1 : 1;
    moviesList.unshift({
      id: newId,
      title,
      duration,
      release_date,
      genres,
      status,
      poster_url,
      description
    });
    window.showToast('Đã thêm thành công phim mới: ' + title);
  }

  closeMovieModal();
  renderMoviesTable(moviesList);
};

// Chỉnh sửa phim
window.editMovie = function (id) {
  const m = moviesList.find(x => x.id === id);
  if (m) openMovieModal(m);
};

// Ngừng chiếu phim (chuyển sang 'ended') (SRS 1.2)
window.endMovieShowing = function (id) {
  const m = moviesList.find(x => x.id === id);
  if (m && confirm(`Bạn có chắc chắn muốn ngừng chiếu bộ phim "${m.title}" không?`)) {
    m.status = 'ended';
    renderMoviesTable(moviesList);
    window.showToast(`Đã chuyển trạng thái phim "${m.title}" sang Đã kết thúc (Ended).`, 'danger');
  }
};

window.restartMovieShowing = function (id) {
  const m = moviesList.find(x => x.id === id);
  if (m) {
    m.status = 'now_showing';
    renderMoviesTable(moviesList);
    window.showToast(`Đã đưa phim "${m.title}" trở lại danh sách Đang chiếu!`);
  }
};

// Xóa phim
window.deleteMovie = function (id) {
  const m = moviesList.find(x => x.id === id);
  if (m && confirm(`CẢNH BÁO: Bạn có chắc chắn muốn xoá vĩnh viễn phim "${m.title}"?`)) {
    moviesList = moviesList.filter(x => x.id !== id);
    renderMoviesTable(moviesList);
    window.showToast(`Đã xoá bộ phim thành công!`, 'danger');
  }
};
