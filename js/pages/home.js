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

        card.innerHTML = `
            <div class="relative w-full h-full overflow-hidden bg-slate-950">
                <img src="${m.poster_url}" alt="${m.title}" loading="lazy" class="w-full h-full object-cover transition-transform duration-700 pointer-events-none">
                
                <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>

                <!-- Top Badges -->
                <div class="absolute top-3 left-3 z-10 flex gap-1.5">
                    <span class="px-2 py-0.5 rounded text-[10px] font-black font-mono-num bg-black/60 backdrop-blur-md text-white border border-white/20">
                        ${m.tech_badge.split(' ')[0]}
                    </span>
                    <span class="px-2 py-0.5 rounded text-[10px] font-black font-mono-num bg-red-600/70 backdrop-blur-md text-white">
                        ${m.age_rating}
                    </span>
                </div>

                <!-- Bottom Title Preview -->
                <div class="absolute bottom-4 left-4 right-4 z-10">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-[#d4ff00]">${m.status_label}</span>
                    <h3 class="text-3d-card-title text-base sm:text-lg font-black leading-tight mt-1 truncate">${m.title}</h3>
                    <p class="text-[11px] text-slate-300 font-mono-num mt-1 flex items-center gap-1 font-semibold">
                        <i class="fa-regular fa-clock text-[#ff5e1e]"></i> ${m.duration_minutes} phút
                    </p>
                </div>
            </div>
        `;

        // =====================================================================
        // YÊU CẦU ĐẶC BIỆT: "khi tôi nhấn phim thì sẽ tự động cuộn sang phim đó nhé"
        // =====================================================================
        card.addEventListener('click', () => {
            if (idx !== currentIndex) {
                playUiTone(520, 'triangle', 0.08, 0.06);
                selectMovie(idx);
            } else {
                playUiTone(640, 'sine', 0.08, 0.04);
            }
        });

        stage.appendChild(card);

        // Dot Indicator
        if (dotsBar) {
            const dot = document.createElement('button');
            dot.className = `w-2 h-2 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-6 bg-[#ff5e1e]' : 'bg-slate-700 hover:bg-slate-500'}`;
            dot.title = m.title;
            dot.addEventListener('click', () => selectMovie(idx));
            dotsBar.appendChild(dot);
        }
    });

    updateSpatialTransforms();
}

// =========================================================================
// 2. BIẾN ĐỔI 3D COVERFLOW SPATIAL (Physics Perspective)
// =========================================================================
function updateSpatialTransforms() {
    const stage = document.getElementById('spatial-carousel');
    if (!stage) return;
    const cards = stage.querySelectorAll('.movie-card-3d');
    const isMobile = window.innerWidth < 768;
    const spacingX = isMobile ? 130 : 210;

    cards.forEach((card, idx) => {
        const offset = idx - currentIndex;
        const absOffset = Math.abs(offset);

        if (offset === 0) {
            // PHIM Ở TÂM ĐIỂM (ACTIVE FOCUSED MOVIE)
            card.style.transform = `translateX(0px) translateZ(140px) rotateY(0deg) scale(1.08)`;
            card.style.opacity = '1';
            card.style.filter = 'brightness(1.1) drop-shadow(0 25px 40px rgba(0,0,0,0.8))';
            card.style.zIndex = '30';
            card.style.borderColor = 'rgba(255, 94, 30, 0.8)';
            card.style.boxShadow = '0 0 40px rgba(255, 94, 30, 0.45)';
        } else if (offset > 0) {
            // CÁC PHIM BÊN PHẢI (ROTATE PHẢI VÀ ĐẨY LÙI KHÔNG GIAN)
            const tx = offset * spacingX + 70;
            const tz = -160 - absOffset * 40;
            const ry = -38;
            const scale = Math.max(0.72, 1 - absOffset * 0.1);
            const opacity = Math.max(0.18, 0.85 - absOffset * 0.22);

            card.style.transform = `translateX(${tx}px) translateZ(${tz}px) rotateY(${ry}deg) scale(${scale})`;
            card.style.opacity = opacity.toString();
            card.style.filter = 'brightness(0.6) blur(1px)';
            card.style.zIndex = (20 - absOffset).toString();
            card.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            card.style.boxShadow = 'none';
        } else {
            // CÁC PHIM BÊN TRÁI (ROTATE TRÁI VÀ ĐẨY LÙI KHÔNG GIAN)
            const tx = offset * spacingX - 70;
            const tz = -160 - absOffset * 40;
            const ry = 38;
            const scale = Math.max(0.72, 1 - absOffset * 0.1);
            const opacity = Math.max(0.18, 0.85 - absOffset * 0.22);

            card.style.transform = `translateX(${tx}px) translateZ(${tz}px) rotateY(${ry}deg) scale(${scale})`;
            card.style.opacity = opacity.toString();
            card.style.filter = 'brightness(0.6) blur(1px)';
            card.style.zIndex = (20 - absOffset).toString();
            card.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            card.style.boxShadow = 'none';
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
                dot.className = 'w-6 h-2 rounded-full bg-[#ff5e1e] shadow-[0_0_12px_rgba(255,94,30,0.8)] transition-all duration-300';
            } else {
                dot.className = 'w-2 h-2 rounded-full bg-slate-700 hover:bg-slate-500 transition-all duration-300';
            }
        });
    }
}

