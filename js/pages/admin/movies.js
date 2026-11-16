/**
 * ==========================================================================
 * ADMIN MOVIES MANAGEMENT CONTROLLER
 * Xử lý thêm, sửa, đổi trạng thái, ngừng chiếu, tìm kiếm phim và lưu vào Database
 * ==========================================================================
 */

let moviesList = [];

document.addEventListener('DOMContentLoaded', function () {
  loadMoviesFromApi();
  initMovieFilterEvents();
});

// Mapping thể loại dạng chữ sang ID trong cơ sở dữ liệu
function mapGenreTextToIds(genresStr) {
  if (!genresStr) return [];
  const lower = genresStr.toLowerCase();
  const map = [
    { id: 1, keys: ['hành động', 'action', 'hanh dong'] },
    { id: 2, keys: ['hài', 'comedy', 'hai'] },
    { id: 3, keys: ['tình cảm', 'lãng mạn', 'romance', 'tinh cam'] },
    { id: 4, keys: ['tâm lý', 'gia đình', 'chính kịch', 'drama', 'tam ly', 'gia dinh'] },
    { id: 5, keys: ['kinh dị', 'horror', 'kinh di'] },
    { id: 6, keys: ['khoa học', 'viễn tưởng', 'sci-fi', 'khoa hoc vien tuong'] },
    { id: 7, keys: ['hoạt hình', 'anime', 'animation', 'hoat hinh'] }
  ];
  const matched = [];
  map.forEach(item => {
    if (item.keys.some(k => lower.includes(k))) {
      matched.push(item.id);
    }
  });
  return matched;
}

