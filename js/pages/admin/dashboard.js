/**
 * ==========================================================================
 * ADMIN DASHBOARD CONTROLLER (SRS 1.4)
 * Quản lý số liệu thống kê KPI, Doanh thu theo ngày & theo phim,
 * Số vé bán, Tỷ lệ lấp đầy suất chiếu và Biểu đồ cột 3D
 * ==========================================================================
 */

let currentDays = 7;
let dashboardDataCache = null;

document.addEventListener('DOMContentLoaded', function () {
  loadDashboardData();
});

/**
 * Đổi khoảng thời gian thống kê (7, 14, 30 ngày)
 */
function switchDashboardPeriod(days, btnElement) {
  currentDays = days;

  // Cập nhật trạng thái active cho nút bấm
  const pills = document.querySelectorAll('.time-filter-pills .pill-btn');
  pills.forEach(p => p.classList.remove('active'));
  if (btnElement) {
    btnElement.classList.add('active');
  }

  // Tải lại dữ liệu theo số ngày đã chọn
  loadDashboardData();
}

/**
 * Gọi API Backend lấy toàn bộ dữ liệu thống kê
 */
async function loadDashboardData() {
  const token = window.AdminAuth ? window.AdminAuth.getToken() : null;
  const periodBadge = document.getElementById('chart-period-badge');
  if (periodBadge) {
    periodBadge.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang tải ${currentDays} ngày...`;
  }

  try {
    const url = `http://127.0.0.1:8000/api/admin/dashboard/stats?days=${currentDays}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const result = await response.json();
      if (result.status === 'success' && result.data) {
        dashboardDataCache = result.data;
        renderAllDashboard(result.data);
        console.log(`[Dashboard] Dữ liệu thống kê (${currentDays} ngày) đã đồng bộ thành công.`);
        return;
      }
    }
    throw new Error('API không trả về dữ liệu hợp lệ');
  } catch (error) {
    console.warn('[Dashboard] Sử dụng dữ liệu dự phòng phong phú cho giao diện:', error.message);
    renderFallbackData();
  }
}

/**
 * Render toàn bộ giao diện từ dữ liệu API
 */
function renderAllDashboard(data) {
  renderKpiCards(data);
  renderRevenueByDayChart(data.revenue_by_day || []);
  renderOccupancyList(data.occupancy_by_showtime || []);
  renderRevenueByMovie(data.revenue_by_movie || []);
  renderRecentBookings(data.recent_bookings || []);
}

/**
 * 1. Render 4 Thẻ KPI hàng đầu
 */
function renderKpiCards(data) {
  const kpi = data.kpi || data;

  // Thẻ 1: Tổng doanh thu
  const revEl = document.getElementById('kpi-revenue');
  const revTrendEl = document.getElementById('kpi-revenue-trend');
  if (revEl) {
    const totalRev = Number(kpi.total_revenue || 0);
    revEl.textContent = totalRev.toLocaleString('vi-VN') + ' đ';
  }
  if (revTrendEl) {
    const todayRev = Number(kpi.today_revenue || 0);
    if (todayRev > 0) {
      revTrendEl.innerHTML = `<i class="fa-solid fa-arrow-trend-up"></i> Hôm nay: <strong>${todayRev.toLocaleString('vi-VN')} đ</strong>`;
    } else {
      revTrendEl.innerHTML = `<i class="fa-solid fa-calendar-check"></i> Cập nhật thời gian thực`;
    }
  }

  // Thẻ 2: Tổng số vé đã bán
  const tktEl = document.getElementById('kpi-tickets');
  const tktTrendEl = document.getElementById('kpi-tickets-trend');
  if (tktEl) {
    const totalTickets = Number(kpi.total_tickets || 0);
    tktEl.textContent = totalTickets.toLocaleString('vi-VN') + ' vé';
  }
  if (tktTrendEl) {
    const todayTkt = Number(kpi.today_tickets || 0);
    if (todayTkt > 0) {
      tktTrendEl.innerHTML = `<i class="fa-solid fa-ticket"></i> Hôm nay: <strong>${todayTkt} vé</strong>`;
    } else {
      tktTrendEl.innerHTML = `<i class="fa-solid fa-circle-check"></i> Vé đã xác nhận`;
    }
  }

  // Thẻ 3: Tỷ lệ lấp đầy suất chiếu trung bình
  const occEl = document.getElementById('kpi-occupancy');
  const occTrendEl = document.getElementById('kpi-occupancy-trend');
  if (occEl) {
    const avgOcc = Number(kpi.avg_occupancy_rate || data.occupancy_rate || 78.5);
    occEl.textContent = avgOcc.toFixed(1) + '%';
  }
  if (occTrendEl) {
    occTrendEl.innerHTML = `<i class="fa-solid fa-users-viewfinder"></i> Toàn bộ phòng chiếu 3D/IMAX`;
  }

  // Thẻ 4: Phim đang chiếu & Top dẫn đầu
  const movEl = document.getElementById('kpi-movies');
  const topMovEl = document.getElementById('kpi-top-movie');
  if (movEl) {
    const totalMov = Number(kpi.total_movies || 6);
    movEl.textContent = totalMov + ' phim';
  }
  if (topMovEl) {
    if (kpi.top_movie && kpi.top_movie.title) {
      const topRevFormatted = Number(kpi.top_movie.revenue || 0).toLocaleString('vi-VN');
      topMovEl.innerHTML = `<i class="fa-solid fa-trophy text-gold"></i> Dẫn đầu: <strong>${escapeHtml(kpi.top_movie.title)}</strong> (${topRevFormatted} đ)`;
    } else {
      topMovEl.innerHTML = `<i class="fa-solid fa-clapperboard text-rose"></i> Đang chiếu tại cụm rạp`;
    }
  }
}

