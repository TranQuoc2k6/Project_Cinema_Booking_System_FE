
/**
 * ==========================================================================
 * HOMEPAGE - CINEMA 3D
 * Tải dữ liệu phim từ Backend API
 * ==========================================================================
 */

// Lấy danh sách phim từ API
async function loadMoviesList() {
    const nowShowingContainer = document.getElementById('movies-container');
    const comingSoonContainer = document.getElementById('coming-soon-container');

    if (!nowShowingContainer || !comingSoonContainer) return;

    nowShowingContainer.innerHTML = '<p class="text-slate-400">Đang tải phim...</p>';
    comingSoonContainer.innerHTML = '<p class="text-slate-400">Đang tải phim...</p>';

    const result = await window.MovieService.getMovies();

    if (!result.success) {
        nowShowingContainer.innerHTML =
            '<p class="text-rose-400">Không thể tải danh sách phim.</p>';

        comingSoonContainer.innerHTML =
            '<p class="text-rose-400">Không thể tải danh sách phim.</p>';

        return;
    }

    const movies = result.data;

    // Lọc phim theo trạng thái từ Backend
    const nowShowing = movies.filter(movie =>
        movie.status === 'now_showing'
    );

    const comingSoon = movies.filter(movie =>
        movie.status === 'coming_soon'
    );

    renderMovieList(nowShowingContainer, nowShowing);
    renderMovieList(comingSoonContainer, comingSoon);

    // Hiển thị banner từ dữ liệu phim API
    renderBanner(comingSoon.length > 0 ? comingSoon : nowShowing);
}


// Hiển thị danh sách phim
function renderMovieList(container, movies) {
    if (movies.length === 0) {
        container.innerHTML = `
            <p class="col-span-full text-center text-slate-500 py-10">
                Hiện chưa có phim trong danh sách này.
            </p>
        `;
        return;
    }

    container.innerHTML = movies.map(movie => `
        <div class="glass-card rounded-2xl overflow-hidden border border-slate-800 hover:-translate-y-2 transition-all duration-300">

            <div class="relative h-[320px] overflow-hidden bg-slate-900">

                ${
                    movie.poster_url
                    ? `<img src="${movie.poster_url}"
                            alt="${movie.title}"
                            class="w-full h-full object-cover">`
                    : `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950">
                            <i class="fa-solid fa-film text-5xl text-cyan-500/50"></i>
                       </div>`
                }

                <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>

            </div>

            <div class="p-4 bg-slate-950/90">

                <h4 class="text-base font-bold text-white truncate">
                    ${movie.title}
                </h4>

                <div class="text-xs text-slate-400 mt-2 mb-3">
                    <i class="fa-regular fa-clock mr-1 text-[#ff5e1e]"></i>
                    ${movie.duration_minutes || 'Chưa cập nhật'} phút
                </div>

                <div class="flex gap-2">
                    <a href="pages/movie-detail.html?id=${movie.id}"
                       class="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold text-center border border-slate-700">
                        Chi tiết
                    </a>

                    <a href="pages/showtimes.html?movieId=${movie.id}"
                       class="flex-1 py-2 rounded-xl bg-gradient-to-r from-[#ff5e1e] to-[#ea580c] hover:brightness-110 text-white text-xs font-bold text-center shadow-[0_0_12px_rgba(255,94,30,0.4)]">
                        Đặt vé
                    </a>
                </div>

            </div>
        </div>
    `).join('');
}


// Hiển thị banner phim từ API
function renderBanner(movies) {
    const container = document.getElementById('carousel-cards');

    if (!container) return;

    if (movies.length === 0) {
        container.innerHTML = `
            <p class="text-slate-400 text-center">
                Hiện chưa có phim để hiển thị banner.
            </p>
        `;

        return;
    }

    // Chỉ lấy tối đa 3 phim
    const bannerMovies = movies.slice(0, 3);

    container.innerHTML = bannerMovies.map((movie, index) => `
        <div class="carousel-card absolute w-[280px] sm:w-[360px] rounded-2xl glass-card overflow-hidden shadow-2xl"
             data-index="${index}">

            <div class="relative h-[380px] sm:h-[420px] overflow-hidden bg-slate-900">

                ${
                    movie.poster_url
                    ? `<img src="${movie.poster_url}"
                            alt="${movie.title}"
                            class="w-full h-full object-cover">`
                    : `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950">
                            <i class="fa-solid fa-film text-6xl text-cyan-500/50"></i>
                       </div>`
                }

                <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>

                <div class="absolute bottom-4 left-4 right-4">

                    <span class="text-xs font-bold text-[#d4ff00]">
                        ${movie.status === 'coming_soon' ? 'Sắp công chiếu' : 'Đang công chiếu'}
                    </span>

                    <h3 class="text-xl sm:text-2xl font-black text-white leading-tight mt-1">
                        ${movie.title}
                    </h3>

                    <p class="text-xs text-slate-300 mt-2">
                        ${movie.duration_minutes || 'Chưa cập nhật'} phút
                    </p>

                </div>
            </div>

            <div class="p-4 bg-slate-950/90 flex items-center justify-between border-t border-slate-800">

                <span class="text-xs font-mono font-bold text-[#ff5e1e]">
                    LUMEN CINEMA
                </span>

                <a href="pages/movie-detail.html?id=${movie.id}"
                   class="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ff5e1e] to-[#ea580c] text-white font-bold text-xs shadow-md">
                    XEM CHI TIẾT
                </a>

            </div>

        </div>
    `).join('');

    // Cập nhật lại carousel sau khi tạo card
    initMovieCarousel();
}


