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

            // Số mặt hàng sắp hết
            $stmt = $db->query("SELECT COUNT(id) FROM san_pham WHERE quantity_on_hand < min_stock AND status = 'active'");
            $lowStockItems = (int) $stmt->fetchColumn();

            // Tổng giá trị tồn kho (Số lượng * Giá)
            $stmt = $db->query("SELECT SUM(quantity_on_hand * price) FROM san_pham WHERE status = 'active'");
            $totalInventoryValue = (int) $stmt->fetchColumn();

            Response::ok([
                "total_products" => $totalProducts,
                "total_suppliers" => $totalSuppliers,
                "low_stock_items" => $lowStockItems,
                "total_inventory_value" => $totalInventoryValue
            ], "Lấy dữ liệu thống kê thành công");

        } catch (PDOException $e) {
            Response::err("Lỗi truy vấn cơ sở dữ liệu: " . $e->getMessage(), 500);
        }
    }

    // 5.3. GET /api/reports/low-stock (Báo cáo hàng sắp hết)
    public static function lowStock() {
        $db = getDB();
        try {
            $sql = "SELECT 
                        sp.id AS product_id, 
                        sp.sku, 
                        sp.name, 
                        sp.category, 
                        sp.quantity_on_hand, 
                        sp.min_stock, 
                        ncc.name AS supplier_name 
                    FROM san_pham sp 
                    LEFT JOIN nha_cung_cap ncc ON sp.supplier_id = ncc.id 
                    WHERE sp.quantity_on_hand < sp.min_stock AND sp.status = 'active'
                    ORDER BY sp.quantity_on_hand ASC";

            $stmt = $db->query($sql);
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

            Response::ok($data, "Lấy danh sách hàng sắp hết thành công");

        } catch (PDOException $e) {
            Response::err("Lỗi truy vấn cơ sở dữ liệu: " . $e->getMessage(), 500);
        }
    }

    // 5.2. GET /api/reports/inventory (Báo cáo xuất nhập tồn)
    public static function inventory() {
        $db = getDB();
        try {
            // Lấy tham số thời gian (mặc định từ 1970 đến hiện tại nếu không truyền)
            $fromDate = $_GET['from_date'] ?? '1970-01-01 00:00:00';
            $toDate = $_GET['to_date'] ?? date('Y-m-d 23:59:59');
            $category = $_GET['category'] ?? '';

            // Sử dụng Subquery để đếm chính xác tổng số lượng nhập/xuất trong khoảng thời gian
            $sql = "SELECT 
                        sp.id AS product_id,
                        sp.sku,
                        sp.name,
                        sp.category,
                        sp.unit,
                        sp.quantity_on_hand AS closing_stock,
                        
                        -- Tổng nhập trong kỳ
                        COALESCE((
                            SELECT SUM(ctpn.quantity) 
                            FROM chi_tiet_phieu_nhap ctpn 
                            JOIN phieu_nhap pn ON ctpn.phieu_nhap_id = pn.id 
                            WHERE ctpn.product_id = sp.id AND pn.created_at BETWEEN :from_date AND :to_date
                        ), 0) AS total_import,
                        
                        -- Tổng xuất trong kỳ
                        COALESCE((
                            SELECT SUM(ctpx.quantity) 
                            FROM chi_tiet_phieu_xuat ctpx 
                            JOIN phieu_xuat px ON ctpx.phieu_xuat_id = px.id 
                            WHERE ctpx.product_id = sp.id AND px.created_at BETWEEN :from_date AND :to_date
                        ), 0) AS total_export
                        
                    FROM san_pham sp
                    WHERE sp.status = 'active'";

            $params = [
                ':from_date' => $fromDate,
                ':to_date' => $toDate
            ];

            // Lọc thêm theo category nếu có
            if (!empty($category)) {
                $sql .= " AND sp.category = :category";
                $params[':category'] = $category;
            }

            $sql .= " ORDER BY sp.id DESC";

            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

            Response::ok($data, "Lấy báo cáo xuất nhập tồn thành công");

        } catch (PDOException $e) {
            Response::err("Lỗi truy vấn cơ sở dữ liệu: " . $e->getMessage(), 500);
        }
    }
}