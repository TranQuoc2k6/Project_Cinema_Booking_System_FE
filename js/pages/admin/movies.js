/**
 * ==========================================================================
 * ADMIN MOVIES MANAGEMENT CONTROLLER
 * Xử lý thêm, sửa, đổi trạng thái, ngừng chiếu, tìm kiếm phim và lưu vào Database
 * ==========================================================================
 */

let moviesList = [];
let selectedPosterFile = null;

// Chuyển đổi đường dẫn ảnh tương đối thành URL đầy đủ để hiển thị
function getPosterFullUrl(url) {
  if (!url) return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&auto=format&fit=crop&q=80';
  if (url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const base = (window.API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '');
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${base}${cleanPath}`;
}

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
            trailer_url: m.trailer_url || '',
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
          trailer_url: m.trailer_url || '',
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
      trailer_url: m.trailer_url || '',
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
    const posterSrc = getPosterFullUrl(movie.poster_url);
    const escapedTitle = (movie.title || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');

    return `
      <tr>
        <td>
          <div style="position: relative; display: inline-block; cursor: pointer;"
               onclick="openPosterLightbox('${posterSrc}', '${escapedTitle}')"
               title="Nhấn để xem trước Poster phóng to">
            <img src="${posterSrc}"
                 alt="${movie.title}"
                 style="width: 48px; height: 68px; object-fit: cover; border-radius: 6px; box-shadow: 0 4px 10px rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.15); transition: transform 0.2s;"
                 onmouseover="this.style.transform='scale(1.08)'"
                 onmouseout="this.style.transform='scale(1)'"
                 onerror="this.src='https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400'">
            <span style="position: absolute; bottom: 2px; right: 2px; background: rgba(0,0,0,0.75); color: #38bdf8; font-size: 9px; padding: 1px 3px; border-radius: 3px;">
              <i class="fa-solid fa-magnifying-glass-plus"></i>
            </span>
          </div>
        </td>
        <td>
          <div style="font-weight: 700; color: #fff; font-size: 15px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <span>${movie.title}</span>
            ${movie.trailer_url ? `
              <a href="${movie.trailer_url}" target="_blank" class="badge badge-danger text-xs" style="text-decoration: none; display: inline-flex; align-items: center; gap: 4px; padding: 2px 7px; font-size: 11px;" title="Mở xem Trailer YouTube">
                <i class="fa-brands fa-youtube"></i> Trailer
              </a>
            ` : ''}
          </div>
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

// ============================================================================
// XỬ LÝ UPLOAD POSTER VÀ LIVE PREVIEW (SRS 1.2 & TASK 4)
// ============================================================================

// Xử lý khi người dùng chọn file ảnh từ máy tính
window.handlePosterFileSelect = function (event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  // 1. Kiểm tra định dạng đuôi file (.jpg, .jpeg, .png)
  const allowedExts = ['.jpg', '.jpeg', '.png'];
  const fileName = (file.name || '').toLowerCase();
  const isExtValid = allowedExts.some(ext => fileName.endsWith(ext));
  const isMimeValid = !file.type || file.type.startsWith('image/');

  if (!isExtValid) {
    if (window.showAlertModal) {
      window.showAlertModal({
        type: 'warning',
        title: 'Định dạng không hỗ trợ',
        message: 'Định dạng file không được hỗ trợ! Vui lòng chỉ chọn ảnh có định dạng .jpg, .jpeg, hoặc .png.',
        confirmText: 'Đã hiểu'
      });
    } else if (window.showToast) {
      window.showToast('Định dạng file không được hỗ trợ! Vui lòng chỉ chọn .jpg, .jpeg, hoặc .png.', 'warning');
    }
    event.target.value = '';
    return;
  }

  // 2. Kiểm tra giới hạn dung lượng: Tối đa 5MB
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  if (file.size > MAX_SIZE) {
    const curMB = (file.size / (1024 * 1024)).toFixed(2);
    if (window.showAlertModal) {
      window.showAlertModal({
        type: 'warning',
        title: 'Dung lượng ảnh quá lớn',
        message: `Dung lượng ảnh (${curMB}MB) vượt quá giới hạn tối đa 5MB cho phép! Vui lòng nén hoặc chọn ảnh khác có dung lượng nhỏ hơn 5MB.`,
        confirmText: 'Đã hiểu'
      });
    } else if (window.showToast) {
      window.showToast(`Dung lượng ảnh (${curMB}MB) vượt quá giới hạn tối đa 5MB!`, 'warning');
    }
    event.target.value = '';
    return;
  }

  if (file.size === 0) {
    if (window.showToast) {
      window.showToast('File ảnh trống (0 bytes). Vui lòng chọn file ảnh hợp lệ!', 'warning');
    }
    event.target.value = '';
    return;
  }

  selectedPosterFile = file;

  // 3. Hiển thị huy hiệu thông tin file đã chọn
  const badge = document.getElementById('poster-file-info-badge');
  const nameEl = document.getElementById('poster-file-name');
  const sizeEl = document.getElementById('poster-file-size');
  if (badge && nameEl && sizeEl) {
    nameEl.textContent = file.name;
    const sizeStr = file.size >= 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
      : `${Math.round(file.size / 1024)} KB`;
    sizeEl.textContent = `(${sizeStr})`;
    badge.style.display = 'flex';
  }

  // 4. Tạo Object URL xem trước hình ảnh trực tiếp (Live Image Preview)
  try {
    const previewUrl = URL.createObjectURL(file);
    updatePosterPreview(previewUrl);
  } catch (err) {
    const reader = new FileReader();
    reader.onload = function (e) {
      updatePosterPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  }
};

// Hủy chọn file ảnh đã chọn
window.clearSelectedPosterFile = function () {
  selectedPosterFile = null;
  const fileInput = document.getElementById('movie-poster-file');
  if (fileInput) fileInput.value = '';

  const badge = document.getElementById('poster-file-info-badge');
  if (badge) badge.style.display = 'none';

  // Khôi phục preview theo input URL hiện tại (nếu có)
  const urlInput = document.getElementById('movie-poster-url');
  updatePosterPreview(urlInput ? urlInput.value : '');
};

// Live Image Preview (SRS Task 4 & SRS 1.2)
window.updatePosterPreview = function (url) {
  const img = document.getElementById('poster-preview-img');
  const placeholder = document.getElementById('poster-preview-placeholder');
  if (!img || !placeholder) return;

  if (url && url.trim().length > 3) {
    const fullUrl = getPosterFullUrl(url.trim());
    img.src = fullUrl;
    img.style.display = 'block';
    placeholder.style.display = 'none';
    img.onerror = function () {
      img.style.display = 'none';
      placeholder.style.display = 'flex';
      placeholder.innerHTML = `
        <i class="fa-solid fa-triangle-exclamation" style="font-size: 2rem; color: #f43f5e;"></i>
        <span style="color: #f43f5e; font-weight: 500;">Không thể tải hình ảnh từ nguồn này</span>
        <span style="font-size: 11px; color: var(--text-muted);">Vui lòng kiểm tra lại đường dẫn hoặc chọn file ảnh từ máy</span>
      `;
    };
  } else {
    img.style.display = 'none';
    placeholder.style.display = 'flex';
    placeholder.innerHTML = `
      <i class="fa-regular fa-image" style="font-size: 2.2rem; color: var(--color-primary);"></i>
      <span>Xem trước hình ảnh Poster (Live Image Preview)</span>
      <span style="font-size: 11px; color: var(--text-muted);">Hỗ trợ xem trước tức thì khi chọn file từ máy hoặc dán link URL</span>
    `;
  }
};

// Chuyển đổi YouTube link sang YouTube embed URL
function getYouTubeEmbedUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = trimmed.match(regExp);
  if (match && match[1]) {
    return `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1`;
  }
  if (trimmed.includes('youtube.com/embed/')) {
    return trimmed;
  }
  return null;
}

// Live Video Trailer Preview
window.updateTrailerPreview = function (url) {
  const container = document.getElementById('trailer-preview-container');
  const iframe = document.getElementById('trailer-preview-iframe');
  const badge = document.getElementById('trailer-preview-badge');
  if (!container || !iframe) return;

  if (!url || !url.trim()) {
    iframe.src = '';
    container.style.display = 'none';
    return;
  }

  const embedUrl = getYouTubeEmbedUrl(url);
  if (embedUrl) {
    iframe.src = embedUrl;
    container.style.display = 'block';
    if (badge) {
      badge.className = 'badge badge-success text-xs';
      badge.innerHTML = '<i class="fa-solid fa-check"></i> Link YouTube hợp lệ';
    }
  } else {
    iframe.src = '';
    container.style.display = 'none';
  }
};

// Modal Thêm / Sửa phim
window.openMovieModal = function (editMovieObj = null) {
  const modal = document.getElementById('movie-modal');
  const titleEl = document.getElementById('modal-movie-title');
  const editId = document.getElementById('movie-edit-id');
  const form = document.getElementById('movie-form');

  form.reset();
  clearSelectedPosterFile();

  if (editMovieObj) {
    titleEl.textContent = 'Chỉnh sửa thông tin phim: ' + editMovieObj.title;
    editId.value = editMovieObj.id;
    document.getElementById('movie-title').value = editMovieObj.title;
    document.getElementById('movie-duration').value = editMovieObj.duration;
    document.getElementById('movie-release-date').value = editMovieObj.release_date;
    document.getElementById('movie-genres-input').value = Array.isArray(editMovieObj.genres) ? editMovieObj.genres.join(', ') : editMovieObj.genres;
    document.getElementById('movie-status').value = editMovieObj.status;
    document.getElementById('movie-poster-url').value = editMovieObj.poster_url;
    document.getElementById('movie-trailer-url').value = editMovieObj.trailer_url || '';
    document.getElementById('movie-description').value = editMovieObj.description || '';
    updatePosterPreview(editMovieObj.poster_url);
    updateTrailerPreview(editMovieObj.trailer_url || '');
  } else {
    titleEl.textContent = 'Thêm phim mới vào hệ thống';
    editId.value = '';
    document.getElementById('movie-release-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('movie-trailer-url').value = '';
    updatePosterPreview('');
    updateTrailerPreview('');
  }

  modal.classList.add('show');
};

window.closeMovieModal = function () {
  const modal = document.getElementById('movie-modal');
  if (modal) modal.classList.remove('show');
  clearSelectedPosterFile();
  updateTrailerPreview('');
};

// Xử lý lưu form phim (Tự động Upload Poster nếu có file mới -> Gọi API POST/PUT Database)
window.handleMovieSubmit = async function (e) {
  e.preventDefault();
  const editId = document.getElementById('movie-edit-id').value;
  const title = document.getElementById('movie-title').value.trim();
  const duration = parseInt(document.getElementById('movie-duration').value, 10);
  const release_date = document.getElementById('movie-release-date').value;
  const genresStr = document.getElementById('movie-genres-input').value;
  const status = document.getElementById('movie-status').value;
  let poster_url = document.getElementById('movie-poster-url').value.trim();
  const trailer_url = document.getElementById('movie-trailer-url').value.trim();
  const description = document.getElementById('movie-description').value.trim();

  // Validation ràng buộc
  if (!title) {
    if (window.showToast) window.showToast('Vui lòng nhập tên phim!', 'warning');
    document.getElementById('movie-title')?.focus();
    return;
  }
  if (!duration || duration <= 0) {
    if (window.showToast) window.showToast('Thời lượng phim bắt buộc phải lớn hơn 0 phút!', 'warning');
    document.getElementById('movie-duration')?.focus();
    return;
  }
  if (!release_date) {
    if (window.showToast) window.showToast('Vui lòng chọn ngày khởi chiếu đúng định dạng YYYY-MM-DD!', 'warning');
    document.getElementById('movie-release-date')?.focus();
    return;
  }

  const saveBtn = document.getElementById('btn-save-movie');
  const originalBtnHtml = saveBtn ? saveBtn.innerHTML : '';

  try {
    // BƯỚC 1: NẾU NGƯỜI DÙNG CHỌN FILE ẢNH MỚI -> UPLOAD LÊN SERVER QUA API UPLOAD POSTER
    if (selectedPosterFile) {
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up fa-spin"></i> Đang tải poster lên máy chủ...';
      }

      const uploadRes = await window.MovieService.uploadPoster(selectedPosterFile);
      if (!uploadRes.success) {
        if (window.showToast) {
          window.showToast('Lỗi upload ảnh poster: ' + (uploadRes.message || 'Không thể tải ảnh lên máy chủ. Vui lòng thử lại!'), 'error');
        }
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = originalBtnHtml;
        }
        return;
      }

      // Lấy URL poster từ phản hồi backend
      const uploadedData = uploadRes.data?.data || uploadRes.data;
      poster_url = uploadedData.poster_url || uploadedData.full_url;
      document.getElementById('movie-poster-url').value = poster_url;
      console.info('[Poster Upload] Upload ảnh poster thành công:', poster_url);
    }

    if (!poster_url) {
      poster_url = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&auto=format&fit=crop&q=80';
    }

    // BƯỚC 2: TIẾN HÀNH LƯU DỮ LIỆU PHIM VÀO DATABASE
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu phim vào Database...';
    }

    const genreIds = mapGenreTextToIds(genresStr);
    const payload = {
      title,
      duration_minutes: duration,
      duration: duration,
      release_date,
      status,
      poster_url,
      trailer_url: trailer_url || null,
      description,
      genre_ids: genreIds
    };

    if (editId) {
      // Cập nhật phim (PUT /api/admin/movies/{id})
      const res = await window.MovieService.adminUpdateMovie(parseInt(editId, 10), payload);
      if (res.success) {
        if (window.showToast) {
          window.showToast('Cập nhật thông tin phim "' + title + '" thành công!', 'success');
        }
        closeMovieModal();
        await loadMoviesFromApi();
      } else {
        if (window.showToast) {
          window.showToast('Lỗi cập nhật phim: ' + (res.message || 'Không thể cập nhật'), 'error');
        }
      }
    } else {
      // Thêm phim mới (POST /api/admin/movies)
      const res = await window.MovieService.adminCreateMovie(payload);
      if (res.success) {
        if (window.showToast) {
          window.showToast('Đã thêm thành công phim mới: ' + title, 'success');
        }
        closeMovieModal();
        await loadMoviesFromApi();
      } else {
        if (window.showToast) {
          window.showToast('Lỗi thêm phim mới: ' + (res.message || 'Không thể tạo phim'), 'error');
        }
      }
    }
  } catch (err) {
    console.error('[handleMovieSubmit error]', err);
    if (window.showToast) {
      window.showToast('Lỗi kết nối máy chủ: ' + err.message, 'error');
    }
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = originalBtnHtml;
    }
  }
};

