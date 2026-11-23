/**
 * ==========================================================================
 * BOOKING PAGE CONTROLLER (js/pages/booking.js)
 * Điều khiển trang Đặt vé & Chọn ghế, tích hợp SeatMap, đếm ngược 10 phút,
 * chọn Combo bắp nước và cộng tự động vào tổng tiền thanh toán (Task T3C72E6)
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
  const summarySeatPriceEl = document.getElementById('summary-seat-price');
  const summaryCombosEl = document.getElementById('summary-combos');
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

  // State quản lý Combo bắp nước đã chọn
  let activeCombos = [];
  const selectedCombos = {}; // { [comboId]: { combo, quantity } }

  /**
   * Tính toán lại và cập nhật toàn bộ giá vé + combo (Grand Total)
   */
  function updateGrandTotal() {
    const selectedSeats = seatMap ? seatMap.getSelectedSeats() : [];
    const seatTotal = seatMap ? seatMap.getTotalAmount() : 0;

    // Cập nhật dòng tiền ghế
    if (summarySeatPriceEl) {
      summarySeatPriceEl.innerText = Number(seatTotal).toLocaleString('vi-VN') + ' đ';
    }

    // Cập nhật dòng combo
    const comboItems = Object.values(selectedCombos).filter(c => c.quantity > 0);
    const comboTotal = comboItems.reduce((sum, item) => sum + (item.quantity * Number(item.combo.price)), 0);

    if (summaryCombosEl) {
      if (comboItems.length === 0) {
        summaryCombosEl.innerText = 'Chưa chọn';
        summaryCombosEl.className = 'text-slate-400 font-mono text-right max-w-[190px]';
      } else {
        const comboSummaryText = comboItems.map(item => `${item.quantity}x ${item.combo.name}`).join(', ');
        summaryCombosEl.innerText = `${comboSummaryText} (+${Number(comboTotal).toLocaleString('vi-VN')} đ)`;
        summaryCombosEl.className = 'text-[#d4ff00] font-mono font-bold text-right max-w-[190px]';
      }
    }

    const grandTotal = seatTotal + comboTotal;
    if (summaryTotalEl) {
      summaryTotalEl.innerText = Number(grandTotal).toLocaleString('vi-VN') + ' đ';
    }

    // Cập nhật trạng thái nút checkout
    if (checkoutBtn) {
      if (selectedSeats.length > 0) {
        checkoutBtn.removeAttribute('disabled');
        checkoutBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        checkoutBtn.innerHTML = `
          <i class="fa-solid fa-credit-card"></i>
          <span>TIẾP TỤC THANH TOÁN (${Number(grandTotal).toLocaleString('vi-VN')} đ)</span>
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

      // Cập nhật tổng tiền bao gồm cả combo
      updateGrandTotal();
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

  // 5. Nạp danh sách Combo Bắp Nước (Task T3C72E6)
  async function loadCombos() {
    const container = document.getElementById('combo-list-container');
    if (!container) return;

    if (window.ComboService && typeof window.ComboService.getActiveCombos === 'function') {
      const res = await window.ComboService.getActiveCombos();
      if (res && res.success && Array.isArray(res.data)) {
        activeCombos = res.data;
      }
    }

    if (!activeCombos || activeCombos.length === 0) {
      container.innerHTML = '<div class="text-xs text-slate-500 py-3 col-span-2">Không có combo bắp nước khả dụng lúc này.</div>';
      return;
    }

    container.innerHTML = activeCombos.map(combo => {
      return `
        <div class="glass-card p-3 rounded-2xl border border-white/10 flex items-center justify-between gap-3 hover:border-[#d4ff00]/40 transition-all">
          <img src="${combo.image_url || 'https://images.unsplash.com/photo-1572177191856-3cde618dee1f?w=150'}" alt="${combo.name}" class="w-16 h-16 rounded-xl object-cover border border-white/10 shrink-0">
          <div class="flex-1 min-w-0">
            <h4 class="text-xs font-bold text-white truncate" title="${combo.name}">${combo.name}</h4>
            <p class="text-[10px] text-slate-400 line-clamp-2 mt-0.5 leading-snug">${combo.description || ''}</p>
            <div class="text-xs font-black text-[#d4ff00] font-mono mt-1">${Number(combo.price).toLocaleString('vi-VN')} đ</div>
          </div>
          <div class="flex items-center gap-1.5 shrink-0 bg-[#0b0d12] p-1 rounded-xl border border-white/10">
            <button type="button" onclick="window.changeComboQty(${combo.id}, -1)" class="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white flex items-center justify-center text-xs font-bold transition-colors">
              <i class="fa-solid fa-minus text-[10px]"></i>
            </button>
            <span id="combo-qty-${combo.id}" class="w-6 text-center font-mono font-bold text-xs text-white">0</span>
            <button type="button" onclick="window.changeComboQty(${combo.id}, 1)" class="w-6 h-6 rounded-lg bg-[#d4ff00]/20 hover:bg-[#d4ff00] text-[#d4ff00] hover:text-[#0b0d12] flex items-center justify-center text-xs font-bold transition-colors">
              <i class="fa-solid fa-plus text-[10px]"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Hàm thay đổi số lượng combo (+ / -)
  window.changeComboQty = function(comboId, delta) {
    const combo = activeCombos.find(c => c.id === comboId);
    if (!combo) return;
    const current = selectedCombos[comboId]?.quantity || 0;
    const newQty = Math.max(0, current + delta);
    if (newQty > 10) {
      showToast('Tối đa 10 phần mỗi loại combo bắp nước!', 'warning');
      return;
    }
    if (newQty === 0) {
      delete selectedCombos[comboId];
    } else {
      selectedCombos[comboId] = { combo, quantity: newQty };
    }
    const qtyEl = document.getElementById(`combo-qty-${comboId}`);
    if (qtyEl) qtyEl.innerText = String(newQty);
    updateGrandTotal();
  };

  await loadCombos();

  // 6. Xử lý nút Tiếp Tục Thanh Toán
  window.proceedToPayment = async function() {
    const selectedSeats = seatMap.getSelectedSeats();
    const seatTotal = seatMap.getTotalAmount();

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

    const comboItems = Object.values(selectedCombos).filter(c => c.quantity > 0);
    const comboTotal = comboItems.reduce((sum, item) => sum + (item.quantity * Number(item.combo.price)), 0);
    const grandTotal = seatTotal + comboTotal;

    const combosPayload = comboItems.map(c => ({
      combo_id: c.combo.id,
      quantity: c.quantity
    }));

    // Thử gọi API giữ ghế (Task T3C6902 & T3C72E6: POST /api/bookings/hold)
    let holdResult = null;
    const seatIds = selectedSeats.map(s => {
      const num = parseInt(s.id, 10);
      return isNaN(num) ? 1 : num;
    });

    if (window.BookingService && typeof window.BookingService.createBooking === 'function') {
      try {
        const payload = {
          showtime_id: parseInt(showtimeId, 10),
          seat_ids: seatIds,
          combos: combosPayload
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
      seatPrice: seatTotal,
      combos: combosPayload,
      comboDetails: comboItems.map(c => ({
        id: c.combo.id,
        name: c.combo.name,
        price: c.combo.price,
        quantity: c.quantity,
        total_price: c.quantity * c.combo.price,
        image_url: c.combo.image_url
      })),
      comboTotal: comboTotal,
      totalPrice: grandTotal,
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
