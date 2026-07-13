# API Spec — Phần mềm Quản lý Xuất Nhập Kho

> File này là **hợp đồng API (API contract)** dùng chung giữa Back-end và Front-end.
> Xem quy trình sử dụng file này để **BE/FE test độc lập với nhau** ở mục *"4.4. Test độc lập Back-end / Front-end qua API Contract"* trong `README.md` gốc.
>
> ⚠️ Đây là **bản nháp gợi ý** dựa trên yêu cầu nghiệp vụ (tài liệu "web NC") và các quy ước đã có sẵn trong code hiện tại (`Response.php`, `Pagination.php`, `AuthController.php`, `ItemController.php`). Cần cả nhóm review, chỉnh field/tên bảng cho khớp `database/schema.sql` thật trước khi code theo spec này.

---

## 0. Quy ước chung

### 0.1. Base URL
| Môi trường | URL |
|---|---|
| Local dev (BE chạy PHP built-in server) | `http://localhost:8000/api` |
| Local dev (BE chạy qua Apache/XAMPP) | `http://localhost/ten-du-an/backend/api` |
| Front-end dev proxy (Vite) | `/api` (proxy sang BE, xem `vite.config.js`) |

### 0.2. Xác thực
- Dùng **Session/Cookie** (`$_SESSION`), **không dùng JWT** (đúng theo lựa chọn hiện tại trong `AuthController.php`, khác với gợi ý "JWT hoặc Session" ban đầu trong tài liệu web NC — đội đã chốt dùng Session).
- Front-end gọi Axios với `withCredentials: true` để cookie session được gửi kèm.
- Mọi API trừ `POST /auth/login` đều yêu cầu đã đăng nhập (middleware `Auth::required()` trong `backend/middleware/Auth.php`); nếu chưa đăng nhập → `401`.

### 0.3. Vai trò (Role-based access control)
| Role | Mã gợi ý | Mô tả |
|---|---|---|
| Quản trị viên | `admin` | Toàn quyền: quản lý người dùng, danh mục, phiếu nhập/xuất, báo cáo |
| Thủ kho | `thu_kho` | Quản lý danh mục, xử lý phiếu nhập/xuất, xem báo cáo — **không** quản lý người dùng |

> Middleware kiểm tra bằng `Auth::role('admin')` (xem `backend/middleware/Auth.php`); nếu sai role → `403`.

### 0.4. Format response chuẩn (bắt buộc theo `backend/utils/Response.php`)

**Thành công — dữ liệu đơn (`Response::ok()`):**
```json
{
  "success": true,
  "message": "OK",
  "data": { }
}
```

**Thành công — danh sách có phân trang (`Response::paged()`, dùng `backend/utils/Pagination.php`):**
```json
{
  "success": true,
  "message": "OK",
  "data": [ ],
  "meta": {
    "total": 42,
    "per_page": 10,
    "current_page": 1,
    "total_pages": 5
  }
}
```

**Lỗi (`Response::err()`):**
```json
{
  "success": false,
  "message": "Mô tả lỗi cụ thể",
  "data": null
}
```

### 0.5. Mã lỗi HTTP dùng chung
| Code | Ý nghĩa |
|---|---|
| `200` | Thành công |
| `201` | Tạo mới thành công |
| `400` | Request/validate sai (thiếu field, sai định dạng...) |
| `401` | Chưa đăng nhập / session hết hạn |
| `403` | Đã đăng nhập nhưng không đủ quyền (role) |
| `404` | Không tìm thấy resource |
| `409` | Xung đột dữ liệu (VD: trùng mã sản phẩm, tồn kho không đủ để xuất) |
| `500` | Lỗi server |

### 0.6. Ghi chú cho mock (FE) và seed (BE)
- Toàn bộ ví dụ response bên dưới có thể copy thẳng làm **mock data cho MSW/json-server** (FE) hoặc làm **dữ liệu tham chiếu khi viết `database/seed.sql`** (BE) — miễn là field name khớp.
- ID dùng số nguyên tăng dần cho đơn giản khi mock; BE có thể đổi sang UUID nếu cần, nhưng phải cập nhật lại spec này trước.

---

## 1. Module Xác thực & Phân quyền (Auth)

### 1.1. `POST /api/auth/login`
Đăng nhập, tạo session.

Request:
```json
{ "username": "thukho01", "password": "Test1234" }
```