// ============================================================================
// LIGHTBOX PHÓNG TO POSTER PHIM (HD PREVIEW)
// ============================================================================
window.openPosterLightbox = function (url, title = '') {
  const modal = document.getElementById('poster-lightbox-modal');
  const img = document.getElementById('lightbox-poster-img');
  const titleEl = document.getElementById('lightbox-poster-title');

  if (modal && img) {
    img.src = url;
    if (titleEl) titleEl.textContent = title ? `Poster: ${title}` : 'Ảnh Poster Phim';
    modal.classList.add('show');
  }
};

window.closePosterLightbox = function (event) {
  if (event && event.target && event.target.tagName === 'IMG') {
    return; // Không đóng nếu click vào chính tấm ảnh
  }
  const modal = document.getElementById('poster-lightbox-modal');
  if (modal) modal.classList.remove('show');
};

// Chỉnh sửa phim
window.editMovie = function (id) {
  const m = moviesList.find(x => x.id === id);
  if (m) openMovieModal(m);
};

// Ngừng chiếu phim (PATCH /api/admin/movies/{id}/stop)
window.endMovieShowing = async function (id) {
  const m = moviesList.find(x => x.id === id);
  if (!m || typeof window.showConfirmModal !== 'function') return;

  await window.showConfirmModal({
    type: 'warning',
    title: 'Xác nhận ngừng chiếu',
    message: `Bạn có chắc chắn muốn ngừng chiếu bộ phim "${m.title}" không?`,
    cancelText: 'Hủy',
    confirmText: 'Ngừng chiếu',
    variant: 'primary',
    loadingText: 'Đang cập nhật...',
    onConfirm: async () => {
      try {
        const res = await window.MovieService.adminStopMovie(id);
        if (res.success) {
          if (window.showToast) {
            window.showToast(`Đã chuyển trạng thái phim "${m.title}" sang Đã kết thúc (Ended).`, 'success');
          }
          await loadMoviesFromApi();
        } else {
          if (window.showToast) {
            window.showToast('Lỗi ngừng chiếu phim: ' + (res.message || 'Không thể cập nhật'), 'error');
          }
        }
      } catch (err) {
        if (window.showToast) {
          window.showToast('Lỗi kết nối máy chủ: ' + err.message, 'error');
        }
      }
    }
  });
};

