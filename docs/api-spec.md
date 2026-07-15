# API Spec — Phần mềm Quản lý Xuất Nhập Kho

> File này là **hợp đồng API (API contract)** dùng chung giữa Back-end và Front-end.
> Xem quy trình sử dụng file này để **BE/FE test độc lập với nhau** ở mục *"4.4. Test độc lập Back-end / Front-end qua API Contract"* trong `README.md` gốc.

---

## 0. Quy ước chung

### 0.1. Base URL
| Môi trường | URL |
|---|---|
| Local dev (BE chạy PHP built-in server) | `http://localhost:8000/api` |
| Local dev (BE chạy qua Apache/XAMPP) | `http://localhost/ten-du-an/backend/api` |
| Front-end dev proxy (Vite) | `/api` (proxy sang BE, xem `vite.config.js`) |

### 0.2. Xác thực
- Dùng **Session/Cookie** (`$_SESSION`), **không dùng JWT**.
- Front-end gọi Axios với `withCredentials: true` để cookie session được gửi kèm.
- Mọi API trừ `POST /auth/login` đều yêu cầu đã đăng nhập; nếu chưa đăng nhập → `401`.

### 0.3. Vai trò (Role-based access control)
| Role | Mã gợi ý | Mô tả |
|---|---|---|
| Quản trị viên | `admin` | Toàn quyền: quản lý người dùng, danh mục, phiếu nhập/xuất, báo cáo |
| Thủ kho | `thu_kho` | Quản lý danh mục, xử lý phiếu nhập/xuất, xem báo cáo — **không** quản lý người dùng |

### 0.4. Format response chuẩn
**Thành công — dữ liệu đơn (`Response::ok()`):**
```json
{
  "success": true,
  "message": "OK",
  "data": { }
}
```

**Thành công — danh sách có phân trang (`Response::paged()`):**
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

### 0.6. Ghi chú dữ liệu mẫu (Seed)
- Toàn bộ ví dụ response bên dưới có thể dùng làm **dữ liệu tham chiếu khi viết `database/seed.sql`** (BE).
- Quá trình test thực hiện thủ công qua Postman/Thunder Client (BE) hoặc hard-code tĩnh trên FE.

---

## 1. Module Xác thực & Phân quyền (Auth)

### 1.1. `POST /api/auth/login`
Đăng nhập, tạo session.
Request: `{ "username": "thukho01", "password": "Test1234" }`
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

### 1.2. `POST /api/auth/logout`
Xoá session hiện tại. Response `200`, `data: null`.

### 1.3. `GET /api/auth/me`
Lấy thông tin user đang đăng nhập.

## 2. Module Quản lý Người dùng (chỉ `admin`)

### 2.1. `GET /api/users?page=1&per_page=10&search=&role=`
Response `200` (paged).

### 2.2. `POST /api/users`
Tạo mới user.

### 2.3. `PUT /api/users/{id}`
Cập nhật thông tin user.

### 2.4. `DELETE /api/users/{id}`
Xoá mềm (đổi `status = inactive`).

---

## 3. Module Quản lý Danh mục (`admin`, `user`)

### 3.1. Sản phẩm — `/api/items`
| Method |                Path                            |            Mô tả               |
|--------|------------------------------------------------|--------------------------------|
| GET    |
 `/api/items?page=&per_page=&search=&category=` | Danh sách, tìm kiếm, phân trang|
| GET    | `/api/items/{id}`                              | Chi tiết 1 sản phẩm            |
| POST   | `/api/items`                                   | Tạo mới                        |
| PUT    | `/api/items/{id}`                              | Cập nhật                       |
| DELETE | `/api/items/{id}`                              | Xoá (chặn nếu đã phát sinh giao dịch — trả `409`) |

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
  "status": "active"
}
```

### 3.2. Nhà cung cấp — `/api/suppliers`
Cùng pattern CRUD như trên. Ví dụ item:
```json
{ "id": 3, "name": "Công ty TNHH Thiết bị ABC", "phone": "0901234567", "email": "abc@supplier.vn", "address": "..." }
```

---

## 4. Module Nghiệp vụ Kho — Phiếu Nhập / Phiếu Xuất

### 4.1. Phiếu nhập — `/api/import-orders`
| Method | Path |
|---|---|
| GET | `/api/import-orders?page=&per_page=&from_date=&to_date=` |
| GET | `/api/import-orders/{id}` (kèm chi tiết dòng hàng) |
| POST | `/api/import-orders` (tạo phiếu + chi tiết trong 1 request) |

Request tạo phiếu nhập:
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

### 4.2. Phiếu xuất nội bộ — `/api/export-orders`
Cấu trúc tương tự Phiếu nhập, điểm khác biệt:
- Thay `supplier_id` bằng trường văn bản `nguoi_nhan` (người hoặc bộ phận nhận hàng).
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
      { "month": "2026-06", "import_total": 135000000, "export_total": 110000000 }
    ]
  }
}
```

### 5.2. `GET /api/reports/inventory?from_date=&to_date=&category=`
Báo cáo tồn kho hiện tại. Server trả JSON, FE hiển thị lên Table.
Response — mỗi item:
```json
{ "product_id": 15, "sku": "SP0015", "name": "Bàn phím cơ AKKO", "quantity_on_hand": 42, "total_imported": 120, "total_exported": 78 }
```

### 5.3. `GET /api/reports/low-stock`
Báo cáo hàng sắp hết.
Response — mỗi item:
```json
{ "product_id": 22, "name": "Chuột không dây", "quantity_on_hand": 3, "min_stock": 10 }
```

---

## 6. Việc cần làm tiếp

- [ ] Chốt tên bảng/field thật trong `database/schema.sql` rồi đối chiếu lại field trong spec này.
- [ ] Bổ sung ví dụ response lỗi validate (`400`) cho endpoint nào thấy cần thiết, ưu tiên viết đúng thời gian đồ án cho phép.