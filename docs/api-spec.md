# API Spec — Phần mềm Quản lý Chuỗi cung ứng và Kho hàng

> File này là **hợp đồng API (API contract)** dùng chung giữa Back-end và Front-end.
> Xem quy trình sử dụng file này để **BE/FE test độc lập với nhau** ở mục *"4.4. Test độc lập Back-end / Front-end qua API Contract"* trong `README.md` gốc.
>
> **Cập nhật theo đề tài mới "Hệ thống quản lý chuỗi cung ứng và kho hàng"** (đa kho). Các mục đã sửa/thêm được đánh dấu `🆕`.
>
> **🆕 Cập nhật quan trọng:**
> 1. **Bỏ trigger CSDL.** Hosting miễn phí InfinityFree giới hạn/không cho phép tạo `TRIGGER` (và
>    `EVENT`), nên toàn bộ logic cập nhật `kho_ton_kho` khi có phiếu nhập/xuất **chuyển sang xử lý ở
>    tầng Back-end (PHP)**, trong cùng một transaction với việc tạo phiếu. Xem chi tiết ở mục 4.1, 4.2.
> 2. **Bỏ lựa chọn kho kiểu "auto / thủ công".** Thay bằng cơ chế **đề xuất kho**: người dùng nhập số
>    lượng cho từng dòng hàng → hệ thống truy vấn CSDL để tìm các kho phù hợp (đủ **sức chứa** khi
>    nhập, đủ **tồn kho** khi xuất) → trả về danh sách kho được đề xuất để người dùng **tự chọn 1 kho**
>    cho dòng hàng đó. Nếu không có kho nào đáp ứng, danh sách đề xuất rỗng và hệ thống thông báo rõ
>    cho người dùng biết, ô chọn kho được để trống. Xem chi tiết ở mục 4.0.

---

## 0. Quy ước chung

### 0.1. Base URL
| Môi trường | URL |
|---|---|
| Local dev (BE chạy PHP built-in server) | `http://localhost:8000/api` |
| Local dev (BE chạy qua Apache/XAMPP) | `http://localhost/ten-du-an/backend/api` |
| Front-end dev proxy (Vite) | `/api` (proxy sang BE, xem `vite.config.js`) |
| 🆕 Production (InfinityFree) | `https://ten-du-an.infinityfreeapp.com/api` — lưu ý hosting free **không hỗ trợ trigger/event/cron ở tầng CSDL**, mọi nghiệp vụ tự động phải xử lý bằng code PHP |

### 0.2. Xác thực
- Dùng **Session/Cookie** (`$_SESSION`), **không dùng JWT**.
- Front-end gọi Axios với `withCredentials: true` để cookie session được gửi kèm.
- Mọi API trừ `POST /auth/login` đều yêu cầu đã đăng nhập; nếu chưa đăng nhập → `401`.

### 0.3. Vai trò (Role-based access control)
| Role | Mã gợi ý | Mô tả |
|---|---|---|
| Quản trị viên | `admin` | Toàn quyền: quản lý người dùng, danh mục, kho, phiếu nhập/xuất, báo cáo |
| Thủ kho | `thu_kho` | Quản lý danh mục, kho, xử lý phiếu nhập/xuất, xem báo cáo — **không** quản lý người dùng |

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
| `409` | Xung đột dữ liệu (VD: trùng mã sản phẩm, tồn kho không đủ để xuất, không kho nào đáp ứng) |
| `500` | Lỗi server |

### 0.6. 🆕 Không dùng trigger CSDL — nguyên tắc xử lý ở tầng Back-end
- InfinityFree (gói free) **không cấp quyền `CREATE TRIGGER` / `CREATE EVENT`**, nên toàn bộ đồ án
  **không dùng trigger, không dùng event scheduler**.
