/**
 * ==========================================================================
 * SEAT MAP COMPONENT (js/components/seat-map.js)
 * Sơ đồ ghế 3D, phân loại màu theo trạng thái & loại ghế, chọn/bỏ chọn,
 * giới hạn 8 ghế, tính tổng tiền tạm tính, đồng hồ đếm ngược 10 phút (Task T3C6AF7)
 * ==========================================================================
 */

class SeatMap {
  /**
   * @param {Object} options
   * @param {string|HTMLElement} options.container - Nơi render sơ đồ ghế
   * @param {string|HTMLElement} [options.timerElement] - Nơi hiển thị đồng hồ đếm ngược
   * @param {number} [options.maxSeats=8] - Giới hạn số ghế tối đa được chọn/lần
   * @param {number} [options.holdMinutes=10] - Thời gian giữ chỗ (mặc định 10 phút)
   * @param {Function} [options.onSelectionChange] - Callback khi thay đổi ghế chọn (seats, total)
   * @param {Function} [options.onMaxExceeded] - Callback khi chọn vượt quá giới hạn
   * @param {Function} [options.onExpired] - Callback khi hết thời gian giữ ghế
   */
  constructor(options = {}) {
    this.container = typeof options.container === 'string'
      ? document.querySelector(options.container)
      : options.container;

    this.timerElement = typeof options.timerElement === 'string'
      ? document.querySelector(options.timerElement)
      : options.timerElement;

    this.maxSeats = options.maxSeats || 8;
    this.holdMinutes = options.holdMinutes || 10;
    this.onSelectionChange = options.onSelectionChange || null;
    this.onMaxExceeded = options.onMaxExceeded || null;
    this.onExpired = options.onExpired || null;

    this.seatData = null; // Dữ liệu từ API showtimes/{id}/seats
    this.selectedSeats = []; // Danh sách ghế đang chọn
    this.timerSeconds = this.holdMinutes * 60;
    this.timerInterval = null;
  }

