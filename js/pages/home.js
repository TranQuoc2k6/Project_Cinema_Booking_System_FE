/**
 * ==========================================================================
 * LUMEN SPATIAL CINEMA 3D - HOME PAGE CONTROLLER
 * Trải nghiệm điện ảnh không gian 3D tương tác hoàn toàn bằng chuột:
 * - Cuộn chuột (Mouse Wheel) để chuyển phim mượt mà
 * - Kéo chuột (Mouse Drag / Swipe) với lực quán tính
 * - Di chuột (Mouse Movement) tạo hiệu ứng nghiêng 3D Parallax chân thực
 * - Nhấp chuột vào bất kỳ phim nào để tự động cuộn sang và lấy nét tâm điểm (Auto-Center)
 * - Tự động đổi hình nền rực rỡ và ánh sáng môi trường Ambient Glow theo phim
 * ==========================================================================
 */

// Dữ liệu phim phong phú dự phòng (kèm Poster HD, Backdrop 4K và Trailer chính thức)
const fallbackMoviesList = [
    {
        id: 3,
        title: "Dune: Hành Tinh Cát 2",
        original_title: "Dune: Part Two",
        status: "now_showing",
        status_label: "Đang công chiếu",
        duration_minutes: 166,
        age_rating: "16+",
        tech_badge: "IMAX LASER 3D",
        genres: ["Khoa Học Viễn Tưởng", "Hành Động", "Phiêu Lưu"],
        description: "Hành trình báo thù và định đoạt tương lai thiên hà của Paul Atreides bên cạnh chiến binh Chani và tộc người Fremen sa mạc Arrakis.",
        poster_url: "https://image.tmdb.org/t/p/original/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg",
        backdrop_url: "https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s520QIq.jpg",
        trailer_url: "https://www.youtube.com/embed/Way9Dexny3w?autoplay=1",
        accent_color: "#e6ca85",
        release_date: "01/03/2026"
    },
    {
        id: 7,
        title: "Deadpool & Wolverine",
        original_title: "Deadpool & Wolverine",
        status: "coming_soon",
        status_label: "Sắp khởi chiếu",
        duration_minutes: 128,
        age_rating: "18+",
        tech_badge: "SCREENX 270°",
        genres: ["Hành Động", "Hài Hước", "Siêu Anh Hùng"],
        description: "Sự kết hợp bùng nổ giữa hai dị nhân biểu tượng của Marvel trong chuyến du hành xuyên đa vũ trụ đầy tiếng cười và màn hành động mãn nhãn.",
        poster_url: "https://image.tmdb.org/t/p/original/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
        backdrop_url: "https://image.tmdb.org/t/p/original/yDHYTjA3R0jFYba16jBB1jv8AmC.jpg",
        trailer_url: "https://www.youtube.com/embed/73_1biulkYk?autoplay=1",
        accent_color: "#ff3344",
        release_date: "26/07/2026"
    },
    {
        id: 1,
        title: "Mai (18+)",
        original_title: "Mai",
        status: "now_showing",
        status_label: "Đang công chiếu",
        duration_minutes: 131,
        age_rating: "18+",
        tech_badge: "DOLBY ATMOS",
        genres: ["Tâm Lý", "Tình Cảm", "Gia Đình"],
        description: "Câu chuyện tình yêu đầy trắc trở giữa Mai - người phụ nữ massage chịu nhiều tổn thương và Dương - chàng nhạc công lãng tử.",
        poster_url: "https://upload.wikimedia.org/wikipedia/vi/3/36/Mai_2024_poster.jpg",
        backdrop_url: "https://upload.wikimedia.org/wikipedia/vi/3/36/Mai_2024_poster.jpg",
        trailer_url: "https://www.youtube.com/embed/HKk97N0jG9g?autoplay=1",
        accent_color: "#ff8c42",
        release_date: "10/02/2026"
    },
    {
        id: 2,
        title: "Lật Mặt 7: Một Điều Ước",
        original_title: "Face Off 7: One Wish",
        status: "now_showing",
        status_label: "Đang công chiếu",
        duration_minutes: 138,
        age_rating: "P",
        tech_badge: "2D DOLBY SOUND",
        genres: ["Gia Đình", "Tâm Lý", "Cảm Động"],
        description: "Bức tranh gia đình nhiều thế hệ xoay quanh người mẹ già một đời tần tảo và ước nguyện sum vầy cùng 5 người con.",
        poster_url: "https://image.tmdb.org/t/p/original/1K7pHhCZprfDXB7LkCquIK62yCb.jpg",
        backdrop_url: "https://image.tmdb.org/t/p/original/1K7pHhCZprfDXB7LkCquIK62yCb.jpg",
        trailer_url: "https://www.youtube.com/embed/e5_Jt3J_Cq4?autoplay=1",
        accent_color: "#d4ff00",
        release_date: "26/04/2026"
    },
    {
        id: 4,
        title: "Quật Mộ Trùng Ma (Exhuma)",
        original_title: "Exhuma",
        status: "now_showing",
        status_label: "Đang công chiếu",
        duration_minutes: 134,
        age_rating: "16+",
        tech_badge: "4DX IMMERSIVE",
        genres: ["Kinh Dị", "Bí Ẩn", "Tâm Linh"],
        description: "Bí ẩn ngôi mộ cổ đe dọa sinh mạng của gia tộc giàu có, kéo theo cuộc trừ tà và khai quật kinh hoàng tại vùng biên giới hoang vu.",
        poster_url: "https://image.tmdb.org/t/p/original/tMefBSflR6PGQLv7WvFPpKLZkyk.jpg",
        backdrop_url: "https://image.tmdb.org/t/p/original/4woSOUD0equAYzvwhWBHIJDCM88.jpg",
        trailer_url: "https://www.youtube.com/embed/N-0_Q8p7sN0?autoplay=1",
        accent_color: "#9945ff",
        release_date: "15/03/2026"
    },
    {
        id: 6,
        title: "Kung Fu Panda 4",
        original_title: "Kung Fu Panda 4",
        status: "now_showing",
        status_label: "Đang công chiếu",
        duration_minutes: 94,
        age_rating: "P",
        tech_badge: "3D REAL-D",
        genres: ["Hoạt Hình", "Hành Động", "Hài Hước"],
        description: "Gấu Po đối mặt với thử thách mới để trở thành Thủ lĩnh Tinh thần Thung lũng Bình Yên và đối đầu Tắc Kè Bông Tắc Kè.",
        poster_url: "https://image.tmdb.org/t/p/original/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg",
        backdrop_url: "https://image.tmdb.org/t/p/original/1XDDXPXGiI8id7MrUxK36ke7gkX.jpg",
        trailer_url: "https://www.youtube.com/embed/_inKs4eeHiI?autoplay=1",
        accent_color: "#10b981",
        release_date: "08/03/2026"
    },
    {
        id: 8,
        title: "Moana 2: Biển Cả Gọi Tên",
        original_title: "Moana 2",
        status: "coming_soon",
        status_label: "Sắp khởi chiếu",
        duration_minutes: 100,
        age_rating: "P",
        tech_badge: "IMAX 3D",
        genres: ["Hoạt Hình", "Âm Nhạc", "Phiêu Lưu"],
        description: "Moana cùng Á thần Maui và thủy thủ đoàn mới bước vào hành trình thám hiểm đại dương bao la để kết nối lại các bộ tộc phương xa.",
        poster_url: "https://image.tmdb.org/t/p/original/yh64qw9mgXBvlaWDi7Q9tpUBAvH.jpg",
        backdrop_url: "https://image.tmdb.org/t/p/original/v9acaWVvY8GjHkM8F6oGZJ8F4Lz.jpg",
        trailer_url: "https://www.youtube.com/embed/hDZ7y8RP5HE?autoplay=1",
        accent_color: "#00d2ff",
        release_date: "27/11/2026"
    },
    {
        id: 9,
        title: "Võ Sĩ Giác Đấu II (Gladiator II)",
        original_title: "Gladiator II",
        status: "coming_soon",
        status_label: "Sắp khởi chiếu",
        duration_minutes: 148,
        age_rating: "18+",
        tech_badge: "IMAX LASER 3D",
        genres: ["Hành Động", "Sử Thi", "Lịch Sử"],
        description: "Trường thiên sử thi rực lửa tại đấu trường La Mã cổ đại nối tiếp huyền thoại đoạt giải Oscar của đạo diễn Ridley Scott.",
        poster_url: "https://image.tmdb.org/t/p/original/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg",
        backdrop_url: "https://image.tmdb.org/t/p/original/u78sP6w68FzXqH0Wp1k0WdK9B2g.jpg",
        trailer_url: "https://www.youtube.com/embed/4rgYUipGJNo?autoplay=1",
        accent_color: "#c2410c",
        release_date: "22/11/2026"
    },
    {
        id: 5,
        title: "Godzilla x Kong: Đế Chế Mới",
        original_title: "Godzilla x Kong: The New Empire",
        status: "now_showing",
        status_label: "Đang công chiếu",
        duration_minutes: 115,
        age_rating: "13+",
        tech_badge: "IMAX LASER 3D",
        genres: ["Quái Thú", "Khoa Học Viễn Tưởng", "Hành Động"],
        description: "Hai biểu tượng quái thú huyền thoại hợp nhất sức mạnh để đối đầu mối đe dọa sinh tử từ sâu thẳm lòng Trái Đất Rỗng.",
        poster_url: "https://upload.wikimedia.org/wikipedia/en/b/be/Godzilla_x_kong_the_new_empire_poster.jpg",
        backdrop_url: "https://upload.wikimedia.org/wikipedia/en/b/be/Godzilla_x_kong_the_new_empire_poster.jpg",
        trailer_url: "https://www.youtube.com/embed/lV1OOlGwExg?autoplay=1",
        accent_color: "#e11d48",
        release_date: "29/03/2026"
    }
];

