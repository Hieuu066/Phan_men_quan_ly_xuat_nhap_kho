# 📦 Phần mềm Quản lý Xuất Nhập Kho

> Nhánh hiện tại: `develop` — bộ khung (skeleton) khởi tạo cho dự án Full-stack: **React (Vite)** ở Front-end và **PHP thuần (vanilla)** ở Back-end, kết nối **MySQL**.

---

## 1. Giới thiệu dự án

Đây là bộ khung khởi tạo cho phần mềm **Quản lý Xuất Nhập Kho**. Dự án đã có:

- Một **Back-end API thuần PHP** với router thủ công, có sẵn module **Xác thực người dùng (Auth)**, **CRUD một thực thể mẫu** (`items` — hiện đang đóng vai trò placeholder, cần đổi tên/mở rộng thành nghiệp vụ xuất–nhập kho thực tế), và **thống kê Dashboard**.
- Một **Front-end React 19 + Vite 8** với layout sidebar theo vai trò (role-based menu), trang Dashboard có biểu đồ (Chart.js), trang danh sách dữ liệu có tìm kiếm/lọc/phân trang, cùng bộ component UI dùng chung (Modal, Toast, Pagination, FileUpload).
- Cấu trúc thư mục cho **database** và **docs** nhưng nội dung (schema, seed data, tài liệu API, sơ đồ) **chưa được điền** — xem mục 5.

Nói cách khác: đây là một **bộ khung mẫu (boilerplate)** dùng chung, các thành viên sẽ dựa vào pattern có sẵn (ví dụ `ItemController`/`ItemList.jsx`) để nhân bản ra các module nghiệp vụ thật của hệ thống kho (Sản phẩm, Phiếu nhập, Phiếu xuất, Nhà cung cấp, Kho hàng...).

> Ghi chú: một số comment/tên biến trong code còn sót lại từ template gốc (ví dụ tên DB mặc định `lms_db`, class tên `ItemController`/`items`) — đây là điều cần chuẩn hoá lại theo đúng nghiệp vụ kho khi bắt đầu code (xem mục 5).

---

## 2. Công nghệ dự án đang sử dụng

### Back-end
| Công nghệ | Phiên bản/Ghi chú |
|---|---|
| PHP thuần (Vanilla PHP) | Không dùng framework, tự viết router trong `index.php` |
| PDO (MySQL driver) | Kết nối CSDL, dùng Prepared Statement chống SQL Injection |
| Apache `.htaccess` (`mod_rewrite`) | Điều hướng mọi request về `index.php` (kiểu front controller) |
| Session PHP (`$_SESSION`) | Xác thực đăng nhập (không dùng JWT) |
| `password_hash`/`password_verify` (Bcrypt, cost 12) | Mã hoá mật khẩu |

### Front-end
| Công nghệ | Phiên bản |
|---|---|
| React | ^19.2.7 |
| Vite | ^8.1.1 (dev server + build tool) |
| React Router DOM | ^7.18.1 |
| Axios | ^1.18.1 (gọi API, có interceptor xử lý lỗi 401) |
| Chart.js + react-chartjs-2 | ^4.5.1 / ^5.3.1 (biểu đồ Dashboard) |
| Oxlint | ^1.71.0 (linter, thay ESLint) |

### Cơ sở dữ liệu
- **MySQL** (kết nối qua PDO, charset `utf8mb4`).
- Định hướng triển khai production: **InfinityFree** hosting (thấy trong comment `config/database.php` và `.env.production`).

### Kiểm thử (Testing)
- **Hiện chưa có bộ test tự động nào** (không có PHPUnit cho BE, không có Vitest/Jest cho FE — xem mục 4 & 5).

---

## 3. Cấu trúc thư mục đầy đủ

