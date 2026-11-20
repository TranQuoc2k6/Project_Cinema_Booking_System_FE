/**
 * ==========================================================================
 * PAYMENT PAGE CONTROLLER (js/pages/payment.js)
 * Điều khiển trang thanh toán, lựa chọn cổng thanh toán, hiển thị Cổng Sandbox
 * mô phỏng kết quả THÀNH CÔNG / THẤT BẠI và cập nhật trạng thái vé (Task T3C6D00)
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  let bookingData = null;
  let selectedMethod = 'MOMO';
  let sandboxTimer = null;
  let sandboxSeconds = 900; // 15 phút đếm ngược phiên giao dịch

  // 1. Nạp thông tin đặt vé từ sessionStorage
  function loadBookingInfo() {
    const raw = sessionStorage.getItem('current_booking');
    if (raw) {
      try {
        bookingData = JSON.parse(raw);
      } catch (e) {
        console.warn('[Payment] Lỗi parse current_booking:', e);
      }
    }

    if (!bookingData) {
      bookingData = {
        bookingId: 1,
        bookingCode: 'BK-LUMEN-20261118',
        movieTitle: 'Dune: Hành Tinh Cát 2 (IMAX 3D Laser)',
        cinema: 'CGV Landmark 81',
        showtime: '18:30 (Hôm nay)',
        seats: ['A1', 'A2'],
        totalPrice: 180000
      };
    }

    // Hiển thị thông tin lên giao diện
    const movieEl = document.getElementById('pay-movie');
    const cinemaEl = document.getElementById('pay-cinema');
    const showtimeEl = document.getElementById('pay-showtime');
    const seatsEl = document.getElementById('pay-seats');
    const totalEl = document.getElementById('pay-total');

    if (movieEl) movieEl.innerText = bookingData.movieTitle;
    if (cinemaEl) cinemaEl.innerText = bookingData.cinema;
    if (showtimeEl) showtimeEl.innerText = bookingData.showtime;
    if (seatsEl) {
      const seatsStr = Array.isArray(bookingData.seats) ? bookingData.seats.join(', ') : bookingData.seats;
      const count = Array.isArray(bookingData.seats) ? bookingData.seats.length : 1;
      seatsEl.innerText = `${seatsStr} (${count} ghế)`;
    }
    if (totalEl) {
      totalEl.innerText = Number(bookingData.totalPrice).toLocaleString('vi-VN') + ' đ';
    }

    // Điền sẵn thông tin khách hàng nếu đã đăng nhập
    if (window.StorageService && window.StorageService.isAuthenticated()) {
      const user = window.StorageService.getUser();
      if (user) {
        const nameInput = document.getElementById('pay-name');
        const emailInput = document.getElementById('pay-email');
        if (nameInput && !nameInput.value) nameInput.value = user.full_name || '';
        if (emailInput && !emailInput.value) emailInput.value = user.email || '';
      }
    }
  }

  // 2. Bắt sự kiện chọn phương thức thanh toán
  function initPaymentMethods() {
    const methodCards = document.querySelectorAll('.payment-method-card');
    methodCards.forEach(card => {
      card.addEventListener('click', () => {
        methodCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        const radio = card.querySelector('input[type="radio"]');
        if (radio) {
          radio.checked = true;
          selectedMethod = radio.value;
        }
      });
    });
  }

  // 3. Mở Cổng Thanh Toán Mô Phỏng (Sandbox Modal)
  window.handleOpenSandbox = function() {
    const nameInput = document.getElementById('pay-name');
    const emailInput = document.getElementById('pay-email');
    const name = nameInput ? nameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';

    if (!name || !email) {
      alert('Vui lòng nhập Họ tên và Email để nhận vé điện tử!');
      if (nameInput && !name) nameInput.focus();
      else if (emailInput) emailInput.focus();
      return;
    }

    // Cập nhật thông tin vào Modal Sandbox
    const modal = document.getElementById('sandbox-modal');
    if (!modal) return;

    const modalCodeEl = document.getElementById('sandbox-booking-code');
    const modalAmountEl = document.getElementById('sandbox-amount');
    const modalMethodEl = document.getElementById('sandbox-method-name');
    const modalMethodIcon = document.getElementById('sandbox-method-icon');

    const bookingCode = bookingData.bookingCode || `BK-${Date.now()}`;
    const amountFormatted = Number(bookingData.totalPrice).toLocaleString('vi-VN') + ' đ';

    if (modalCodeEl) modalCodeEl.innerText = bookingCode;
    if (modalAmountEl) modalAmountEl.innerText = amountFormatted;

    // Đổi hiển thị thương hiệu cổng thanh toán
    if (modalMethodEl) {
      if (selectedMethod === 'MOMO') modalMethodEl.innerText = 'CỔNG THANH TOÁN MOMO';
      else if (selectedMethod === 'VNPAY') modalMethodEl.innerText = 'CỔNG THANH TOÁN VNPAY-QR';
      else if (selectedMethod === 'VISA') modalMethodEl.innerText = 'CỔNG THANH TOÁN QUỐC TẾ VISA/MASTERCARD';
      else modalMethodEl.innerText = 'CỔNG THANH TOÁN ZALOPAY';
    }

    if (modalMethodIcon) {
      if (selectedMethod === 'MOMO') modalMethodIcon.className = 'fa-solid fa-wallet text-pink-500 text-xl';
      else if (selectedMethod === 'VNPAY') modalMethodIcon.className = 'fa-solid fa-qrcode text-blue-400 text-xl';
      else if (selectedMethod === 'VISA') modalMethodIcon.className = 'fa-brands fa-cc-visa text-cyan-400 text-xl';
      else modalMethodIcon.className = 'fa-solid fa-money-bill-transfer text-emerald-400 text-xl';
    }

    // Đặt lại màn hình sandbox về trạng thái chờ
    document.getElementById('sandbox-process-view').classList.remove('hidden');
    document.getElementById('sandbox-success-view').classList.add('hidden');
    document.getElementById('sandbox-failure-view').classList.add('hidden');

    // Bắt đầu đếm ngược phiên giao dịch (15 phút)
    startSandboxTimer();

    // Hiển thị modal
    modal.classList.remove('hidden');
  };

  // 4. Đóng Modal Sandbox
  window.handleCloseSandbox = function() {
    const modal = document.getElementById('sandbox-modal');
    if (modal) modal.classList.add('hidden');
    stopSandboxTimer();
  };

  // 5. Đồng hồ đếm ngược phiên giao dịch
  function startSandboxTimer() {
    stopSandboxTimer();
    sandboxSeconds = 900;
    const timerEl = document.getElementById('sandbox-timer');

    sandboxTimer = setInterval(() => {
      sandboxSeconds--;
      if (timerEl) {
        const m = Math.floor(sandboxSeconds / 60);
        const s = sandboxSeconds % 60;
        timerEl.innerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      }

      if (sandboxSeconds <= 0) {
        stopSandboxTimer();
        alert('Phiên giao dịch thanh toán đã hết hạn! Ghế đã được tự động giải phóng.');
        window.handleCloseSandbox();
        window.location.href = 'showtimes.html';
      }
    }, 1000);
  }

  function stopSandboxTimer() {
    if (sandboxTimer) {
      clearInterval(sandboxTimer);
      sandboxTimer = null;
    }
  }

  // 6. Xử lý MÔ PHỎNG THÀNH CÔNG (Simulate Success)
  window.handleSimulateSuccess = async function() {
    stopSandboxTimer();
    const btnSuccess = document.getElementById('btn-simulate-success');
    if (btnSuccess) {
      btnSuccess.innerHTML = '<i class="fa-solid fa-spinner animate-spin"></i> ĐANG XỬ LÝ...';
      btnSuccess.setAttribute('disabled', 'true');
    }

    const payload = {
      booking_id: bookingData.bookingId || null,
      booking_code: bookingData.bookingCode || null,
      payment_method: selectedMethod,
      status: 'SUCCESS',
      amount: bookingData.totalPrice
    };

    let result = null;
    if (window.PaymentService && typeof window.PaymentService.processSandboxPayment === 'function') {
      result = await window.PaymentService.processSandboxPayment(payload);
    }

    // Cập nhật trạng thái vé sang DA_THANH_TOAN
    bookingData.status = 'DA_THANH_TOAN';
    bookingData.paymentStatus = 'SUCCESS';
    bookingData.transactionId = result?.data?.transaction_id || `SANDBOX-${selectedMethod}-${Date.now()}`;
    bookingData.customerName = document.getElementById('pay-name').value;
    bookingData.customerEmail = document.getElementById('pay-email').value;

    // Lưu vào danh sách vé của tôi (sessionStorage)
    try {
      const ticketsKey = 'user_my_tickets';
      let tickets = [];
      const cached = localStorage.getItem(ticketsKey) || sessionStorage.getItem(ticketsKey);
      if (cached) tickets = JSON.parse(cached);
      tickets.unshift(bookingData);
      localStorage.setItem(ticketsKey, JSON.stringify(tickets));
    } catch (e) {}

    // Hiển thị Màn hình Thành công
    document.getElementById('sandbox-process-view').classList.add('hidden');
    document.getElementById('sandbox-success-view').classList.remove('hidden');

    const successCode = document.getElementById('success-ticket-code');
    const successEmail = document.getElementById('success-user-email');
    if (successCode) successCode.innerText = bookingData.bookingCode || 'BK-LUMEN-SUCCESS';
    if (successEmail) successEmail.innerText = bookingData.customerEmail || 'email của bạn';

    const myTicketsLink = document.querySelector('a[href*="my-tickets.html"]');
    if (myTicketsLink && bookingData.bookingCode) {
      myTicketsLink.href = `my-tickets.html?booking_code=${encodeURIComponent(bookingData.bookingCode)}`;
    }

    // Xóa giỏ vé tạm
    sessionStorage.removeItem('current_booking');
  };

  // 7. Xử lý MÔ PHỎNG THẤT BẠI (Simulate Failure)
  window.handleSimulateFailure = async function() {
    const reasonSelect = document.getElementById('sandbox-failure-reason');
    const failureReason = reasonSelect ? reasonSelect.value : 'Tài khoản không đủ số dư để thanh toán';

    const payload = {
      booking_id: bookingData.bookingId || null,
      booking_code: bookingData.bookingCode || null,
      payment_method: selectedMethod,
      status: 'FAILED',
      failure_reason: failureReason,
      amount: bookingData.totalPrice
    };

    if (window.PaymentService && typeof window.PaymentService.processSandboxPayment === 'function') {
      await window.PaymentService.processSandboxPayment(payload);
    }

    // Hiển thị Màn hình Thất bại
    document.getElementById('sandbox-process-view').classList.add('hidden');
    document.getElementById('sandbox-failure-view').classList.remove('hidden');

    const failReasonEl = document.getElementById('failure-reason-text');
    if (failReasonEl) failReasonEl.innerText = failureReason;
  };

  // 8. Thử lại thanh toán sau khi thất bại
  window.handleRetryPayment = function() {
    document.getElementById('sandbox-failure-view').classList.add('hidden');
    document.getElementById('sandbox-process-view').classList.remove('hidden');
    startSandboxTimer();
  };

  // Khởi chạy khi nạp trang
  loadBookingInfo();
  initPaymentMethods();
});