// Khởi tạo carousel
function initMovieCarousel() {
    let currentIndex = 0;

    const cards = document.querySelectorAll('.carousel-card');
    const dots = document.querySelectorAll('.dot-indicator');

    const prevButton = document.getElementById('prev-btn');
    const nextButton = document.getElementById('next-btn');

    if (cards.length === 0) return;

    // Cập nhật số lượng dấu chấm theo số card
    const dotContainer = dots.length > 0
        ? dots[0].parentElement
        : null;

    if (dotContainer) {
        dotContainer.innerHTML = Array.from(cards).map((_, index) => `
            <span class="dot-indicator w-2.5 h-2 rounded-full bg-slate-700 transition-all duration-300"></span>
        `).join('');
    }

    const newDots = document.querySelectorAll('.dot-indicator');

    function updateCarousel() {
        const total = cards.length;
        const isMobile = window.innerWidth <= 768;
        const distance = isMobile ? 140 : 220;

        cards.forEach((card, index) => {
            const offset = (index - currentIndex + total) % total;

            if (offset === 0) {
                card.style.transform =
                    'translateX(0) translateZ(100px) scale(1)';
                card.style.opacity = '1';
                card.style.zIndex = '30';

            } else if (offset === 1) {
                card.style.transform =
                    `translateX(${distance}px) translateZ(-50px) scale(0.85)`;
                card.style.opacity = '0.6';
                card.style.zIndex = '10';

            } else {
                card.style.transform =
                    `translateX(-${distance}px) translateZ(-50px) scale(0.85)`;
                card.style.opacity = '0.6';
                card.style.zIndex = '10';
            }
        });

        newDots.forEach((dot, index) => {
            dot.className = index === currentIndex
                ? 'dot-indicator w-8 h-2 rounded-full bg-cyan-400 transition-all duration-300'
                : 'dot-indicator w-2.5 h-2 rounded-full bg-slate-700 transition-all duration-300';
        });
    }

    // Gán sự kiện chuyển card
    if (nextButton) {
        nextButton.onclick = () => {
            currentIndex = (currentIndex + 1) % cards.length;
            updateCarousel();
        };
    }

    if (prevButton) {
        prevButton.onclick = () => {
            currentIndex = (currentIndex - 1 + cards.length) % cards.length;
            updateCarousel();
        };
    }

    cards.forEach((card, index) => {
        card.onclick = (event) => {
            if (event.target.closest('a')) return;

            currentIndex = index;
            updateCarousel();
        };
    });

    updateCarousel();
}


// Cập nhật trạng thái đăng nhập trên Header
function updateAuthHeader() {
    const authSec = document.getElementById('header-auth-section');

    if (!authSec) return;

    const isAuth = window.StorageService
        ? window.StorageService.isAuthenticated()
        : false;

    const user = window.StorageService
        ? window.StorageService.getUser()
        : null;

    const isAdmin = window.StorageService
        ? window.StorageService.isAdmin()
        : false;

    if (isAuth && user) {
        authSec.innerHTML = `
            <div class="flex items-center gap-3">

                ${isAdmin
                    ? `<a href="pages/admin/dashboard.html"
                          class="px-3 py-1.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">
                          <i class="fa-solid fa-shield mr-1"></i> Admin
                       </a>`
                    : ''
                }

                <a href="pages/profile.html"
                   class="flex items-center gap-2 text-xs font-semibold text-slate-200">

                    <span class="hidden sm:inline">
                        ${user.full_name || user.email}
                    </span>
                </a>

                <button id="logout-btn"
                        class="px-3 py-1.5 rounded-full glass-panel text-xs text-slate-400 hover:text-rose-400">
                    <i class="fa-solid fa-arrow-right-from-bracket"></i>
                </button>

            </div>
        `;

        document.getElementById('logout-btn').onclick = handleLogout;
    }
}


// Đăng xuất
function handleLogout() {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        if (window.AuthService) {
            window.AuthService.logout('index.html');
        }
    }
}


// Khởi chạy Homepage
document.addEventListener('DOMContentLoaded', () => {
    loadMoviesList();
    updateAuthHeader();
});