```
Phan_men_quan_ly_xuat_nhap_kho/
├── .gitignore                      # Loại trừ node_modules, file .env thật, database.php thật, uploads...
├── .vscode/settings.json           # Cấu hình VSCode dùng chung cho team (hiện đang trống)
├── README.md                       # File này
│
├── backend/                        # ===== BACK-END (PHP thuần) =====
│   ├── .htaccess                   # Bật mod_rewrite: mọi request → index.php; chặn truy cập trực tiếp database.php
│   ├── index.php                   # ⭐ FRONT CONTROLLER: xử lý CORS, session, phân tích URL (/api/...),
│   │                                #    định tuyến (routing table) tới đúng Controller theo segment (auth/items/stats)
│   │                                #    → Đây là nơi khai báo route mới khi thêm module nghiệp vụ
│   │
│   ├── config/
│   │   └── database.php            # Kết nối PDO tới MySQL (Singleton pattern), đọc biến môi trường
│   │                                #    DB_HOST/DB_NAME/DB_USER/DB_PASS. ⚠️ Đang bị .gitignore chặn
│   │                                #    push bản thật lên git nhưng bản hiện tại trong repo là bản mẫu.
│   │
│   ├── controllers/                 # Chứa logic xử lý nghiệp vụ cho từng nhóm API (theo REST)
│   │   ├── AuthController.php      # register/login/logout/me/updateProfile — đăng ký, đăng nhập (session),
│   │   │                            #    đổi hồ sơ (kèm upload avatar)
│   │   ├── ItemController.php      # CRUD mẫu (index/show/store/update/destroy) + export CSV
│   │   │                            #    ⭐ Đây là FILE MẪU quan trọng nhất để copy pattern khi làm
│   │   │                            #    module thật (VD: PhieuNhapController, SanPhamController...)
│   │   └── StatsController.php     # API tổng hợp số liệu cho trang Dashboard (summary)
│   │
│   ├── middleware/
│   │   └── Auth.php                # Guard kiểm tra đăng nhập (required), phân quyền theo role (role()),
│   │                                #    kiểm tra quyền sở hữu bản ghi (owns()) — gọi ở đầu mỗi action cần bảo vệ
│   │
│   ├── models/                     # ⚠️ ĐANG TRỐNG — chưa có code. Hiện các Controller đang query SQL
│   │   ├── ItemModel.php           #    trực tiếp thay vì qua Model. Cần bổ sung tầng Model để tách
│   │   └── UserModel.php           #    biệt truy vấn CSDL khỏi Controller (xem mục 5).
│   │
│   ├── uploads/
│   │   └── .gitkeep                # Thư mục runtime chứa file/ảnh người dùng upload (avatar, ảnh sản phẩm...)
│   │                                #    Nội dung bị .gitignore loại trừ, chỉ giữ thư mục rỗng trên git
│   │
│   └── utils/                       # Các lớp tiện ích dùng chung toàn Back-end
│       ├── FileUpload.php          # Xử lý upload file an toàn (check mime thật bằng finfo, giới hạn 5MB,
│       │                            #    đặt tên file random, tạo thư mục con tự động)
│       ├── Pagination.php          # Hàm phân trang chuẩn hoá (tính total/total_pages/offset...) dùng cho
│       │                            #    mọi API danh sách có phân trang
│       ├── Response.php            # ⭐ Chuẩn hoá format JSON trả về (success/message/data) — MỌI API
│       │                            #    phải dùng Response::ok()/Response::err()/Response::paged()
│       └── Sanitize.php            # ⚠️ ĐANG TRỐNG — dự kiến chứa hàm làm sạch/validate input dùng chung
│
├── database/                        # ===== DATABASE =====
│   ├── schema.sql                  # ⚠️ ĐANG TRỐNG — cần viết script tạo bảng (users, items/...,
│   │                                #    và các bảng nghiệp vụ kho: san_pham, phieu_nhap, phieu_xuat, kho...)
│   └── seed.sql                    # ⚠️ ĐANG TRỐNG — cần viết dữ liệu mẫu để dev/test
│
├── docs/                            # ===== TÀI LIỆU =====
│   ├── api-spec.md                 # ⚠️ ĐANG TRỐNG — nơi mô tả chi tiết từng API endpoint (request/response)
│   ├── architecture.png            # ⚠️ ĐANG TRỐNG (file rỗng) — sơ đồ kiến trúc hệ thống
│   └── erd.png                     # ⚠️ ĐANG TRỐNG (file rỗng) — sơ đồ quan hệ thực thể (ERD) của CSDL
│
└── frontend/                        # ===== FRONT-END (React + Vite) =====
    ├── .env.development            # Biến môi trường khi chạy `npm run dev` (trỏ API về localhost)
    ├── .env.production             # Biến môi trường khi build production (trỏ API về domain InfinityFree)
    ├── .gitignore                  # Loại trừ node_modules, dist, file local
    ├── .oxlintrc.json              # Cấu hình linter (Oxlint) — rule React hooks, export...
    ├── README.md                   # README mặc định do Vite sinh ra (chưa chỉnh sửa theo dự án)
    ├── index.html                  # HTML gốc, entry point mà Vite inject bundle JS vào (`#root`)
    ├── package.json                # Khai báo dependency & script (dev/build/lint/preview)
    ├── package-lock.json           # Lock version dependency (KHÔNG sửa tay)
    ├── vite.config.js              # Cấu hình Vite: cổng dev (5173), proxy `/api` & `/uploads` sang PHP backend
    │
    ├── public/
    │   ├── favicon.svg
    │   └── icons.svg               # Sprite icon dùng chung trong UI
    │
    └── src/
        ├── main.jsx                 # ⭐ ĐIỂM VÀO ứng dụng React — mount <Dashboard/> vào DOM, bọc
        │                            #    BrowserRouter + AuthProvider. ⚠️ Hiện CHƯA khai báo <Routes>,
        │                            #    xem mục 5.
        │
        ├── components/
        │   ├── layout/
        │   │   ├── Layout.jsx      # Khung layout chung: Sidebar + vùng nội dung chính + header mobile
        │   │   └── Sidebar.jsx     # Menu điều hướng, tự đổi theo `user.role` (admin/teacher/student/user
        │   │                        #    — cần đổi thành role thực tế của hệ thống kho, VD: quan_ly/nhan_vien)
        │   └── ui/                  # Component dùng lại nhiều nơi
        │       ├── FileUpload.jsx  # Ô kéo-thả upload ảnh có preview
        │       ├── Modal.jsx       # Modal chung + ConfirmModal (hộp thoại xác nhận xoá)
        │       ├── Pagination.jsx  # Thanh phân trang (khớp với `meta` trả về từ backend/utils/Pagination.php)
        │       └── Toast.jsx       # Hệ thống thông báo (success/error/warning/info)
        │
        ├── contexts/
        │   └── AuthContext.jsx     # ⚠️ Đang là bản DEMO (user hard-code "Admin Demo"), CHƯA nối với API
        │                            #    đăng nhập thật của backend — xem mục 5.
        │
        ├── hooks/
        │   ├── useAsync.js         # Hook quản lý state loading/data/error cho các lời gọi API
        │   ├── useDebounce.js      # Hook debounce giá trị (dùng cho ô tìm kiếm)
        │   └── useToast.js         # Hook quản lý danh sách toast đang hiển thị
        │
        ├── pages/                   # Các trang màn hình hoàn chỉnh (route-level component)
        │   ├── Dashboard.jsx        # Trang tổng quan: stat card + biểu đồ cột/tròn + bảng bản ghi mới nhất
        │   └── ItemList.jsx         # Trang danh sách dữ liệu mẫu: tìm kiếm, lọc trạng thái, phân trang,
        │                             #    xoá có xác nhận, xuất CSV — ⭐ FILE MẪU để copy khi làm trang
        │                             #    danh sách nghiệp vụ thật (VD: DanhSachSanPham.jsx)
        │
        ├── services/                 # Tầng gọi API (tách biệt khỏi component)
        │   ├── api.js               # Khởi tạo instance Axios dùng chung (baseURL, withCredentials,
        │   │                          #    interceptor tự redirect khi bị 401)
        │   ├── item.service.js      # Các hàm gọi API `/api/items` (get/create/update/remove/exportCSV)
        │   └── stats.service.js     # Hàm gọi API `/api/stats/summary`
        │                             #    ⚠️ Thiếu `auth.service.js` để gọi API đăng nhập/đăng ký thật
        │
        └── styles/
            ├── global.css            # CSS toàn cục (class .btn, .card, .table, .badge, .pagination...)
            └── variables.css         # CSS variables (màu sắc, spacing, font-size, radius, shadow...)
