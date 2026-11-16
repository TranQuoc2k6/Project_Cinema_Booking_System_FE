/**
 * ==========================================================================
 * PAYMENT SERVICE (js/services/payment.service.js)
 * Quản lý các cổng thanh toán MoMo, VNPAY, Thẻ Quốc Tế và xác thực giao dịch
 * ==========================================================================
 */

const PaymentService = {
  _getBaseUrl() {
    const raw = window.API_BASE_URL || 'http://127.0.0.1:8000/api/v1';
    return raw.replace(/\/api\/v1\/?$/, '');
  },

  _getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = window.StorageService ? window.StorageService.getToken() : localStorage.getItem('token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  },

  /**
   * Tạo URL thanh toán (MoMo, VNPAY, etc.)
   * @param {object} payload { booking_id, amount, payment_method, return_url }
   * @returns {Promise<object>}
   */
  async createPaymentUrl(payload) {
    try {
      const baseUrl = this._getBaseUrl();
      const url = `${baseUrl}/api/payments/create-url`;
      if (window.apiClient) {
        const res = await window.apiClient.post(url, payload);
        return { success: true, data: res.data };
      }
      const res = await fetch(url, {
        method: 'POST',
        headers: this._getHeaders(),
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Lỗi khi tạo liên kết thanh toán');
      return { success: true, data };
    } catch (error) {
      console.warn('[PaymentService.createPaymentUrl]', error.message);
      return {
        success: false,
        message: error.response?.data?.detail || error.message || 'Lỗi cổng thanh toán'
      };
    }
  },

  /**
   * Xác nhận kết quả thanh toán từ callback
   * @param {object} params query params trả về từ cổng thanh toán
   * @returns {Promise<object>}
   */
  async verifyPayment(params) {
    try {
      const baseUrl = this._getBaseUrl();
      const queryStr = new URLSearchParams(params).toString();
      const url = `${baseUrl}/api/payments/verify?${queryStr}`;
      if (window.apiClient) {
        const res = await window.apiClient.get(url);
        return { success: true, data: res.data };
      }
      const res = await fetch(url, { headers: this._getHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Xác thực thanh toán thất bại');
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || error.message
      };
    }
  }
};

window.PaymentService = PaymentService;