- Mọi thay đổi tồn kho (`kho_ton_kho`) khi tạo phiếu nhập/xuất được thực hiện **tường minh trong code
  PHP**, bọc trong 1 transaction (`BEGIN` ... `COMMIT` / `ROLLBACK`):
  1. Insert phiếu (`phieu_nhap`/`phieu_xuat`) + chi tiết phiếu.
  2. Với từng dòng chi tiết: `SELECT ... FOR UPDATE` trên `kho_ton_kho` để khoá dòng, kiểm tra điều
     kiện (đủ sức chứa khi nhập / đủ tồn khi xuất), rồi `UPDATE`/`INSERT ... ON DUPLICATE KEY UPDATE`
     (UPSERT thủ công bằng câu lệnh SQL, không phải trigger tự động).
  3. Nếu bất kỳ dòng nào không thỏa điều kiện → `ROLLBACK` toàn bộ phiếu, trả `409` kèm gợi ý (xem
     mục 4.0).
- Cách làm này tương đương về mặt nghiệp vụ với trigger, nhưng nằm hoàn toàn trong tầm kiểm soát của
  PHP nên chạy được trên hosting free, dễ debug, dễ viết log/Exception hơn.

### 0.7. Ghi chú dữ liệu mẫu (Seed)
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

### 3.1. Hàng hóa 🆕 — `/api/items`
> Đổi tên khái niệm từ "Sản phẩm/linh kiện" → **"Hàng hóa"**.
> **Field `category` bị loại bỏ**, thay bằng `mo_ta` (text tự do). **`quantity_on_hand` và
> `min_stock` không còn lưu trực tiếp trên `items`** — tồn kho nay được tính từ bảng `kho_ton_kho`
> (xem mục 3.4). Field `tong_ton_kho` dưới đây là giá trị **tính toán** (SUM theo tất cả các kho),
> không phải cột lưu trữ, chỉ trả về ở response, không nhận ở request tạo/sửa.

| Method |                Path                            |            Mô tả               |
|--------|------------------------------------------------|--------------------------------|
| GET    | `/api/items?page=&per_page=&search=`           | Danh sách, tìm kiếm, phân trang (🆕 bỏ query `category`) |
| GET    | `/api/items/{id}`                              | Chi tiết 1 hàng hóa            |
| POST   | `/api/items`                                   | Tạo mới                        |
| PUT    | `/api/items/{id}`                              | Cập nhật                       |
| DELETE | `/api/items/{id}`                              | Xoá (chặn nếu đã phát sinh giao dịch — trả `409`) |

Ví dụ 1 hàng hóa (`data`) 🆕:
```json
{
  "id": 15,
  "sku": "SP0015",
  "name": "Bàn phím cơ AKKO",
  "unit": "cái",
  "mo_ta": "Bàn phím cơ, switch đỏ, kết nối USB-C, bảo hành 12 tháng",
  "supplier_id": 3,
  "tong_ton_kho": 42,
  "price": 850000,
  "status": "active"
}
```

Request tạo/sửa hàng hóa (không gửi `category`, không gửi tồn kho — tồn kho chỉ hình thành qua
phiếu nhập/xuất và bảng `kho_ton_kho`):
```json
{
  "sku": "SP0015",
  "name": "Bàn phím cơ AKKO",
  "unit": "cái",
  "mo_ta": "Bàn phím cơ, switch đỏ, kết nối USB-C, bảo hành 12 tháng",
  "supplier_id": 3,
  "price": 850000
}
```

### 3.2. Nhà cung cấp — `/api/suppliers`
Cùng pattern CRUD như trên, không đổi. Ví dụ item:
```json
{ "id": 3, "name": "Công ty TNHH Thiết bị ABC", "phone": "0901234567", "email": "abc@supplier.vn", "address": "..." }
```

### 3.3. Kho hàng 🆕 — `/api/warehouses`
CRUD bảng `kho_hang`, phục vụ trang quản lý kho mới (README_v2 mục 4, 5).

> 🆕 Thêm field **`suc_chua`** (sức chứa tối đa của kho, đơn vị: số lượng hàng hóa quy đổi). Field
> này dùng làm căn cứ để tính "kho còn trống bao nhiêu" khi hệ thống **đề xuất kho cho phiếu nhập**
> (mục 4.0). Nếu đồ án không quản lý sức chứa theo đơn vị chung, có thể để `suc_chua = null` — khi đó
> BE coi kho này là **không giới hạn sức chứa** (luôn đủ chứa) khi tính gợi ý.

