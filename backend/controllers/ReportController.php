<?php

class ReportController {
    // 5.1. GET /api/stats/summary (Tổng quan Dashboard)
    public static function summary() {
        $db = getDB();
        try {
            // Tổng sản phẩm
            $stmt = $db->query("SELECT COUNT(id) FROM san_pham WHERE status = 'active'");
            $totalProducts = (int) $stmt->fetchColumn();

            // Tổng nhà cung cấp
            $stmt = $db->query("SELECT COUNT(id) FROM nha_cung_cap WHERE status = 'active'");
            $totalSuppliers = (int) $stmt->fetchColumn();

            // Tổng số kho hàng (Thêm mới theo mô hình đa kho)
            $stmt = $db->query("SELECT COUNT(id) FROM kho_hang WHERE trang_thai = 'active'");
            $totalWarehouses = (int) $stmt->fetchColumn();

            // Số mặt hàng sắp hết (Đếm số cặp kho - hàng hóa chạm ngưỡng)
            $stmt = $db->query("SELECT COUNT(*) FROM kho_ton_kho WHERE so_luong_ton <= nguong_canh_bao");
            $lowStockCount = (int) $stmt->fetchColumn();

            // Tổng giá trị tồn kho (Tổng số lượng tồn ở mọi kho * Giá sản phẩm)
            // Sử dụng COALESCE để trả về 0 nếu kho chưa có hàng hóa nào
            $stmt = $db->query("
                SELECT COALESCE(SUM(k.so_luong_ton * s.price), 0) 
                FROM kho_ton_kho k
                JOIN san_pham s ON k.product_id = s.id
                WHERE s.status = 'active'
            ");
            $totalInventoryValue = (int) $stmt->fetchColumn();

            Response::ok([
                "total_products" => $totalProducts,
                "total_suppliers" => $totalSuppliers,
                "total_warehouses" => $totalWarehouses,
                "low_stock_count" => $lowStockCount,
                "total_inventory_value" => $totalInventoryValue
            ], "Lấy dữ liệu thống kê thành công");

        } catch (PDOException $e) {
            Response::err("Lỗi truy vấn cơ sở dữ liệu: " . $e->getMessage(), 500);
        }
    }

    public static function lowStock() {
        $db = getDB();
        try {
            // Lấy danh sách hàng sắp hết dựa trên từng kho hàng (kho_ton_kho)
            // Ánh xạ lại tên cột (so_luong_ton -> quantity_on_hand, nguong_canh_bao -> min_stock)
            // để giữ tính tương thích với Front-end cũ (nếu có) mà không bị sập.
            $sql = "SELECT 
                        sp.id AS product_id, 
                        sp.sku, 
                        sp.name, 
                        sp.mo_ta, 
                        k.kho_id AS warehouse_id,
                        k.so_luong_ton AS quantity_on_hand,
                        k.nguong_canh_bao AS min_stock, 
                        ncc.name AS supplier_name 
                    FROM kho_ton_kho k
                    JOIN san_pham sp ON k.product_id = sp.id 
                    LEFT JOIN nha_cung_cap ncc ON sp.supplier_id = ncc.id 
                    WHERE k.so_luong_ton <= k.nguong_canh_bao 
                    AND sp.status = 'active'
                    ORDER BY k.so_luong_ton ASC";

            $stmt = $db->query($sql);
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

            Response::ok($data, "Lấy danh sách hàng sắp hết thành công");

        } catch (PDOException $e) {
            Response::err("Lỗi truy vấn cơ sở dữ liệu: " . $e->getMessage(), 500);
        }
    }

    // 5.2. GET /api/reports/inventory (Báo cáo xuất nhập tồn)
    // Gọi Stored Procedure sp_bao_cao_xuat_nhap_ton (định nghĩa trong schema.sql)
    // thay vì tự dựng câu SQL động trong PHP — vừa gọn code, vừa đúng khuyến nghị
    // của đề bài CĐ05 (dùng Stored Procedure cho báo cáo tổng hợp truy vấn thường xuyên).
    public static function inventory() {
        $db = getDB();
        try {
            $fromDate = $_GET['from_date'] ?? '1970-01-01 00:00:00';
            $toDate = $_GET['to_date'] ?? date('Y-m-d 23:59:59');
            $moTa = $_GET['mo_ta'] ?? null;
            $khoId = !empty($_GET['kho_id']) ? (int)$_GET['kho_id'] : null;

            $stmt = $db->prepare("CALL sp_bao_cao_xuat_nhap_ton(?, ?, ?, ?)");
            $stmt->execute([$fromDate, $toDate, $khoId, $moTa]);
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $stmt->closeCursor(); // Bắt buộc sau CALL để giải phóng kết nối cho câu lệnh tiếp theo

            // Ép kiểu chuẩn JSON để Front-end không bị lỗi parse Number
            foreach ($data as &$row) {
                $row['product_id'] = (int)$row['product_id'];
                $row['closing_stock'] = (int)$row['closing_stock'];
                $row['total_import'] = (int)$row['total_import'];
                $row['total_export'] = (int)$row['total_export'];
                if ($row['kho_id'] !== null) {
                    $row['kho_id'] = (int)$row['kho_id'];
                }
            }
            Response::ok($data, "Lấy báo cáo xuất nhập tồn thành công");

        } catch (PDOException $e) {
            Response::err("Lỗi truy vấn cơ sở dữ liệu: " . $e->getMessage(), 500);
        }
    }
}