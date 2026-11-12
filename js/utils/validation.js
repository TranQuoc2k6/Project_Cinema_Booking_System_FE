/**
 * ==========================================================================
 * VALIDATION HELPER (js/utils/validation.js)
 * Bộ công cụ kiểm tra tính hợp lệ dữ liệu biểu mẫu (Client-side Form Validation)
 * ==========================================================================
 */

const Validation = {
  // Regex kiểm tra email chuẩn
  EMAIL_REGEX: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,

  // Regex kiểm tra số điện thoại Việt Nam (10 số, bắt đầu 0 hoặc +84)
  PHONE_REGEX: /^(0|\+84)[0-9]{9}$/,

  /**
   * Kiểm tra chuỗi rỗng
   */
  isEmpty(val) {
    return val === null || val === undefined || String(val).trim() === '';
  },

  /**
   * Kiểm tra định dạng Email
   */
  isValidEmail(email) {
    if (this.isEmpty(email)) return false;
    return this.EMAIL_REGEX.test(String(email).trim());
  },

  /**
   * Kiểm tra định dạng Số điện thoại Việt Nam
   */
  isValidPhone(phone) {
    if (this.isEmpty(phone)) return true; // Phone là optional trong một số form
    return this.PHONE_REGEX.test(String(phone).trim());
  },

  /**
   * Kiểm tra độ dài mật khẩu (tối thiểu 6 ký tự theo backend)
   */
  isValidPassword(password, minLength = 6) {
    if (this.isEmpty(password)) return false;
    return String(password).length >= minLength;
  },

  /**
   * Hiển thị thông báo lỗi dưới ô input
   * @param {string|HTMLElement} input - ID của input hoặc chính thẻ input
   * @param {string} message - Nội dung thông báo lỗi
   */
  showError(input, message) {
    const inputEl = typeof input === 'string' ? document.getElementById(input) : input;
    if (!inputEl) return;

    inputEl.classList.add('is-invalid');
    inputEl.classList.remove('is-valid');

    let feedbackEl = inputEl.parentElement.querySelector('.invalid-feedback');
    if (!feedbackEl) {
      feedbackEl = document.createElement('div');
      feedbackEl.className = 'invalid-feedback';
      feedbackEl.style.cssText = 'color: #ef4444; font-size: 12px; margin-top: 4px; display: block;';
      inputEl.parentElement.appendChild(feedbackEl);
    }
    feedbackEl.textContent = message;
    feedbackEl.style.display = 'block';
  },

  /**
   * Xóa thông báo lỗi của một ô input
   */
  clearError(input) {
    const inputEl = typeof input === 'string' ? document.getElementById(input) : input;
    if (!inputEl) return;

    inputEl.classList.remove('is-invalid');
    const feedbackEl = inputEl.parentElement.querySelector('.invalid-feedback');
    if (feedbackEl) {
      feedbackEl.textContent = '';
      feedbackEl.style.display = 'none';
    }
  },

  /**
   * Xóa sạch lỗi của tất cả ô input trong một form
   */
  clearAllErrors(form) {
    const formEl = typeof form === 'string' ? document.getElementById(form) : form;
    if (!formEl) return;

    formEl.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    formEl.querySelectorAll('.invalid-feedback').forEach(el => {
      el.textContent = '';
      el.style.display = 'none';
    });
  }
};

window.Validation = Validation;