| Method |         Path                | Mô tả |
|--------|------------------------------|-------|
| GET    | `/api/warehouses?page=&per_page=&search=&trang_thai=` | Danh sách kho, phân trang |
| GET    | `/api/warehouses/{id}`       | Chi tiết 1 kho |
| POST   | `/api/warehouses`            | Tạo kho mới |
| PUT    | `/api/warehouses/{id}`       | Cập nhật kho |
| DELETE | `/api/warehouses/{id}`       | Xoá mềm (đổi `trang_thai = inactive`); chặn nếu kho đang còn tồn kho > 0 → trả `409` |

Ví dụ 1 kho (`data`) 🆕:
```json
{
  "id": 1,
  "ten_kho": "Kho Quận 7 - TP.HCM",
  "dia_chi": "123 Nguyễn Văn Linh, Quận 7, TP.HCM",
  "suc_chua": 5000,
  "trang_thai": "active",
  "created_at": "2026-07-10 08:00:00"
}
```

### 3.4. Tồn kho theo kho 🆕 — `GET /api/warehouse-stock`
Nguồn dữ liệu real-time cho **trang Quản lý kho** (bảng `tên kho / tên hàng hóa / nhà cung cấp /
số lượng tồn`).

**`GET /api/warehouse-stock?kho_id=&product_id=&supplier_id=&page=&per_page=`**

Tất cả query param đều **tùy chọn** — không truyền gì thì trả toàn bộ bản ghi `kho_ton_kho` (phân
trang). Response `200` (paged), mỗi item:
```json
{
  "id": 501,
  "kho_id": 1,
  "ten_kho": "Kho Quận 7 - TP.HCM",
  "product_id": 15,
  "sku": "SP0015",
  "product_name": "Bàn phím cơ AKKO",
  "supplier_id": 3,
  "supplier_name": "Công ty TNHH Thiết bị ABC",
  "so_luong_ton": 18,
  "nguong_canh_bao": 10,
  "updated_at": "2026-07-20 09:12:00"
}
```

**`PUT /api/warehouse-stock/{id}`** — chỉ cho phép sửa `nguong_canh_bao` (ngưỡng cảnh báo), **không**
cho sửa trực tiếp `so_luong_ton` qua endpoint này. 🆕 Số lượng tồn chỉ thay đổi khi BE xử lý phiếu
nhập/xuất (mục 4.1, 4.2) — bằng câu lệnh SQL chạy trong transaction ở tầng PHP, **không dùng trigger**
— đúng nguyên tắc "không tin số liệu FE".
```json
{ "nguong_canh_bao": 15 }
```

---

## 4. Module Nghiệp vụ Kho — Phiếu Nhập / Phiếu Xuất

### 4.0. 🆕 Đề xuất kho (dùng chung cho Phiếu nhập & Phiếu xuất)

Quy trình mới bắt buộc đi qua bước **đề xuất → chọn**:

1. Người dùng nhập `product_id` và `quantity` cho một dòng hàng trên form phiếu nhập/xuất.
2. FE gọi ngay API đề xuất kho tương ứng (nhập hoặc xuất) bên dưới.
3. BE chạy câu SQL kiểm tra **tất cả kho `trang_thai = active`**:
   - **Phiếu nhập:** kho nào còn đủ chỗ trống để **chứa thêm** `quantity` — tức
     `suc_chua - SUM(so_luong_ton hiện có trong kho) >= quantity` (kho có `suc_chua = null` luôn coi
     là đủ chứa).
   - **Phiếu xuất:** kho nào có `so_luong_ton` của đúng `product_id` đó **>=** `quantity` cần xuất.
4. BE trả về danh sách kho thoả điều kiện, **sắp xếp theo mức độ phù hợp** (kho còn trống nhiều nhất
   / tồn nhiều nhất xếp trước) để người dùng dễ chọn.
