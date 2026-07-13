# 📦 Phần mềm Quản lý Xuất Nhập Kho

> Nhánh hiện tại: `develop` — bộ khung (skeleton) khởi tạo cho dự án Full-stack: **React (Vite)** ở Front-end và **PHP thuần (vanilla)** ở Back-end, kết nối **MySQL**.

---

## 1. Giới thiệu dự án

Đây là bộ khung khởi tạo cho phần mềm **Quản lý Xuất Nhập Kho** (quy mô dự án môn học 3 tuần). Hệ thống tập trung giải quyết bài toán cốt lõi:

- **Back-end API thuần PHP**: Router thủ công, có sẵn module **Xác thực người dùng (Auth)**, và **CRUD cơ bản**. Xử lý trực tiếp nghiệp vụ tại Controller.
- **Front-end React 19 + Vite 8**: Layout sidebar phân quyền (2 vai trò: `admin`, `thu_kho`), trang Dashboard thống kê đơn giản, các trang danh sách dữ liệu.
- **Nghiệp vụ trọng tâm (Tiêu chí chấm điểm)**: 
  - Quản lý Sản phẩm, Nhà cung cấp.
  - Quản lý Phiếu nhập / Phiếu xuất (xuất nội bộ).
  - Sử dụng **Transaction (Commit/Rollback)** khi lưu phiếu.
  - Sử dụng **Trigger** trong MySQL để tự động cộng/trừ tồn kho.

---

## 2. Công nghệ dự án đang sử dụng

### Back-end
| Công nghệ | Phiên bản/Ghi chú |
|---|---|
| PHP thuần (Vanilla PHP) | Không dùng framework, tự viết router trong `index.php` |
| PDO (MySQL driver) | Kết nối CSDL, dùng Prepared Statement chống SQL Injection |
| Apache `.htaccess` | Điều hướng request về `index.php` |
| Session PHP (`$_SESSION`) | Xác thực đăng nhập |
| `password_hash` | Mã hoá mật khẩu Bcrypt |

### Front-end
| Công nghệ | Phiên bản |
|---|---|
| React | ^19.2.7 |
| Vite | ^8.1.1 |
| React Router DOM | ^7.18.1 |
| Axios | ^1.18.1 |
| Chart.js | ^4.5.1 (Biểu đồ cột đơn giản) |

### Cơ sở dữ liệu
- **MySQL** (kết nối qua PDO, charset `utf8mb4`).

---

## 3. Cấu trúc thư mục

```text
Phan_men_quan_ly_xuat_nhap_kho/
├── backend/                        # ===== BACK-END (PHP thuần) =====
│   ├── index.php                   # ⭐ FRONT CONTROLLER: Định tuyến (routing table)
│   ├── config/
│   │   └── database.php            # Kết nối PDO tới MySQL
│   ├── controllers/                # Nơi viết logic và query SQL TRỰC TIẾP (không qua Model)
│   │   ├── AuthController.php      
│   │   ├── ItemController.php      # CRUD mẫu (File chuẩn để copy làm module thật)
│   │   └── StatsController.php     
│   ├── middleware/
│   │   └── Auth.php                # Phân quyền 2 vai trò: admin, thu_kho
│   ├── models/                     # ⚠️ LƯỢC BỎ: Không dùng phân tầng Model cho dự án 3 tuần.
│   │   └── (trống)                 
│   ├── utils/                       
│       ├── Pagination.php          # Phân trang
│       └── Response.php            # Chuẩn hoá JSON trả về
│       # ⚠️ LƯỢC BỎ FileUpload.php, Sanitize.php (validate bằng if/else tại Controller)
│
├── database/                       # ===== DATABASE =====
│   ├── schema.sql                  # Script tạo bảng, chứa các TRIGGER cộng/trừ tồn kho
│   └── seed.sql                    # Dữ liệu mẫu
│
├── docs/                           # ===== TÀI LIỆU =====
│   ├── api-spec.md                 # Định nghĩa Request/Response API
│   └── erd.png                     # Sơ đồ quan hệ thực thể ERD 
│
└── frontend/                       # ===== FRONT-END (React + Vite) =====
    ├── vite.config.js              
    └── src/
        ├── main.jsx                # Entry point, cấu hình Router
        ├── components/
        │   ├── layout/
        │   │   └── Sidebar.jsx     # Menu điều hướng theo role (admin, thu_kho)
        │   └── ui/                  
        │       # ⚠️ LƯỢC BỎ FileUpload component. Chỉ dùng Modal, Pagination, Toast.
        ├── pages/                   
        │   ├── Dashboard.jsx       # Thống kê: Vài thẻ số liệu + 1 biểu đồ cột theo tháng
        │   └── ItemList.jsx        # Trang danh sách mẫu (không có nút xuất Excel/PDF)
        ├── services/               # Tầng gọi API bằng Axios
        └── styles/
```

