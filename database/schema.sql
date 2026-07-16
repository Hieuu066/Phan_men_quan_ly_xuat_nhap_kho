-- 1. Tạo bảng users
CREATE DATABASE IF NOT EXISTS quanly_xuat_nhap_kho;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- Lưu chuỗi hash Bcrypt
    full_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tạo bảng nha_cung_cap
CREATE TABLE nha_cung_cap (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NULL,
    email VARCHAR(100) NULL,
    address TEXT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tạo bảng san_pham
CREATE TABLE san_pham (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) DEFAULT 'cái',
    category VARCHAR(100) NOT NULL,
    supplier_id INT NULL,
    quantity_on_hand INT DEFAULT 0,
    min_stock INT DEFAULT 0,
    price INT NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES nha_cung_cap(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



-- ================================================================
-- 4. Tạo bảng phieu_nhap (đầu phiếu nhập kho)
-- ================================================================
CREATE TABLE phieu_nhap (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NULL UNIQUE COMMENT 'Mã phiếu, VD: PN000108 - do Back-end sinh sau khi insert',
    supplier_id INT NULL,
    created_by INT NOT NULL COMMENT 'user_id người tạo phiếu',
    note TEXT NULL,
    total_amount BIGINT NOT NULL DEFAULT 0 COMMENT 'Tổng giá trị phiếu - Trigger tự cộng dồn',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_pn_created_at (created_at),
    INDEX idx_pn_supplier (supplier_id),
    FOREIGN KEY (supplier_id) REFERENCES nha_cung_cap(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 5. Tạo bảng chi_tiet_phieu_nhap (dòng hàng trong phiếu nhập)
-- ================================================================
CREATE TABLE chi_tiet_phieu_nhap (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phieu_nhap_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price BIGINT NOT NULL COMMENT 'Giá nhập tại thời điểm đó - không lấy trực tiếp từ san_pham.price vì giá có thể đổi về sau' CHECK (unit_price >= 0),
    line_total BIGINT GENERATED ALWAYS AS (quantity * unit_price) STORED,
    INDEX idx_ctpn_phieu (phieu_nhap_id),
    INDEX idx_ctpn_sanpham (product_id),
    FOREIGN KEY (phieu_nhap_id) REFERENCES phieu_nhap(id),
    FOREIGN KEY (product_id) REFERENCES san_pham(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 6. Tạo bảng phieu_xuat (đầu phiếu xuất kho)
-- ================================================================
CREATE TABLE phieu_xuat (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NULL UNIQUE COMMENT 'Mã phiếu, VD: PX000045 - do Back-end sinh sau khi insert',
    nguoi_nhan VARCHAR(150) NOT NULL COMMENT 'Người/bộ phận nhận hàng - trường văn bản, không phải FK',
    created_by INT NOT NULL,
    note TEXT NULL,
    total_amount BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_px_created_at (created_at),
    FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- 7. Tạo bảng chi_tiet_phieu_xuat (dòng hàng trong phiếu xuất)
-- ================================================================
CREATE TABLE chi_tiet_phieu_xuat (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phieu_xuat_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price BIGINT NOT NULL CHECK (unit_price >= 0),
    line_total BIGINT GENERATED ALWAYS AS (quantity * unit_price) STORED,
    INDEX idx_ctpx_phieu (phieu_xuat_id),
    INDEX idx_ctpx_sanpham (product_id),
    FOREIGN KEY (phieu_xuat_id) REFERENCES phieu_xuat(id),
    FOREIGN KEY (product_id) REFERENCES san_pham(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- TRIGGER: tự động cộng tồn kho + tổng tiền phiếu khi thêm dòng NHẬP
-- ================================================================
DELIMITER $$

CREATE TRIGGER trg_sau_them_chi_tiet_phieu_nhap
AFTER INSERT ON chi_tiet_phieu_nhap
FOR EACH ROW
BEGIN
    UPDATE san_pham
    SET quantity_on_hand = quantity_on_hand + NEW.quantity
    WHERE id = NEW.product_id;

    UPDATE phieu_nhap
    SET total_amount = total_amount + NEW.line_total
    WHERE id = NEW.phieu_nhap_id;
END$$

-- ================================================================
-- TRIGGER: kiểm tra đủ tồn kho TRƯỚC khi cho thêm dòng XUẤT
-- Không đủ hàng -> chặn ngay tại CSDL (SIGNAL lỗi 45000)
-- ================================================================
CREATE TRIGGER trg_truoc_them_chi_tiet_phieu_xuat
BEFORE INSERT ON chi_tiet_phieu_xuat
FOR EACH ROW
BEGIN
    DECLARE ton_hien_tai INT;
    DECLARE ten_sp VARCHAR(200);
    DECLARE thong_bao VARCHAR(255);

    SELECT quantity_on_hand, name INTO ton_hien_tai, ten_sp
    FROM san_pham WHERE id = NEW.product_id
    FOR UPDATE;

    IF ton_hien_tai IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'San pham khong ton tai.';
    ELSEIF ton_hien_tai < NEW.quantity THEN
        SET thong_bao = CONCAT('San pham "', ten_sp, '" khong du ton kho (con ',
                                ton_hien_tai, ', yeu cau xuat ', NEW.quantity, ')');
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = thong_bao;
    END IF;
END$$

-- ================================================================
-- TRIGGER: tự động trừ tồn kho + tổng tiền phiếu khi thêm dòng XUẤT
-- (chỉ chạy khi trigger BEFORE ở trên không chặn)
-- ================================================================
CREATE TRIGGER trg_sau_them_chi_tiet_phieu_xuat
AFTER INSERT ON chi_tiet_phieu_xuat
FOR EACH ROW
BEGIN
    UPDATE san_pham
    SET quantity_on_hand = quantity_on_hand - NEW.quantity
    WHERE id = NEW.product_id;

    UPDATE phieu_xuat
    SET total_amount = total_amount + NEW.line_total
    WHERE id = NEW.phieu_xuat_id;
END$$

DELIMITER ;