5. FE hiển thị danh sách này cho người dùng **chọn đúng 1 kho** cho dòng hàng đó (dropdown/select).
   - Nếu danh sách rỗng (không kho nào đáp ứng) → FE **để trống ô chọn kho** và hiển thị thông báo lỗi
     lấy từ `message` của response (VD: *"Không có kho nào còn đủ chỗ trống cho 20 Bàn phím cơ AKKO"*
     hoặc *"Không có kho nào còn đủ tồn để xuất 20 Bàn phím cơ AKKO"*). Người dùng phải giảm số lượng,
     tách dòng hàng, hoặc huỷ dòng đó trước khi có thể lưu phiếu.
6. Khi người dùng bấm "Lưu phiếu", FE gửi `kho_id` đã chọn (bắt buộc, khác `null`) trong `details` như
   trước; BE **kiểm tra lại lần nữa trong transaction** (`SELECT ... FOR UPDATE`) trước khi ghi, để
   tránh trường hợp giữa lúc gợi ý và lúc lưu phiếu, kho đã bị người khác dùng hết chỗ/hết hàng.

#### 4.0.1. Đề xuất kho cho phiếu nhập — `GET /api/warehouses/suggest-import`

**`GET /api/warehouses/suggest-import?product_id=15&quantity=20`**

Response `200` — có kho phù hợp:
```json
{
  "success": true,
  "message": "Tìm thấy 2 kho phù hợp",
  "data": {
    "product_id": 15,
    "product_name": "Bàn phím cơ AKKO",
    "requested_quantity": 20,
    "suitable_warehouses": [
      { "kho_id": 4, "ten_kho": "Kho Thủ Đức - TP.HCM", "suc_chua": 3000, "da_su_dung": 500, "con_trong": 2500 },
      { "kho_id": 1, "ten_kho": "Kho Quận 7 - TP.HCM", "suc_chua": 5000, "da_su_dung": 3200, "con_trong": 1800 }
    ]
  }
}
```

Response `200` — **không có kho nào đáp ứng** (FE để trống ô chọn kho, hiển thị `message`):
```json
{
  "success": true,
  "message": "Không có kho nào còn đủ chỗ trống cho 20 Bàn phím cơ AKKO",
  "data": {
    "product_id": 15,
    "product_name": "Bàn phím cơ AKKO",
    "requested_quantity": 20,
    "suitable_warehouses": []
  }
}
```
> Trường hợp này trả `200` (không phải lỗi) vì đây là kết quả hợp lệ của một câu truy vấn — "không
> có kho phù hợp" là dữ liệu, không phải exception. FE dựa vào `suitable_warehouses.length === 0` để
> quyết định hiển thị cảnh báo và để trống select.

#### 4.0.2. Đề xuất kho cho phiếu xuất — `GET /api/warehouses/suggest-export`

**`GET /api/warehouses/suggest-export?product_id=15&quantity=20`**

Response `200` — có kho phù hợp:
```json
{
  "success": true,
  "message": "Tìm thấy 2 kho phù hợp",
  "data": {
    "product_id": 15,
    "product_name": "Bàn phím cơ AKKO",
    "requested_quantity": 20,
    "suitable_warehouses": [
      { "kho_id": 4, "ten_kho": "Kho Thủ Đức - TP.HCM", "so_luong_ton": 25 },
      { "kho_id": 1, "ten_kho": "Kho Quận 7 - TP.HCM", "so_luong_ton": 20 }
    ]
  }
}
```

Response `200` — **không có kho nào đáp ứng**:
```json
{
  "success": true,
  "message": "Không có kho nào còn đủ tồn để xuất 20 Bàn phím cơ AKKO",
  "data": {
    "product_id": 15,
    "product_name": "Bàn phím cơ AKKO",
    "requested_quantity": 20,
    "suitable_warehouses": []
  }
}
```

---

### 4.1. Phiếu nhập 🆕 — `/api/import-orders`
| Method | Path |
|---|---|
| GET | `/api/import-orders?page=&per_page=&from_date=&to_date=` |
| GET | `/api/import-orders/{id}` (kèm chi tiết dòng hàng) |
| POST | `/api/import-orders` (tạo phiếu + chi tiết trong 1 request) |