// =========================================================================
// 4. CẬP NHẬT THÔNG TIN HUD THEO PHIM ĐƯỢC CHỌN
// =========================================================================
function updateHudDetails() {
    const movie = filteredMovies[currentIndex];
    if (!movie) return;

    const backdropEl = document.getElementById('cinematic-backdrop');
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

    if (backdropEl) {
        backdropEl.style.backgroundImage = `url('${movie.backdrop_url || movie.poster_url}')`;
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
}

// =========================================================================
// 5. REQUIREMENT: "chỉ dùng chuột để di chuyển giữa các phim nhé"
// MOUSE ENGINE: Cuộn chuột (Wheel), Kéo chuột (Drag) & Nghiêng 3D (Parallax)
// =========================================================================
function initMouseInteractionEngine() {
    const stage = document.getElementById('spatial-carousel');
    const trailerModal = document.getElementById('trailer-modal');

    // A. CUỘN CHUỘT (Mouse Wheel Event)
    let wheelTimer = null;
    let wheelDelta = 0;

    window.addEventListener('wheel', (e) => {
        if (trailerModal && trailerModal.classList.contains('pointer-events-auto')) return;

        wheelDelta += e.deltaY;
        clearTimeout(wheelTimer);

        wheelTimer = setTimeout(() => {
            if (Math.abs(wheelDelta) > 30) {
                if (wheelDelta > 0) {
                    // Cuộn xuống / qua phải -> Phim tiếp theo
                    if (currentIndex < filteredMovies.length - 1) {
                        playUiTone(480, 'sine', 0.05, 0.03);
                        selectMovie(currentIndex + 1);
                    }
                } else {
                    // Cuộn lên / qua trái -> Phim trước đó
                    if (currentIndex > 0) {
                        playUiTone(480, 'sine', 0.05, 0.03);
                        selectMovie(currentIndex - 1);
                    }
                }
            }
            wheelDelta = 0;
        }, 40);
    }, { passive: true });

    // B. KÉO CHUỘT (Mouse Drag with Inertia)
    if (stage) {
        let isDragging = false;
        let startX = 0;
        let currentX = 0;

        stage.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            currentX = e.clientX;
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) {
                // C. DI CHUỘT NGHIÊNG 3D PARALLAX
                const cx = window.innerWidth / 2;
                const cy = window.innerHeight / 2;
                const tiltX = (e.clientY - cy) * 0.015;
                const tiltY = (e.clientX - cx) * -0.015;
                stage.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
                return;
            }
            currentX = e.clientX;
        });

        window.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false;
            const diffX = currentX - startX;

            if (Math.abs(diffX) > 40) {
                if (diffX < 0 && currentIndex < filteredMovies.length - 1) {
                    playUiTone(440, 'triangle', 0.06, 0.04);
                    selectMovie(currentIndex + 1);
                } else if (diffX > 0 && currentIndex > 0) {
                    playUiTone(440, 'triangle', 0.06, 0.04);
                    selectMovie(currentIndex - 1);
                }
            }
            stage.style.transform = 'rotateX(0deg) rotateY(0deg)';
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

    const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

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