```

### 🧭 Bản đồ nhanh "làm module nghiệp vụ mới thì sửa ở đâu?"

| Muốn làm gì | Back-end sửa/thêm | Front-end sửa/thêm |
|---|---|---|
| Thêm bảng CSDL mới | `database/schema.sql` | — |
| Thêm API CRUD mới | Tạo Controller mới trong `backend/controllers/`, copy pattern từ `ItemController.php`, khai báo route trong `backend/index.php` | Tạo `xxx.service.js` mới trong `frontend/src/services/`, copy `item.service.js` |
| Thêm trang danh sách/màn hình mới | — | Tạo file trong `frontend/src/pages/`, copy pattern từ `ItemList.jsx`, thêm route trong `main.jsx` (sau khi bổ sung Router) và thêm mục menu trong `Sidebar.jsx` |
| Thêm quyền/role mới | `backend/middleware/Auth.php` (role check) | `frontend/src/components/layout/Sidebar.jsx` (đối tượng `MENUS`) |
| Đổi format phản hồi API | `backend/utils/Response.php` | — |

---

## 4. Hướng dẫn chạy Front-end / Back-end / Database

> ⚠️ **Lưu ý quan trọng**: dự án hiện **chưa có bộ test tự động** (không có PHPUnit ở BE, không có Vitest/Jest ở FE). Phần dưới đây hướng dẫn **cách chạy/kiểm thử thủ công** bộ khung hiện có, kèm gợi ý cách thiết lập test tự động sau này.

### 4.1. Database (MySQL)

1. Cài **MySQL** (hoặc dùng XAMPP/Laragon nếu chạy local kèm Apache).
2. Tạo database, ví dụ:
   ```sql
   CREATE DATABASE quan_ly_xuat_nhap_kho CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. **Hiện `database/schema.sql` và `database/seed.sql` đang trống** — cần viết script tạo bảng trước khi chạy được (tối thiểu phải có bảng `users` và bảng nghiệp vụ tương ứng với `items` trong `ItemController.php`, gồm các cột: `id, name, description, image, status, user_id, created_at, updated_at`).