// Trạng thái ứng dụng
let masterMoviesList = [...fallbackMoviesList];
let filteredMovies = [...fallbackMoviesList];
let currentIndex = 0; // Vị trí phim đang được chọn làm tâm điểm
let currentFilter = 'all';

// Audio Synthesizer (Hiệu ứng âm thanh điện ảnh tinh tế khi di chuyển phim)
let soundEnabled = true;
const audioCtx = (window.AudioContext || window.webkitAudioContext) ? new (window.AudioContext || window.webkitAudioContext)() : null;
function playUiTone(freq = 440, type = 'sine', duration = 0.08, gain = 0.04) {
    if (!soundEnabled || !audioCtx) return;
    try {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gNode = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gNode.gain.setValueAtTime(gain, audioCtx.currentTime);
        gNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gNode);
        gNode.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
}

// Khởi chạy khi tài liệu nạp xong
document.addEventListener('DOMContentLoaded', async () => {
    initThreeBackground();
    initFilterTabs();
    initMouseInteractionEngine();
    initTrailerModal();
    updateAuthHeader();

    await loadMoviesFromBackend();
});

// Nạp danh sách phim từ Backend API (kết hợp làm giàu thông tin đồ họa)
async function loadMoviesFromBackend() {
    try {
        if (window.MovieService && typeof window.MovieService.getMovies === 'function') {
            const res = await window.MovieService.getMovies();
            if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
                // Map dữ liệu từ Backend vào format hiển thị 3D
                masterMoviesList = res.data.map((m, idx) => {
                    const fallbackMatch = fallbackMoviesList.find(f => f.id === m.id || f.title.toLowerCase().includes(m.title.toLowerCase()));
                    return {
                        id: m.id,
                        title: m.title,
                        original_title: m.slug || m.title,
                        status: (m.status || '').toLowerCase() === 'coming_soon' ? 'coming_soon' : 'now_showing',
                        status_label: (m.status || '').toLowerCase() === 'coming_soon' ? 'Sắp khởi chiếu' : 'Đang công chiếu',
                        duration_minutes: m.duration_minutes || (fallbackMatch ? fallbackMatch.duration_minutes : 120),
                        age_rating: fallbackMatch ? fallbackMatch.age_rating : '16+',
                        tech_badge: fallbackMatch ? fallbackMatch.tech_badge : 'IMAX LASER 3D',
                        genres: (m.genres && m.genres.length > 0) ? m.genres.map(g => g.name || g) : (fallbackMatch ? fallbackMatch.genres : ['Điện Ảnh', 'Hành Động']),
                        description: m.description || (fallbackMatch ? fallbackMatch.description : 'Trải nghiệm đỉnh cao công nghệ điện ảnh tại LUMEN Cinema.'),
                        poster_url: m.poster_url || (fallbackMatch ? fallbackMatch.poster_url : ''),
                        backdrop_url: (fallbackMatch ? fallbackMatch.backdrop_url : m.poster_url),
                        trailer_url: (m.trailer_url && m.trailer_url.includes('embed')) ? m.trailer_url : (fallbackMatch ? fallbackMatch.trailer_url : 'https://www.youtube.com/embed/Way9Dexny3w?autoplay=1'),
                        accent_color: fallbackMatch ? fallbackMatch.accent_color : '#ff5e1e',
                        release_date: m.release_date || '2026'
                    };
                });
            }
        }
    } catch (e) {
        console.warn('[loadMoviesFromBackend] Sử dụng danh mục 3D mặc định:', e);
    }

    applyFilter(currentFilter);
}

