/**
 * ==========================================================================
 * ADMIN COMBOS MANAGEMENT CONTROLLER (js/pages/admin/combos.js)
 * Quản trị danh mục Combo Bắp Nước & Đồ Ăn Kèm (CRUD) (Task T3C72E6)
 * ==========================================================================
 */

let combosList = [];
let pendingDeleteId = null;

document.addEventListener('DOMContentLoaded', function () {
  loadCombosFromApi();
  initFilterEvents();
});

// Tải danh sách combo từ Backend API
async function loadCombosFromApi() {
  const tbody = document.getElementById('combos-table-tbody');
  const searchInput = document.getElementById('combo-search-input');
  const statusFilter = document.getElementById('combo-status-filter');

  const search = searchInput ? searchInput.value.trim() : '';
  const filterVal = statusFilter ? statusFilter.value : 'all';
  let isActive = null;
  if (filterVal === 'active') isActive = true;
  else if (filterVal === 'inactive') isActive = false;

  try {
    if (window.ComboService && typeof window.ComboService.adminGetCombos === 'function') {
      const res = await window.ComboService.adminGetCombos({ search, is_active: isActive });
      if (res && res.success && Array.isArray(res.data)) {
        combosList = res.data;
      } else {
        // Fallback sang getActiveCombos nếu admin API tạm chưa cấp dữ liệu
        const fallbackRes = await window.ComboService.getActiveCombos();
        combosList = fallbackRes?.data || [];
      }
    }
  } catch (err) {
    console.error('[Admin Combos] Lỗi nạp combo:', err);
  }

  updateStats();
  renderCombosTable();
}

// Cập nhật các chỉ số thống kê
function updateStats() {
  const totalEl = document.getElementById('stat-total-combos');
  const activeEl = document.getElementById('stat-active-combos');
  const inactiveEl = document.getElementById('stat-inactive-combos');
  const avgPriceEl = document.getElementById('stat-avg-price');

  const total = combosList.length;
  const active = combosList.filter(c => c.is_active).length;
  const inactive = total - active;
  const avgPrice = total > 0
    ? Math.round(combosList.reduce((sum, c) => sum + Number(c.price || 0), 0) / total)
    : 0;

  if (totalEl) totalEl.innerText = String(total);
  if (activeEl) activeEl.innerText = String(active);
  if (inactiveEl) inactiveEl.innerText = String(inactive);
  if (avgPriceEl) avgPriceEl.innerText = Number(avgPrice).toLocaleString('vi-VN') + ' đ';
}