> 🆕 Mỗi dòng chi tiết bắt buộc có `kho_id` — là kho **đã được người dùng chọn từ danh sách đề xuất**
> ở mục 4.0.1 (FE gọi `GET /api/warehouses/suggest-import` trước khi cho phép chọn). BE **không dùng
> trigger** để cập nhật tồn kho: khi nhận request này, BE mở transaction, `INSERT` phiếu + chi tiết,
> sau đó với từng dòng chạy `INSERT ... ON DUPLICATE KEY UPDATE so_luong_ton = so_luong_ton + :qty`
> trực tiếp trên `kho_ton_kho` theo `(kho_id, product_id)`, rồi `COMMIT`. Trước khi cộng, BE kiểm tra
> lại sức chứa còn trống của kho (đề phòng kho vừa đầy do phiếu khác); nếu không còn đủ chỗ →
> `ROLLBACK`, trả `409` kèm gợi ý kho khác (định dạng giống mục 4.0.1).

Request tạo phiếu nhập 🆕:
```json
{
  "supplier_id": 3,
  "note": "Nhập hàng đợt tháng 7",
  "details": [
    { "product_id": 15, "kho_id": 4, "quantity": 20, "unit_price": 800000 },
    { "product_id": 22, "kho_id": 2, "quantity": 5,  "unit_price": 150000 }
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
      { "product_id": 15, "product_name": "Bàn phím cơ AKKO", "kho_id": 4, "ten_kho": "Kho Thủ Đức - TP.HCM", "quantity": 20, "unit_price": 800000, "line_total": 16000000 },
      { "product_id": 22, "product_name": "Chuột không dây", "kho_id": 2, "ten_kho": "Kho Bình Tân - TP.HCM", "quantity": 5, "unit_price": 150000, "line_total": 750000 }
    ]
  }
}
```

**🆕 `409` — kho đã chọn vừa hết chỗ trống tại thời điểm lưu (race condition), BE gợi ý lại:**
```json
{
  "success": false,
  "message": "Kho 'Kho Thủ Đức - TP.HCM' không còn đủ chỗ trống cho 'Bàn phím cơ AKKO' (còn trống 8, yêu cầu 20)",
  "data": {
    "product_id": 15,
    "product_name": "Bàn phím cơ AKKO",
    "requested_kho_id": 4,
    "requested_quantity": 20,
    "available_space_at_requested_kho": 8,
    "suggestions": {
      "alternative_warehouses": [
        { "kho_id": 1, "ten_kho": "Kho Quận 7 - TP.HCM", "con_trong": 1800 }
      ]
    }
  }
}
```

### 4.2. Phiếu xuất nội bộ 🆕 — `/api/export-orders`
Cấu trúc tương tự Phiếu nhập, điểm khác biệt:
- Thay `supplier_id` bằng trường văn bản `nguoi_nhan` (người hoặc bộ phận nhận hàng).
- 🆕 **Bỏ hẳn field `warehouse_mode` (`manual`/`auto`).** Mỗi dòng chi tiết bắt buộc có `kho_id` — là
  kho **người dùng đã chọn từ danh sách đề xuất** ở mục 4.0.2 (FE gọi
  `GET /api/warehouses/suggest-export` ngay khi người dùng nhập xong `quantity` cho dòng đó).
- 🆕 BE **luôn** truy vấn lại `so_luong_ton` real-time trong transaction (`SELECT ... FOR UPDATE`
  trên `kho_ton_kho`) trước khi trừ, **không dùng số liệu FE gửi lên và không dùng trigger** — giải
  quyết VD1. Nếu đủ, `UPDATE kho_ton_kho SET so_luong_ton = so_luong_ton - :qty` ngay trong transaction
  đó rồi `COMMIT`; nếu không đủ → `ROLLBACK`, trả `409` kèm gợi ý (bên dưới).

**Request (chỉ còn 1 kiểu — luôn chọn kho tường minh theo gợi ý):**
```json
{
  "nguoi_nhan": "Phòng Kỹ thuật",
  "note": "Xuất phục vụ bảo trì",
  "details": [
    { "product_id": 15, "kho_id": 4, "quantity": 20 },
    { "product_id": 22, "kho_id": 2, "quantity": 5 }
  ]
}
```