// Chiếu lại phim (PATCH /api/admin/movies/{id}/status)
window.restartMovieShowing = async function (id) {
  const m = moviesList.find(x => x.id === id);
  if (m) {
    try {
      const res = await window.MovieService.adminUpdateStatus(id, 'now_showing');
      if (res.success) {
        if (window.showToast) {
          window.showToast(`Đã đưa phim "${m.title}" trở lại danh sách Đang chiếu!`, 'success');
        }
        await loadMoviesFromApi();
      } else {
        if (window.showToast) {
          window.showToast('Lỗi đổi trạng thái phim: ' + (res.message || 'Không thể cập nhật'), 'error');
        }
      }
    } catch (err) {
      if (window.showToast) {
        window.showToast('Lỗi kết nối máy chủ: ' + err.message, 'error');
      }
    }
  }
};

// Xóa phim vĩnh viễn (DELETE /api/admin/movies/{id})
window.deleteMovie = async function (id) {
  const m = moviesList.find(x => x.id === id);
  if (!m || typeof window.showConfirmModal !== 'function') return;

  await window.showConfirmModal({
    type: 'danger',
    title: 'Xác nhận xóa phim',
    message: `Bạn có chắc chắn muốn xóa vĩnh viễn phim "${m.title}" khỏi cơ sở dữ liệu không? Hành động này có thể không khôi phục được.`,
    cancelText: 'Hủy',
    confirmText: 'Xóa',
    variant: 'danger',
    dangerous: true,
    loadingText: 'Đang xóa phim...',
    onConfirm: async () => {
      try {
        const res = await window.MovieService.adminDeleteMovie(id);
        if (res.success) {
          if (window.showToast) {
            window.showToast(`Đã xóa phim "${m.title}" thành công!`, 'success');
          }
          await loadMoviesFromApi();
        } else {
          if (window.showToast) {
            window.showToast('Lỗi xóa phim: ' + (res.message || 'Không thể xóa'), 'error');
          }
        }
      } catch (err) {
        if (window.showToast) {
          window.showToast('Lỗi kết nối máy chủ: ' + err.message, 'error');
        }
      }
    }
  });
};