// =========================================================================
// 1. RENDER 3D STAGE & CARDS
// =========================================================================
let hasDragged = false; // Phân biệt giữa Click chọn phim và Kéo lướt phim

function renderStage() {
    const stage = document.getElementById('spatial-carousel');
    const dotsBar = document.getElementById('hud-dots-bar');
    if (!stage) return;

    stage.innerHTML = '';
    if (dotsBar) dotsBar.innerHTML = '';

    filteredMovies.forEach((m, idx) => {
        const card = document.createElement('div');
        card.className = 'movie-card-3d card-reflection glass-hud border border-white/20 overflow-hidden';
        card.dataset.index = idx;
        card.dataset.id = m.id;
        card.style.cursor = 'pointer';

        card.innerHTML = `
            <!-- Neon Glow Pod for active focused card (GPU opacity) -->
            <div class="card-active-glow pointer-events-none"></div>
            <!-- Dynamic Depth Dimmer for side cards (GPU opacity) -->
            <div class="card-depth-dimmer pointer-events-none"></div>

            <div class="relative w-full h-full overflow-hidden bg-slate-950 pointer-events-none">
                <img src="${m.poster_url}" alt="${m.title}" loading="eager" class="w-full h-full object-cover transition-transform duration-500 pointer-events-none">
                
                <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent pointer-events-none"></div>

                <!-- Top Badges -->
                <div class="absolute top-3 left-3 z-20 flex gap-1.5 pointer-events-none">
                    <span class="px-2 py-0.5 rounded text-[10px] font-black font-mono-num bg-black/60 backdrop-blur-md text-white border border-white/20">
                        ${m.tech_badge.split(' ')[0]}
                    </span>
                    <span class="px-2 py-0.5 rounded text-[10px] font-black font-mono-num bg-red-600/70 backdrop-blur-md text-white">
                        ${m.age_rating}
                    </span>
                </div>

                <!-- Bottom Title Preview -->
                <div class="absolute bottom-2.5 left-2.5 right-2.5 sm:bottom-4 sm:left-4 sm:right-4 z-20 pointer-events-none">
                    <span class="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#d4ff00]">${m.status_label}</span>
                    <h3 class="text-3d-card-title text-xs sm:text-base font-black leading-tight mt-0.5 line-clamp-2">${m.title}</h3>
                    <p class="text-[10px] sm:text-[11px] text-slate-300 font-mono-num mt-0.5 flex items-center gap-1 font-semibold">
                        <i class="fa-regular fa-clock text-[#ff5e1e]"></i> ${m.duration_minutes} phút
                    </p>
                </div>
            </div>
        `;

        // Nhấp vào phim trực tiếp để tự động cuộn sang
        card.addEventListener('click', (e) => {
            e.stopPropagation();
            if (hasDragged) return;

            if (idx !== currentIndex) {
                playUiTone(520, 'triangle', 0.08, 0.06);
                selectMovie(idx);
            } else {
                playUiTone(640, 'sine', 0.08, 0.04);
            }
        });

        stage.appendChild(card);

        // Dot Indicator (Responsive kích thước hạt chỉ số theo Mobile)
        if (dotsBar) {
            const dot = document.createElement('button');
            dot.className = `w-1.5 h-1.5 min-[360px]:w-2 min-[360px]:h-2 rounded-full transition-all duration-300 shrink-0 ${idx === currentIndex ? 'w-4 min-[360px]:w-6 bg-[#ff5e1e]' : 'bg-slate-700 hover:bg-slate-500'}`;
            dot.title = m.title;
            dot.addEventListener('click', () => selectMovie(idx));
            dotsBar.appendChild(dot);
        }
    });

    updateSpatialTransforms();
}