4. Sau khi có `schema.sql`, import bằng:
   ```bash
   mysql -u root -p quan_ly_xuat_nhap_kho < database/schema.sql
   mysql -u root -p quan_ly_xuat_nhap_kho < database/seed.sql
   ```

### 4.2. Back-end (PHP)

**Yêu cầu**: PHP ≥ 8.1 (do dùng `match` expression, `readonly`... cú pháp PHP 8), Apache có bật `mod_rewrite`, extension `pdo_mysql`.

1. Đặt thư mục `backend/` vào server Apache (VD: `htdocs/ten-du-an/backend` nếu dùng XAMPP), hoặc dùng PHP built-in server để chạy nhanh:
   ```bash
   cd backend
   php -S localhost:8000
   ```
   > Nếu dùng built-in server, cần tự map rule của `.htaccess` (built-in server không đọc `.htaccess`) — khuyến nghị dùng Apache/XAMPP để khớp với `vite.config.js` (`http://localhost/ten-du-an/backend`).
2. Cấu hình kết nối CSDL — set biến môi trường (hoặc sửa trực tiếp default trong `backend/config/database.php` khi dev local):
   ```bash
   DB_HOST=localhost
   DB_NAME=quan_ly_xuat_nhap_kho
   DB_USER=root
   DB_PASS=
   ```
