
-- comment lại khi up lên infinityfree
-- CREATE DATABASE IF NOT EXISTS quanly_xuat_nhap_kho;
-- USE quanly_xuat_nhap_kho;

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE san_pham (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) DEFAULT 'cái',
    mo_ta TEXT NULL,
    supplier_id INT NULL,
    price INT NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES nha_cung_cap(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE IF NOT EXISTS kho_hang (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ten_kho VARCHAR(255) NOT NULL COMMENT 'Tên kho hàng',
    dia_chi TEXT NULL COMMENT 'Địa chỉ kho',
    suc_chua INT NOT NULL DEFAULT 0 COMMENT 'Sức chứa tối đa (số lượng hàng hóa quy đổi hoặc đơn vị tính)',
    trang_thai ENUM('active', 'inactive') NOT NULL DEFAULT 'active' COMMENT 'Trạng thái hoạt động',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_kho_trang_thai (trang_thai)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS kho_ton_kho (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kho_id INT NOT NULL COMMENT 'Khóa ngoại trỏ đến bảng kho_hang',
    product_id INT NOT NULL COMMENT 'Khóa ngoại trỏ đến bảng san_pham',
    supplier_id INT NULL COMMENT 'Nhà cung cấp của lô hàng tồn tại kho này (có thể khác nhà cung cấp mặc định của sản phẩm) — được cập nhật tự động mỗi lần nhập kho',
    so_luong_ton INT NOT NULL DEFAULT 0 COMMENT 'Số lượng tồn kho thực tế tại kho này',
    nguong_canh_bao INT NOT NULL DEFAULT 10 COMMENT 'Ngưỡng cảnh báo tồn kho thấp cho sản phẩm tại kho này',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uq_kho_sanpham (kho_id, product_id),
    
    INDEX idx_ktk_kho (kho_id),
    INDEX idx_ktk_product (product_id),
    INDEX idx_ktk_supplier (supplier_id),
    INDEX idx_ktk_canh_bao (so_luong_ton, nguong_canh_bao),
    
    CONSTRAINT fk_ktk_kho FOREIGN KEY (kho_id) REFERENCES kho_hang(id) ON DELETE CASCADE,
    CONSTRAINT fk_ktk_san_pham FOREIGN KEY (product_id) REFERENCES san_pham(id) ON DELETE CASCADE,
    CONSTRAINT fk_ktk_supplier FOREIGN KEY (supplier_id) REFERENCES nha_cung_cap(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE chi_tiet_phieu_nhap (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phieu_nhap_id INT NOT NULL,
    product_id INT NOT NULL,
    kho_id INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price BIGINT NOT NULL COMMENT 'Giá nhập tại thời điểm đó - không lấy trực tiếp từ san_pham.price vì giá có thể đổi về sau' CHECK (unit_price >= 0),
    line_total BIGINT GENERATED ALWAYS AS (quantity * unit_price) STORED,
    INDEX idx_ctpn_phieu (phieu_nhap_id),
    INDEX idx_ctpn_sanpham (product_id),
    FOREIGN KEY (phieu_nhap_id) REFERENCES phieu_nhap(id),
    FOREIGN KEY (product_id) REFERENCES san_pham(id),
    FOREIGN KEY (kho_id) REFERENCES kho_hang(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE chi_tiet_phieu_xuat (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phieu_xuat_id INT NOT NULL,
    product_id INT NOT NULL,
    kho_id INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price BIGINT NOT NULL CHECK (unit_price >= 0),
    line_total BIGINT GENERATED ALWAYS AS (quantity * unit_price) STORED,
    INDEX idx_ctpx_phieu (phieu_xuat_id),
    INDEX idx_ctpx_sanpham (product_id),
    FOREIGN KEY (phieu_xuat_id) REFERENCES phieu_xuat(id),
    FOREIGN KEY (product_id) REFERENCES san_pham(id),
    FOREIGN KEY (kho_id) REFERENCES kho_hang(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;