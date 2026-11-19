/**
 * ==========================================================================
 * BOOKING PAGE CONTROLLER (js/pages/booking.js)
 * Điều khiển trang Đặt vé & Chọn ghế, tích hợp SeatMap, đếm ngược 10 phút,
 * tính tổng tiền tạm tính và chuyển tiếp thanh toán (Task T3C6AF7)
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const showtimeId = urlParams.get('showtimeId') || '1';
  let movieId = urlParams.get('movieId') || '1';
  let cinema = urlParams.get('cinema') || 'CGV Landmark 81';
  let time = urlParams.get('time') || '18:30';

  // 1. Kiểm tra cache thông tin suất chiếu từ trang Lịch chiếu (showtimes.html)
  let showtimeData = null;
  try {
    const cached = sessionStorage.getItem('selected_showtime');
    if (cached) {
      showtimeData = JSON.parse(cached);
    }
  } catch (e) {
    console.warn('[Booking] Lỗi đọc cache suất chiếu:', e);
  }

  // 2. Nếu chưa có showtimeData hoặc URL có id khác, nạp từ ShowtimeService
  if (!showtimeData || String(showtimeData.id) !== String(showtimeId)) {
    if (window.ShowtimeService && typeof window.ShowtimeService.getShowtimeById === 'function') {
      try {
        const res = await window.ShowtimeService.getShowtimeById(showtimeId);
        if (res && res.success && res.data) {
          showtimeData = res.data;
        }
      } catch (err) {
        console.warn('[Booking] Lỗi nạp chi tiết suất chiếu từ server:', err);
      }
    }
  }

  // Cập nhật thông tin đồng bộ
  if (showtimeData) {
    movieId = showtimeData.movie_id || movieId;
    cinema = showtimeData.cinema_name || cinema;
    time = showtimeData.start_time
      ? (window.FormatUtil ? window.FormatUtil.extractTime(showtimeData.start_time) : String(showtimeData.start_time).split(' ')[1] || time)
      : time;
  }

  // 3. Hiển thị thông tin lên giao diện Header & Summary
  const movieTitleEl = document.getElementById('booking-movie-title');
  const hallInfoEl = document.getElementById('booking-hall-info');
  const summaryMovieEl = document.getElementById('summary-movie');
  const summaryCinemaEl = document.getElementById('summary-cinema');
  const summaryShowtimeEl = document.getElementById('summary-showtime');
  const summarySeatsEl = document.getElementById('summary-seats');
  const summaryTotalEl = document.getElementById('summary-total');
  const checkoutBtn = document.getElementById('btn-checkout');

  const movieName = (showtimeData?.movie_title || 'DUNE: HÀNH TINH CÁT 2').toUpperCase();
  const roomName = showtimeData?.room_name || 'Phòng Chiếu IMAX Laser 01';
  const formatName = showtimeData?.format || '2D Digital';

  if (movieTitleEl) movieTitleEl.innerText = movieName;
  if (summaryMovieEl) summaryMovieEl.innerText = movieName;
  if (summaryCinemaEl) summaryCinemaEl.innerText = cinema;
  if (summaryShowtimeEl) summaryShowtimeEl.innerText = `${time} (Hôm nay)`;
  if (hallInfoEl) {
    hallInfoEl.innerText = `${cinema} • ${roomName} (${formatName}) • Suất: ${time}`;
  }

  // 4. Khởi tạo SeatMap Component (10 phút đếm ngược, tối đa 8 ghế/lần)
  const seatMap = new SeatMap({
    container: '#seat-layout-grid',
    timerElement: '#countdown-timer',
    maxSeats: 8,
    holdMinutes: 10,
    onSelectionChange: (selectedSeats, totalAmount) => {
      // Cập nhật danh sách ghế đã chọn
      if (summarySeatsEl) {
        if (selectedSeats.length === 0) {
          summarySeatsEl.innerText = 'Chưa chọn ghế';
          summarySeatsEl.className = 'text-slate-400 font-mono';
        } else {
          const seatNames = selectedSeats.map(s => s.seat_number).join(', ');
          summarySeatsEl.innerText = `${seatNames} (${selectedSeats.length} ghế)`;
          summarySeatsEl.className = 'text-[#d4ff00] font-mono font-bold';
        }
      }

      // Cập nhật tổng tiền tạm tính
      if (summaryTotalEl) {
        summaryTotalEl.innerText = Number(totalAmount).toLocaleString('vi-VN') + ' đ';
      }

      // Cập nhật nút Checkout
      if (checkoutBtn) {
        if (selectedSeats.length > 0) {
          checkoutBtn.removeAttribute('disabled');
          checkoutBtn.classList.remove('opacity-50', 'cursor-not-allowed');
          checkoutBtn.innerHTML = `
            <i class="fa-solid fa-credit-card"></i>
            <span>TIẾP TỤC THANH TOÁN (${Number(totalAmount).toLocaleString('vi-VN')} đ)</span>
          `;
        } else {
          checkoutBtn.setAttribute('disabled', 'true');
          checkoutBtn.classList.add('opacity-50', 'cursor-not-allowed');
          checkoutBtn.innerHTML = `
            <i class="fa-solid fa-credit-card"></i>
            <span>VUI LÒNG CHỌN GHẾ</span>
          `;
        }
      }
    },
    onMaxExceeded: (maxLimit) => {
      showToast(`Bạn chỉ được chọn tối đa ${maxLimit} ghế mỗi lần đặt vé!`, 'warning');
    },
    onExpired: () => {
      showToast('Đã hết thời gian giữ ghế 10 phút. Hệ thống tự động hủy giữ chỗ để giải phóng ghế!', 'error');
      // Tải lại sơ đồ ghế
      seatMap.load(showtimeId);
    }
  });

  // Tải dữ liệu ghế cho suất chiếu
  await seatMap.load(showtimeId);

  // 5. Xử lý nút Tiếp Tục Thanh Toán
  window.proceedToPayment = async function() {
    const selectedSeats = seatMap.getSelectedSeats();
    const totalAmount = seatMap.getTotalAmount();

    if (!selectedSeats || selectedSeats.length === 0) {
      showToast('Vui lòng chọn ít nhất 1 ghế trước khi thanh toán!', 'warning');
      return;
    }

    // Kiểm tra đăng nhập bắt buộc
    if (!window.StorageService || !window.StorageService.isAuthenticated()) {
      showToast('Vui lòng đăng nhập tài khoản để tiếp tục thanh toán!', 'info');
      sessionStorage.setItem('cinema_redirect_url', window.location.href);
      sessionStorage.setItem('auth_error', 'Vui lòng đăng nhập để thanh toán đơn vé.');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1000);
      return;
    }

    // Thử gọi API giữ ghế (Task T3C6902: POST /api/bookings/hold)
    let holdResult = null;
    const seatIds = selectedSeats.map(s => {
      const num = parseInt(s.id, 10);
      return isNaN(num) ? 1 : num;
    });

    if (window.BookingService && typeof window.BookingService.createBooking === 'function') {
      try {
        const payload = {
          showtime_id: parseInt(showtimeId, 10),
          seat_ids: seatIds
        };
        holdResult = await window.BookingService.createBooking(payload);
      } catch (err) {
        console.warn('[Booking] Lỗi gọi API giữ ghế Backend, sử dụng chế độ Client Session:', err);
      }
    }

    // Lưu vào sessionStorage để payment.html hiển thị
    const bookingInfo = {
      showtimeId: showtimeId,
      movieTitle: movieName,
      cinema: cinema,
      showtime: `${time} (Hôm nay)`,
      seats: selectedSeats.map(s => s.seat_number),
      seatDetails: selectedSeats,
      totalPrice: totalAmount,
      bookingCode: holdResult?.data?.booking_code || `BK-${Date.now()}`
    };

    sessionStorage.setItem('current_booking', JSON.stringify(bookingInfo));

    // Chuyển sang trang thanh toán
    window.location.href = 'payment.html';
  };

  /**
   * Toast notification đơn giản, hiện đại
   */
  function showToast(message, type = 'info') {
    let toastContainer = document.getElementById('cinema-toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'cinema-toast-container';
      toastContainer.className = 'fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none';
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    const borderCol = type === 'warning' ? 'border-amber-500 text-amber-200' : (type === 'error' ? 'border-rose-500 text-rose-200' : 'border-cyan-400 text-cyan-200');
    const bgCol = 'bg-[#131722]/95 backdrop-blur-md shadow-2xl';

    toast.className = `pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border ${borderCol} ${bgCol} text-xs font-semibold transform transition-all duration-300 translate-y-4 opacity-0`;
    toast.innerHTML = `
      <i class="fa-solid ${type === 'warning' ? 'fa-triangle-exclamation text-amber-400' : (type === 'error' ? 'fa-circle-xmark text-rose-400' : 'fa-circle-info text-cyan-400')} text-base"></i>
      <span class="flex-1">${message}</span>
    `;

    toastContainer.appendChild(toast);

    // Animation in
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-4', 'opacity-0');
    });

    // Auto dismiss sau 3.5 giây
    setTimeout(() => {
      toast.classList.add('translate-y-2', 'opacity-0');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
});
