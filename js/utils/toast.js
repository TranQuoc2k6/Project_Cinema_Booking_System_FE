/**
 * ==========================================================================
 * LUMEN CINEMA - GLOBAL TOAST NOTIFICATION SYSTEM (js/utils/toast.js)
 * Hệ thống thông báo nhanh dùng chung toàn bộ Frontend (Customer + Admin):
 * - 4 Trạng thái: success, error/danger, warning, info
 * - Giao diện Dark UI đồng bộ LUMEN CINEMA (#211B22 / #2D252D / #FFFFFF)
 * - Tự động biến mất kèm thanh tiến trình + nút đóng thủ công
 * - Chống thông báo trùng lặp (deduplication) và giới hạn số lượng hiển thị
 * - Responsive an toàn trên Desktop, Laptop, Tablet và Mobile
 * ==========================================================================
 */

(function () {
  'use strict';

  const STYLE_ID = 'lumen-toast-system-styles';
  const CONTAINER_ID = 'cinema-toast-container';
  const MAX_TOASTS = 4;

  const TOAST_ICONS = {
    success: 'fa-solid fa-circle-check',
    error: 'fa-solid fa-circle-xmark',
    danger: 'fa-solid fa-circle-xmark',
    warning: 'fa-solid fa-triangle-exclamation',
    info: 'fa-solid fa-circle-info'
  };

  const TOAST_COLORS = {
    success: {
      border: 'rgba(22, 163, 74, 0.7)',
      glow: 'rgba(22, 163, 74, 0.28)',
      icon: '#22C55E',
      iconBg: 'rgba(22, 163, 74, 0.16)',
      bar: 'linear-gradient(90deg, #16A34A, #22C55E)'
    },
    error: {
      border: 'rgba(220, 53, 69, 0.72)',
      glow: 'rgba(220, 53, 69, 0.28)',
      icon: '#F87171',
      iconBg: 'rgba(220, 53, 69, 0.18)',
      bar: 'linear-gradient(90deg, #DC3545, #F87171)'
    },
    danger: {
      border: 'rgba(220, 53, 69, 0.72)',
      glow: 'rgba(220, 53, 69, 0.28)',
      icon: '#F87171',
      iconBg: 'rgba(220, 53, 69, 0.18)',
      bar: 'linear-gradient(90deg, #DC3545, #F87171)'
    },
    warning: {
      border: 'rgba(245, 158, 11, 0.72)',
      glow: 'rgba(245, 158, 11, 0.25)',
      icon: '#FBBF24',
      iconBg: 'rgba(245, 158, 11, 0.18)',
      bar: 'linear-gradient(90deg, #F59E0B, #FBBF24)'
    },
    info: {
      border: 'rgba(232, 62, 117, 0.7)',
      glow: 'rgba(232, 62, 117, 0.25)',
      icon: '#E83E75',
      iconBg: 'rgba(232, 62, 117, 0.16)',
      bar: 'linear-gradient(90deg, #E83E75, #F472B6)'
    }
  };

  const activeToastMap = new Map();

  function injectToastStyles() {
    if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${CONTAINER_ID} {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000050;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 400px;
        width: calc(100vw - 40px);
        pointer-events: none;
        box-sizing: border-box;
      }

      .lumen-toast-card {
        pointer-events: auto;
        position: relative;
        width: 100%;
        background: rgba(33, 27, 34, 0.96);
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
        border-radius: 14px;
        padding: 13px 15px;
        display: flex;
        align-items: flex-start;
        gap: 12px;
        color: #FFFFFF;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        transform: translateY(-14px) scale(0.96);
        opacity: 0;
        transition: transform 0.26s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.22s ease;
        overflow: hidden;
        box-sizing: border-box;
      }

      .lumen-toast-card.lumen-toast-visible {
        opacity: 1;
        transform: translateY(0) scale(1);
      }

      .lumen-toast-card.lumen-toast-pulse {
        transform: translateY(0) scale(1.02);
      }

      .lumen-toast-icon-box {
        flex-shrink: 0;
        width: 32px;
        height: 32px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1rem;
      }

      .lumen-toast-body {
        flex: 1;
        min-width: 0;
        padding-right: 4px;
      }

      .lumen-toast-title {
        font-size: 0.8125rem;
        font-weight: 800;
        letter-spacing: 0.02em;
        margin-bottom: 2px;
        line-height: 1.3;
      }

      .lumen-toast-message {
        font-size: 0.8125rem;
        font-weight: 500;
        color: #E2DCE5;
        line-height: 1.45;
        word-break: break-word;
      }

      .toast-close-btn {
        flex-shrink: 0;
        width: 28px;
        height: 28px;
        border-radius: 8px;
        background: #2D252D;
        border: 1px solid rgba(255, 255, 255, 0.08);
        color: #D1C9D4;
        font-size: 0.85rem;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.15s ease, color 0.15s ease;
      }

      .toast-close-btn:hover {
        background: #45404A;
        color: #FFFFFF;
      }

      .toast-progress-bar {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        width: 100%;
        transform-origin: left;
      }

      @media (max-width: 640px) {
        #${CONTAINER_ID} {
          top: 12px;
          top: max(12px, env(safe-area-inset-top));
          left: 12px;
          right: 12px;
          width: auto;
          max-width: none;
        }
        .lumen-toast-card {
          padding: 12px 13px;
          border-radius: 13px;
        }
      }
    `;

    (document.head || document.documentElement).appendChild(style);
  }

  function getOrCreateContainer() {
    injectToastStyles();
    let container = document.getElementById(CONTAINER_ID);
    if (!container) {
      container = document.createElement('div');
      container.id = CONTAINER_ID;
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('role', 'region');
      container.setAttribute('aria-label', 'Thông báo hệ thống');
      document.body.appendChild(container);
    }
    return container;
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Hiển thị thông báo Toast
   * @param {string} message - Nội dung thông báo
   * @param {'success'|'error'|'danger'|'warning'|'info'} [type='info'] - Loại thông báo
   * @param {number} [duration=3500] - Thời gian tự biến mất (ms)
   * @param {string} [title=''] - Tiêu đề tùy chọn
   */
  function showToast(message, type = 'info', duration = 3500, title = '') {
    if (!message || typeof document === 'undefined' || !document.body) return null;

    const normalizedType = (type || 'info').toLowerCase();
    const canonicalType = normalizedType === 'danger' ? 'error' : normalizedType;
    const dedupKey = `${canonicalType}::${String(message).trim()}`;

    // Chống hiển thị thông báo trùng lặp đang còn mở
    if (activeToastMap.has(dedupKey)) {
      const existing = activeToastMap.get(dedupKey);
      if (existing && existing.el && existing.el.isConnected) {
        existing.resetTimer(duration);
        existing.el.classList.add('lumen-toast-pulse');
        setTimeout(() => existing.el.classList.remove('lumen-toast-pulse'), 180);
        return { dismiss: existing.dismiss };
      }
      activeToastMap.delete(dedupKey);
    }

    const colors = TOAST_COLORS[normalizedType] || TOAST_COLORS.info;
    const iconClass = TOAST_ICONS[normalizedType] || TOAST_ICONS.info;

    const defaultTitle = {
      success: 'Thành công',
      error: 'Có lỗi xảy ra',
      danger: 'Cảnh báo lỗi',
      warning: 'Cảnh báo',
      info: 'Thông tin'
    }[normalizedType] || 'Thông báo';

    const headerTitle = title || defaultTitle;
    const container = getOrCreateContainer();

    // Giới hạn số lượng toast cùng lúc để không che nội dung
    while (container.children.length >= MAX_TOASTS) {
      const oldest = container.firstElementChild;
      if (!oldest) break;
      if (oldest._lumenDismiss) {
        oldest._lumenDismiss(true);
      } else {
        oldest.remove();
      }
    }

    const toast = document.createElement('div');
    toast.className = 'lumen-toast-card';
    toast.setAttribute('role', canonicalType === 'error' ? 'alert' : 'status');
    toast.style.border = `1px solid ${colors.border}`;
    toast.style.boxShadow = `0 16px 36px -8px rgba(0, 0, 0, 0.8), 0 0 22px ${colors.glow}`;

    toast.innerHTML = `
      <div class="lumen-toast-icon-box" style="background: ${colors.iconBg}; color: ${colors.icon};">
        <i class="${iconClass}"></i>
      </div>
      <div class="lumen-toast-body">
        <div class="lumen-toast-title" style="color: ${colors.icon};">
          ${escapeHtml(headerTitle)}
        </div>
        <div class="lumen-toast-message">
          ${escapeHtml(message)}
        </div>
      </div>
      <button type="button" aria-label="Đóng thông báo" class="toast-close-btn">
        <i class="fa-solid fa-xmark"></i>
      </button>
      <div class="toast-progress-bar" style="background: ${colors.bar};"></div>
    `;

    container.appendChild(toast);

    let dismissTimeout = null;
    let isDismissed = false;

    function startProgressBar(ms) {
      const bar = toast.querySelector('.toast-progress-bar');
      if (!bar) return;
      bar.style.transition = 'none';
      bar.style.transform = 'scaleX(1)';
      if (ms > 0) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            bar.style.transition = `transform ${ms}ms linear`;
            bar.style.transform = 'scaleX(0)';
          });
        });
      }
    }

    function dismiss(immediate = false) {
      if (isDismissed) return;
      isDismissed = true;
      if (dismissTimeout) clearTimeout(dismissTimeout);
      if (activeToastMap.get(dedupKey)?.el === toast) {
        activeToastMap.delete(dedupKey);
      }
      if (immediate) {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
        return;
      }
      toast.classList.remove('lumen-toast-visible');
      setTimeout(() => {
        if (toast && toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 240);
    }

    function resetTimer(ms) {
      if (dismissTimeout) clearTimeout(dismissTimeout);
      startProgressBar(ms);
      if (ms > 0) {
        dismissTimeout = setTimeout(() => dismiss(false), ms);
      }
    }

    toast._lumenDismiss = dismiss;
    activeToastMap.set(dedupKey, { el: toast, dismiss, resetTimer });

    requestAnimationFrame(() => {
      toast.classList.add('lumen-toast-visible');
    });

    const closeBtn = toast.querySelector('.toast-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dismiss(false);
      });
    }

    resetTimer(duration);

    return {
      dismiss: () => dismiss(false)
    };
  }

  window.showToast = showToast;
  window.showNotification = showToast;
  window.LumenToast = {
    show: showToast,
    success: (msg, duration = 3500, title = '') => showToast(msg, 'success', duration, title),
    error: (msg, duration = 4000, title = '') => showToast(msg, 'error', duration, title),
    warning: (msg, duration = 3800, title = '') => showToast(msg, 'warning', duration, title),
    info: (msg, duration = 3500, title = '') => showToast(msg, 'info', duration, title)
  };
})();