  /**
   * Tải sơ đồ ghế từ Backend API theo showtimeId
   * @param {number|string} showtimeId
   */
  async load(showtimeId) {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="py-16 text-center">
        <div class="inline-block w-8 h-8 border-4 border-[#ff5e1e] border-t-transparent rounded-full animate-spin"></div>
        <p class="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Đang tải sơ đồ ghế...</p>
      </div>
    `;

    try {
      let result = null;
      if (window.ShowtimeService && typeof window.ShowtimeService.getShowtimeSeats === 'function') {
        result = await window.ShowtimeService.getShowtimeSeats(showtimeId);
      }

      if (result && result.success && result.data) {
        this.seatData = result.data;
      } else {
        // Fallback mock layout nếu service chưa sẵn sàng
        this.seatData = this._getFallbackLayout(showtimeId);
      }
    } catch (error) {
      console.warn('[SeatMap.load] Lỗi tải dữ liệu, chuyển sang Mock Layout:', error);
      this.seatData = this._getFallbackLayout(showtimeId);
    }

    this.render();
    this.startTimer();
  }

  /**
   * Tạo layout giả lập chuẩn phòng chiếu hiện đại (A-C: Thường, D-E: VIP, F: Đôi)
   */
  _getFallbackLayout(showtimeId) {
    const basePrice = 90000;
    const rowList = ['A', 'B', 'C', 'D', 'E', 'F'];
    const rows = {};

    rowList.forEach(row => {
      const isCouple = row === 'F';
      const isVip = row === 'D' || row === 'E';
      const type = isCouple ? 'couple' : (isVip ? 'vip' : 'standard');
      const mult = isCouple ? 2.0 : (isVip ? 1.5 : 1.0);
      const price = Math.round(basePrice * mult);
      const colCount = 10;

      const seats = [];
      for (let c = 1; c <= colCount; c++) {
        const seatNum = isCouple ? `F${String(c).padStart(2, '0')}` : `${row}${c}`;
        seats.push({
          id: seatNum,
          seat_number: seatNum,
          seat_row: row,
          seat_column: c,
          seat_type: type,
          status: 'available',
          price: price
        });
      }
      rows[row] = seats;
    });

    return {
      showtime_id: showtimeId,
      room_id: 1,
      base_price: basePrice,
      total_seats: 60,
      available_seats: 60,
      rows: rows
    };
  }

  /**
   * Render toàn bộ giao diện sơ đồ ghế và bảng chú thích
   */
  render() {
    if (!this.container || !this.seatData) return;

    const rows = this.seatData.rows || {};
    const rowKeys = Object.keys(rows);

    let html = `
      <div class="seat-map-wrapper w-full flex flex-col items-center select-none">
        ${(this.seatData.is_weekend || this.seatData.is_peak_hour) ? `
        <!-- Surcharge Notice Banner -->
        <div class="surcharge-notice w-full max-w-xl mb-6 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-[#ff5e1e]/10 to-transparent border border-amber-500/30 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-tags text-[#ff5e1e]"></i>
            <span class="text-slate-200 font-semibold">Phụ thu suất chiếu:</span>
            ${this.seatData.is_weekend ? `<span class="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-[10px] font-bold text-amber-300">Cuối tuần (+${Number(this.seatData.weekend_surcharge || 10000).toLocaleString('vi-VN')} đ)</span>` : ''}
            ${this.seatData.is_peak_hour ? `<span class="px-2 py-0.5 rounded-md bg-orange-500/20 border border-orange-500/40 text-[10px] font-bold text-orange-300">Giờ vàng (+${Number(this.seatData.peak_hour_surcharge || 10000).toLocaleString('vi-VN')} đ)</span>` : ''}
          </div>
          <span class="text-[10px] text-slate-400 italic">Đã cộng vào giá từng ghế</span>
        </div>
        ` : ''}

        <!-- Màn hình 3D Laser Arc -->
        <div class="screen-area w-full max-w-xl mb-10 flex flex-col items-center">
          <div class="screen-arc w-full h-10 rounded-t-[100%] flex items-center justify-center border-t-2 border-[#ff5e1e] shadow-[0_12px_30px_rgba(255,94,30,0.35)] bg-gradient-to-b from-[#ff5e1e]/60 via-[#ff5e1e]/10 to-transparent">
            <span class="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.25em] text-white/90 drop-shadow">MÀN HÌNH CHIẾU LASER 3D</span>
          </div>
          <span class="text-[9px] uppercase tracking-widest text-slate-500 mt-2 font-mono flex items-center gap-1.5">
            <i class="fa-solid fa-arrows-left-right text-[8px] text-[#ff5e1e]"></i> MẶT TRƯỚC SÂN KHẤU
          </span>
        </div>

        <!-- Khung các hàng ghế -->
        <div class="seat-grid-container w-full max-w-2xl flex flex-col items-center gap-2 sm:gap-2.5 overflow-x-auto py-2 px-1 scroll-smooth">
    `;

    rowKeys.forEach(rowName => {
      const seatList = rows[rowName] || [];
      const isCoupleRow = seatList.some(s => s.seat_type === 'couple');

      html += `
        <div class="seat-row flex items-center justify-center gap-1 min-[390px]:gap-2 sm:gap-3 w-full shrink-0" data-row="${rowName}">
          <span class="row-label w-5 text-center text-xs font-mono font-bold ${isCoupleRow ? 'text-purple-400' : 'text-slate-400'}">
            ${rowName}
          </span>
          <div class="seats-in-row flex items-center gap-1 min-[390px]:gap-1.5 sm:gap-2">
      `;

      seatList.forEach(seat => {
        const isSelected = this.selectedSeats.some(s => s.seat_number === seat.seat_number);
        const btnClasses = this._getSeatClasses(seat, isSelected);
        const isDisabled = seat.status === 'booked' || seat.status === 'held';
        const tooltip = this._getSeatTooltip(seat);

        if (seat.seat_type === 'couple') {
          html += `
            <button
              type="button"
              class="seat seat-couple ${btnClasses}"
              data-seat-id="${seat.id}"
              data-seat-number="${seat.seat_number}"
              data-price="${seat.price}"
              data-type="${seat.seat_type}"
              data-status="${seat.status}"
              title="${tooltip}"
              ${isDisabled ? 'disabled' : ''}
            >
              <span class="text-[9px] font-black tracking-tight">${isSelected ? '✓ ' + seat.seat_number : '♥ ' + seat.seat_number}</span>
            </button>
          `;
        } else {
          html += `
            <button
              type="button"
              class="seat ${btnClasses}"
              data-seat-id="${seat.id}"
              data-seat-number="${seat.seat_number}"
              data-price="${seat.price}"
              data-type="${seat.seat_type}"
              data-status="${seat.status}"
              title="${tooltip}"
              ${isDisabled ? 'disabled' : ''}
            >
              ${isSelected ? '✓' : seat.seat_column}
            </button>
          `;
        }
      });

      html += `
          </div>
          <span class="row-label w-5 text-center text-xs font-mono font-bold ${isCoupleRow ? 'text-purple-400' : 'text-slate-400'}">
            ${rowName}
          </span>
        </div>
      `;
    });

    html += `
        </div>

        <!-- Chú thích loại ghế & trạng thái (Legend) -->
        <div class="legend-area w-full max-w-2xl mt-8 pt-5 border-t border-white/10 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-400">
          <div class="flex items-center gap-2">
            <span class="w-4 h-4 rounded bg-[#1f2433] border border-white/20 inline-block"></span>
            <span>Thường</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-4 h-4 rounded bg-gradient-to-br from-[#e6ca85] to-amber-700 border border-amber-300 inline-block"></span>
            <span class="text-amber-200">VIP</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-7 h-4 rounded bg-gradient-to-r from-[#7c3aed] to-[#5b21b6] border border-violet-400 inline-block"></span>
            <span class="text-purple-300">Ghế Đôi</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-4 h-4 rounded bg-[#d4ff00] text-black font-black text-[10px] flex items-center justify-center shadow-[0_0_8px_#d4ff00]">✓</span>
            <span class="text-[#d4ff00] font-bold">Đang Chọn</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-4 h-4 rounded bg-amber-500/20 border border-amber-500/60 text-amber-400 text-[10px] flex items-center justify-center font-mono">⧗</span>
            <span class="text-amber-400">Đang Giữ Chỗ</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-4 h-4 rounded bg-slate-800 border border-slate-700 opacity-40 inline-block"></span>
            <span class="text-slate-500">Đã Bán</span>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this._bindEvents();
  }

  /**
   * Xác định class màu sắc cho từng ghế
   */
  _getSeatClasses(seat, isSelected) {
    const baseDimensions = seat.seat_type === 'couple'
      ? 'w-14 min-[390px]:w-16 sm:w-20 h-7 min-[390px]:h-8 sm:h-9 rounded-lg'
      : 'w-[25px] h-[25px] min-[390px]:w-7 min-[390px]:h-7 sm:w-8 sm:h-8 rounded-md sm:rounded-lg text-[9px] min-[390px]:text-[10px] font-bold';

    // 1. Đang chọn (Ưu tiên cao nhất)
    if (isSelected) {
      return `${baseDimensions} seat-selected bg-[#d4ff00] text-[#0b0d12] font-black border-2 border-white shadow-[0_0_16px_rgba(212,255,0,0.85)] scale-110 z-10 transition-transform duration-150`;
    }

    // 2. Đã đặt (Booked)
    if (seat.status === 'booked') {
      return `${baseDimensions} seat-booked bg-slate-800/80 border border-slate-700/50 text-slate-600 opacity-35 cursor-not-allowed`;
    }

    // 3. Đang giữ chỗ tạm thời (Held)
    if (seat.status === 'held') {
      return `${baseDimensions} seat-held bg-amber-950/40 border border-amber-500/70 text-amber-400 cursor-not-allowed shadow-[0_0_6px_rgba(245,158,11,0.2)] animate-pulse`;
    }

    // 4. Ghế trống (Available) theo loại ghế
    if (seat.seat_type === 'couple') {
      return `${baseDimensions} seat-available bg-gradient-to-r from-[#7c3aed] to-[#5b21b6] border border-violet-400/80 text-violet-100 hover:scale-105 hover:shadow-[0_0_12px_rgba(124,58,237,0.6)] cursor-pointer transition-all duration-150`;
    }

    if (seat.seat_type === 'vip') {
      return `${baseDimensions} seat-available bg-gradient-to-br from-[#e6ca85] via-[#d4af37] to-amber-700 border border-amber-300 text-[#0b0d12] font-bold hover:scale-110 hover:shadow-[0_0_12px_rgba(230,202,133,0.7)] cursor-pointer transition-all duration-150`;
    }

    // Ghế tiêu chuẩn (Standard)
    return `${baseDimensions} seat-available bg-[#1f2433] hover:bg-[#282f42] border border-white/10 hover:border-white/40 text-slate-200 hover:scale-110 hover:shadow-[0_0_8px_rgba(255,255,255,0.2)] cursor-pointer transition-all duration-150`;
  }

  /**
   * Tooltip gợi ý thông tin ghế khi hover
   */
  _getSeatTooltip(seat) {
    const typeLabel = seat.seat_type === 'couple' ? 'Ghế Đôi Sweetbox' : (seat.seat_type === 'vip' ? 'Ghế VIP' : 'Ghế Thường');
    const priceStr = Number(seat.price).toLocaleString('vi-VN') + ' đ';

    if (seat.status === 'booked') {
      return `Ghế ${seat.seat_number} (${typeLabel}) - Đã có người mua`;
    }
    if (seat.status === 'held') {
      return `Ghế ${seat.seat_number} (${typeLabel}) - Đang có khách giữ chỗ tạm thời`;
    }
    return `Ghế ${seat.seat_number} (${typeLabel}) • Giá: ${priceStr}`;
  }

  /**
   * Bắt sự kiện click chọn / bỏ chọn ghế
   */
  _bindEvents() {
    const seatButtons = this.container.querySelectorAll('.seat:not([disabled])');
    seatButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const seatNumber = btn.dataset.seatNumber;
        const seatId = btn.dataset.seatId;
        const price = parseFloat(btn.dataset.price) || 0;
        const type = btn.dataset.type || 'standard';
        const status = btn.dataset.status || 'available';

        this.toggleSeat({
          id: seatId,
          seat_number: seatNumber,
          price: price,
          seat_type: type,
          status: status
        });
      });
    });
  }

  /**
   * Chọn hoặc bỏ chọn một ghế
   */
  toggleSeat(seat) {
    if (seat.status === 'booked' || seat.status === 'held') {
      return;
    }

    const existingIndex = this.selectedSeats.findIndex(s => s.seat_number === seat.seat_number);

    if (existingIndex > -1) {
      // Đã chọn -> Bỏ chọn
      this.selectedSeats.splice(existingIndex, 1);
    } else {
      // Kiểm tra giới hạn tối đa 8 ghế/lần (Task T3C6902 & T3C6AF7)
      if (this.selectedSeats.length >= this.maxSeats) {
        if (typeof this.onMaxExceeded === 'function') {
          this.onMaxExceeded(this.maxSeats);
        } else {
          if (typeof window.showToast === 'function') {
            window.showToast(`Bạn chỉ được chọn tối đa ${this.maxSeats} ghế mỗi lần đặt!`, 'warning');
          } else if (typeof window.showAlertModal === 'function') {
            window.showAlertModal({
              type: 'warning',
              title: 'Giới hạn chọn ghế',
              message: `Bạn chỉ được chọn tối đa ${this.maxSeats} ghế mỗi lần đặt!`,
              confirmText: 'Đã hiểu'
            });
          }
        }
        return;
      }
      this.selectedSeats.push(seat);
    }

    // Re-render sơ đồ để cập nhật trạng thái các nút
    this.render();

    // Thông báo cho callback bên ngoài
    if (typeof this.onSelectionChange === 'function') {
      this.onSelectionChange(this.selectedSeats, this.getTotalAmount());
    }
  }

  /**
   * Lấy tổng tiền tạm tính hiện tại
   */
  getTotalAmount() {
    return this.selectedSeats.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0);
  }

  /**
   * Lấy danh sách ghế đã chọn
   */
  getSelectedSeats() {
    return [...this.selectedSeats];
  }

  /**
   * Xóa toàn bộ lựa chọn ghế
   */
  clearSelection() {
    this.selectedSeats = [];
    this.render();
    if (typeof this.onSelectionChange === 'function') {
      this.onSelectionChange(this.selectedSeats, 0);
    }
  }

  /**
   * Khởi động đồng hồ đếm ngược 10 phút giữ ghế
   */
  startTimer(minutes = this.holdMinutes) {
    this.stopTimer();
    this.timerSeconds = minutes * 60;
    this._updateTimerDisplay();

    this.timerInterval = setInterval(() => {
      this.timerSeconds--;
      this._updateTimerDisplay();

      if (this.timerSeconds <= 0) {
        this.stopTimer();
        this._handleTimerExpired();
      }
    }, 1000);
  }

  /**
   * Dừng đồng hồ đếm ngược
   */
  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * Cập nhật thời gian hiển thị trên UI
   */
  _updateTimerDisplay() {
    if (!this.timerElement) return;

    const m = Math.floor(this.timerSeconds / 60);
    const s = this.timerSeconds % 60;
    const formatted = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    this.timerElement.innerText = formatted;

    // Cảnh báo đỏ nhấp nháy khi còn dưới 1 phút
    if (this.timerSeconds <= 60) {
      this.timerElement.classList.add('text-rose-500', 'animate-pulse');
      this.timerElement.classList.remove('text-[#ff5e1e]');
    } else {
      this.timerElement.classList.remove('text-rose-500', 'animate-pulse');
      this.timerElement.classList.add('text-[#ff5e1e]');
    }
  }

  /**
   * Xử lý khi hết thời gian 10 phút giữ ghế
   */
  _handleTimerExpired() {
    this.clearSelection();

    if (typeof this.onExpired === 'function') {
      this.onExpired();
    } else {
      if (typeof window.showAlertModal === 'function') {
        window.showAlertModal({
          type: 'warning',
          title: 'Hết thời gian giữ ghế',
          message: 'Đã hết thời gian giữ ghế (10 phút). Danh sách ghế đã chọn đã được hủy để giải phóng ghế. Vui lòng chọn lại!',
          confirmText: 'Đã hiểu'
        });
      } else if (typeof window.showToast === 'function') {
        window.showToast('Đã hết thời gian giữ ghế (10 phút). Danh sách ghế đã chọn đã được hủy để giải phóng ghế. Vui lòng chọn lại!', 'error');
      }
      if (this.seatData && this.seatData.showtime_id) {
        this.load(this.seatData.showtime_id);
      }
    }
  }
}

// Xuất ra window để các file script khác sử dụng
window.SeatMap = SeatMap;