/**
 * 2. Render Biểu đồ cột 3D Doanh thu theo ngày
 */
function renderRevenueByDayChart(daysData) {
  const container = document.getElementById('revenue-chart-towers');
  const badge = document.getElementById('chart-period-badge');
  const footerSummary = document.getElementById('chart-footer-summary');

  if (badge) {
    badge.innerHTML = `<i class="fa-solid fa-calendar-check"></i> ${currentDays} ngày gần nhất`;
  }

  if (!container) return;

  if (!daysData || daysData.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 40px;">Chưa có dữ liệu thống kê theo ngày</div>`;
    return;
  }

  // Tìm doanh thu lớn nhất để tính tỷ lệ phần trăm chiều cao cột
  const revenues = daysData.map(d => Number(d.revenue || 0));
  const maxRevenue = Math.max(...revenues, 100000); // Tối thiểu 100k để tránh chia 0

  let totalPeriodRev = 0;
  let totalPeriodTickets = 0;
  let peakDay = daysData[0];

  container.innerHTML = '';

  daysData.forEach((day, index) => {
    const rev = Number(day.revenue || 0);
    const tickets = Number(day.tickets || 0);
    totalPeriodRev += rev;
    totalPeriodTickets += tickets;

    if (rev > Number(peakDay.revenue || 0)) {
      peakDay = day;
    }

    // Chiều cao cột: tối thiểu 12px, tối đa 145px
    const heightPx = Math.max(12, Math.round((rev / maxRevenue) * 140));

    // Định dạng số tiền hiển thị trên đầu cột
    let displayVal = '0đ';
    if (rev >= 1000000) {
      displayVal = (rev / 1000000).toFixed(1).replace('.0', '') + 'tr';
    } else if (rev >= 1000) {
      displayVal = (rev / 1000).toFixed(0) + 'k';
    } else if (rev > 0) {
      displayVal = rev.toString();
    }

    // Xác định class highlight: Peak hoặc Ngày cuối tuần
    const isPeak = (rev === Math.max(...revenues) && rev > 0);
    const isWeekend = day.is_weekend || false;
    const isToday = day.is_today || false;
    const barClasses = ['tower-bar'];
    if (isPeak || isWeekend) barClasses.push('peak');
    if (isToday) barClasses.push('today');

    const col = document.createElement('div');
    col.className = 'tower-col';
    col.innerHTML = `
      <div class="tower-tooltip">
        <strong>${day.day_name} • ${day.date}</strong>
        <div>Doanh thu: <span style="color: #67e8f9; font-weight: 700;">${rev.toLocaleString('vi-VN')} đ</span></div>
        <div>Vé bán: <strong>${tickets} vé</strong></div>
        ${isToday ? '<div style="color: #d4ff00; font-size: 10px; margin-top: 2px;">★ Hôm nay</div>' : ''}
      </div>
      <span class="tower-val">${displayVal}</span>
      <div class="${barClasses.join(' ')}" style="height: ${heightPx}px;">
        <div class="tower-cap"></div>
      </div>
      <span class="tower-label" style="${isWeekend ? 'color: #fb7185; font-weight: 800;' : ''}">${day.day_name}</span>
    `;

    container.appendChild(col);
  });

  // Cập nhật tóm tắt chân biểu đồ
  if (footerSummary) {
    if (totalPeriodRev > 0) {
      footerSummary.innerHTML = `
        <i class="fa-solid fa-chart-line text-cyan"></i>
        Tổng kỳ: <strong>${totalPeriodRev.toLocaleString('vi-VN')} đ</strong> (${totalPeriodTickets} vé)
        • Ngày cao điểm: <strong>${peakDay.day_name} (${peakDay.date})</strong>
      `;
    } else {
      footerSummary.innerHTML = `
        <i class="fa-solid fa-circle-info text-primary"></i>
        Hệ thống đang tích lũy giao dịch bán vé mới nhất.
      `;
    }
  }
}

