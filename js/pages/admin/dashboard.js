/**
 * ==========================================================================
 * ADMIN DASHBOARD CONTROLLER
 * Quản lý số liệu thống kê KPI và tải dữ liệu từ API Backend
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', function () {
  loadDashboardData();
});

async function loadDashboardData() {
  const token = window.AdminAuth ? window.AdminAuth.getToken() : null;

  try {
    const response = await fetch('http://127.0.0.1:8000/api/admin/dashboard/stats', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const result = await response.json();
      if (result.status === 'success' && result.data) {
        const stats = result.data;
        
        // Cập nhật số liệu KPI từ API Backend
        const revEl = document.getElementById('kpi-revenue');
        const tktEl = document.getElementById('kpi-tickets');
        const movEl = document.getElementById('kpi-movies');
        const usrEl = document.getElementById('kpi-users');

        if (revEl && stats.total_revenue) {
          revEl.textContent = Number(stats.total_revenue).toLocaleString('vi-VN') + ' đ';
        }
        if (tktEl && stats.total_tickets) {
          tktEl.textContent = stats.total_tickets + ' vé';
        }
        if (movEl && stats.total_movies) {
          movEl.textContent = stats.total_movies + ' phim';
        }
        if (usrEl && stats.total_users) {
          usrEl.textContent = stats.total_users + ' tài khoản';
        }

        console.log('[Dashboard] Dữ liệu thống kê đã được đồng bộ với Backend.');
      }
    }
  } catch (error) {
    console.log('[Dashboard] Backend chưa sẵn sàng, sử dụng dữ liệu mẫu cho giao diện.');
  }
}
