-- USE quanly_xuat_nhap_kho;
INSERT INTO users (username, password, full_name, role, status) VALUES
('admin01', '$2y$12$ACvFrpQUHoi7wq7EbmY0UOnRHnpPrPAD/vnMVPpV8lSywdtjojm7K', 'Quản trị viên', 'admin', 'active'),
('thukho01', '$2y$12$ACvFrpQUHoi7wq7EbmY0UOnRHnpPrPAD/vnMVPpV8lSywdtjojm7K', 'Nguyễn Văn A', 'user', 'active');

INSERT INTO nha_cung_cap (id, name, phone, email, address, status) VALUES
(1, 'Nhà phân phối AKKO & Logitech', '0901234567', 'contact@akkologitech.vn', 'Hà Nội', 'active'),
(2, 'Công ty Thiết bị điện tử Dell & HyperX', '0987654321', 'sales@dellhyperx.vn', 'TP.HCM', 'active'),
(3, 'Đại lý Âm thanh Microlab', '0911222333', 'info@microlab.com.vn', 'Đà Nẵng', 'active');

-- Thêm khoảng 10 linh kiện đa dạng để test phân trang (per_page=10)
INSERT INTO san_pham (sku, name, unit, mo_ta, supplier_id, price, status) VALUES
('SP006', 'Mainboard ASUS ROG Strix B550-F', 'cái', 'Bo mạch chủ gaming ASUS', 1, 3500000, 'active'),
('SP007', 'CPU Intel Core i7-12700K', 'cái', 'Vi xử lý Intel thế hệ 12', 2, 8500000, 'active'),
('SP008', 'RAM Corsair Vengeance RGB Pro 16GB', 'cái', 'RAM DDR4 3200MHz', 2, 1400000, 'active'),
('SP009', 'SSD Samsung 980 PRO 1TB', 'cái', 'Ổ cứng SSD NVMe PCIe Gen 4', 1, 2800000, 'active'),
('SP010', 'Card màn hình Gigabyte RTX 3060', 'cái', 'VGA chuyên game và đồ họa', 2, 8900000, 'active'),
('SP011', 'Nguồn máy tính Corsair RM750x', 'cái', 'Nguồn 750W 80 Plus Gold', 3, 2500000, 'active'),
('SP012', 'Vỏ case NZXT H510', 'cái', 'Vỏ máy tính mid-tower', 3, 1800000, 'active'),
('SP013', 'Tản nhiệt nước AIO Cooler Master', 'cái', 'Tản nhiệt CPU 240mm', 1, 2100000, 'active'),
('SP014', 'Màn hình LG 27GL850 27 inch 144Hz', 'cái', 'Màn hình gaming Nano IPS', 2, 9500000, 'active'),
('SP015', 'Webcam Logitech C920', 'cái', 'Webcam Full HD 1080p', 1, 1200000, 'inactive'); -- 1 sản phẩm inactive để test bộ lọc status

-- Bước 2.1: Tạo 2 kho hàng cơ bản
INSERT INTO kho_hang (ten_kho, dia_chi, suc_chua, trang_thai) VALUES
('Kho Tổng Hà Nội', 'Khu công nghiệp Bắc Thăng Long, Hà Nội', 10000, 'active'),
('Kho Chi nhánh TP.HCM', 'Khu công nghệ cao, Quận 9, TP.HCM', 5000, 'active');

-- Bước 2.2: Phân bổ số lượng tồn kho chi tiết cho các sản phẩm vào từng kho
-- LƯU Ý: bản seed gốc thiếu INSERT cho SP001-SP005 (5 sản phẩm đầu), nên trên CSDL
-- trống, SP006 tự tăng ID thành 1 thay vì 6 như comment cũ giả định — toàn bộ dữ liệu
-- bên dưới đã được remap lại đúng theo ID thực tế (SP006→1, SP007→2, SP008→3, SP009→4),
-- đồng thời bổ sung thêm tồn kho cho SP010-SP015 (id 5-10, trước đó seed gốc cũng chưa
-- có dòng nào) để đủ dữ liệu demo cho cả 10 sản phẩm và có ví dụ cảnh báo tồn thấp.
INSERT INTO kho_ton_kho (kho_id, product_id, so_luong_ton, nguong_canh_bao) VALUES
-- ===== TỒN KHO TẠI HÀ NỘI (kho_id = 1) =====
(1, 1, 15, 5),   -- Mainboard ASUS (SP006, id=1) có 15 cái
(1, 2, 25, 5),   -- CPU Intel i7 (SP007, id=2) có 25 cái
(1, 5, 10, 5),   -- Card Gigabyte RTX 3060 (SP010, id=5) có 10 cái
(1, 6, 20, 10),  -- Nguồn Corsair (SP011, id=6) có 20 cái tại HN
(1, 8, 2, 10),   -- Tản nhiệt AIO (SP013, id=8) chỉ còn 2 cái — dưới ngưỡng, để test cảnh báo tồn thấp
(1, 9, 8, 5),    -- Màn hình LG (SP014, id=9) có 8 cái tại HN

-- ===== TỒN KHO TẠI TP.HCM (kho_id = 2) =====
(2, 3, 100, 20), -- RAM Corsair (SP008, id=3) có 100 cái, chỉ nằm ở HCM
(2, 4, 60, 10),  -- SSD Samsung (SP009, id=4) có 60 cái
(2, 6, 5, 10),   -- Nguồn Corsair (SP011, id=6) chỉ còn 5 cái tại HCM — dưới ngưỡng, test cảnh báo theo từng kho riêng biệt
(2, 7, 30, 10),  -- Vỏ case NZXT (SP012, id=7) có 30 cái
(2, 9, 12, 5);   -- Màn hình LG (SP014, id=9) có 12 cái tại HCM