// =========================================================================
// 2. BIẾN ĐỔI 3D COVERFLOW SPATIAL (Hardware-Accelerated 60FPS)
// =========================================================================
function updateSpatialTransforms() {
    const stage = document.getElementById('spatial-carousel');
    if (!stage) return;
    const cards = stage.querySelectorAll('.movie-card-3d');
    const width = window.innerWidth;
    const isTinyMobile = width < 360;
    const isSmallMobile = width < 480;
    const isMobile = width < 768;
    const isTablet = width < 1024;

    // Tính toán khoảng cách tọa độ X tinh tế theo kích thước viewport
    const spacingX = isTinyMobile ? 54 : (isSmallMobile ? 75 : (isMobile ? 95 : (isTablet ? 115 : 205)));
    const baseShift = isTinyMobile ? 28 : (isSmallMobile ? 38 : (isMobile ? 48 : (isTablet ? 45 : 65)));

    // Giới hạn số lượng thẻ hiển thị theo màn hình để triệt tiêu 100% hiện tượng tràn ngang (overflow)
    const maxVisibleOffset = isTinyMobile ? 1 : (isSmallMobile ? 1 : (isMobile ? 1 : (isTablet ? 2 : 3)));

    cards.forEach((card, idx) => {
        const offset = idx - currentIndex;
        const absOffset = Math.abs(offset);

        // Ẩn hoàn toàn (display: none) các phim nằm ngoài tầm nhìn để loại bỏ triệt để bounding box gây tràn trang
        if (absOffset > maxVisibleOffset) {
            card.style.display = 'none';
            card.style.visibility = 'hidden';
            card.style.pointerEvents = 'none';
            card.classList.remove('is-active-card');
            return;
        }

        card.style.display = 'block';
        card.style.visibility = 'visible';
        card.style.pointerEvents = 'auto';
        const dimmer = card.querySelector('.card-depth-dimmer');

        if (offset === 0) {
            // PHIM Ở TÂM ĐIỂM (ACTIVE FOCUSED MOVIE)
            card.classList.add('is-active-card');
            const centerScale = isTinyMobile ? 1.02 : (isSmallMobile ? 1.04 : 1.08);
            card.style.transform = `translate3d(0px, 0px, 140px) rotateY(0deg) scale3d(${centerScale}, ${centerScale}, 1)`;
            card.style.opacity = '1';
            card.style.zIndex = '30';
            if (dimmer) dimmer.style.opacity = '0';
        } else if (offset > 0) {
            // CÁC PHIM BÊN PHẢI (ROTATE PHẢI VÀ ĐẨY LÙI KHÔNG GIAN)
            card.classList.remove('is-active-card');
            const tx = offset * spacingX + baseShift;
            const tz = -140 - absOffset * 35;
            const ry = isTinyMobile ? -24 : (isSmallMobile ? -28 : -36);
            const scale = Math.max(0.70, 0.95 - absOffset * 0.12);
            const opacity = Math.max(0.25, 0.85 - absOffset * 0.25);

            card.style.transform = `translate3d(${tx}px, 0px, ${tz}px) rotateY(${ry}deg) scale3d(${scale}, ${scale}, 1)`;
            card.style.opacity = opacity.toString();
            card.style.zIndex = (20 - absOffset).toString();
            if (dimmer) dimmer.style.opacity = Math.min(0.75, 0.25 + absOffset * 0.18).toFixed(2);
        } else {
            // CÁC PHIM BÊN TRÁI (ROTATE TRÁI VÀ ĐẨY LÙI KHÔNG GIAN)
            card.classList.remove('is-active-card');
            const tx = offset * spacingX - baseShift;
            const tz = -140 - absOffset * 35;
            const ry = isTinyMobile ? 24 : (isSmallMobile ? 28 : 36);
            const scale = Math.max(0.70, 0.95 - absOffset * 0.12);
            const opacity = Math.max(0.25, 0.85 - absOffset * 0.25);

            card.style.transform = `translate3d(${tx}px, 0px, ${tz}px) rotateY(${ry}deg) scale3d(${scale}, ${scale}, 1)`;
            card.style.opacity = opacity.toString();
            card.style.zIndex = (20 - absOffset).toString();
            if (dimmer) dimmer.style.opacity = Math.min(0.75, 0.25 + absOffset * 0.18).toFixed(2);
        }
    });

    updateHudDetails();
}