**Response `201` thành công:**
```json
{
  "success": true,
  "message": "Tạo phiếu xuất thành công",
  "data": {
    "id": 55,
    "code": "PX000055",
    "type": "export",
    "created_by": 2,
    "nguoi_nhan": "Phòng Kỹ thuật",
    "created_at": "2026-07-20 14:00:00",
    "details": [
      { "product_id": 15, "product_name": "Bàn phím cơ AKKO", "kho_id": 4, "ten_kho": "Kho Thủ Đức - TP.HCM", "quantity": 20 },
      { "product_id": 22, "product_name": "Chuột không dây", "kho_id": 2, "ten_kho": "Kho Bình Tân - TP.HCM", "quantity": 5 }
    ]
  }
}
```

**🆕 `409` — kho đã chọn vừa hết hàng tại thời điểm lưu (race condition), BE gợi ý phương án thay thế**
(giải quyết VD2 — BE quét lại các kho khác còn đủ hàng và trả gợi ý; FE hiển thị cho người dùng quay
lại bước chọn kho hoặc xác nhận chia đơn theo `split_option`):
```json
{
  "success": false,
  "message": "Kho 'Kho Thủ Đức - TP.HCM' không còn đủ tồn cho 'Bàn phím cơ AKKO' (còn 5, yêu cầu 20)",
  "data": {
    "product_id": 15,
    "product_name": "Bàn phím cơ AKKO",
    "requested_kho_id": 4,
    "requested_quantity": 20,
    "available_at_requested_kho": 5,
    "suggestions": {
      "alternative_warehouses": [
        { "kho_id": 1, "ten_kho": "Kho Quận 7 - TP.HCM", "so_luong_ton": 25 }
      ],
      "split_option": [
        { "kho_id": 4, "ten_kho": "Kho Thủ Đức - TP.HCM", "quantity": 5 },
        { "kho_id": 1, "ten_kho": "Kho Quận 7 - TP.HCM", "quantity": 15 }
      ]
    }
  }
}
```

**🆕 `409` — tổng tồn toàn hệ thống vẫn không đủ (không kho nào, kể cả gộp nhiều kho, đủ đáp ứng):**
```json
{
  "success": false,
  "message": "Không đủ tồn kho toàn hệ thống cho 'Bàn phím cơ AKKO' (còn 12, yêu cầu 20, thiếu 8)",
  "data": {
    "product_id": 15,
    "total_available": 12,
    "requested_quantity": 20,
    "shortage": 8
  }
}
```

### 4.3. Cảnh báo tồn kho thấp 🆕 — `GET /api/alerts/low-stock`
Danh sách các cặp `(kho, hàng hóa)` có `so_luong_ton <= nguong_canh_bao` — giải quyết VD3. Dùng cho
badge cảnh báo trên trang Quản lý kho.

**`GET /api/alerts/low-stock?kho_id=&page=&per_page=`**

Response `200` (paged), mỗi item:
```json
{
  "kho_id": 2,
  "ten_kho": "Kho Bình Tân - TP.HCM",
  "product_id": 22,
  "sku": "SP0022",
  "product_name": "Chuột không dây",
  "so_luong_ton": 3,
  "nguong_canh_bao": 10
}
```

### 4.4. Nhật ký giao dịch 🆕 — `GET /api/transactions`
Hợp nhất phiếu nhập + phiếu xuất thành một danh sách, phục vụ trang **Nhật ký giao dịch** với bộ lọc
Mã phiếu / Loại hình / Ngày.

**`GET /api/transactions?code=&type=&from_date=&to_date=&page=&per_page=`**
- `type`: `"import"` | `"export"` (bỏ trống = cả hai).
- `code`: tìm gần đúng theo mã phiếu (`PN...` hoặc `PX...`).

