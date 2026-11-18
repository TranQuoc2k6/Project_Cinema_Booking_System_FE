/**
 * ==========================================================================
 * PAYMENT SERVICE (js/services/payment.service.js)
 * Quản lý các cổng thanh toán MoMo, VNPAY, Thẻ Quốc Tế và Cổng Sandbox (Task T3C6D00)
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
   * Lấy danh sách các phương thức thanh toán được hỗ trợ
   */
  async getPaymentMethods() {
    try {
      const baseUrl = this._getBaseUrl();
      const url = `${baseUrl}/api/payments/methods`;
      if (window.apiClient) {
        const res = await window.apiClient.get(url);
        return { success: true, data: res.data };
      }
      const res = await fetch(url, { headers: this._getHeaders() });
      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      }
    } catch (e) {
      console.warn('[PaymentService.getPaymentMethods] Sử dụng danh sách phương thức mặc định:', e);
    }

    // Danh sách mặc định nếu server chưa phản hồi
    return {
      success: true,
      data: [
        { code: 'MOMO', name: 'Ví Điện Tử MoMo', description: 'Quét mã QR MoMo hoặc thanh toán qua ứng dụng MoMo', icon: 'momo' },
        { code: 'VNPAY', name: 'Cổng VNPAY-QR', description: 'Thanh toán qua ứng dụng ngân hàng, thẻ ATM hoặc VNPAY-QR', icon: 'vnpay' },
        { code: 'VISA', name: 'Thẻ Quốc Tế (Visa / Mastercard)', description: 'Thẻ tín dụng/ghi nợ quốc tế bảo mật 3D-Secure', icon: 'visa' },
        { code: 'ZALOPAY', name: 'Ví ZaloPay', description: 'Thanh toán qua ví điện tử ZaloPay', icon: 'zalopay' }
      ]
    };
  },

  /**
   * Xử lý thanh toán mô phỏng (Sandbox) cập nhật trạng thái vé (Task T3C6D00)
   * @param {object} payload
   * @param {number} [payload.booking_id]
   * @param {string} [payload.booking_code]
   * @param {string} payload.payment_method - 'MOMO' | 'VNPAY' | 'VISA' | 'ZALOPAY'
   * @param {string} payload.status - 'SUCCESS' | 'FAILED'
   * @param {string} [payload.failure_reason]
   * @param {number} [payload.amount]
   * @returns {Promise<object>}
   */
  async processSandboxPayment(payload) {
    try {
      const baseUrl = this._getBaseUrl();
      const url = `${baseUrl}/api/payments/sandbox`;

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

      if (!res.ok) {
        return {
          success: false,
          message: data.detail || 'Lỗi xử lý giao dịch thanh toán mô phỏng',
          status: res.status
        };
      }

      return { success: true, data };
    } catch (error) {
      console.warn('[PaymentService.processSandboxPayment] Lỗi gọi API Backend, xử lý Client Fallback:', error);
      
      // Fallback Client Simulation nếu Backend chưa chạy
      const isSuccess = payload.status === 'SUCCESS';
      const mockResult = {
        id: Math.floor(Math.random() * 10000) + 1,
        booking_id: payload.booking_id || 1,
        booking_code: payload.booking_code || `BK-${Date.now()}`,
        amount: payload.amount || 180000,
        payment_method: payload.payment_method || 'MOMO',
        status: payload.status,
        transaction_id: `SANDBOX-${payload.payment_method}-${Date.now()}`,
        payment_time: new Date().toISOString(),
        message: isSuccess
          ? 'Thanh toán mô phỏng thành công! Đơn vé đã được xác nhận (DA_THANH_TOAN).'
          : `Thanh toán mô phỏng thất bại: ${payload.failure_reason || 'Người dùng hủy giao dịch'}.`,
        booking_status: isSuccess ? 'DA_THANH_TOAN' : 'GIU_CHO'
      };

      return { success: true, data: mockResult };
    }
  },

  /**
   * Tạo URL thanh toán (MoMo, VNPAY, etc.)
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