// Tải danh sách phim từ Backend API (kết nối trực tiếp Database)
async function loadMoviesFromApi() {
  const tbody = document.getElementById('movies-table-tbody');
  if (tbody && moviesList.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-6 text-slate-400">
          <i class="fa-solid fa-spinner fa-spin mr-2"></i> Đang tải dữ liệu phim từ Database...
        </td>
      </tr>
    `;
  }

  try {
    if (window.MovieService && typeof window.MovieService.adminGetMovies === 'function') {
      const res = await window.MovieService.adminGetMovies({ limit: 100 });
      if (res.success && res.data && Array.isArray(res.data.items)) {
        moviesList = res.data.items.map(m => {
          let genresArr = [];
          let genreIds = [];
          if (Array.isArray(m.genres)) {
            m.genres.forEach(g => {
              if (typeof g === 'object' && g !== null) {
                genresArr.push(g.name);
                if (g.id) genreIds.push(g.id);
              } else if (typeof g === 'string') {
                genresArr.push(g);
              }
            });
          }
          return {
            id: m.id,
            title: m.title,
            duration: m.duration_minutes || m.duration || 120,
            release_date: m.release_date || '',
            genres: genresArr.length > 0 ? genresArr : ['Điện ảnh'],
            genre_ids: genreIds,
            status: (m.status || 'now_showing').toLowerCase(),
            poster_url: m.poster_url || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&auto=format&fit=crop&q=80',
            description: m.description || ''
          };
        });
      } else {
        console.warn('[Movies Admin] Không tải được từ adminGetMovies, thử fallback getMovies.');
        await fallbackPublicMovies();
      }
    } else {
      await fallbackPublicMovies();
    }
  } catch (e) {
    console.error('[Movies Admin] Lỗi tải phim:', e);
    await fallbackPublicMovies();
  }

  renderMoviesTable(moviesList);
}

// Fallback tải qua public API hoặc Mock Data nếu chưa đăng nhập token admin
async function fallbackPublicMovies() {
  try {
    const res = await fetch('http://127.0.0.1:8000/api/movies?limit=50');
    if (res.ok) {
      const data = await res.json();
      const items = Array.isArray(data) ? data : (data.items || []);
      if (items.length > 0) {
        moviesList = items.map(m => ({
          id: m.id,
          title: m.title,
          duration: m.duration_minutes || m.duration || 120,
          release_date: m.release_date || '',
          genres: ['Điện ảnh'],
          genre_ids: [],
          status: (m.status || 'now_showing').toLowerCase(),
          poster_url: m.poster_url || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&auto=format&fit=crop&q=80',
          description: m.description || ''
        }));
        return;
      }
    }
  } catch (err) {
    console.warn('[Movies Admin] Fallback error:', err);
  }

  // Dùng mock fallback nếu hoàn toàn mất kết nối
  if (moviesList.length === 0 && window.MovieService?._mockMovies) {
    moviesList = window.MovieService._mockMovies.map(m => ({
      id: m.id,
      title: m.title,
      duration: m.duration_minutes || 120,
      release_date: m.release_date || '2026-05-01',
      genres: m.genres || ['Điện ảnh'],
      genre_ids: [],
      status: m.status || 'now_showing',
      poster_url: m.poster_url || '',
      description: m.description || ''
    }));
  }
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
          <img src="${movie.poster_url || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400'}"
               alt="${movie.title}"
               style="width: 46px; height: 64px; object-fit: cover; border-radius: 4px; box-shadow: 0 2px 6px rgba(0,0,0,0.5);">
        </td>
        <td>
          <div style="font-weight: 700; color: #fff; font-size: 15px;">${movie.title}</div>
          <div style="font-size: 12px; color: var(--text-muted);">${(movie.description || '').substring(0, 50)}${(movie.description || '').length > 50 ? '...' : ''}</div>
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
    const keyword = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const status = statusFilter ? statusFilter.value : 'all';

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
  const modal = document.getElementById('movie-modal');
  if (modal) modal.classList.remove('show');
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

// Xử lý lưu form phim (Gọi API POST/PUT lên Backend Database)
window.handleMovieSubmit = async function (e) {
  e.preventDefault();
  const editId = document.getElementById('movie-edit-id').value;
  const title = document.getElementById('movie-title').value.trim();
  const duration = parseInt(document.getElementById('movie-duration').value, 10);
  const release_date = document.getElementById('movie-release-date').value;
  const genresStr = document.getElementById('movie-genres-input').value;
  const status = document.getElementById('movie-status').value;
  const poster_url = document.getElementById('movie-poster-url').value.trim() || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&auto=format&fit=crop&q=80';
  const description = document.getElementById('movie-description').value.trim();

  // Validation ràng buộc
  if (!title) {
    alert('Vui lòng nhập tên phim!');
    return;
  }
  if (!duration || duration <= 0) {
    alert('Thời lượng phim bắt buộc phải lớn hơn 0 phút!');
    return;
  }
  if (!release_date) {
    alert('Vui lòng chọn ngày khởi chiếu đúng định dạng YYYY-MM-DD!');
    return;
  }

  const saveBtn = document.getElementById('btn-save-movie');
  const originalBtnHtml = saveBtn ? saveBtn.innerHTML : '';
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';
  }

  const genreIds = mapGenreTextToIds(genresStr);
  const payload = {
    title,
    duration_minutes: duration,
    duration: duration,
    release_date,
    status,
    poster_url,
    description,
    genre_ids: genreIds
  };

  try {
    if (editId) {
      // Cập nhật phim (PUT /api/admin/movies/{id})
      const res = await window.MovieService.adminUpdateMovie(parseInt(editId, 10), payload);
      if (res.success) {
        window.showToast('Cập nhật thông tin phim "' + title + '" thành công!');
        closeMovieModal();
        await loadMoviesFromApi();
      } else {
        alert('Lỗi cập nhật phim: ' + (res.message || 'Không thể cập nhật'));
      }
    } else {
      // Thêm phim mới (POST /api/admin/movies)
      const res = await window.MovieService.adminCreateMovie(payload);
      if (res.success) {
        window.showToast('Đã thêm thành công phim mới: ' + title);
        closeMovieModal();
        await loadMoviesFromApi();
      } else {
        alert('Lỗi thêm phim mới: ' + (res.message || 'Không thể tạo phim'));
      }
    }
  } catch (err) {
    console.error('[handleMovieSubmit error]', err);
    alert('Lỗi kết nối máy chủ: ' + err.message);
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = originalBtnHtml;
    }
  }
};

// Chỉnh sửa phim
window.editMovie = function (id) {
  const m = moviesList.find(x => x.id === id);
  if (m) openMovieModal(m);
};

// Ngừng chiếu phim (PATCH /api/admin/movies/{id}/stop)
window.endMovieShowing = async function (id) {
  const m = moviesList.find(x => x.id === id);
  if (m && confirm(`Bạn có chắc chắn muốn ngừng chiếu bộ phim "${m.title}" không?`)) {
    try {
      const res = await window.MovieService.adminStopMovie(id);
      if (res.success) {
        window.showToast(`Đã chuyển trạng thái phim "${m.title}" sang Đã kết thúc (Ended).`, 'danger');
        await loadMoviesFromApi();
      } else {
        alert('Lỗi ngừng chiếu phim: ' + (res.message || 'Không thể cập nhật'));
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ: ' + err.message);
    }
  }
};

// Chiếu lại phim (PATCH /api/admin/movies/{id}/status)
window.restartMovieShowing = async function (id) {
  const m = moviesList.find(x => x.id === id);
  if (m) {
    try {
      const res = await window.MovieService.adminUpdateStatus(id, 'now_showing');
      if (res.success) {
        window.showToast(`Đã đưa phim "${m.title}" trở lại danh sách Đang chiếu!`);
        await loadMoviesFromApi();
      } else {
        alert('Lỗi đổi trạng thái phim: ' + (res.message || 'Không thể cập nhật'));
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ: ' + err.message);
    }
  }
};

// Xóa phim vĩnh viễn (DELETE /api/admin/movies/{id})
window.deleteMovie = async function (id) {
  const m = moviesList.find(x => x.id === id);
  if (m && confirm(`CẢNH BÁO: Bạn có chắc chắn muốn xoá vĩnh viễn phim "${m.title}" khỏi cơ sở dữ liệu?`)) {
    try {
      const res = await window.MovieService.adminDeleteMovie(id);
      if (res.success) {
        window.showToast(`Đã xoá bộ phim thành công!`, 'danger');
        await loadMoviesFromApi();
      } else {
        alert('Lỗi xoá phim: ' + (res.message || 'Không thể xóa'));
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ: ' + err.message);
    }
  }
};