// =========================================================================
// 3. TỰ ĐỘNG CUỘN ĐẾN PHIM (AUTO-SCROLL & CENTER FOCUS)
// =========================================================================
function selectMovie(index) {
    if (filteredMovies.length === 0) return;
    currentIndex = Math.max(0, Math.min(index, filteredMovies.length - 1));
    updateSpatialTransforms();

    const dotsBar = document.getElementById('hud-dots-bar');
    if (dotsBar) {
        const dots = dotsBar.querySelectorAll('button');
        dots.forEach((dot, dIdx) => {
            if (dIdx === currentIndex) {
                dot.className = 'w-4 min-[360px]:w-6 h-1.5 min-[360px]:h-2 rounded-full bg-[#ff5e1e] shadow-[0_0_12px_rgba(255,94,30,0.8)] transition-all duration-300 shrink-0';
            } else {
                dot.className = 'w-1.5 h-1.5 min-[360px]:w-2 min-[360px]:h-2 rounded-full bg-slate-700 hover:bg-slate-500 transition-all duration-300 shrink-0';
            }
        });
    }
}

// =========================================================================
// 4. CẬP NHẬT THÔNG TIN HUD THEO PHIM ĐƯỢC CHỌN (GPU Crossfade & Preload)
// =========================================================================
let activeBackdropLayer = 1;
const preloadedBackdrops = new Set();

function preloadAdjacentBackdrops() {
    [currentIndex - 1, currentIndex, currentIndex + 1].forEach(i => {
        if (i >= 0 && i < filteredMovies.length) {
            const url = filteredMovies[i].backdrop_url || filteredMovies[i].poster_url;
            if (url && !preloadedBackdrops.has(url)) {
                preloadedBackdrops.add(url);
                const img = new Image();
                img.src = url;
            }
        }
    });
}

