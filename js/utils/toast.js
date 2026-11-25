/**
 * ==========================================================================
 * LUMEN CINEMA - GLOBAL TOAST NOTIFICATION SYSTEM (js/utils/toast.js)
 * Hệ thống thông báo dùng chung toàn bộ Frontend:
 * - 4 Trạng thái: success, error/danger, warning, info
 * - Tự động biến mất (Auto dismiss) kèm thanh tiến trình Neon trực quan
 * - Nút đóng thủ công (Manual close)
 * - Thiết kế Glassmorphism Obsidian & Neon Glow chuẩn LUMEN CINEMA
 * - Responsive 100% trên Desktop, Laptop, Tablet và Mobile
 * ==========================================================================
 */

(function () {
  'use strict';

  const TOAST_ICONS = {
    success: 'fa-solid fa-circle-check',
    error: 'fa-solid fa-circle-xmark',
    danger: 'fa-solid fa-circle-xmark',
    warning: 'fa-solid fa-triangle-exclamation',
    info: 'fa-solid fa-circle-info'
  };

  const TOAST_COLORS = {
    success: {
      border: 'rgba(16, 185, 129, 0.6)',
      glow: 'rgba(16, 185, 129, 0.25)',
      icon: '#34d399',
      bar: 'linear-gradient(90deg, #10b981, #34d399)'
    },
    error: {
      border: 'rgba(244, 63, 94, 0.65)',
      glow: 'rgba(244, 63, 94, 0.25)',
      icon: '#fb7185',
      bar: 'linear-gradient(90deg, #f43f5e, #fb7185)'
    },
    danger: {
      border: 'rgba(244, 63, 94, 0.65)',
      glow: 'rgba(244, 63, 94, 0.25)',
      icon: '#fb7185',
      bar: 'linear-gradient(90deg, #f43f5e, #fb7185)'
    },
    warning: {
      border: 'rgba(245, 158, 11, 0.65)',
      glow: 'rgba(245, 158, 11, 0.25)',
      icon: '#fbbf24',
      bar: 'linear-gradient(90deg, #f59e0b, #fbbf24)'
    },
    info: {
      border: 'rgba(255, 94, 30, 0.6)',
      glow: 'rgba(255, 94, 30, 0.25)',
      icon: '#ff5e1e',
      bar: 'linear-gradient(90deg, #ff5e1e, #d4ff00)'
    }
  };

  function getOrCreateContainer() {
    let container = document.getElementById('cinema-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'cinema-toast-container';
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('role', 'region');
      container.setAttribute('aria-label', 'Thông báo hệ thống');
      container.style.cssText = [
        'position: fixed',
        'top: 24px',
        'right: 24px',
        'z-index: 999999',
        'display: flex',
        'flex-direction: column',
        'gap: 12px',
        'max-width: 420px',
        'width: calc(100% - 48px)',
        'pointer-events: none',
        'box-sizing: border-box'
      ].join(';');
      document.body.appendChild(container);
    }
    return container;
  }

  /**
   * Hiển thị thông báo Toast
   * @param {string} message - Nội dung thông báo
   * @param {'success'|'error'|'danger'|'warning'|'info'} [type='info'] - Loại thông báo
   * @param {number} [duration=3500] - Thời gian tự biến mất (ms)
   * @param {string} [title=''] - Tiêu đề tùy chọn
   */
  function showToast(message, type = 'info', duration = 3500, title = '') {
    if (!message) return;

    const normalizedType = (type || 'info').toLowerCase();
    const colors = TOAST_COLORS[normalizedType] || TOAST_COLORS.info;
    const iconClass = TOAST_ICONS[normalizedType] || TOAST_ICONS.info;

    const defaultTitle = {
      success: 'Thành Công',
      error: 'Có Lỗi Xảy Ra',
      danger: 'Cảnh Báo Lỗi',
      warning: 'Chú Ý',
      info: 'Thông Tin'
    }[normalizedType] || 'Thông Báo';

    const headerTitle = title || defaultTitle;
    const container = getOrCreateContainer();

    const toast = document.createElement('div');
    toast.className = 'lumen-toast-card';
    toast.style.cssText = [
      'pointer-events: auto',
      'position: relative',
      'width: 100%',
      'background: rgba(11, 15, 25, 0.95)',
      'backdrop-filter: blur(20px)',
      '-webkit-backdrop-filter: blur(20px)',
      `border: 1px solid ${colors.border}`,
      `box-shadow: 0 16px 36px -8px rgba(0, 0, 0, 0.8), 0 0 24px ${colors.glow}`,
      'border-radius: 16px',
      'padding: 14px 16px',
      'display: flex',
      'align-items: flex-start',
      'gap: 12px',
      'color: #f8fafc',
      'font-family: Inter, -apple-system, sans-serif',
      'transform: translateY(-16px) scale(0.96)',
      'opacity: 0',
      'transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.24s ease',
      'overflow: hidden',
      'box-sizing: border-box'
    ].join(';');

    toast.innerHTML = `
      <div style="flex-shrink: 0; margin-top: 2px; font-size: 1.15rem; color: ${colors.icon};">
        <i class="${iconClass}"></i>
      </div>
      <div style="flex: 1; min-width: 0; padding-right: 4px;">
        <div style="font-size: 0.825rem; font-weight: 800; letter-spacing: 0.02em; text-transform: uppercase; margin-bottom: 2px; color: ${colors.icon};">
          ${escapeHtml(headerTitle)}
        </div>
        <div style="font-size: 0.8rem; font-weight: 500; color: #cbd5e1; line-height: 1.45; word-break: break-word;">
          ${escapeHtml(message)}
        </div>
      </div>
      <button type="button" aria-label="Đóng thông báo" class="toast-close-btn" style="flex-shrink: 0; background: transparent; border: 0; color: #94a3b8; font-size: 0.9rem; cursor: pointer; padding: 2px 4px; border-radius: 6px; transition: color 0.15s ease;">
        <i class="fa-solid fa-xmark"></i>
      </button>
      <div class="toast-progress-bar" style="position: absolute; bottom: 0; left: 0; height: 3px; width: 100%; background: ${colors.bar}; transform-origin: left; transition: transform ${duration}ms linear;"></div>
    `;

    container.appendChild(toast);

    // Kích hoạt animation xuất hiện
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0) scale(1)';

      const bar = toast.querySelector('.toast-progress-bar');
      if (bar) {
        requestAnimationFrame(() => {
          bar.style.transform = 'scaleX(0)';
        });
      }
    });

    let dismissTimeout = null;

    function dismiss() {
      if (dismissTimeout) clearTimeout(dismissTimeout);
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-12px) scale(0.95)';
      setTimeout(() => {
        if (toast && toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 260);
    }

    const closeBtn = toast.querySelector('.toast-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dismiss();
      });
      closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.color = '#ffffff';
      });
      closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.color = '#94a3b8';
      });
    }

    if (duration > 0) {
      dismissTimeout = setTimeout(dismiss, duration);
    }

    return {
      dismiss
    };
  }

  function escapeHtml(str) {
    if (!str || typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Xuất ra phạm vi toàn cục
  window.showToast = showToast;
  window.showNotification = showToast;
})();