3. Kiểm thử API thủ công (chưa có test tự động) bằng `curl` hoặc Postman, ví dụ:
   ```bash
   curl -X POST http://localhost/ten-du-an/backend/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"name":"Test User","email":"test@example.com","password":"Test1234"}'

   curl http://localhost/ten-du-an/backend/api/items -b cookie.txt -c cookie.txt
   ```
4. **Gợi ý thiết lập test tự động sau này**: cài [PHPUnit](https://phpunit.de/) qua Composer, viết test cho từng Controller (mock PDO hoặc dùng SQLite in-memory), đặt trong thư mục `backend/tests/`.

### 4.3. Front-end (React + Vite)

**Yêu cầu**: Node.js ≥ 18.

1. Cài dependency:
   ```bash
   cd frontend
   npm install
   ```
2. Kiểm tra `frontend/.env.development` — đảm bảo `VITE_API_BASE` trỏ đúng tới URL Back-end đang chạy ở bước 4.2.
3. Chạy dev server:
   ```bash
   npm run dev
   ```
   → mở `http://localhost:5173` (Vite tự mở trình duyệt, có sẵn proxy `/api` và `/uploads` sang backend theo cấu hình trong `vite.config.js`).
4. Lint code (thay cho ESLint):
   ```bash
   npm run lint
   ```
5. Build production:
   ```bash
   npm run build   # xuất ra frontend/dist
   npm run preview # xem thử bản build
   ```
6. **Gợi ý thiết lập test tự động sau này**: thêm [Vitest](https://vitest.dev/) + `@testing-library/react` (`npm install -D vitest @testing-library/react jsdom`), viết test cho từng hook (`useDebounce`, `useAsync`...) và component trong thư mục `frontend/src/**/__tests__/`.

### 4.4. Test độc lập Back-end / Front-end qua API Contract (`docs/api-spec.md`)

> Mục tiêu: **BE và FE không cần chờ nhau chạy xong mới test được**. Cả hai đội cùng thống nhất trước một "hợp đồng API" (API contract) là file [`docs/api-spec.md`](docs/api-spec.md), sau đó mỗi bên tự giả lập (mock) phía còn lại để phát triển và kiểm thử song song.

**Nguyên tắc chung:**

1. **`docs/api-spec.md` là nguồn sự thật duy nhất (single source of truth)** cho mọi endpoint: path, method, quyền truy cập (role), request body, response JSON (cả trường hợp thành công lẫn lỗi). Trước khi code một API mới, người phụ trách BE **viết/cập nhật spec trong `docs/api-spec.md` trước**, review với FE, rồi mới code.
2. **Mọi thay đổi hợp đồng** (đổi tên field, đổi status code, thêm param...) đều phải sửa `docs/api-spec.md` trước, sau đó mới sửa code — tránh tình trạng BE đổi response mà FE không biết.
3. Vì `Response::ok()/Response::err()/Response::paged()` (`backend/utils/Response.php`) đã chuẩn hoá format `{ success, message, data }` (và `meta` cho danh sách phân trang, xem `backend/utils/Pagination.php`), **mọi endpoint mới đều phải mô tả đúng format này trong spec** để FE mock đúng hình dạng dữ liệu thật.

**Cách Back-end test độc lập (không cần FE):**
- Chạy `database/seed.sql` để có dữ liệu mẫu khớp với ví dụ trong `docs/api-spec.md`.
- Test từng endpoint bằng `curl`/Postman theo đúng request/response mẫu trong spec (xem ví dụ ở mục 4.2).
- Khuyến nghị: xuất một **Postman Collection** (hoặc file `.http` cho VSCode REST Client) đi kèm `docs/api-spec.md` để test nhanh, khỏi gõ lại `curl` mỗi lần.

**Cách Front-end test độc lập (không cần BE chạy thật):**
- Dựng một lớp mock dựa **đúng theo response mẫu trong `docs/api-spec.md`**, ví dụ:
  - Dùng [MSW (Mock Service Worker)](https://mswjs.io/) để chặn request Axios và trả về JSON mẫu lấy từ spec — cách này khuyến nghị vì không phải sửa code service khi chuyển qua API thật.
  - Hoặc dựng nhanh bằng [`json-server`](https://github.com/typicode/json-server) chạy trên một port riêng (VD: `3001`), có file `db.json` chứa dữ liệu mẫu theo đúng cấu trúc trong spec, rồi trỏ `VITE_API_BASE` sang đó khi cần test UI mà chưa cần BE thật.
- Khi BE đã sẵn sàng, chỉ cần đổi `VITE_API_BASE` trỏ về BE thật (không sửa code UI) — vì response đã cùng hình dạng với mock, miễn là 2 bên tuân thủ đúng spec.

**Quy trình khuyến nghị khi thêm 1 module nghiệp vụ mới (VD: Phiếu nhập kho):**
1. Cùng thống nhất & viết endpoint đó vào `docs/api-spec.md` (path, request, response mẫu).
2. BE code theo spec, tự test bằng curl/Postman, seed dữ liệu khớp response mẫu.
3. FE mock theo spec (MSW/json-server), tự code UI mà không cần chờ BE.
4. Tới ngày tích hợp: FE trỏ về BE thật, kiểm tra response FE nhận có khớp `docs/api-spec.md` không — nếu lệch, coi đó là bug (của BE nếu sai spec, của FE nếu code sai theo spec).

> 📄 Bản nháp cấu trúc + nội dung gợi ý cho `docs/api-spec.md` (dựa trên yêu cầu nghiệp vụ trong tài liệu web NC) đã được soạn sẵn — xem file `docs/api-spec.md` trong repo.

---

## 5. Đánh giá — còn thiếu gì cần bổ sung

Dựa trên rà soát toàn bộ nhánh `develop`, đây là danh sách các phần **còn trống hoặc chưa hoàn thiện**, nên phân công cho từng thành viên:

### 🔴 Thiếu hoàn toàn (file rỗng, chặn không chạy được end-to-end)
- **`database/schema.sql`, `database/seed.sql`** — chưa có script tạo bảng và dữ liệu mẫu → không thể chạy được Back-end nếu chưa có DB.
- **`backend/models/ItemModel.php`, `backend/models/UserModel.php`** — trống, các Controller hiện đang query SQL trực tiếp (vi phạm tách lớp MVC), cần bổ sung Model để dễ bảo trì/test.
- **`backend/utils/Sanitize.php`** — trống, chưa có hàm validate/làm sạch input dùng chung (hiện mỗi Controller tự viết validate riêng lẻ).
- **`docs/api-spec.md`, `docs/architecture.png`, `docs/erd.png`** — chưa có tài liệu API và sơ đồ kiến trúc/ERD, cần thiết để thành viên mới onboard nhanh.
- **Root `README.md`** — đang trống (chính là file đang được tạo này).

### 🟠 Có khung nhưng chưa hoàn chỉnh / chưa nối đúng
- **`frontend/src/contexts/AuthContext.jsx`** đang là bản demo (user hard-code "Admin Demo"), **chưa gọi API `/api/auth/login`, `/api/auth/register`, `/api/auth/me`** thật sự → chưa có luồng đăng nhập/đăng ký hoạt động trên FE.
- **Thiếu `frontend/src/services/auth.service.js`** để gọi các API auth đã có sẵn ở BE (`AuthController.php` đã đủ endpoint nhưng FE chưa có service gọi tới).
- **`frontend/src/main.jsx` chưa khai báo `<Routes>`/`<Route>`** — dù đã import `react-router-dom` và các trang (`ItemList.jsx`, `Sidebar` menu) đều dùng `<Link>`/`<NavLink>`, hiện tại app chỉ render cứng `<Dashboard/>`. Cần thêm Router config (kèm route bảo vệ — Protected Route — để chặn truy cập khi chưa đăng nhập).
- **Thiếu các trang**: Login, Register, trang Thêm/Sửa bản ghi (form tương ứng nút "+ Thêm mới"/"✏️" trong `ItemList.jsx` đang trỏ tới `/items/new`, `/items/edit/:id` nhưng chưa có component trang này), trang Quản lý người dùng (`/users`), trang Hồ sơ cá nhân (`/profile`) — các route này đã được khai trong `Sidebar.jsx` nhưng chưa có trang thật.
- **`ItemController`/`items`** là entity **mẫu (placeholder)**, cần đổi tên và mở rộng thành các entity nghiệp vụ thật của "Xuất nhập kho" (ví dụ: `SanPham`, `PhieuNhap`, `PhieuXuat`, `NhaCungCap`, `KhoHang`, `LichSuGiaoDich`...) — kèm quan hệ giữa các bảng (1 phiếu nhập có nhiều dòng sản phẩm, tồn kho tính theo nhập-xuất...).
- **Vai trò (role)** trong `Sidebar.jsx`/`AuthController.php` hiện đang dùng tên chung `admin/teacher/student/user` (dấu vết từ template gốc, có vẻ ban đầu là dự án LMS — thấy cả tên DB mặc định `lms_db`) — cần đổi thành vai trò phù hợp nghiệp vụ kho (VD: `quan_ly_kho`, `nhan_vien_kho`, `ke_toan`...).
- **`backend/config/database.php`** đang được **track trên git** dù `.gitignore` gốc có ý định loại trừ nó — hiện tại an toàn vì chỉ chứa giá trị mặc định đọc từ biến môi trường (`getenv()`), nhưng cần lưu ý: nếu sau này ai đó hard-code thông tin kết nối thật vào file này rồi commit, sẽ lộ thông tin.

### 🟡 Nên bổ sung để chuyên nghiệp hoá
- **Test tự động**: chưa có PHPUnit (BE) hay Vitest/Jest (FE) — nên thiết lập sớm để tránh nợ kỹ thuật.
- **CI/CD** (GitHub Actions): chưa có workflow lint/test tự động khi push/PR.
- **`.env.example`** cho Back-end (hiện chỉ có mẫu comment trong `database.php`) để thành viên mới biết cần khai báo biến môi trường nào.
- **Composer** cho Back-end nếu muốn quản lý autoload/dependency PHP (hiện chưa có `composer.json`, tất cả class được `require_once` thủ công).
- **Xử lý lỗi 500/log tập trung** ở Back-end (hiện `getDB()` chỉ trả lỗi chung chung, chưa log chi tiết ra file để debug).
- **Validation phía Front-end** trước khi submit form (hiện chỉ thấy validate ở Back-end).

---

### ✅ Gợi ý phân công tiếp theo cho nhóm
1. Thiết kế ERD + viết `database/schema.sql`, `seed.sql`.
2. Hoàn thiện luồng Auth thật (AuthContext + auth.service.js + Router + Protected Route).
3. Đổi `Item*` thành entity nghiệp vụ kho đầu tiên (khuyến nghị bắt đầu từ `SanPham`) để làm mẫu chuẩn cho các module còn lại.
4. Viết `docs/api-spec.md` **trước** khi code từng API (không phải viết sau) — dùng chung làm hợp đồng để BE và FE test độc lập với nhau, xem quy trình chi tiết ở mục 4.4.