function updateHudDetails() {
    const movie = filteredMovies[currentIndex];
    if (!movie) return;

    const layer1 = document.getElementById('cinematic-backdrop-1');
    const layer2 = document.getElementById('cinematic-backdrop-2');
    const singleBackdrop = document.getElementById('cinematic-backdrop'); // fallback
    const bloomPod = document.getElementById('ambient-bloom');
    const hudTitle = document.getElementById('hud-title');
    const hudStatus = document.getElementById('hud-status');
    const hudAge = document.getElementById('hud-age-rating');
    const hudTech = document.getElementById('hud-tech-badge');
    const hudDuration = document.getElementById('hud-duration');
    const hudGenres = document.getElementById('hud-genres');
    const hudSynopsis = document.getElementById('hud-synopsis');
    const hudIndexIndicator = document.getElementById('hud-index-indicator');
    const btnBook = document.getElementById('btn-hud-book');

    const targetBackdrop = movie.backdrop_url || movie.poster_url;

    // GPU Crossfade giữa 2 layer để xóa bỏ hiện tượng giật khi đổi ảnh nền
    if (layer1 && layer2) {
        const activeLayer = activeBackdropLayer === 1 ? layer1 : layer2;
        const nextLayer = activeBackdropLayer === 1 ? layer2 : layer1;

        nextLayer.style.backgroundImage = `url('${targetBackdrop}')`;
        nextLayer.classList.remove('opacity-0');
        nextLayer.classList.add('opacity-100');

        activeLayer.classList.remove('opacity-100');
        activeLayer.classList.add('opacity-0');

        activeBackdropLayer = activeBackdropLayer === 1 ? 2 : 1;
    } else if (singleBackdrop) {
        singleBackdrop.style.backgroundImage = `url('${targetBackdrop}')`;
    }

    if (bloomPod) {
        bloomPod.style.background = movie.accent_color || '#ff5e1e';
    }

    if (hudTitle) hudTitle.innerText = movie.title;
    if (hudDuration) hudDuration.innerHTML = `<i class="fa-regular fa-clock text-[#ff5e1e]"></i> ${movie.duration_minutes} phút`;
    if (hudAge) hudAge.innerText = movie.age_rating;
    if (hudTech) hudTech.innerText = movie.tech_badge;
    if (hudSynopsis) hudSynopsis.innerText = movie.description;

    if (hudStatus) {
        if (movie.status === 'now_showing') {
            hudStatus.className = 'px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
            hudStatus.innerText = 'Đang công chiếu';
        } else {
            hudStatus.className = 'px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30';
            hudStatus.innerText = 'Sắp khởi chiếu';
        }
    }

    if (hudGenres) {
        hudGenres.innerHTML = (movie.genres || []).map(g => `
            <span class="px-2.5 py-1 rounded-lg glass-pill text-[11px] text-slate-300 font-medium">
                ${g}
            </span>
        `).join('');
    }

    if (hudIndexIndicator) {
        const curStr = String(currentIndex + 1).padStart(2, '0');
        const totStr = String(filteredMovies.length).padStart(2, '0');
        hudIndexIndicator.innerText = `${curStr} / ${totStr}`;
    }

    if (btnBook) {
        btnBook.href = `pages/showtimes.html?movieId=${movie.id}`;
    }

    preloadAdjacentBackdrops();
}