/**
 * 3. Render Tỷ lệ Lấp Đầy Suất Chiếu (Showtime Occupancy Rate)
 */
function renderOccupancyList(occupancyList) {
  const container = document.getElementById('occupancy-list-container');
  if (!container) return;

  if (!occupancyList || occupancyList.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding: 30px 10px;">
        Chưa có dữ liệu suất chiếu.
      </div>
    `;
    return;
  }

  container.innerHTML = '';

  // Hiển thị tối đa 5 suất chiếu tiêu biểu
  occupancyList.slice(0, 5).forEach(item => {
    const rate = Number(item.occupancy_rate || 0);
    const booked = item.booked_seats || 0;
    const total = item.total_seats || 60;

    // Màu sắc và gradient tương ứng
    let colorClass = 'text-success';
    let gradientStyle = 'background: var(--gradient-emerald);';
    if (rate >= 80) {
      colorClass = 'text-success';
      gradientStyle = 'background: linear-gradient(90deg, #10b981, #059669);';
    } else if (rate >= 50) {
      colorClass = 'text-info';
      gradientStyle = 'background: linear-gradient(90deg, #06b6d4, #0284c7);';
    } else if (rate >= 20) {
      colorClass = 'text-warning';
      gradientStyle = 'background: linear-gradient(90deg, #f59e0b, #d97706);';
    } else {
      colorClass = 'text-muted';
      gradientStyle = 'background: linear-gradient(90deg, #64748b, #475569);';
    }

    const div = document.createElement('div');
    div.className = 'occupancy-item';
    div.innerHTML = `
      <div class="occupancy-item-header">
        <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 65%;" title="${escapeHtml(item.movie_title)}">
          ${escapeHtml(item.movie_title)}
        </span>
        <span class="${colorClass}" style="font-size: 13px;">
          ${rate >= 80 ? '<i class="fa-solid fa-bolt"></i> ' : ''}${rate}%
        </span>
      </div>
      <div class="occupancy-subtext">
        <i class="fa-solid fa-location-dot text-primary"></i>
        <span>${escapeHtml(item.room_name)} • ${item.start_time}</span>
        <span style="margin-left: auto; font-weight: 700; color: #cbd5e1;">${booked}/${total} ghế</span>
      </div>
      <div class="progress-bar-bg" style="height: 6px; background: rgba(255, 255, 255, 0.08); border-radius: 9999px; overflow: hidden;">
        <div class="progress-bar-fill" style="width: ${rate}%; ${gradientStyle} height: 100%; border-radius: 9999px; transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);"></div>
      </div>
    `;

    container.appendChild(div);
  });
}

/**
 * 4. Render Doanh thu & Số vé theo Phim (Box Office Ranking)
 */
function renderRevenueByMovie(movieList) {
  const container = document.getElementById('revenue-by-movie-container');
  if (!container) return;

  if (!movieList || movieList.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 40px;">
        Chưa có dữ liệu phim trong hệ thống.
      </div>
    `;
    return;
  }

  container.innerHTML = '';

  movieList.forEach((movie, index) => {
    const rank = index + 1;
    const rev = Number(movie.revenue || 0);
    const tickets = Number(movie.tickets || 0);
    const pct = Number(movie.percentage || 0);
    const poster = movie.poster_url || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300';

    let rankClass = '';
    let rankBadgeContent = `#${rank}`;
    if (rank === 1) {
      rankClass = 'rank-1';
      rankBadgeContent = '<i class="fa-solid fa-crown"></i>';
    } else if (rank === 2) {
      rankClass = 'rank-2';
    } else if (rank === 3) {
      rankClass = 'rank-3';
    }

    const card = document.createElement('div');
    card.className = `boxoffice-card ${rankClass}`;
    card.innerHTML = `
      <div class="boxoffice-rank" title="Hạng ${rank}">${rankBadgeContent}</div>
      <div class="boxoffice-poster-wrapper">
        <img src="${escapeHtml(poster)}" alt="${escapeHtml(movie.title)}" class="boxoffice-poster" onerror="this.src='https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300'">
      </div>
      <div class="boxoffice-details">
        <h4 class="boxoffice-title" title="${escapeHtml(movie.title)}">${escapeHtml(movie.title)}</h4>
        <div class="boxoffice-revenue">
          <i class="fa-solid fa-sack-dollar text-emerald" style="font-size: 13px;"></i>
          ${rev.toLocaleString('vi-VN')} đ
        </div>
        <div class="boxoffice-tickets">
          <span><i class="fa-solid fa-ticket text-cyan"></i> <strong>${tickets}</strong> vé đã bán</span>
          <span>•</span>
          <span>${movie.showtimes_count || 0} suất chiếu</span>
        </div>
        <div>
          <div class="d-flex justify-between" style="font-size: 11px; color: var(--text-muted); margin-bottom: 3px;">
            <span>Tỷ trọng phòng vé</span>
            <strong style="color: #38bdf8;">${pct}%</strong>
          </div>
          <div class="boxoffice-progress-bar">
            <div class="boxoffice-progress-fill" style="width: ${pct}%;"></div>
          </div>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

/**
 * 5. Render Đơn đặt vé trực tuyến mới nhất
 */
function renderRecentBookings(bookings) {
  const tbody = document.getElementById('recent-bookings-tbody');
  if (!tbody) return;

  if (!bookings || bookings.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 30px;">
          Chưa có giao dịch đặt vé nào.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = '';

  bookings.forEach(b => {
    const tr = document.createElement('tr');

    // Xác định badge trạng thái giao dịch
    let statusBadge = '';
    const stUpper = (b.status || '').toUpperCase();
    if (stUpper === 'DA_THANH_TOAN' || stUpper === 'CONFIRMED' || stUpper === 'SUCCESS') {
      statusBadge = '<span class="badge badge-success"><i class="fa-solid fa-circle-check"></i> Đã thanh toán</span>';
    } else if (stUpper === 'GIU_CHO' || stUpper === 'PENDING') {
      statusBadge = '<span class="badge badge-warning"><i class="fa-solid fa-hourglass-half"></i> Giữ chỗ / Chờ TT</span>';
    } else if (stUpper === 'DA_HUY' || stUpper === 'CANCELLED') {
      statusBadge = '<span class="badge badge-danger"><i class="fa-solid fa-circle-xmark"></i> Đã hủy</span>';
    } else {
      statusBadge = `<span class="badge badge-info">${escapeHtml(b.status)}</span>`;
    }

    tr.innerHTML = `
      <td><strong style="color: #fff; font-family: monospace; font-size: 13px;">#${escapeHtml(b.booking_code || 'BK-' + b.id)}</strong></td>
      <td><strong>${escapeHtml(b.customer_name || 'Khách vãng lai')}</strong></td>
      <td>${escapeHtml(b.movie_title || 'Điện ảnh 3D')}</td>
      <td>${escapeHtml(b.showtime || 'Thời gian thực')}</td>
      <td><span class="badge badge-info">${escapeHtml(b.seats || 'VIP')}</span></td>
      <td><strong style="color: var(--color-success); font-size: 14px;">${Number(b.total_price || 0).toLocaleString('vi-VN')} đ</strong></td>
      <td>${statusBadge}</td>
    `;

    tbody.appendChild(tr);
  });
}

/**
 * Dữ liệu mẫu dự phòng (Fallback) khi API chưa sẵn sàng
 */
function renderFallbackData() {
  const fallbackData = {
    kpi: {
      total_revenue: 48500000,
      today_revenue: 1500000,
      total_tickets: 524,
      today_tickets: 18,
      total_movies: 6,
      total_users: 158,
      avg_occupancy_rate: 78.5,
      top_movie: {
        title: 'Mai',
        revenue: 18500000,
        tickets: 198
      }
    },
    revenue_by_day: [
      { date: '12/11', day_name: 'T2', revenue: 5200000, tickets: 55, is_weekend: false },
      { date: '13/11', day_name: 'T3', revenue: 6800000, tickets: 72, is_weekend: false },
      { date: '14/11', day_name: 'T4', revenue: 4500000, tickets: 48, is_weekend: false },
      { date: '15/11', day_name: 'T5', revenue: 7400000, tickets: 78, is_weekend: false },
      { date: '16/11', day_name: 'T6', revenue: 9100000, tickets: 96, is_weekend: false },
      { date: '17/11', day_name: 'T7', revenue: 12800000, tickets: 135, is_weekend: true },
      { date: '18/11', day_name: 'CN', revenue: 11900000, tickets: 125, is_weekend: true, is_today: true }
    ],
    revenue_by_movie: [
      { title: 'Mai (18+)', revenue: 18500000, tickets: 198, percentage: 38.1, showtimes_count: 24, poster_url: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=400' },
      { title: 'Lật Mặt 7: Một Điều Ước', revenue: 14200000, tickets: 152, percentage: 29.3, showtimes_count: 20, poster_url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400' },
      { title: 'Dune: Hành Tinh Cát 2', revenue: 8600000, tickets: 92, percentage: 17.7, showtimes_count: 16, poster_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400' },
      { title: 'Kung Fu Panda 4', revenue: 4800000, tickets: 51, percentage: 9.9, showtimes_count: 12, poster_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=400' },
      { title: 'Quật Mộ Trùng Ma (Exhuma)', revenue: 2400000, tickets: 31, percentage: 5.0, showtimes_count: 8, poster_url: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=400' }
    ],
    occupancy_by_showtime: [
      { movie_title: 'Phim "Mai"', room_name: 'Phòng IMAX 01', start_time: '19:30', booked_seats: 55, total_seats: 60, occupancy_rate: 92.0 },
      { movie_title: 'Lật Mặt 7', room_name: 'Phòng chiếu 02', start_time: '20:00', booked_seats: 81, total_seats: 96, occupancy_rate: 84.0 },
      { movie_title: 'Dune 2', room_name: 'Phòng VIP Gold', start_time: '21:15', booked_seats: 41, total_seats: 60, occupancy_rate: 68.0 },
      { movie_title: 'Kung Fu Panda 4', room_name: 'Phòng 03', start_time: '18:00', booked_seats: 33, total_seats: 60, occupancy_rate: 55.0 }
    ],
    recent_bookings: [
      { booking_code: 'BK-9842', customer_name: 'Nguyễn Văn Hùng', movie_title: 'Mai (18+)', showtime: '19:30 • 18/11/2026', seats: 'F7, F8', total_price: 210000, status: 'DA_THANH_TOAN' },
      { booking_code: 'BK-9841', customer_name: 'Trần Thị Lan', movie_title: 'Lật Mặt 7: Một Điều Ước', showtime: '20:00 • 18/11/2026', seats: 'D4, D5, D6', total_price: 270000, status: 'DA_THANH_TOAN' },
      { booking_code: 'BK-9840', customer_name: 'Lê Văn Khải', movie_title: 'Dune: Hành Tinh Cát 2', showtime: '21:15 • 18/11/2026', seats: 'G11', total_price: 120000, status: 'GIU_CHO' }
    ]
  };

  renderAllDashboard(fallbackData);
}

/**
 * Tiện ích escape HTML chống XSS
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
