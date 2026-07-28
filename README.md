# 📦 Hệ thống Quản lý Chuỗi cung ứng và Kho hàng

> Tên đề tài chính thức (theo phản hồi GVHD): **Hệ thống quản lý chuỗi cung ứng và kho hàng**.
> Nhánh đang phát triển: `develop` — full-stack **React (Vite)** ở Front-end, **PHP thuần (vanilla)** ở Back-end, **MySQL** ở tầng dữ liệu, hỗ trợ **nhiều kho hàng**.

---

## 1. Giới thiệu dự án

Phần mềm quản lý nghiệp vụ xuất/nhập/tồn kho theo **nhiều kho hàng**, có thống kê và cảnh báo tồn kho (dự án môn học, học phần Thiết kế web nâng cao). Hệ thống tập trung giải quyết:

- **Back-end API thuần PHP**: Router thủ công (`backend/index.php`), module **Xác thực (Auth)**, và các Controller xử lý trực tiếp nghiệp vụ (không qua tầng Model).
- **Front-end React 19 + Vite 8**: Layout sidebar phân quyền (2 vai trò: `admin`, `thu_kho`), Dashboard thống kê, các trang quản lý dữ liệu.
- **Nghiệp vụ trọng tâm (Tiêu chí chấm điểm)**:
  - Quản lý Sản phẩm, Nhà cung cấp, **Kho hàng** (nhiều kho).
  - Quản lý Phiếu nhập / Phiếu xuất theo từng kho, tự động cập nhật tồn kho.
  - Tra cứu tồn kho theo mặt hàng / theo từng kho; cảnh báo khi tồn dưới ngưỡng.
  - Báo cáo tổng hợp xuất - nhập - tồn theo khoảng thời gian.
  - Sử dụng **Transaction (`beginTransaction`/`commit`/`rollBack`)** kèm khoá dòng (`SELECT ... FOR UPDATE`) khi lập phiếu, đảm bảo đúng số lượng tồn khi có nhiều giao dịch đồng thời.
  - Sử dụng **View** (`v_ton_kho_chi_tiet`) và **Stored Procedure** (`sp_bao_cao_xuat_nhap_ton`) cho các báo cáo tổng hợp truy vấn thường xuyên.

> **Lưu ý kiến trúc:** Việc cộng/trừ tồn kho hiện được xử lý **trong PHP** (UPSERT + khoá dòng `FOR UPDATE` tại `ImportOrderController`/`ExportOrderController`), **không dùng MySQL Trigger** — quyết định có chủ đích để tránh cộng/trừ 2 lần khi mô hình tồn kho chuyển từ 1-kho sang nhiều-kho. Nếu tiêu chí chấm điểm bắt buộc phải có Trigger, cần trao đổi lại với GVHD.

---

## 2. Công nghệ dự án đang sử dụng

### Back-end
| Công nghệ | Phiên bản/Ghi chú |
|---|---|
| PHP thuần (Vanilla PHP) | Không dùng framework, tự viết router trong `index.php` |
| PDO (MySQL driver) | Kết nối CSDL, dùng Prepared Statement chống SQL Injection (`PDO::ATTR_EMULATE_PREPARES = false`) |
| Session PHP (`$_SESSION`) | Xác thực đăng nhập |
| `password_hash` | Mã hoá mật khẩu Bcrypt |

### Front-end
| Công nghệ | Phiên bản |
|---|---|
| React | ^19.2.7 |
| Vite | ^8.1.1 |
| React Router DOM | ^7.18.1 |
| Axios | ^1.18.1 |
| Chart.js | ^4.5.1 |

### Cơ sở dữ liệu
- **MySQL** (kết nối qua PDO, charset `utf8mb4`, collation `utf8mb4_unicode_ci`).
- Tên CSDL thật trong code: **`quanly_xuat_nhap_kho`** (xem `backend/config/database.php`).

---

## 3. Cấu trúc thư mục

```text
Phan_men_quan_ly_xuat_nhap_kho/
├── backend/                        # ===== BACK-END (PHP thuần) =====
│   ├── index.php                   # ⭐ FRONT CONTROLLER: Định tuyến (routing table)
│   ├── config/
│   │   ├── database.php            # Kết nối PDO tới MySQL
│   │   └── database.local.php      # (tuỳ chọn, không commit) Override port/host riêng từng máy
│   ├── controllers/
│   │   ├── AuthController.php      
│   │   ├── ItemController.php      # CRUD Sản phẩm
│   │   ├── SupplierController.php  # CRUD Nhà cung cấp
│   │   ├── UserController.php      
│   │   ├── WarehouseController.php # CRUD Kho hàng + gợi ý kho khi nhập/xuất
│   │   ├── WarehouseStockController.php # Tồn kho theo từng kho (dùng VIEW v_ton_kho_chi_tiet)
│   │   ├── ImportOrderController.php    # Phiếu nhập — Transaction + UPSERT tồn kho
│   │   ├── ExportOrderController.php    # Phiếu xuất — Transaction + khoá dòng + gợi ý kho thay thế
│   │   ├── AlertController.php     # Cảnh báo tồn kho thấp
│   │   ├── TransactionController.php    # Nhật ký giao dịch hợp nhất nhập+xuất
│   │   ├── ReportController.php    # Báo cáo (gọi Stored Procedure cho báo cáo xuất-nhập-tồn)
│   │   └── StatsController.php     
│   ├── middleware/
│   │   └── Auth.php                # Phân quyền 2 vai trò: admin, thu_kho
│   ├── models/                     # ⚠️ LƯỢC BỎ: Không dùng phân tầng Model cho dự án 3 tuần.
│   └── utils/
│       ├── Pagination.php          # Phân trang
│       └── Response.php            # Chuẩn hoá JSON trả về
│
├── database/
│   ├── schema.sql                  # Bảng + VIEW v_ton_kho_chi_tiet + STORED PROCEDURE sp_bao_cao_xuat_nhap_ton
│   └── seed.sql                    # Dữ liệu mẫu (10 sản phẩm, 2 kho)
│
├── docs/
│   ├── api-spec.md                 # Định nghĩa Request/Response API
│   ├── architecture.png
│   └── use-case.png
│
└── frontend/                       # ===== FRONT-END (React + Vite) =====
    └── src/
        ├── main.jsx / App.jsx      # Entry point, cấu hình Router
        ├── components/
        │   └── ProtectedRoute.jsx  # Bảo vệ route theo trạng thái đăng nhập
        ├── contexts/
        │   └── AuthContext.jsx
        ├── pages/
        │   ├── Dashboard.jsx       # Thống kê + biểu đồ theo danh mục & tỉ lệ tồn kho
        │   ├── Products.jsx / Suppliers.jsx / Users.jsx / Profile.jsx / Login.jsx
        │   └── Transactions.jsx    # Lập phiếu nhập/xuất
        └── services/                # Tầng gọi API bằng Axios
```