Response `200`:
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "id": 2,
    "username": "thukho01",
    "full_name": "Nguyễn Văn A",
    "role": "thu_kho"
  }
}
```

Response `401` (sai tài khoản/mật khẩu):
```json
{ "success": false, "message": "Tên đăng nhập hoặc mật khẩu không đúng", "data": null }
```

### 1.2. `POST /api/auth/logout`
Xoá session hiện tại. Response `200`, `data: null`.

### 1.3. `GET /api/auth/me`
Lấy thông tin user đang đăng nhập (FE gọi khi load app để giữ trạng thái đăng nhập).

Response `200`: giống `data` ở mục 1.1. Nếu chưa đăng nhập → `401`.

### 1.4. `PUT /api/auth/change-password`
Đổi mật khẩu (mật khẩu mới bắt buộc hash bằng `password_hash` — bcrypt — trước khi lưu, theo đúng yêu cầu web NC).

Request:
```json
{ "old_password": "Test1234", "new_password": "NewPass2025" }
```
Response `200`: `{ "success": true, "message": "Đổi mật khẩu thành công", "data": null }`

---

## 2. Module Quản lý Người dùng (chỉ `admin`)

### 2.1. `GET /api/users?page=1&per_page=10&search=&role=`
Response `200` (paged) — mỗi item:
```json
{ "id": 2, "username": "thukho01", "full_name": "Nguyễn Văn A", "role": "thu_kho", "status": "active", "created_at": "2026-01-10 09:00:00" }
```

### 2.2. `POST /api/users`
Request: `{ "username", "full_name", "password", "role" }` → `201`, trả `data` là user vừa tạo (không trả `password`).

### 2.3. `PUT /api/users/{id}`
Cập nhật `full_name`, `role`, `status` (khoá/mở tài khoản). Không đổi `password` ở đây (dùng mục 1.4 hoặc endpoint riêng nếu admin reset mật khẩu hộ user).

### 2.4. `DELETE /api/users/{id}`
Xoá mềm (đổi `status = inactive`) thay vì xoá cứng, để không phá vỡ liên kết với các phiếu đã tạo bởi user đó.

---

## 3. Module Quản lý Danh mục (`admin`, `thu_kho`)

Áp dụng chung 1 pattern CRUD cho cả **Sản phẩm**, **Nhà cung cấp** (copy pattern `ItemController.php`).

### 3.1. Sản phẩm — `/api/products`
| Method | Path | Mô tả |
|---|---|---|
| GET | `/api/products?page=&per_page=&search=&category=` | Danh sách, tìm kiếm, phân trang |
| GET | `/api/products/{id}` | Chi tiết 1 sản phẩm |
| POST | `/api/products` | Tạo mới |
| PUT | `/api/products/{id}` | Cập nhật |
| DELETE | `/api/products/{id}` | Xoá (chặn nếu đã phát sinh giao dịch — trả `409`) |

Ví dụ 1 sản phẩm (`data`):
```json
{
  "id": 15,
  "sku": "SP0015",
  "name": "Bàn phím cơ AKKO",
  "unit": "cái",
  "category": "Thiết bị máy tính",
  "supplier_id": 3,
  "quantity_on_hand": 42,
  "min_stock": 10,
  "price": 850000,
  "image": "/uploads/products/sp0015.jpg",
  "status": "active"
}
```

### 3.2. Nhà cung cấp — `/api/suppliers`
Cùng pattern CRUD như trên. Ví dụ item:
```json
{ "id": 3, "name": "Công ty TNHH Thiết bị ABC", "phone": "0901234567", "email": "abc@supplier.vn", "address": "..." }
```

> Nếu cần thêm **Khách hàng** (mục "Sản phẩm, Nhà cung cấp, Khách hàng" trong web NC) cho nghiệp vụ xuất kho bán hàng, dùng cùng pattern tại `/api/customers`.

---

## 4. Module Nghiệp vụ Kho — Phiếu Nhập / Phiếu Xuất (Master-Detail)

> Yêu cầu nghiệp vụ (web NC): lưu phiếu qua **Database Transaction (commit/rollback)** giữa bảng `invoices` (phiếu) và `invoice_details` (chi tiết dòng hàng); số lượng tồn trong `products` được cập nhật **tự động qua Trigger MySQL** khi insert dòng chi tiết — API chỉ cần insert đúng cấu trúc dưới, không tự tính lại tồn kho ở tầng code.

### 4.1. Phiếu nhập — `/api/import-orders`
| Method | Path |
|---|---|
| GET | `/api/import-orders?page=&per_page=&from_date=&to_date=` |
| GET | `/api/import-orders/{id}` (kèm chi tiết dòng hàng) |
| POST | `/api/import-orders` (tạo phiếu + chi tiết trong 1 request) |

Request tạo phiếu nhập (FE gửi 1 cục JSON tổng hợp — đúng yêu cầu web NC):
```json
{
  "supplier_id": 3,
  "note": "Nhập hàng đợt tháng 7",
  "details": [
    { "product_id": 15, "quantity": 20, "unit_price": 800000 },
    { "product_id": 22, "quantity": 5,  "unit_price": 150000 }
  ]
}
```

Response `201`:
```json
{
  "success": true,
  "message": "Tạo phiếu nhập thành công",
  "data": {
    "id": 108,
    "code": "PN000108",
    "type": "import",
    "created_by": 2,
    "supplier_id": 3,
    "total_amount": 16750000,
    "created_at": "2026-07-13 10:20:00",
    "details": [
      { "product_id": 15, "product_name": "Bàn phím cơ AKKO", "quantity": 20, "unit_price": 800000, "line_total": 16000000 },
      { "product_id": 22, "product_name": "Chuột không dây", "quantity": 5, "unit_price": 150000, "line_total": 750000 }
    ]
  }
}
```

Response `400`/`409` khi rollback (VD: sản phẩm không tồn tại, số lượng ≤ 0):
```json
{ "success": false, "message": "Sản phẩm id=22 không tồn tại, giao dịch đã được huỷ (rollback)", "data": null }
```

### 4.2. Phiếu xuất — `/api/export-orders`
Cấu trúc **giống hệt** mục 4.1 (đổi `supplier_id` → `customer_id` hoặc `recipient` tuỳ nghiệp vụ), điểm khác:
- Server phải **kiểm tra tồn kho đủ hàng trước khi trừ** — nếu `quantity` yêu cầu xuất > `quantity_on_hand` hiện tại → rollback toàn bộ phiếu, trả `409`:
```json
{ "success": false, "message": "Sản phẩm 'Bàn phím cơ AKKO' không đủ tồn kho (còn 5, yêu cầu xuất 20)", "data": null }
```

---

## 5. Module Thống kê & Báo cáo (`admin`, `thu_kho`)

### 5.1. `GET /api/stats/summary` (Dashboard)
Response `200`:
```json
{
  "success": true,
  "message": "OK",
  "data": {
    "total_products": 320,
    "total_import_this_month": 45,
    "total_export_this_month": 38,
    "low_stock_count": 6,
    "chart_by_month": [
      { "month": "2026-05", "import_total": 120000000, "export_total": 98000000 },
      { "month": "2026-06", "import_total": 135000000, "export_total": 110000000 },
      { "month": "2026-07", "import_total": 60000000, "export_total": 52000000 }
    ]
  }
}
```

### 5.2. `GET /api/reports/inventory?from_date=&to_date=&category=`
Báo cáo tồn kho hiện tại — BE dùng `JOIN` + `GROUP BY`/`SUM()` (hoặc Stored Procedure) để trả sẵn số liệu, không kéo raw data về xử lý ở code.

Response — mỗi item:
```json
{ "product_id": 15, "sku": "SP0015", "name": "Bàn phím cơ AKKO", "quantity_on_hand": 42, "total_imported": 120, "total_exported": 78 }
```

### 5.3. `GET /api/reports/low-stock`
Báo cáo hàng sắp hết (dùng `HAVING quantity_on_hand <= min_stock`).

Response — mỗi item:
```json
{ "product_id": 22, "name": "Chuột không dây", "quantity_on_hand": 3, "min_stock": 10 }
```

### 5.4. `GET /api/reports/inventory/export?format=xlsx|pdf&from_date=&to_date=`
Export báo cáo ra file (nút "Export Excel/PDF" ở FE). Trả về file binary (`Content-Disposition: attachment`), **không** theo format JSON envelope ở mục 0.4.

---

## 6. Việc cần làm tiếp (đánh dấu vào đây khi hoàn thiện từng endpoint)

- [ ] Chốt tên bảng/field thật trong `database/schema.sql` rồi đối chiếu lại field trong spec này (hiện đang đặt tên gợi ý theo tiếng Anh cho nhất quán với `Item*`, có thể đổi sang tiếng Việt không dấu nếu nhóm muốn).
- [ ] Bổ sung ví dụ response lỗi validate chi tiết (`400`) cho từng endpoint POST/PUT.
- [ ] Thêm phần **rate limit / kích thước upload ảnh** cho endpoint có `image` (đã có `FileUpload.php` giới hạn 5MB, cần ghi rõ vào spec).
- [ ] Sau khi thống nhất, xuất kèm 1 **Postman Collection** (`docs/api-spec.postman_collection.json`) để BE test nhanh, và 1 file mock JSON (`docs/mock/*.json`) để FE dùng với MSW/json-server.
