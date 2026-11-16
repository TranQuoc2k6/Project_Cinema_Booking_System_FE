# 🎬 CINEMA 3D - Hệ Thống Đặt Vé Xem Phim & Quản Trị Rạp Chiếu Phim

Hệ thống đặt vé xem phim điện ảnh công nghệ cao 3D IMAX với giao diện khách hàng hiện đại và cổng quản trị (Admin Portal) Glassmorphism 3D Holographic.

---

## 📁 Cấu Trúc Dự Án (Project Structure)

```text
Project_Cinema_Booking_System_FE/
├── index.html                   # Trang chủ khách hàng (Hero 3D Carousel, Phim Đang Chiếu, Sắp Chiếu)
├── README.md                    # Tài liệu hướng dẫn dự án
├── css/
│   ├── variables.css            # Design tokens, màu sắc Neon Cyber, Glow, 3D Shadows
│   ├── reset.css                # CSS Reset chuẩn
│   ├── global.css               # Global styles, hiệu ứng lưới perspective 3D, thanh cuộn
│   ├── layout.css               # Hệ thống layout Admin (Holographic Sidebar, Header Ribbon)
│   ├── components.css           # 3D Cards, Buttons, Holographic Badges, Modals, Toasts
│   ├── responsive.css           # Media queries cho Mobile (<=768px), Tablet (<=1024px), Desktop
│   └── pages/                   # CSS riêng từng trang (admin.css, showtimes.css, v.v.)
├── js/
│   ├── config/
│   │   └── api.js               # Cấu hình API Client, Base URL, Axios Interceptor & Bearer Token
│   ├── services/
│   │   ├── auth.service.js      # API Đăng nhập, Đăng ký, Đăng xuất, Profile
│   │   ├── movie.service.js     # API & Mock Data Danh sách Phim, Chi tiết Phim
│   │   ├── cinema.service.js    # API Quản lý Cụm rạp & Phòng chiếu (CRUD)
│   │   ├── showtime.service.js  # API Suất chiếu, Kiểm tra quá giờ, Mock 7 ngày
│   │   ├── seat.service.js      # API & Thuật toán Sinh sơ đồ ghế ma trận tự động
│   │   ├── booking.service.js   # API Đơn đặt vé, Hủy vé
│   │   ├── payment.service.js   # API Cổng thanh toán (MoMo, VNPAY, Thẻ Quốc Tế)
│   │   └── user.service.js      # API Đổi mật khẩu, Cập nhật thông tin cá nhân
│   ├── utils/
│   │   ├── auth-guard.js        # Route Guard bảo vệ các trang Admin, chặn người dùng thường
│   │   ├── admin-layout.js      # Controller quản trị Menu Active, Profile, Modal ESC, Toasts
│   │   ├── format.js            # Tiện ích định dạng tiền VND, ngày tháng, thời lượng
│   │   ├── storage.js           # Quản lý localStorage/sessionStorage Token và User
│   │   └── validation.js        # Validation form biểu mẫu (Email, SĐT, Password)
│   └── pages/
│       ├── home.js              # Controller Trang chủ, 3D Carousel
│       ├── login.js             # Controller Đăng nhập & Xác thực FE
│       ├── register.js          # Controller Đăng ký tài khoản
│       ├── showtimes.js         # Controller Lịch chiếu (Tabs 7 ngày, Gom nhóm rạp)
│       └── admin/
│           ├── dashboard.js     # Thống kê KPI, Doanh thu, Tỷ lệ lấp đầy
│           ├── movies.js        # Quản lý Phim, Live Poster Preview
│           ├── cinemas.js       # Quản lý Cụm rạp, Phòng & Sơ đồ ghế (Interactive Brush Picker)
│           ├── showtimes.js     # Quản lý Suất chiếu & Khung giờ
│           ├── bookings.js      # Quản lý Đơn vé & Hủy vé
│           └── users.js         # Quản trị Người dùng & Khóa/Mở tài khoản
└── pages/
    ├── login.html               # Trang Đăng nhập
    ├── register.html            # Trang Đăng ký
    ├── movies.html              # Trang Danh sách Phim chiếu rạp
    ├── movie-detail.html        # Trang Chi tiết Phim
    ├── showtimes.html           # Trang Lịch chiếu toàn hệ thống
    ├── booking.html             # Trang Chọn ghế 3D Curved
    ├── payment.html             # Trang Xác nhận & Thanh toán
    ├── profile.html             # Trang Hồ sơ cá nhân & Đổi mật khẩu
    └── admin/
        ├── dashboard.html       # Dashboard Thống kê Vận hành
        ├── movies.html          # Quản lý Phim điện ảnh
        ├── cinemas.html         # Quản lý Cụm rạp & Trình biên tập sơ đồ ghế
        ├── showtimes.html       # Quản lý Suất chiếu
        ├── bookings.html        # Quản lý Đơn vé
        └── users.html           # Quản trị Người dùng & Phân quyền
```

---

## 🌟 Tính Năng Nổi Bật

1. **Giao Diện 3D Holographic Cyber Cinema**:
   - Sử dụng Three.js hiệu ứng hạt particles và sàn lưới chiều sâu (perspective grid).
   - Glassmorphism kết hợp ánh sáng Neon Cyan (`#06b6d4`), Cinema Rose (`#f43f5e`), Electric Violet (`#8b5cf6`).
2. **Trình Quản Trị Ghế & Phòng Chiếu (Seat Map Matrix Editor)**:
   - Tự động sinh ma trận hàng ghế (A - Z) và cột (01 - 30) với phân vùng VIP, Ghế Đôi (Couple).
   - Chổi tô màu chuyển đổi loại ghế theo thời gian thực (Standard / VIP / Couple / Khóa ghế).
   - Hỗ trợ chọn tất cả, xóa trắng sơ đồ và lưu cấu hình hàng loạt lên Backend API.
3. **Bảo Mật Phân Quyền (Route Guard)**:
   - Tự động kiểm tra JWT Token và Role `admin` trước khi cho phép tải giao diện quản trị.
   - Chặn đứng mọi truy cập trái phép từ tài khoản thường hoặc người dùng chưa đăng nhập.
4. **Độ Bền & Khả Năng Chống Lỗi (High Resilience & Fallback)**:
   - Tích hợp dữ liệu mô phỏng chuẩn (Mock Data) khi Backend API đang khởi động hoặc ngoại tuyến.
   - Hỗ trợ đầy đủ Responsive trên cả Mobile, Tablet và Desktop.

---

## 🚀 Hướng Dẫn Chạy Dự Án

### 1. Mở bằng Live Server
- Mở thư mục dự án trong **VS Code**.
- Chuột phải vào `index.html` và chọn **Open with Live Server** (hoặc truy cập `http://127.0.0.1:5500/index.html`).

### 2. Tài Khoản Thử Nghiệm Nhanh
- **Admin**: `admin@cinema.com` / `admin123` (Truy cập được toàn bộ Admin Portal).
- **Khách hàng**: `customer@cinema.com` / `user123`.

---

© 2026 Cinema 3D System. All rights reserved.
