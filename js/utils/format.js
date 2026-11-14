/**
 * ==========================================================================
 * FORMAT UTILITIES (js/utils/format.js)
 * Chứa các hàm định dạng ngày tháng, giờ, tiền tệ, thời lượng phim
 * ==========================================================================
 */

const FormatUtil = {
  /**
   * Định dạng tiền tệ VND (ví dụ: 110000 -> 110.000 đ)
   */
  currency(amount) {
    if (amount === undefined || amount === null || isNaN(amount)) return '0 đ';
    return Number(amount).toLocaleString('vi-VN') + ' đ';
  },

  /**
   * Định dạng ngày theo chuẩn YYYY-MM-DD
   */
  formatDateToYMD(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  /**
   * Định dạng ngày hiển thị tiếng Việt (ví dụ: Thứ Hai, 16/11/2026)
   */
  formatDateDisplay(date) {
    const d = new Date(date);
    const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayName = dayNames[d.getDay()];
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${dayName}, ${day}/${month}/${year}`;
  },

  /**
   * Lấy nhãn ngày tương đối (Hôm nay, Ngày mai hoặc Thứ X - DD/MM)
   */
  getRelativeDateLabel(targetDate, referenceDate = new Date()) {
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);

    const ref = new Date(referenceDate);
    ref.setHours(0, 0, 0, 0);

    const diffDays = Math.round((target - ref) / (1000 * 60 * 60 * 24));
    const dayNamesShort = ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'];

    if (diffDays === 0) return { label: 'Hôm nay', shortDay: 'Hôm nay', isToday: true };
    if (diffDays === 1) return { label: 'Ngày mai', shortDay: 'Ngày mai', isToday: false };
    return {
      label: dayNamesShort[target.getDay()],
      shortDay: dayNamesShort[target.getDay()],
      isToday: false
    };
  },

  /**
   * Trích xuất giờ từ chuỗi thời gian "YYYY-MM-DD HH:mm" hoặc Date object
   */
  extractTime(timeStr) {
    if (!timeStr) return '--:--';
    if (typeof timeStr === 'string' && timeStr.includes(' ')) {
      const parts = timeStr.split(' ');
      return parts[1].substring(0, 5);
    }
    const d = new Date(timeStr);
    if (!isNaN(d.getTime())) {
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      return `${h}:${m}`;
    }
    return timeStr;
  },

  /**
   * Định dạng thời lượng phim (ví dụ: 125 phút -> 2h 05m)
   */
  duration(minutes) {
    if (!minutes || isNaN(minutes)) return '0m';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs === 0) return `${mins}m`;
    return `${hrs}h ${mins > 0 ? String(mins).padStart(2, '0') + 'm' : ''}`;
  }
};

window.FormatUtil = FormatUtil;
