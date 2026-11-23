/**
 * ==========================================================================
 * FOOTER COMPONENT (js/components/footer.js)
 * Tự động render Footer đồng bộ trên toàn bộ hệ thống LUMEN CINEMA:
 * - 4 Khối thông tin chuẩn 2x2 trên Mobile / 4 cột trên Desktop:
 *   + Hàng 1: GIỚI THIỆU (trái) | GÓC ĐIỆN ẢNH (phải)
 *   + Hàng 2: HỖ TRỢ (trái) | LOGO, SOCIAL ICONS & BỘ CÔNG THƯƠNG (phải)
 * - Tối ưu hoàn hảo cho Mobile S (320px) không bao giờ bị cắt chữ
 * - Typography, Icon mạng xã hội & Huy hiệu Bộ Công Thương chuẩn theo thiết kế
 * - Thông tin pháp lý công ty, MST, địa chỉ, hotline
 * ==========================================================================
 */

(function () {
  'use strict';

  function getPathPrefixes() {
    const pathname = window.location.pathname.replace(/\\/g, '/').toLowerCase();
    const isAdminDir = pathname.includes('/pages/admin/') || pathname.includes('/admin/');
    const isPagesDir = pathname.includes('/pages/');

    if (isAdminDir) {
      return {
        root: '../../',
        pages: '../',
        admin: './'
      };
    } else if (isPagesDir) {
      return {
        root: '../',
        pages: './',
        admin: './admin/'
      };
    }
    return {
      root: './',
      pages: 'pages/',
      admin: 'pages/admin/'
    };
  }

  function renderFooter() {
    const pathname = window.location.pathname.replace(/\\/g, '/').toLowerCase();

    // Yêu cầu: Trừ phần đăng nhập ra (trang login.html không hiển thị footer)
    if (pathname.endsWith('login.html') || pathname.includes('/login.html')) {
      return;
    }

    let footerEl = document.getElementById('main-footer');
    if (!footerEl) {
      footerEl = document.querySelector('footer');
    }
    if (!footerEl) {
      footerEl = document.createElement('footer');
      footerEl.id = 'main-footer';
      document.body.appendChild(footerEl);
    }

    footerEl.id = 'main-footer';
    footerEl.className = 'relative z-10 bg-[#0b0d12] border-t border-white/10 text-slate-400 pt-10 sm:pt-12 pb-8 mt-auto w-full';

    const prefixes = getPathPrefixes();

    footerEl.innerHTML = `
      <div class="max-w-7xl mx-auto px-2.5 min-[360px]:px-4 sm:px-6 lg:px-8">
        
        <!-- Hàng 4 Cột Thông Tin (2 cột trên Mobile chuẩn 2x2, 4 cột trên Desktop) -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-x-3 min-[360px]:gap-x-6 sm:gap-x-10 gap-y-7 sm:gap-y-10 lg:gap-12 pb-10">
          
          <!-- Cột 1 (Hàng 1 Trái): GIỚI THIỆU -->
          <div>
            <h4 class="text-xs min-[360px]:text-sm sm:text-base font-bold text-white uppercase tracking-wider mb-2.5 sm:mb-4">GIỚI THIỆU</h4>
            <ul class="space-y-2 sm:space-y-3 text-[11px] min-[360px]:text-xs sm:text-sm text-slate-300/80 font-medium">
              <li><a href="${prefixes.root}index.html" class="hover:text-[#ff5e1e] transition-colors block">Về Chúng Tôi</a></li>
              <li><a href="#" class="hover:text-[#ff5e1e] transition-colors block">Thoả Thuận Sử Dụng</a></li>
              <li><a href="#" class="hover:text-[#ff5e1e] transition-colors block">Quy Chế Hoạt Động</a></li>
              <li><a href="#" class="hover:text-[#ff5e1e] transition-colors block">Chính Sách Bảo Mật</a></li>
            </ul>
          </div>

          <!-- Cột 2 (Hàng 1 Phải): GÓC ĐIỆN ẢNH -->
          <div>
            <h4 class="text-xs min-[360px]:text-sm sm:text-base font-bold text-white uppercase tracking-wider mb-2.5 sm:mb-4">GÓC ĐIỆN ẢNH</h4>
            <ul class="space-y-2 sm:space-y-3 text-[11px] min-[360px]:text-xs sm:text-sm text-slate-300/80 font-medium">
              <li><a href="${prefixes.pages}movies.html" class="hover:text-[#ff5e1e] transition-colors block">Thể Loại Phim</a></li>
              <li><a href="${prefixes.pages}movies.html" class="hover:text-[#ff5e1e] transition-colors block">Bình Luận Phim</a></li>
              <li><a href="${prefixes.pages}movies.html" class="hover:text-[#ff5e1e] transition-colors block">Blog Điện Ảnh</a></li>
              <li><a href="${prefixes.pages}movies.html" class="hover:text-[#ff5e1e] transition-colors block">Phim Hay Tháng</a></li>
              <li><a href="${prefixes.pages}movies.html" class="hover:text-[#ff5e1e] transition-colors block">Phim IMAX</a></li>
            </ul>
          </div>

          <!-- Cột 3 (Hàng 2 Trái): HỖ TRỢ -->
          <div>
            <h4 class="text-xs min-[360px]:text-sm sm:text-base font-bold text-white uppercase tracking-wider mb-2.5 sm:mb-4">HỖ TRỢ</h4>
            <ul class="space-y-2 sm:space-y-3 text-[11px] min-[360px]:text-xs sm:text-sm text-slate-300/80 font-medium">
              <li><a href="#" class="hover:text-[#ff5e1e] transition-colors block">Góp Ý</a></li>
              <li><a href="#" class="hover:text-[#ff5e1e] transition-colors block">Sale & Services</a></li>
              <li><a href="${prefixes.pages}showtimes.html" class="hover:text-[#ff5e1e] transition-colors block">Rạp / Giá Vé</a></li>
              <li><a href="#" class="hover:text-[#ff5e1e] transition-colors block">Tuyển Dụng</a></li>
              <li><a href="#" class="hover:text-[#ff5e1e] transition-colors block">FAQ</a></li>
            </ul>
          </div>

          <!-- Cột 4 (Hàng 2 Phải): Logo, Mạng Xã Hội & Chứng Nhận Bộ Công Thương -->
          <div class="flex flex-col items-start gap-3 min-[360px]:gap-4 sm:gap-5 justify-start min-w-0">
            <!-- Brand Logo (Hexagon Icon + LUMENCINEMA + Studio & Theater HQ) - Co giãn chuẩn Mobile S không bao giờ bị cắt chữ A -->
            <a href="${prefixes.root}index.html" class="flex items-center gap-1.5 min-[360px]:gap-2 sm:gap-3 group shrink-0 max-w-full">
              <img src="${prefixes.root}assets/images/logo/logo.png" alt="LUMEN CINEMA" class="w-6 h-6 min-[360px]:w-8 min-[360px]:h-8 sm:w-10 sm:h-10 object-contain drop-shadow-[0_0_12px_rgba(255,180,0,0.45)] group-hover:scale-105 transition-transform duration-300 shrink-0">
              <div class="flex flex-col text-left shrink-0">
                <div class="text-[11px] min-[340px]:text-[12.5px] min-[380px]:text-[13.5px] min-[420px]:text-sm sm:text-base lg:text-lg font-black tracking-tight min-[360px]:tracking-normal sm:tracking-wide leading-tight whitespace-nowrap">
                  <span class="text-[#ff5e1e]">LUMEN</span><span class="text-white">CINEMA</span>
                </div>
                <span class="text-[6px] min-[340px]:text-[7px] min-[380px]:text-[8px] sm:text-[9px] uppercase tracking-wider text-[#d4ff00] font-bold block leading-tight mt-0.5 whitespace-nowrap">STUDIO & THEATER HQ</span>
              </div>
            </a>

            <!-- Social Media Icons (Facebook, YouTube, Instagram) -->
            <div class="flex items-center gap-2.5 min-[360px]:gap-3.5 sm:gap-4 text-white text-lg min-[360px]:text-xl sm:text-2xl">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" class="hover:text-[#ff5e1e] hover:scale-110 transition-all" title="Facebook">
                <i class="fa-brands fa-square-facebook"></i>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" class="hover:text-[#ff5e1e] hover:scale-110 transition-all" title="YouTube">
                <i class="fa-brands fa-youtube"></i>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" class="hover:text-[#ff5e1e] hover:scale-110 transition-all" title="Instagram">
                <i class="fa-brands fa-square-instagram"></i>
              </a>
            </div>

            <!-- Badge ĐÃ THÔNG BÁO BỘ CÔNG THƯƠNG -->
            <a href="http://online.gov.vn" target="_blank" rel="noopener noreferrer" class="inline-block transition-transform hover:scale-105 max-w-full" title="Đã thông báo Bộ Công Thương">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 42" class="h-6 min-[360px]:h-8 sm:h-10 w-auto max-w-full">
                <rect width="170" height="42" rx="8" fill="#0071ba" />
                <circle cx="21" cy="21" r="15" fill="#0071ba" stroke="#ffffff" stroke-width="1.8" />
                <circle cx="21" cy="21" r="12" fill="none" stroke="#ffffff" stroke-width="0.8" stroke-dasharray="1.5 1" />
                <path d="M14 21 L19 26 L29 15" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                <text x="44" y="19" fill="#ffffff" font-family="'Inter', Arial, sans-serif" font-size="10" font-weight="900" letter-spacing="0.5">ĐÃ THÔNG BÁO</text>
                <text x="44" y="32" fill="#ffffff" font-family="'Inter', Arial, sans-serif" font-size="9" font-weight="700" letter-spacing="0.5">BỘ CÔNG THƯƠNG</text>
              </svg>
            </a>
          </div>
        </div>

        <!-- Đường Kẻ Ngang Phân Cách & Thông Tin Công Ty Bên Dưới -->
        <div class="border-t border-white/10 pt-6 sm:pt-8 pb-4">
          <div class="flex flex-col md:flex-row items-start md:items-center gap-4 sm:gap-6">
            <!-- Logo Doanh Nghiệp Bên Trái -->
            <a href="${prefixes.root}index.html" class="flex items-center gap-3 group shrink-0">
              <img src="${prefixes.root}assets/images/logo/logo.png" alt="LUMEN CINEMA" class="w-7 h-7 min-[360px]:w-8 min-[360px]:h-8 sm:w-10 sm:h-10 object-contain drop-shadow-[0_0_12px_rgba(255,180,0,0.45)] group-hover:scale-105 transition-transform duration-300">
            </a>

            <!-- Chi Tiết Doanh Nghiệp (Khớp 100% Thông Tin Pháp Lý Galaxy Cinema / Thiên Ngân) -->
            <div class="space-y-1 text-xs text-slate-400">
              <h5 class="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">CÔNG TY CỔ PHẦN PHIM THIÊN NGÂN</h5>
              <p class="text-[10px] min-[360px]:text-[11px] sm:text-xs text-slate-400">MST: 0101595681</p>
              <p class="text-[10px] min-[360px]:text-[11px] sm:text-xs text-slate-400">3/9 Võ Văn Tần, Phường Xuân Hòa, Thành phố Hồ Chí Minh, Việt Nam</p>
              <p class="flex flex-wrap items-center gap-x-2.5 sm:gap-x-4 gap-y-1 pt-0.5 text-[10px] min-[360px]:text-[11px] sm:text-xs">
                <span class="flex items-center gap-1.5"><i class="fa-solid fa-phone text-[9px] sm:text-[11px] text-[#ff5e1e]"></i> 028.39.333.303</span>
                <span class="text-slate-600 hidden sm:inline">-</span>
                <span class="flex items-center gap-1.5"><i class="fa-solid fa-headset text-[9px] sm:text-[11px] text-[#d4ff00]"></i> 19002224 (9:00 - 22:00)</span>
                <span class="text-slate-600 hidden sm:inline">-</span>
                <span class="flex items-center gap-1.5"><i class="fa-solid fa-paper-plane text-[9px] sm:text-[11px] text-[#ff5e1e]"></i> hotro@galaxystudio.vn</span>
              </p>
              <p class="text-[9px] min-[360px]:text-[10px] sm:text-[11px] text-slate-500 pt-1">© 2026 LUMEN CINEMA. Bản quyền thuộc về Công ty Cổ phần Phim Thiên Ngân. All Rights Reserved.</p>
            </div>
          </div>
        </div>

      </div>
    `;
  }

  // Khởi tạo render tự động khi DOM sẵn sàng
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderFooter);
  } else {
    renderFooter();
  }

  // Đưa vào window để có thể gọi lại bất cứ lúc nào
  window.renderFooter = renderFooter;
})();