Response `200` (paged), mỗi item:
```json
{
  "id": 108,
  "code": "PN000108",
  "type": "import",
  "counterparty": "Công ty TNHH Thiết bị ABC",
  "total_amount": 16750000,
  "created_by_name": "Nguyễn Văn A",
  "created_at": "2026-07-13 10:20:00"
}
```
> Với `type = "export"`, field `counterparty` trả về giá trị của `nguoi_nhan` thay vì tên nhà cung
> cấp.

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
    "total_warehouses": 5,
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
> 🆕 Thêm field `total_warehouses`. `low_stock_count` nay đếm theo số cặp `(kho, hàng hóa)` đạt
> ngưỡng cảnh báo (lấy từ cùng nguồn dữ liệu với `alerts/low-stock`).

### 5.2. `GET /api/reports/inventory?from_date=&to_date=&kho_id=`
🆕 Báo cáo tồn kho hiện tại — bỏ query `category` (đã loại bỏ khái niệm phân loại), thêm query tùy
chọn `kho_id` để xem theo từng kho; không truyền `kho_id` → trả tổng hợp toàn hệ thống.
Response — mỗi item:
```json
{
  "product_id": 15,
  "sku": "SP0015",
  "name": "Bàn phím cơ AKKO",
  "kho_id": 1,
  "ten_kho": "Kho Quận 7 - TP.HCM",
  "so_luong_ton": 18,
  "total_imported": 120,
  "total_exported": 78
}
```
> Khi gọi không kèm `kho_id`: field `kho_id`/`ten_kho` trả `null`, `so_luong_ton` là tổng tất cả kho.

### 5.3. `GET /api/reports/low-stock` — ⚠️ cần chốt với `alerts/low-stock`
🆕 Vì ngưỡng cảnh báo (`nguong_canh_bao`) nay gắn theo **từng kho** thay vì `min_stock` toàn cục trên
`items`, endpoint này đề xuất giữ lại cho mục đích **báo cáo tổng hợp** (gộp theo hàng hóa, không
tách theo kho), khác với `GET /api/alerts/low-stock` ở mục 4.3 vốn trả **chi tiết theo từng kho**
(phục vụ badge cảnh báo trực tiếp trên trang Quản lý kho). Giữ cả 2 endpoint
hay gộp làm một trước khi code BE.
Response — mỗi item (đề xuất):
```json
{
  "product_id": 22,
  "name": "Chuột không dây",
  "tong_so_luong_ton": 8,
  "so_kho_dang_canh_bao": 2
}
```

---

## 6. Việc cần làm tiếp

- [ ] Chốt tên bảng/field thật trong `database/schema.sql` rồi đối chiếu lại field trong spec này.
- [ ] 🆕 Rà lại toàn bộ `database/schema.sql` và code seed để đảm bảo **không còn `CREATE TRIGGER` /
      `CREATE EVENT`** nào (do InfinityFree free không hỗ trợ) — chuyển hết sang xử lý PHP trong
      transaction như mô tả ở mục 0.6, 4.1, 4.2.
- [ ] 🆕 Thêm cột `suc_chua` vào bảng `kho_hang` (mục 3.3) nếu đồ án chọn quản lý sức chứa kho; cân
      nhắc đơn vị tính (số lượng hàng hóa quy đổi, hay m², m³...).
- [ ] 🆕 Thống nhất với FE: bước gọi `GET /api/warehouses/suggest-import` /
      `GET /api/warehouses/suggest-export` phải được gọi **ngay khi người dùng nhập xong số lượng**
      cho từng dòng hàng (debounce ~300–500ms), trước khi cho phép chọn kho — không cho submit phiếu
      nếu dòng nào chưa có `kho_id`.
- [ ] 🆕 Thống nhất format `suggestions` trong response `409` của `POST /api/export-orders` và
      `POST /api/import-orders` (`alternative_warehouses` / `split_option`) với FE trước khi code màn
      hình xử lý gợi ý kho.
- [ ] 🆕 Xác nhận `PUT /api/warehouse-stock/{id}` chỉ cho sửa `nguong_canh_bao`, không mở endpoint
      nào khác cho phép ghi trực tiếp `so_luong_ton` (tồn kho chỉ đổi khi BE xử lý phiếu nhập/xuất).
- [ ] Bổ sung ví dụ response lỗi validate (`400`) cho endpoint nào thấy cần thiết, ưu tiên viết đúng
      thời gian đồ án cho phép.