// Render dữ liệu ra bảng quản trị
function renderCombosTable() {
  const tbody = document.getElementById('combos-table-tbody');
  if (!tbody) return;

  if (combosList.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-8 text-slate-400">
          <div style="font-size: 2rem; margin-bottom: 0.5rem; opacity: 0.5;">
            <i class="fa-solid fa-bowl-food"></i>
          </div>
          <div>Không tìm thấy combo bắp nước nào phù hợp với bộ lọc.</div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = combosList.map(combo => {
    const isAct = combo.is_active;
    const statusBadge = isAct
      ? '<span class="status-badge" style="background: rgba(16,185,129,0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3); padding: 0.25rem 0.625rem; border-radius: 9999px; font-size: 0.6875rem; font-weight: 700;"><i class="fa-solid fa-circle text-[8px] mr-1"></i> Đang mở bán</span>'
      : '<span class="status-badge" style="background: rgba(244,63,94,0.15); color: #f43f5e; border: 1px solid rgba(244,63,94,0.3); padding: 0.25rem 0.625rem; border-radius: 9999px; font-size: 0.6875rem; font-weight: 700;"><i class="fa-solid fa-circle text-[8px] mr-1"></i> Tạm ngưng</span>';

    const updatedAt = combo.updated_at
      ? new Date(combo.updated_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : 'Hôm nay';

    const imgUrl = combo.image_url || 'https://images.unsplash.com/photo-1572177191856-3cde618dee1f?w=150';

    return `
      <tr>
        <td>
          <img src="${imgUrl}" alt="${combo.name}" style="width: 60px; height: 60px; border-radius: 0.75rem; object-fit: cover; border: 1px solid rgba(255,255,255,0.1);">
        </td>
        <td>
          <div style="font-weight: 800; color: #f8fafc; font-size: 0.875rem; margin-bottom: 0.25rem;">${combo.name}</div>
          <div style="font-size: 0.75rem; color: #94a3b8; max-width: 320px; line-height: 1.4;">${combo.description || 'Chưa có mô tả'}</div>
        </td>
        <td>
          <span style="font-family: monospace; font-weight: 800; color: #d4ff00; font-size: 0.9375rem;">
            ${Number(combo.price).toLocaleString('vi-VN')} đ
          </span>
        </td>
        <td>
          ${statusBadge}
        </td>
        <td>
          <span style="font-size: 0.75rem; color: #64748b;">${updatedAt}</span>
        </td>
        <td style="text-align: right;">
          <div style="display: flex; gap: 0.375rem; justify-content: flex-end;">
            <button type="button" class="btn btn-sm" onclick="toggleComboStatus(${combo.id}, ${isAct})" style="background: ${isAct ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)'}; color: ${isAct ? '#f43f5e' : '#10b981'}; border: 1px solid ${isAct ? 'rgba(244,63,94,0.3)' : 'rgba(16,185,129,0.3)'}; padding: 0.375rem 0.625rem; border-radius: 0.5rem;" title="${isAct ? 'Tạm ngưng mở bán' : 'Mở bán lại'}">
              <i class="fa-solid ${isAct ? 'fa-pause' : 'fa-play'}"></i>
            </button>
            <button type="button" class="btn btn-sm" onclick="openComboModal(${combo.id})" style="background: rgba(6,182,212,0.1); color: #06b6d4; border: 1px solid rgba(6,182,212,0.3); padding: 0.375rem 0.625rem; border-radius: 0.5rem;" title="Chỉnh sửa combo">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button type="button" class="btn btn-sm" onclick="promptDeleteCombo(${combo.id}, '${combo.name.replace(/'/g, "\\'")}')" style="background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); padding: 0.375rem 0.625rem; border-radius: 0.5rem;" title="Xóa combo">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Bắt sự kiện tìm kiếm & lọc
function initFilterEvents() {
  const searchInput = document.getElementById('combo-search-input');
  const statusFilter = document.getElementById('combo-status-filter');

  let debounceTimer = null;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadCombosFromApi();
      }, 300);
    });
  }

  if (statusFilter) {
    statusFilter.addEventListener('change', () => {
      loadCombosFromApi();
    });
  }
}

// Mở modal Thêm / Sửa Combo
function openComboModal(comboId = null) {
  const modal = document.getElementById('combo-modal');
  const titleEl = document.getElementById('modal-combo-title');
  const form = document.getElementById('combo-form');
  const idInput = document.getElementById('combo-id');
  const nameInput = document.getElementById('combo-name');
  const priceInput = document.getElementById('combo-price');
  const statusSelect = document.getElementById('combo-status');
  const imageUrlInput = document.getElementById('combo-image-url');
  const descInput = document.getElementById('combo-description');

  if (form) form.reset();

  if (comboId) {
    const combo = combosList.find(c => c.id === comboId);
    if (!combo) return;

    if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-pen-to-square text-primary"></i> Chỉnh Sửa Combo Bắp Nước';
    if (idInput) idInput.value = String(combo.id);
    if (nameInput) nameInput.value = combo.name || '';
    if (priceInput) priceInput.value = combo.price || 0;
    if (statusSelect) statusSelect.value = String(combo.is_active);
    if (imageUrlInput) imageUrlInput.value = combo.image_url || '';
    if (descInput) descInput.value = combo.description || '';
  } else {
    if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-plus text-primary"></i> Thêm Combo Bắp Nước Mới';
    if (idInput) idInput.value = '';
    if (statusSelect) statusSelect.value = 'true';
  }

  previewComboImage();
  if (modal) modal.classList.add('active');
}

// Đóng modal combo
function closeComboModal() {
  const modal = document.getElementById('combo-modal');
  if (modal) modal.classList.remove('active');
}

// Xem trước ảnh combo
function previewComboImage() {
  const input = document.getElementById('combo-image-url');
  const container = document.getElementById('image-preview-container');
  const img = document.getElementById('image-preview-img');

  if (!input || !container || !img) return;

  const url = input.value.trim();
  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    img.src = url;
    container.style.display = 'block';
  } else {
    container.style.display = 'none';
  }
}

// Xử lý gửi biểu mẫu Thêm / Sửa
async function handleComboSubmit(event) {
  event.preventDefault();

  const idInput = document.getElementById('combo-id');
  const nameInput = document.getElementById('combo-name');
  const priceInput = document.getElementById('combo-price');
  const statusSelect = document.getElementById('combo-status');
  const imageUrlInput = document.getElementById('combo-image-url');
  const descInput = document.getElementById('combo-description');
  const btnSave = document.getElementById('btn-save-combo');

  const name = nameInput?.value.trim();
  const price = parseFloat(priceInput?.value || '0');
  const isActive = statusSelect?.value === 'true';
  const imageUrl = imageUrlInput?.value.trim() || null;
  const description = descInput?.value.trim() || null;

  if (!name) {
    if (window.showToast) window.showToast('Vui lòng nhập tên combo bắp nước!', 'warning');
    nameInput?.focus();
    return;
  }

  if (isNaN(price) || price < 0) {
    if (window.showToast) window.showToast('Giá combo phải lớn hơn hoặc bằng 0!', 'warning');
    priceInput?.focus();
    return;
  }

  const payload = {
    name,
    price,
    is_active: isActive,
    image_url: imageUrl,
    description
  };

  if (btnSave) {
    btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Đang lưu...';
    btnSave.disabled = true;
  }

  try {
    const isEdit = idInput && idInput.value;
    let res = null;

    if (isEdit) {
      res = await window.ComboService.adminUpdateCombo(parseInt(idInput.value, 10), payload);
    } else {
      res = await window.ComboService.adminCreateCombo(payload);
    }

    if (res && res.success) {
      closeComboModal();
      if (window.showToast) {
        window.showToast(
          isEdit ? `Đã cập nhật combo "${name}" thành công!` : `Đã thêm combo "${name}" thành công!`,
          'success'
        );
      }
      await loadCombosFromApi();
    } else {
      if (window.showToast) {
        window.showToast(res?.message || 'Không thể lưu combo bắp nước. Vui lòng thử lại!', 'error');
      }
    }
  } catch (err) {
    if (window.showToast) {
      window.showToast('Lỗi hệ thống: ' + (err.message || err), 'error');
    }
  } finally {
    if (btnSave) {
      btnSave.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Lưu Combo';
      btnSave.disabled = false;
    }
  }
}

// Đổi nhanh trạng thái mở bán (Toggle Active)
async function toggleComboStatus(comboId, currentStatus) {
  try {
    const res = await window.ComboService.adminUpdateCombo(comboId, {
      is_active: !currentStatus
    });
    if (res && res.success) {
      if (window.showToast) {
        window.showToast(
          !currentStatus ? 'Đã mở bán lại combo bắp nước!' : 'Đã chuyển combo sang trạng thái tạm ngưng bán!',
          'success'
        );
      }
      await loadCombosFromApi();
    } else {
      if (window.showToast) {
        window.showToast(res?.message || 'Không thể cập nhật trạng thái combo!', 'error');
      }
    }
  } catch (err) {
    if (window.showToast) {
      window.showToast('Lỗi: ' + err.message, 'error');
    }
  }
}

// Mở modal xác nhận xóa (dùng hệ thống Confirm Modal chuẩn toàn cục)
async function promptDeleteCombo(comboId, comboName) {
  if (typeof window.showConfirmModal !== 'function') return;

  await window.showConfirmModal({
    type: 'danger',
    title: 'Xác nhận xóa Combo',
    message: `Bạn có chắc chắn muốn xóa combo "${comboName}" không? Nếu combo đã có khách đặt trong quá khứ, hệ thống sẽ tự động chuyển sang tạm ngưng bán.`,
    cancelText: 'Hủy',
    confirmText: 'Xóa',
    variant: 'danger',
    dangerous: true,
    loadingText: 'Đang xóa...',
    onConfirm: async () => {
      try {
        const res = await window.ComboService.adminDeleteCombo(comboId);
        if (res && res.success) {
          if (window.showToast) {
            window.showToast(`Đã xóa combo "${comboName}" thành công!`, 'success');
          }
          await loadCombosFromApi();
        } else {
          if (window.showToast) {
            window.showToast(res?.message || 'Không thể xóa combo bắp nước!', 'error');
          }
        }
      } catch (err) {
        if (window.showToast) {
          window.showToast('Lỗi: ' + err.message, 'error');
        }
      }
    }
  });
}

// Đóng modal xóa (giữ tương thích nếu HTML vẫn có tham chiếu)
function closeDeleteModal() {
  pendingDeleteId = null;
  const modal = document.getElementById('delete-confirm-modal');
  if (modal) modal.classList.remove('active');
}

// Thực hiện xóa combo (giữ tương thích)
async function executeDeleteCombo() {
  if (!pendingDeleteId) return;

  const btnDelete = document.getElementById('btn-confirm-delete');
  if (btnDelete) {
    btnDelete.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Đang xóa...';
    btnDelete.disabled = true;
  }

  try {
    const res = await window.ComboService.adminDeleteCombo(pendingDeleteId);
    if (res && res.success) {
      closeDeleteModal();
      if (window.showToast) window.showToast('Đã xóa combo thành công!', 'success');
      await loadCombosFromApi();
    } else {
      if (window.showToast) window.showToast(res?.message || 'Không thể xóa combo bắp nước!', 'error');
    }
  } catch (err) {
    if (window.showToast) window.showToast('Lỗi: ' + err.message, 'error');
  } finally {
    if (btnDelete) {
      btnDelete.innerHTML = '<i class="fa-solid fa-trash-can mr-1"></i> Xóa Combo';
      btnDelete.disabled = false;
    }
  }
}