// =========================================================================
// 5. MOUSE ENGINE: Nhấp chuột chuyển phim & Nghiêng 3D Parallax LERP 60FPS
// (Đã loại bỏ hoàn toàn cuộn chuột để tránh nhảy phim ngoài ý muốn)
// =========================================================================
function initMouseInteractionEngine() {
    const stage = document.getElementById('spatial-carousel');

    // A. PARALLAX 3D TỰ NHIÊN BẰNG LERP + REQUEST ANIMATION FRAME
    let targetTiltX = 0;
    let targetTiltY = 0;
    let currentTiltX = 0;
    let currentTiltY = 0;
    let parallaxActive = false;

    function stepParallax() {
        if (!stage) return;
        currentTiltX += (targetTiltX - currentTiltX) * 0.1;
        currentTiltY += (targetTiltY - currentTiltY) * 0.1;
        stage.style.transform = `rotateX(${currentTiltX.toFixed(2)}deg) rotateY(${currentTiltY.toFixed(2)}deg)`;

        if (Math.abs(targetTiltX - currentTiltX) > 0.01 || Math.abs(targetTiltY - currentTiltY) > 0.01) {
            requestAnimationFrame(stepParallax);
        } else {
            parallaxActive = false;
        }
    }

    // B. KÉO CHUỘT (Drag) & BẮT CLICK CHUYỂN PHIM TOÀN DIỆN
    if (stage) {
        let isDragging = false;
        let startX = 0;
        let currentX = 0;

        stage.addEventListener('mousedown', (e) => {
            isDragging = true;
            hasDragged = false;
            startX = e.clientX;
            currentX = e.clientX;
        });

        window.addEventListener('mousemove', (e) => {
            if (isDragging) {
                currentX = e.clientX;
                if (Math.abs(currentX - startX) > 12) {
                    hasDragged = true;
                }
                return;
            }
            // Di chuột tính góc nghiêng Parallax
            const cx = window.innerWidth / 2;
            const cy = window.innerHeight / 2;
            targetTiltX = (e.clientY - cy) * 0.012;
            targetTiltY = (e.clientX - cx) * -0.012;

            if (!parallaxActive) {
                parallaxActive = true;
                requestAnimationFrame(stepParallax);
            }
        }, { passive: true });

        window.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false;
            const diffX = currentX - startX;

            // Kéo chuột với khoảng cách lớn (> 40px) để lướt phim
            if (Math.abs(diffX) > 40) {
                if (diffX < 0 && currentIndex < filteredMovies.length - 1) {
                    playUiTone(440, 'triangle', 0.06, 0.04);
                    selectMovie(currentIndex + 1);
                } else if (diffX > 0 && currentIndex > 0) {
                    playUiTone(440, 'triangle', 0.06, 0.04);
                    selectMovie(currentIndex - 1);
                }
            }

            // Trả góc nghiêng 3D về vị trí tự nhiên
            targetTiltX = 0;
            targetTiltY = 0;
            if (!parallaxActive) {
                parallaxActive = true;
                requestAnimationFrame(stepParallax);
            }

            // Đặt lại cờ sau 50ms để không ảnh hưởng sự kiện click
            setTimeout(() => {
                hasDragged = false;
            }, 50);
        });

        // Hỗ trợ cảm ứng vuốt màn hình trên điện thoại (Touch Swipe Support)
        let touchStartY = 0;
        stage.addEventListener('touchstart', (e) => {
            if (!e.touches || e.touches.length === 0) return;
            isDragging = true;
            hasDragged = false;
            startX = e.touches[0].clientX;
            currentX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        window.addEventListener('touchmove', (e) => {
            if (!isDragging || !e.touches || e.touches.length === 0) return;
            currentX = e.touches[0].clientX;
            const diffX = Math.abs(currentX - startX);
            const diffY = Math.abs(e.touches[0].clientY - touchStartY);
            if (diffX > 10 && diffX > diffY) {
                hasDragged = true;
            }
        }, { passive: true });

        window.addEventListener('touchend', () => {
            if (!isDragging) return;
            isDragging = false;
            const diffX = currentX - startX;
            if (Math.abs(diffX) > 35) {
                if (diffX < 0 && currentIndex < filteredMovies.length - 1) {
                    playUiTone(440, 'triangle', 0.06, 0.04);
                    selectMovie(currentIndex + 1);
                } else if (diffX > 0 && currentIndex > 0) {
                    playUiTone(440, 'triangle', 0.06, 0.04);
                    selectMovie(currentIndex - 1);
                }
            }
            setTimeout(() => {
                hasDragged = false;
            }, 60);
        });

        // Bắt sự kiện Click thông minh trên Stage (cho cả trường hợp click trúng card lẫn click vùng lân cận)
        stage.addEventListener('click', (e) => {
            if (hasDragged) return;

            // 1. Kiểm tra nếu click trúng thẻ phim bất kỳ
            const card = e.target.closest('.movie-card-3d');
            if (card && card.dataset.index !== undefined) {
                const targetIdx = parseInt(card.dataset.index, 10);
                if (!isNaN(targetIdx)) {
                    if (targetIdx !== currentIndex) {
                        playUiTone(520, 'triangle', 0.08, 0.06);
                        selectMovie(targetIdx);
                    } else {
                        playUiTone(640, 'sine', 0.08, 0.04);
                    }
                    return;
                }
            }

            // 2. Dự phòng: Nếu người dùng click vào khoảng không gian 3D bên phải hoặc bên trái phim tâm điểm
            const rect = stage.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const stageWidth = rect.width;
            const centerLeft = stageWidth / 2 - 140;
            const centerRight = stageWidth / 2 + 140;

            if (clickX > centerRight && currentIndex < filteredMovies.length - 1) {
                playUiTone(520, 'triangle', 0.08, 0.06);
                selectMovie(currentIndex + 1);
            } else if (clickX < centerLeft && currentIndex > 0) {
                playUiTone(520, 'triangle', 0.08, 0.06);
                selectMovie(currentIndex - 1);
            }
        });
    }

    // Nút mũi tên hỗ trợ bổ sung
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentIndex > 0) {
                playUiTone(440, 'sine', 0.06, 0.04);
                selectMovie(currentIndex - 1);
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentIndex < filteredMovies.length - 1) {
                playUiTone(440, 'sine', 0.06, 0.04);
                selectMovie(currentIndex + 1);
            }
        });
    }
}

// =========================================================================
// 6. BỘ LỌC DANH MỤC PHIM (Tất cả / Đang chiếu / Sắp chiếu)
// =========================================================================
function initFilterTabs() {
    const filterBtns = document.querySelectorAll('.nav-filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const mode = btn.dataset.filter;
            applyFilter(mode);
            playUiTone(560, 'sine', 0.08, 0.05);
        });
    });
}

