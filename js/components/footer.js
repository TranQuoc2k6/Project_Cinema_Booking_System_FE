/**
 * ==========================================================================
 * FOOTER COMPONENT (js/components/footer.js)
 * Tự động render Footer đồng bộ trên toàn bộ hệ thống LUMEN CINEMA:
 * - 4 Cột thông tin: Giới thiệu, Góc điện ảnh, Hỗ trợ, Logo & Mạng xã hội & Bộ Công Thương
 * - Thông tin pháp lý công ty, MST, địa chỉ, hotline
 * - Huy hiệu "ĐÃ THÔNG BÁO BỘ CÔNG THƯƠNG"
 * Chỉnh sửa 1 nơi - Tự động áp dụng cho TẤT CẢ các trang!
 * ==========================================================================
 */

(function () {
  'use strict';

  function getPathPrefixes() {
    const pathname = window.location.pathname.replace(/\\/g, '/');
    const isPagesDir = pathname.includes('/pages/');
    const isAdminDir = pathname.includes('/pages/admin/') || pathname.includes('/admin/');

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
    let footerEl = document.getElementById('main-footer');
    if (!footerEl) {
      footerEl = document.querySelector('footer');
    }
    if (!footerEl) return;

    // Đảm bảo footer có id và styling container chuẩn
    footerEl.id = 'main-footer';
    footerEl.className = 'relative z-10 bg-[#0b0d12] border-t border-white/10 text-slate-400 pt-12 pb-8 mt-auto';

    const prefixes = getPathPrefixes();

    footerEl.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Hàng 4 Cột Thông Tin (2 cột trên Mobile & iPad Mini, 4 cột trên Desktop rộng) -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-x-6 sm:gap-x-8 gap-y-8 lg:gap-12 pb-10">
          
          <!-- Cột 1: GIỚI THIỆU -->
          <div>
            <h4 class="text-xs sm:text-sm font-bold text-white uppercase tracking-wider mb-3 sm:mb-4">GIỚI THIỆU</h4>
            <ul class="space-y-2 sm:space-y-2.5 text-xs text-slate-400 font-medium">
              <li><a href="#" class="hover:text-[#ff5e1e] transition-colors block">Về Chúng Tôi</a></li>
              <li><a href="#" class="hover:text-[#ff5e1e] transition-colors block">Thoả Thuận Sử Dụng</a></li>
              <li><a href="#" class="hover:text-[#ff5e1e] transition-colors block">Quy Chế Hoạt Động</a></li>
              <li><a href="#" class="hover:text-[#ff5e1e] transition-colors block">Chính Sách Bảo Mật</a></li>
            </ul>
          </div>

          <!-- Cột 2: GÓC ĐIỆN ẢNH -->
          <div>
            <h4 class="text-xs sm:text-sm font-bold text-white uppercase tracking-wider mb-3 sm:mb-4">GÓC ĐIỆN ẢNH</h4>
            <ul class="space-y-2 sm:space-y-2.5 text-xs text-slate-400 font-medium">
              <li><a href="${prefixes.pages}movies.html" class="hover:text-[#ff5e1e] transition-colors block">Thể Loại Phim</a></li>
              <li><a href="#" class="hover:text-[#ff5e1e] transition-colors block">Bình Luận Phim</a></li>
              <li><a href="#" class="hover:text-[#ff5e1e] transition-colors block">Blog Điện Ảnh</a></li>
              <li><a href="${prefixes.pages}movies.html" class="hover:text-[#ff5e1e] transition-colors block">Phim Hay Tháng</a></li>
              <li><a href="${prefixes.pages}movies.html" class="hover:text-[#ff5e1e] transition-colors block">Phim IMAX</a></li>
            </ul>
          </div>

          <!-- Cột 3: HỖ TRỢ -->
          <div>
            <h4 class="text-xs sm:text-sm font-bold text-white uppercase tracking-wider mb-3 sm:mb-4">HỖ TRỢ</h4>
            <ul class="space-y-2 sm:space-y-2.5 text-xs text-slate-400 font-medium">
              <li><a href="#" class="hover:text-[#ff5e1e] transition-colors block">Góp Ý</a></li>
              <li><a href="#" class="hover:text-[#ff5e1e] transition-colors block">Sale & Services</a></li>
              <li><a href="${prefixes.pages}showtimes.html" class="hover:text-[#ff5e1e] transition-colors block">Rạp / Giá Vé</a></li>
              <li><a href="#" class="hover:text-[#ff5e1e] transition-colors block">Tuyển Dụng</a></li>
              <li><a href="#" class="hover:text-[#ff5e1e] transition-colors block">FAQ</a></li>
            </ul>
          </div>

          <!-- Cột 4: Logo, Mạng Xã Hội & Chứng Nhận Bộ Công Thương -->
          <div class="flex flex-col items-start lg:items-end gap-3 sm:gap-4 shrink-0">
            <!-- Brand Logo (Thu nhỏ hoặc phóng to linh hoạt theo từng màn hình, không bao giờ bị cắt chữ A) -->
            <a href="${prefixes.root}index.html" class="flex items-center gap-2 sm:gap-3 group max-w-full shrink-0">
              <img src="${prefixes.root}assets/images/logo/logo.png" alt="LUMEN CINEMA" class="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 object-contain shrink-0 drop-shadow-[0_0_12px_rgba(255,180,0,0.45)] group-hover:scale-105 transition-transform duration-300">
              <div class="flex flex-col text-left shrink-0">
                <span class="text-xs min-[360px]:text-sm sm:text-base lg:text-xl font-black tracking-normal sm:tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-[#ff5e1e] via-[#d4ff00] to-white leading-tight whitespace-nowrap pr-2">
                  LUMEN<span class="text-white font-light">CINEMA</span>
                </span>
                <span class="text-[6.5px] min-[360px]:text-[7.5px] sm:text-[8px] uppercase tracking-wider text-[#d4ff00] font-semibold block leading-tight mt-0.5 whitespace-nowrap">Studio & Theater HQ</span>
              </div>
            </a>

            <!-- Social Media Icons (Facebook, YouTube, Instagram) -->
            <div class="flex items-center gap-3 text-slate-300">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" class="hover:text-[#ff5e1e] transition-colors" title="Facebook">
                <i class="fa-brands fa-square-facebook text-xl sm:text-2xl"></i>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" class="hover:text-[#ff5e1e] transition-colors" title="YouTube">
                <i class="fa-brands fa-youtube text-xl sm:text-2xl"></i>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" class="hover:text-[#ff5e1e] transition-colors" title="Instagram">
                <i class="fa-brands fa-square-instagram text-xl sm:text-2xl"></i>
              </a>
            </div>

            <!-- Badge ĐÃ THÔNG BÁO BỘ CÔNG THƯƠNG -->
            <a href="http://online.gov.vn" target="_blank" rel="noopener noreferrer" class="inline-block transition-transform hover:scale-105" title="Đã thông báo Bộ Công Thương">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 155 38" class="h-8 sm:h-9 w-auto">
                <rect x="22" y="4" width="130" height="30" rx="4" fill="#0071ba" />
                <text x="45" y="17" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="8.5" font-weight="900" letter-spacing="0.4">ĐÃ THÔNG BÁO</text>
                <text x="45" y="28" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="7.5" font-weight="700" letter-spacing="0.4">BỘ CÔNG THƯƠNG</text>
                <circle cx="19" cy="19" r="16.5" fill="#0071ba" stroke="#ffffff" stroke-width="2"/>
                <circle cx="19" cy="19" r="13" fill="none" stroke="#ffffff" stroke-width="0.8" stroke-dasharray="1.5 1"/>
                <path d="M12 19 L16.5 23.5 L26 14" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </a>
          </div>
        </div>

        <!-- Đường Kẻ Ngang Phân Cách & Thông Tin Công Ty Bên Dưới -->
        <div class="border-t border-white/10 pt-6 sm:pt-8 pb-4">
          <div class="flex flex-col md:flex-row items-start md:items-center gap-4 sm:gap-6">
            <!-- Logo Doanh Nghiệp Bên Trái -->
            <a href="${prefixes.root}index.html" class="flex items-center gap-3 group shrink-0">
              <img src="${prefixes.root}assets/images/logo/logo.png" alt="LUMEN CINEMA" class="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-[0_0_12px_rgba(255,180,0,0.45)] group-hover:scale-105 transition-transform duration-300">
            </a>

            <!-- Chi Tiết Doanh Nghiệp (Khớp 100% Thông Tin Pháp Lý) -->
            <div class="space-y-1 text-xs text-slate-400">
              <h5 class="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">CÔNG TY CỔ PHẦN PHIM THIÊN NGÂN</h5>
              <p class="text-[11px] sm:text-xs">MST: 0101595681</p>
              <p class="text-[11px] sm:text-xs">3/9 Võ Văn Tần, Phường Xuân Hòa, Thành phố Hồ Chí Minh, Việt Nam</p>
              <p class="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 pt-0.5 text-[11px] sm:text-xs">
                <span class="flex items-center gap-1.5"><i class="fa-solid fa-phone text-[10px] sm:text-[11px] text-[#ff5e1e]"></i> 028.39.333.303</span>
                <span class="text-slate-600 hidden sm:inline">-</span>
                <span class="flex items-center gap-1.5"><i class="fa-solid fa-headset text-[10px] sm:text-[11px] text-[#d4ff00]"></i> 19002224 (9:00 - 22:00)</span>
                <span class="text-slate-600 hidden sm:inline">-</span>
                <span class="flex items-center gap-1.5"><i class="fa-solid fa-paper-plane text-[10px] sm:text-[11px] text-[#ff5e1e]"></i> hotro@galaxystudio.vn</span>
              </p>
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