---

## 4. Hướng dẫn chạy

### 4.1. Database (MySQL)
`schema.sql` **không tự tạo CSDL nữa** (để tương thích các hosting không cho phép `CREATE DATABASE` qua SQL, ví dụ InfinityFree) — cần tạo CSDL trống trước, rồi nạp vào đúng CSDL đó:
```bash
mysql -u root -p -e "CREATE DATABASE quanly_xuat_nhap_kho CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p quanly_xuat_nhap_kho < database/schema.sql
mysql -u root -p quanly_xuat_nhap_kho < database/seed.sql
```
Trên InfinityFree (hoặc hosting tương tự): tạo CSDL qua giao diện quản trị hosting trước (tên CSDL thường có tiền tố riêng do hosting cấp), sau đó vào phpMyAdmin của CSDL đó, dùng mục Import để nạp lần lượt `schema.sql` rồi `seed.sql`. Phần VIEW/STORED PROCEDURE (kỹ thuật nâng cao, không bắt buộc) đang để dạng comment ở cuối `schema.sql` vì nhiều hosting miễn phí không cấp quyền tạo — ứng dụng chạy đầy đủ tính năng mà không cần phần này.

### 4.2. Back-end
1. Cấu hình CSDL trong `backend/config/database.php` (mặc định `localhost:3306`). Nếu máy bạn dùng cổng khác, tạo file `backend/config/database.local.php` để override riêng — **không sửa trực tiếp port mặc định trong `database.php`**.
2. Chạy server PHP tại thư mục `backend/`:
   ```bash
   php -S localhost:8000
   ```

### 4.3. Front-end
```bash
cd frontend
npm install
npm run dev
```

---

## 5. Danh sách công việc tiếp theo (To-do List)

### 🔴 Database
- [x] Bảng `kho_hang`, `kho_ton_kho`; thêm `kho_id` vào `chi_tiet_phieu_nhap`/`chi_tiet_phieu_xuat`.
- [x] Đổi `san_pham.category` → `mo_ta`; bỏ `quantity_on_hand`, `min_stock` khỏi `san_pham`.
- [x] VIEW `v_ton_kho_chi_tiet` + STORED PROCEDURE `sp_bao_cao_xuat_nhap_ton`.
- [ ] Cân nhắc thêm cột `supplier_id` vào `kho_ton_kho` (cho phép 1 sản phẩm có nhà cung cấp khác nhau theo từng kho — hiện chỉ có 1 nhà cung cấp cố định ở `san_pham`).

### 🟠 Back-end API
- [x] `WarehouseController` (CRUD kho hàng).
- [x] `AlertController` (cảnh báo tồn thấp), `TransactionController` (nhật ký giao dịch).
- [x] Transaction + khoá dòng (`FOR UPDATE`) khi lập phiếu nhập/xuất; gợi ý kho thay thế khi xuất thiếu hàng.
- [ ] `GET /api/warehouse-stock`: bổ sung filter theo `product_id`, `supplier_id` (hiện chỉ có `keyword`, `kho_id`).
- [ ] `POST /api/export-orders`: chế độ `warehouse_mode=auto` (hệ thống tự chọn kho phù hợp) — hiện bắt buộc chọn `kho_id` thủ công cho từng dòng.

### 🟡 Front-end UI
- [ ] Trang **Quản lý kho**: bảng kho hàng / hàng hóa / nhà cung cấp / số lượng tồn, form ngưỡng cảnh báo.
- [ ] Bước **chọn kho** (thủ công/tự động) trong form lập phiếu nhập/xuất.
- [ ] Bộ lọc **Nhật ký giao dịch** (mã phiếu, loại hình, khoảng ngày).
- [x] Đổi nhãn "Phân loại" → "Mô tả hàng hóa" ở trang Danh mục.
- [ ] Biểu đồ biến động xuất/nhập theo thời gian ở Dashboard (hiện mới có biểu đồ theo danh mục & tỉ lệ tồn).
