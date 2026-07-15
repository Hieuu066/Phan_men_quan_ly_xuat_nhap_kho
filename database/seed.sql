INSERT INTO users (username, password, full_name, role, status) VALUES
('admin01', '$2y$12$ACvFrpQUHoi7wq7EbmY0UOnRHnpPrPAD/vnMVPpV8lSywdtjojm7K', 'Quản trị viên', 'admin', 'active'),
('thukho01', '$2y$12$ACvFrpQUHoi7wq7EbmY0UOnRHnpPrPAD/vnMVPpV8lSywdtjojm7K', 'Nguyễn Văn A', 'user', 'active');

INSERT INTO nha_cung_cap (id, name, phone, email, address, status) VALUES
(1, 'Nhà phân phối AKKO & Logitech', '0901234567', 'contact@akkologitech.vn', 'Hà Nội', 'active'),
(2, 'Công ty Thiết bị điện tử Dell & HyperX', '0987654321', 'sales@dellhyperx.vn', 'TP.HCM', 'active'),
(3, 'Đại lý Âm thanh Microlab', '0911222333', 'info@microlab.com.vn', 'Đà Nẵng', 'active');

INSERT INTO san_pham (sku, name, unit, category, supplier_id, quantity_on_hand, min_stock, price, status) VALUES
('SP001', 'Bàn phím cơ AKKO', 'cái', 'Bàn phím', 1, 42, 10, 850000, 'active'),
('SP002', 'Chuột Logitech G102', 'cái', 'Chuột', 1, 150, 20, 400000, 'active'),
('SP003', 'Tai nghe HyperX Cloud II', 'cái', 'Tai nghe', 2, 30, 5, 1500000, 'active'),
('SP004', 'Loa ngoài Microlab', 'bộ', 'Loa ngoài', 3, 15, 5, 650000, 'active'),
('SP005', 'Màn hình Dell Ultrasharp 24 inch', 'cái', 'Màn hình', 2, 25, 10, 5500000, 'active');