function applyFilter(mode) {
    currentFilter = mode;
    if (mode === 'all') {
        filteredMovies = [...masterMoviesList];
    } else {
        filteredMovies = masterMoviesList.filter(m => m.status === mode);
    }
    currentIndex = 0;
    renderStage();
}

// =========================================================================
// 7. TRAILER MODAL VIDEO HD
// =========================================================================
function initTrailerModal() {
    const btnTrailer = document.getElementById('btn-hud-trailer');
    const modal = document.getElementById('trailer-modal');
    const iframe = document.getElementById('trailer-iframe');
    const btnClose = document.getElementById('btn-close-trailer');

    if (btnTrailer && modal && iframe) {
        btnTrailer.addEventListener('click', () => {
            const movie = filteredMovies[currentIndex];
            if (!movie || !movie.trailer_url) return;

            iframe.src = movie.trailer_url;
            modal.classList.remove('opacity-0', 'pointer-events-none');
            modal.classList.add('opacity-100', 'pointer-events-auto');
            playUiTone(620, 'sine', 0.08, 0.05);
        });

        function closeModal() {
            iframe.src = '';
            modal.classList.remove('opacity-100', 'pointer-events-auto');
            modal.classList.add('opacity-0', 'pointer-events-none');
        }

        if (btnClose) btnClose.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }
}

// =========================================================================
// 8. THREE.JS 3D PARTICLE CONSTELLATION BACKGROUND
// =========================================================================
function initThreeBackground() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 45;
    camera.position.y = 8;

    const renderer = new THREE.WebGLRenderer({ 
        canvas: canvas, 
        alpha: true, 
        antialias: true,
        powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    const particleCount = 200;
    const geom = new THREE.BufferGeometry();
    const pos = new Float32Array(particleCount * 3);
    const cols = new Float32Array(particleCount * 3);
    const color1 = new THREE.Color('#ff5e1e');
    const color2 = new THREE.Color('#d4ff00');
    const color3 = new THREE.Color('#00d2ff');

    for (let i = 0; i < particleCount * 3; i += 3) {
        pos[i] = (Math.random() - 0.5) * 130;
        pos[i + 1] = (Math.random() - 0.5) * 80;
        pos[i + 2] = (Math.random() - 0.5) * 80;

        const rand = Math.random();
        const c = rand < 0.4 ? color1 : (rand < 0.7 ? color2 : color3);
        cols[i] = c.r; cols[i + 1] = c.g; cols[i + 2] = c.b;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(cols, 3));

    const mat = new THREE.PointsMaterial({ size: 0.9, vertexColors: true, transparent: true, opacity: 0.65 });
    const points = new THREE.Points(geom, mat);
    scene.add(points);

    const grid = new THREE.GridHelper(160, 45, 0xff5e1e, 0x141b2b);
    grid.position.y = -22;
    scene.add(grid);

    function animate() {
        requestAnimationFrame(animate);
        points.rotation.y += 0.0004;
        points.rotation.x += 0.0002;
        grid.position.z = (Date.now() * 0.0018) % 3.55;
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        updateSpatialTransforms();
    });
}

// Cập nhật trạng thái người dùng trên Header
function updateAuthHeader() {
    if (window.renderAppHeader) {
        window.renderAppHeader();
        return;
    }
    const authSec = document.getElementById('header-auth-section');
    if (!authSec) return;

    const isAuth = window.StorageService ? window.StorageService.isAuthenticated() : false;
    const user = window.StorageService ? window.StorageService.getUser() : null;
    const isAdmin = window.StorageService ? window.StorageService.isAdmin() : false;

    if (isAuth && user) {
        authSec.innerHTML = `
            <div class="flex items-center gap-3">
                ${isAdmin ? `
                    <a href="pages/admin/dashboard.html" class="px-3.5 py-1.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30 transition-colors">
                        <i class="fa-solid fa-shield mr-1"></i> Admin Portal
                    </a>
                ` : ''}
                <a href="pages/profile.html" class="flex items-center gap-2 text-xs font-semibold text-slate-200 hover:text-[#ff5e1e] transition-colors">
                    <img src="${user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60'}" class="w-7 h-7 rounded-full object-cover border border-[#ff5e1e]">
                    <span class="hidden sm:inline">${user.full_name || user.email}</span>
                </a>
                <button id="logout-btn" class="w-8 h-8 rounded-full glass-pill flex items-center justify-center text-slate-400 hover:text-rose-400 transition-colors" title="Đăng xuất">
                    <i class="fa-solid fa-arrow-right-from-bracket text-xs"></i>
                </button>
            </div>
        `;

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.onclick = () => {
                if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
                    if (window.AuthService) {
                        window.AuthService.logout('index.html');
                    } else if (window.StorageService) {
                        window.StorageService.clear();
                        window.location.reload();
                    }
                }
            };
        }
    }
}