---

## 4. Hướng dẫn chạy

### 4.1. Database (MySQL)
1. Tạo CSDL: `CREATE DATABASE quan_ly_xuat_nhap_kho CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
2. Import script (sau khi code xong schema/trigger):
   ```bash
   mysql -u root -p quan_ly_xuat_nhap_kho < database/schema.sql
   mysql -u root -p quan_ly_xuat_nhap_kho < database/seed.sql
   ```

### 4.2. Back-end
1. Chạy server PHP tại thư mục `backend/`:
   ```bash
   php -S localhost:8000
   ```
2. Cấu hình CSDL trong `backend/config/database.php` khớp với localhost.

### 4.3. Front-end
1. Cài đặt và chạy:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## 5. Danh sách công việc tiếp theo (To-do List)

Dưới đây là các phần cần hoàn thiện (đã được tinh gọn để sát với yêu cầu 3 tuần):

### 🔴 Core Database (Bắt buộc để lấy điểm)
- **`database/schema.sql`**: Thiết kế ERD và tạo các bảng cốt lõi: `users`, `san_pham`, `nha_cung_cap`, `phieu_nhap`, `chi_tiet_phieu_nhap`, `phieu_xuat`, `chi_tiet_phieu_xuat`.
  - *Lưu ý:* Bỏ bảng Khách Hàng. Phiếu xuất chỉ cần 1 cột text `nguoi_nhan`.
- **Trigger**: Viết script Trigger tự động cộng `so_luong` vào `san_pham` khi thêm `chi_tiet_phieu_nhap`, và trừ `so_luong` khi thêm `chi_tiet_phieu_xuat`.

### 🟠 Back-end API
- Đổi tên biến/module `Item` thành các thực thể thật (VD: `SanPhamController`).
- **Giao dịch (Transaction)**: Tại hàm tạo phiếu nhập/xuất trong Controller, **BẮT BUỘC** dùng `PDO::beginTransaction()`, `commit()`, và `rollBack()` để đảm bảo tính toàn vẹn dữ liệu.
- Phân quyền: Chỉ cấp phép 2 role là `admin` và `thu_kho` trong hệ thống.
- Validation: Validate trực tiếp bằng lệnh `if` ngay đầu các hàm trong Controller, không cần tạo Class riêng.
- Ảnh Sản phẩm/Avatar: Bỏ tính năng upload, gán cứng 1 link ảnh placeholder mặc định khi thêm mới.

### 🟡 Front-end UI
- **Router & Auth**: Hoàn thiện luồng đăng nhập, gán token/session và bảo vệ các route private.
- **Trang Dashboard**: Xây dựng 1 biểu đồ cột (tổng số lượng nhập/xuất theo tháng) và 3-4 thẻ thống kê số liệu tổng. Không vẽ các biểu đồ phức tạp.
- **Tính năng xuất báo cáo**: Chỉ cần lập bảng hiển thị trên web + tính năng lọc theo khoảng thời gian (Từ ngày - Đến ngày). KHÔNG code chức năng xuất Excel/PDF.
