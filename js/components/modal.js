/**
 * ==========================================================================
 * LUMEN CINEMA - GLOBAL MODAL SYSTEM (js/components/modal.js)
 * Hệ thống Alert Modal, Confirm Modal và Prompt/Input Modal dùng chung toàn website
 * - Thiết kế Dark UI đồng bộ thương hiệu LUMEN CINEMA:
 *   + Nền Modal: #211B22 | Nền phụ: #2D252D | Chữ chính: #FFFFFF
 *   + Nút xác nhận chính: #E83E75 | Nút hủy: #45404A
 *   + Nút thành công: #16A34A | Nút xóa nguy hiểm: #DC3545 | Nút thử lại: #F59E0B
 * - Hỗ trợ Promise & async/await, loading state, chống nhấn nhiều lần
 * - Hỗ trợ bàn phím (ESC, Enter an toàn, Tab focus trap) & Responsive mọi thiết bị
 * ==========================================================================
 */

(function () {
  'use strict';

  const STYLE_ID = 'lumen-modal-system-styles';
  const BACKDROP_ID = 'lumen-global-modal-backdrop';

  const TYPE_CONFIG = {
    success: {
      icon: 'fa-solid fa-circle-check',
      iconColor: '#16A34A',
      iconBg: 'rgba(22, 163, 74, 0.16)',
      iconBorder: 'rgba(22, 163, 74, 0.45)',
      defaultTitle: 'Thành công!',
      defaultButtonText: 'Đóng',
      buttonVariant: 'success'
    },
    error: {
      icon: 'fa-solid fa-circle-xmark',
      iconColor: '#DC3545',
      iconBg: 'rgba(220, 53, 69, 0.16)',
      iconBorder: 'rgba(220, 53, 69, 0.45)',
      defaultTitle: 'Có lỗi xảy ra!',
      defaultButtonText: 'Đóng',
      buttonVariant: 'danger'
    },
    danger: {
      icon: 'fa-solid fa-triangle-exclamation',
      iconColor: '#DC3545',
      iconBg: 'rgba(220, 53, 69, 0.16)',
      iconBorder: 'rgba(220, 53, 69, 0.45)',
      defaultTitle: 'Cảnh báo!',
      defaultButtonText: 'Đóng',
      buttonVariant: 'danger'
    },
    warning: {
      icon: 'fa-solid fa-triangle-exclamation',
      iconColor: '#F59E0B',
      iconBg: 'rgba(245, 158, 11, 0.16)',
      iconBorder: 'rgba(245, 158, 11, 0.45)',
      defaultTitle: 'Cảnh báo!',
      defaultButtonText: 'Đã hiểu',
      buttonVariant: 'retry'
    },
    info: {
      icon: 'fa-solid fa-circle-info',
      iconColor: '#E83E75',
      iconBg: 'rgba(232, 62, 117, 0.16)',
      iconBorder: 'rgba(232, 62, 117, 0.45)',
      defaultTitle: 'Thông báo',
      defaultButtonText: 'Đã hiểu',
      buttonVariant: 'primary'
    }
  };

  let activeModalState = null;
  let modalQueue = Promise.resolve();

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${BACKDROP_ID} {
        position: fixed;
        inset: 0;
        z-index: 1000000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        background: rgba(11, 8, 12, 0.78);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.22s ease, visibility 0.22s ease;
        box-sizing: border-box;
      }

      #${BACKDROP_ID}.lumen-modal-open {
        opacity: 1;
        visibility: visible;
      }

      .lumen-modal-dialog {
        width: 100%;
        max-width: 440px;
        max-height: calc(100vh - 32px);
        max-height: calc(100dvh - 32px);
        background: #211B22;
        color: #FFFFFF;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 18px;
        box-shadow: 0 24px 64px rgba(0, 0, 0, 0.72), 0 0 0 1px rgba(255, 255, 255, 0.04) inset;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        transform: translateY(12px) scale(0.96);
        opacity: 0;
        transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.22s ease;
        box-sizing: border-box;
        position: relative;
      }

      #${BACKDROP_ID}.lumen-modal-open .lumen-modal-dialog {
        transform: translateY(0) scale(1);
        opacity: 1;
      }

      .lumen-modal-close-x {
        position: absolute;
        top: 14px;
        right: 14px;
        width: 34px;
        height: 34px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: #2D252D;
        color: #D1C9D4;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 14px;
        transition: background-color 0.16s ease, color 0.16s ease, transform 0.12s ease;
        z-index: 2;
      }

      .lumen-modal-close-x:hover:not(:disabled) {
        background: #45404A;
        color: #FFFFFF;
      }

      .lumen-modal-close-x:active:not(:disabled) {
        transform: scale(0.94);
      }

      .lumen-modal-close-x:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }

      .lumen-modal-body {
        padding: 28px 24px 20px;
        overflow-y: auto;
        text-align: center;
        -webkit-overflow-scrolling: touch;
      }

      .lumen-modal-icon-wrap {
        width: 60px;
        height: 60px;
        border-radius: 16px;
        margin: 0 auto 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 26px;
      }

      .lumen-modal-title {
        margin: 0 0 8px;
        padding: 0 24px;
        font-size: 1.1875rem;
        font-weight: 800;
        line-height: 1.35;
        color: #FFFFFF;
        letter-spacing: -0.01em;
      }

      .lumen-modal-message {
        margin: 0;
        font-size: 0.925rem;
        line-height: 1.55;
        color: #E2DCE5;
        white-space: pre-line;
        word-break: break-word;
      }

      .lumen-modal-details {
        margin-top: 16px;
        padding: 12px 14px;
        background: #2D252D;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        text-align: left;
        display: flex;
        flex-direction: column;
        gap: 8px;
        font-size: 0.84rem;
      }

      .lumen-modal-detail-row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 12px;
      }

      .lumen-modal-detail-label {
        color: #B6ACB9;
        flex-shrink: 0;
      }

      .lumen-modal-detail-value {
        color: #FFFFFF;
        font-weight: 600;
        text-align: right;
        word-break: break-word;
      }

      .lumen-modal-input-group {
        margin-top: 16px;
        text-align: left;
      }

      .lumen-modal-input-label {
        display: block;
        margin-bottom: 6px;
        font-size: 0.84rem;
        font-weight: 600;
        color: #FFFFFF;
      }

      .lumen-modal-input {
        width: 100%;
        min-height: 44px;
        padding: 10px 14px;
        background: #2D252D;
        color: #FFFFFF;
        border: 1px solid rgba(255, 255, 255, 0.16);
        border-radius: 12px;
        font-size: 0.95rem;
        font-family: inherit;
        outline: none;
        box-sizing: border-box;
        transition: border-color 0.16s ease, box-shadow 0.16s ease;
      }

      .lumen-modal-input:focus {
        border-color: #E83E75;
        box-shadow: 0 0 0 3px rgba(232, 62, 117, 0.25);
      }

      .lumen-modal-input.is-invalid {
        border-color: #DC3545;
        box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.25);
      }

      .lumen-modal-input-error {
        margin-top: 6px;
        font-size: 0.8125rem;
        font-weight: 500;
        color: #FF8A95;
        display: none;
      }

      .lumen-modal-input-error.visible {
        display: block;
      }

      .lumen-modal-footer {
        padding: 16px 24px 22px;
        background: #2D252D;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        flex-wrap: wrap;
      }

      .lumen-modal-btn {
        flex: 1 1 130px;
        min-height: 44px;
        padding: 10px 18px;
        border: none;
        border-radius: 12px;
        font-family: inherit;
        font-size: 0.925rem;
        font-weight: 700;
        color: #FFFFFF;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: background-color 0.16s ease, transform 0.12s ease, opacity 0.16s ease, box-shadow 0.16s ease;
        box-sizing: border-box;
        text-decoration: none;
        line-height: 1.2;
      }

      .lumen-modal-btn:focus-visible {
        outline: 2px solid #FFFFFF;
        outline-offset: 2px;
      }

      .lumen-modal-btn:active:not(:disabled) {
        transform: scale(0.97);
      }

      .lumen-modal-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .lumen-btn-primary {
        background: #E83E75;
        color: #FFFFFF;
        box-shadow: 0 6px 18px rgba(232, 62, 117, 0.35);
      }
      .lumen-btn-primary:hover:not(:disabled) {
        background: #D63167;
      }

      .lumen-btn-cancel {
        background: #45404A;
        color: #FFFFFF;
      }
      .lumen-btn-cancel:hover:not(:disabled) {
        background: #554F5B;
      }

      .lumen-btn-success {
        background: #16A34A;
        color: #FFFFFF;
        box-shadow: 0 6px 18px rgba(22, 163, 74, 0.32);
      }
      .lumen-btn-success:hover:not(:disabled) {
        background: #15803D;
      }

      .lumen-btn-danger {
        background: #DC3545;
        color: #FFFFFF;
        box-shadow: 0 6px 18px rgba(220, 53, 69, 0.35);
      }
      .lumen-btn-danger:hover:not(:disabled) {
        background: #C82333;
      }

      .lumen-btn-retry {
        background: #F59E0B;
        color: #FFFFFF;
        box-shadow: 0 6px 18px rgba(245, 158, 11, 0.32);
      }
      .lumen-btn-retry:hover:not(:disabled) {
        background: #D97706;
      }

      @media (max-width: 480px) {
        #${BACKDROP_ID} {
          padding: 12px;
        }
        .lumen-modal-dialog {
          border-radius: 16px;
        }
        .lumen-modal-body {
          padding: 24px 16px 16px;
        }
        .lumen-modal-title {
          font-size: 1.08rem;
          padding: 0 20px;
        }
        .lumen-modal-footer {
          padding: 14px 16px 18px;
          gap: 10px;
        }
        .lumen-modal-btn {
          flex: 1 1 120px;
          font-size: 0.875rem;
          padding: 10px 14px;
        }
      }
    `;

    (document.head || document.documentElement).appendChild(style);
  }

  function getFocusableElements(container) {
    if (!container) return [];
    const selector = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.from(container.querySelectorAll(selector)).filter(el => el.offsetParent !== null);
  }

  function getVariantClass(variant) {
    switch (variant) {
      case 'cancel':
      case 'neutral':
        return 'lumen-btn-cancel';
      case 'success':
        return 'lumen-btn-success';
      case 'danger':
        return 'lumen-btn-danger';
      case 'retry':
      case 'warning':
        return 'lumen-btn-retry';
      case 'primary':
      default:
        return 'lumen-btn-primary';
    }
  }

  function renderDetailsHtml(details) {
    if (!Array.isArray(details) || details.length === 0) return '';
    const rows = details
      .filter(d => d && d.label !== undefined && d.value !== undefined)
      .map(d => `
        <div class="lumen-modal-detail-row">
          <span class="lumen-modal-detail-label">${escapeHtml(d.label)}:</span>
          <span class="lumen-modal-detail-value">${escapeHtml(d.value)}</span>
        </div>
      `)
      .join('');
    return rows ? `<div class="lumen-modal-details">${rows}</div>` : '';
  }

  function enqueueModal(factory) {
    const run = modalQueue.then(() => factory());
    modalQueue = run.catch(() => {});
    return run;
  }

  function openModalInternal(config) {
    return new Promise((resolve) => {
      if (typeof document === 'undefined' || !document.body) {
        resolve(config.mode === 'confirm' ? false : config.mode === 'prompt' ? null : undefined);
        return;
      }

      injectStyles();

      // Dọn dẹp backdrop cũ nếu còn sót
      const existing = document.getElementById(BACKDROP_ID);
      if (existing && existing.parentNode) {
        existing.parentNode.removeChild(existing);
      }

      const previousActiveElement = document.activeElement;
      const previousBodyOverflow = document.body.style.overflow;

      const backdrop = document.createElement('div');
      backdrop.id = BACKDROP_ID;
      backdrop.setAttribute('role', 'presentation');

      const dialog = document.createElement('div');
      dialog.className = 'lumen-modal-dialog';
      dialog.setAttribute('role', config.mode === 'alert' ? 'alertdialog' : 'dialog');
      dialog.setAttribute('aria-modal', 'true');
      dialog.setAttribute('aria-labelledby', 'lumen-modal-title');
      dialog.setAttribute('aria-describedby', 'lumen-modal-message');

      const typeInfo = TYPE_CONFIG[config.type] || TYPE_CONFIG.info;
      const titleText = config.title || typeInfo.defaultTitle;
      const messageText = config.message || '';
      const detailsHtml = renderDetailsHtml(config.details);

      let inputSectionHtml = '';
      if (config.mode === 'prompt') {
        const inputType = config.inputType || 'text';
        const minAttr = config.min !== undefined ? `min="${escapeHtml(config.min)}"` : '';
        const maxAttr = config.max !== undefined ? `max="${escapeHtml(config.max)}"` : '';
        const stepAttr = config.step !== undefined ? `step="${escapeHtml(config.step)}"` : '';
        const placeholderAttr = config.placeholder ? `placeholder="${escapeHtml(config.placeholder)}"` : '';
        const defaultVal = config.defaultValue !== undefined ? escapeHtml(config.defaultValue) : '';
        const labelHtml = config.inputLabel
          ? `<label class="lumen-modal-input-label" for="lumen-modal-prompt-input">${escapeHtml(config.inputLabel)}</label>`
          : '';

        inputSectionHtml = `
          <div class="lumen-modal-input-group">
            ${labelHtml}
            <input
              id="lumen-modal-prompt-input"
              class="lumen-modal-input"
              type="${escapeHtml(inputType)}"
              value="${defaultVal}"
              ${minAttr}
              ${maxAttr}
              ${stepAttr}
              ${placeholderAttr}
            />
            <div id="lumen-modal-prompt-error" class="lumen-modal-input-error" role="alert"></div>
          </div>
        `;
      }

      let footerHtml = '';
      if (config.mode === 'alert') {
        const btnText = config.confirmText || typeInfo.defaultButtonText;
        const btnClass = getVariantClass(config.variant || typeInfo.buttonVariant);
        const retryBtnHtml = config.retryText
          ? `<button type="button" id="lumen-modal-retry-btn" class="lumen-modal-btn lumen-btn-retry">${escapeHtml(config.retryText)}</button>`
          : '';
        footerHtml = `
          ${retryBtnHtml}
          <button type="button" id="lumen-modal-confirm-btn" class="lumen-modal-btn ${btnClass}">
            ${escapeHtml(btnText)}
          </button>
        `;
      } else {
        const cancelText = config.cancelText || 'Hủy';
        const confirmText = config.confirmText || (config.dangerous ? 'Xóa' : 'Xác nhận');
        const confirmVariant = config.variant || (config.dangerous ? 'danger' : 'primary');
        const confirmClass = getVariantClass(confirmVariant);
        footerHtml = `
          <button type="button" id="lumen-modal-cancel-btn" class="lumen-modal-btn lumen-btn-cancel">
            ${escapeHtml(cancelText)}
          </button>
          <button type="button" id="lumen-modal-confirm-btn" class="lumen-modal-btn ${confirmClass}">
            ${escapeHtml(confirmText)}
          </button>
        `;
      }

      dialog.innerHTML = `
        <button type="button" id="lumen-modal-close-x" class="lumen-modal-close-x" aria-label="Đóng hộp thoại">
          <i class="fa-solid fa-xmark"></i>
        </button>
        <div class="lumen-modal-body">
          <div class="lumen-modal-icon-wrap" style="background: ${typeInfo.iconBg}; border: 1px solid ${typeInfo.iconBorder}; color: ${typeInfo.iconColor};">
            <i class="${typeInfo.icon}"></i>
          </div>
          <h3 id="lumen-modal-title" class="lumen-modal-title">${escapeHtml(titleText)}</h3>
          <p id="lumen-modal-message" class="lumen-modal-message">${escapeHtml(messageText)}</p>
          ${detailsHtml}
          ${inputSectionHtml}
        </div>
        <div class="lumen-modal-footer">
          ${footerHtml}
        </div>
      `;

      backdrop.appendChild(dialog);
      document.body.appendChild(backdrop);
      document.body.style.overflow = 'hidden';

      const closeXBtn = dialog.querySelector('#lumen-modal-close-x');
      const cancelBtn = dialog.querySelector('#lumen-modal-cancel-btn');
      const confirmBtn = dialog.querySelector('#lumen-modal-confirm-btn');
      const retryBtn = dialog.querySelector('#lumen-modal-retry-btn');
      const promptInput = dialog.querySelector('#lumen-modal-prompt-input');
      const promptError = dialog.querySelector('#lumen-modal-prompt-error');

      let isClosed = false;
      let isProcessing = false;

      function setProcessing(loading) {
        isProcessing = loading;
        if (closeXBtn) closeXBtn.disabled = loading;
        if (cancelBtn) cancelBtn.disabled = loading;
        if (confirmBtn) {
          confirmBtn.disabled = loading;
          if (loading) {
            confirmBtn.dataset.originalHtml = confirmBtn.innerHTML;
            const loadingText = config.loadingText || 'Đang xử lý...';
            confirmBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>${escapeHtml(loadingText)}</span>`;
          } else if (confirmBtn.dataset.originalHtml) {
            confirmBtn.innerHTML = confirmBtn.dataset.originalHtml;
          }
        }
        if (promptInput) promptInput.disabled = loading;
      }

      function cleanupAndResolve(result) {
        if (isClosed) return;
        isClosed = true;
        activeModalState = null;

        document.removeEventListener('keydown', handleKeyDown, true);
        backdrop.classList.remove('lumen-modal-open');
        document.body.style.overflow = previousBodyOverflow;

        setTimeout(() => {
          if (backdrop.parentNode) {
            backdrop.parentNode.removeChild(backdrop);
          }
          if (previousActiveElement && typeof previousActiveElement.focus === 'function' && document.contains(previousActiveElement)) {
            try {
              previousActiveElement.focus();
            } catch (e) {}
          }
          resolve(result);
        }, 200);
      }

      function handleCancel() {
        if (isProcessing || isClosed) return;
        if (config.mode === 'confirm') cleanupAndResolve(false);
        else if (config.mode === 'prompt') cleanupAndResolve(null);
        else cleanupAndResolve(undefined);
      }

      async function handleConfirm() {
        if (isProcessing || isClosed) return;

        let valueToReturn = config.mode === 'confirm' ? true : undefined;

        if (config.mode === 'prompt' && promptInput) {
          const rawVal = promptInput.value;
          if (typeof config.validator === 'function') {
            const validationError = config.validator(rawVal);
            if (validationError) {
              promptInput.classList.add('is-invalid');
              if (promptError) {
                promptError.textContent = validationError;
                promptError.classList.add('visible');
              }
              promptInput.focus();
              return;
            }
          }
          promptInput.classList.remove('is-invalid');
          if (promptError) {
            promptError.textContent = '';
            promptError.classList.remove('visible');
          }
          valueToReturn = rawVal;
        }

        if (typeof config.onConfirm === 'function') {
          setProcessing(true);
          try {
            const callbackRes = await config.onConfirm(valueToReturn);
            if (callbackRes && callbackRes.keepOpen === true) {
              setProcessing(false);
              return;
            }
            cleanupAndResolve(config.mode === 'prompt' ? valueToReturn : true);
          } catch (err) {
            setProcessing(false);
            console.error('[LumenModal.onConfirm]', err);
            cleanupAndResolve(config.mode === 'prompt' ? null : false);
          }
        } else {
          cleanupAndResolve(valueToReturn);
        }
      }

      function handleKeyDown(e) {
        if (isClosed) return;

        if (e.key === 'Escape') {
          if (!isProcessing && config.closeOnEscape !== false) {
            e.preventDefault();
            e.stopPropagation();
            handleCancel();
          }
          return;
        }

        if (e.key === 'Tab') {
          const focusables = getFocusableElements(dialog);
          if (focusables.length === 0) return;
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
          return;
        }

        if (e.key === 'Enter') {
          if (isProcessing) {
            e.preventDefault();
            return;
          }
          // Nếu đang focus ở một button cụ thể, để trình duyệt tự trigger click của button đó
          if (document.activeElement && document.activeElement.tagName === 'BUTTON') {
            return;
          }
          if (config.mode === 'prompt' && document.activeElement === promptInput) {
            e.preventDefault();
            handleConfirm();
            return;
          }
          if (config.mode === 'alert') {
            e.preventDefault();
            handleConfirm();
            return;
          }
          // Với confirm: chỉ Enter xác nhận nếu KHÔNG phải thao tác nguy hiểm và không tắt confirmOnEnter
          if (config.mode === 'confirm' && !config.dangerous && config.confirmOnEnter !== false) {
            e.preventDefault();
            handleConfirm();
          }
        }
      }

      if (closeXBtn) closeXBtn.addEventListener('click', handleCancel);
      if (cancelBtn) cancelBtn.addEventListener('click', handleCancel);
      if (confirmBtn) confirmBtn.addEventListener('click', handleConfirm);

      if (retryBtn) {
        retryBtn.addEventListener('click', async () => {
          if (isProcessing || isClosed) return;
          if (typeof config.onRetry === 'function') {
            cleanupAndResolve('retry');
            await config.onRetry();
          } else {
            cleanupAndResolve('retry');
          }
        });
      }

      if (promptInput) {
        promptInput.addEventListener('input', () => {
          promptInput.classList.remove('is-invalid');
          if (promptError) {
            promptError.textContent = '';
            promptError.classList.remove('visible');
          }
        });
      }

      backdrop.addEventListener('click', (e) => {
        if (e.target !== backdrop || isProcessing) return;
        const allowBackdropClose = config.closeOnBackdrop !== undefined
          ? config.closeOnBackdrop
          : (config.mode === 'alert' || (!config.dangerous && config.mode === 'confirm'));
        if (allowBackdropClose) {
          handleCancel();
        }
      });

      document.addEventListener('keydown', handleKeyDown, true);

      activeModalState = {
        close: handleCancel
      };

      requestAnimationFrame(() => {
        backdrop.classList.add('lumen-modal-open');
        setTimeout(() => {
          if (isClosed) return;
          if (config.mode === 'prompt' && promptInput) {
            promptInput.focus();
            promptInput.select();
          } else if (config.mode === 'confirm' && config.dangerous && cancelBtn) {
            cancelBtn.focus();
          } else if (confirmBtn) {
            confirmBtn.focus();
          }
        }, 40);
      });
    });
  }

  /**
   * Hiển thị Alert Modal (Thông báo xác nhận đã đọc)
   * @param {object|string} optionsOrMessage
   * @param {'success'|'error'|'warning'|'info'} [type='info']
   * @param {string} [title='']
   */
  function showAlertModal(optionsOrMessage, type = 'info', title = '') {
    const opts = typeof optionsOrMessage === 'string'
      ? { message: optionsOrMessage, type, title }
      : { ...(optionsOrMessage || {}) };

    return enqueueModal(() => openModalInternal({
      mode: 'alert',
      type: opts.type || 'info',
      title: opts.title,
      message: opts.message || '',
      details: opts.details,
      confirmText: opts.confirmText,
      variant: opts.variant,
      retryText: opts.retryText,
      onRetry: opts.onRetry,
      closeOnBackdrop: opts.closeOnBackdrop !== undefined ? opts.closeOnBackdrop : true,
      closeOnEscape: opts.closeOnEscape !== undefined ? opts.closeOnEscape : true
    }));
  }

  /**
   * Hiển thị Confirm Modal (Hộp thoại lựa chọn Hủy / Xác nhận)
   * @param {object|string} optionsOrMessage
   * @returns {Promise<boolean>}
   */
  function showConfirmModal(optionsOrMessage) {
    const opts = typeof optionsOrMessage === 'string'
      ? { message: optionsOrMessage }
      : { ...(optionsOrMessage || {}) };

    const isDangerous = Boolean(opts.dangerous || opts.variant === 'danger');

    return enqueueModal(() => openModalInternal({
      mode: 'confirm',
      type: opts.type || (isDangerous ? 'danger' : 'warning'),
      title: opts.title || (isDangerous ? 'Xác nhận xóa' : 'Xác nhận thao tác'),
      message: opts.message || '',
      details: opts.details,
      confirmText: opts.confirmText || (isDangerous ? 'Xóa' : 'Xác nhận'),
      cancelText: opts.cancelText || 'Hủy',
      variant: opts.variant || (isDangerous ? 'danger' : 'primary'),
      dangerous: isDangerous,
      loadingText: opts.loadingText || 'Đang xử lý...',
      onConfirm: opts.onConfirm,
      closeOnBackdrop: opts.closeOnBackdrop,
      closeOnEscape: opts.closeOnEscape,
      confirmOnEnter: opts.confirmOnEnter
    }));
  }

  /**
   * Hiển thị Prompt / Input Modal (Thay thế prompt() mặc định)
   * @param {object} options
   * @returns {Promise<string|null>}
   */
  function showPromptModal(options = {}) {
    const opts = typeof options === 'string' ? { message: options } : { ...options };

    return enqueueModal(() => openModalInternal({
      mode: 'prompt',
      type: opts.type || 'info',
      title: opts.title || 'Nhập thông tin',
      message: opts.message || '',
      inputLabel: opts.inputLabel || '',
      inputType: opts.inputType || 'text',
      min: opts.min,
      max: opts.max,
      step: opts.step,
      defaultValue: opts.defaultValue !== undefined ? opts.defaultValue : '',
      placeholder: opts.placeholder || '',
      validator: opts.validator,
      confirmText: opts.confirmText || 'Xác nhận',
      cancelText: opts.cancelText || 'Hủy',
      variant: opts.variant || 'primary',
      loadingText: opts.loadingText || 'Đang xử lý...',
      onConfirm: opts.onConfirm,
      closeOnBackdrop: opts.closeOnBackdrop !== undefined ? opts.closeOnBackdrop : false,
      closeOnEscape: opts.closeOnEscape !== undefined ? opts.closeOnEscape : true
    }));
  }

  const LumenModal = {
    alert: showAlertModal,
    confirm: showConfirmModal,
    prompt: showPromptModal,
    success: (message, title = 'Thành công!', extra = {}) =>
      showAlertModal({ ...extra, type: 'success', title, message }),
    error: (message, title = 'Có lỗi xảy ra!', extra = {}) =>
      showAlertModal({ ...extra, type: 'error', title, message }),
    warning: (message, title = 'Cảnh báo!', extra = {}) =>
      showAlertModal({ ...extra, type: 'warning', title, message }),
    info: (message, title = 'Thông báo', extra = {}) =>
      showAlertModal({ ...extra, type: 'info', title, message }),
    close: () => {
      if (activeModalState && typeof activeModalState.close === 'function') {
        activeModalState.close();
      }
    }
  };

  window.LumenModal = LumenModal;
  window.showAlertModal = showAlertModal;
  window.showConfirmModal = showConfirmModal;
  window.showPromptModal = showPromptModal;
})();
