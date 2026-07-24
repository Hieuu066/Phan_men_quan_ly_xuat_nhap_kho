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
            // Ánh xạ lại tên cột để giữ tính tương thích với Front-end cũ
            $sql = "SELECT 
                        sp.id AS product_id, 
                        sp.sku, 
                        sp.name, 
                        sp.mo_ta, 
                        k.warehouse_id,
                        k.so_luong_ton AS quantity_on_hand, --giao diện UI cũ của bạn (nếu có) vẫn map đúng key JSON mà không bị sập.
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
    public static function inventory() {
        $db = getDB();
        try {
            // Lấy tham số thời gian (mặc định từ 1970 đến hiện tại nếu không truyền)
            $fromDate = $_GET['from_date'] ?? '1970-01-01 00:00:00';
            $toDate = $_GET['to_date'] ?? date('Y-m-d 23:59:59');
            $moTa = $_GET['mo_ta'] ?? '';
            $khoId = $_GET['kho_id'] ?? null;

            // 1. Xử lý động cột hiển thị: Nếu có kho_id thì lấy thông tin kho, nếu không thì trả NULL
            $selectKho = $khoId 
                ? ":kho_id AS kho_id, (SELECT ten_kho FROM kho_hang WHERE id = :kho_id) AS ten_kho," 
                : "NULL AS kho_id, NULL AS ten_kho,";
            // 2. Xử lý động điều kiện cho các Subquery và JOIN
            $khoConditionNhap = $khoId ? " AND ctpn.kho_id = :kho_id" : "";
            $khoConditionXuat = $khoId ? " AND ctpx.kho_id = :kho_id" : "";
            $khoConditionTon  = $khoId ? " AND k.kho_id = :kho_id" : "";
            // Sử dụng Subquery để đếm nhập/xuất và LEFT JOIN để lấy tổng tồn kho hiện tại
            $sql = "SELECT 
                        sp.id AS product_id,
                        sp.sku,
                        sp.name,
                        sp.mo_ta,
                        sp.unit,
                        {$selectKho}
                        COALESCE(SUM(k.so_luong_ton), 0) AS closing_stock,
                        
                        -- Tổng nhập trong kỳ (Có lọc theo kho nếu được truyền)
                        COALESCE((
                            SELECT SUM(ctpn.quantity) 
                            FROM chi_tiet_phieu_nhap ctpn 
                            JOIN phieu_nhap pn ON ctpn.phieu_nhap_id = pn.id 
                            WHERE ctpn.product_id = sp.id 
                            AND pn.created_at BETWEEN :from_date AND :to_date
                            {$khoConditionNhap}
                        ), 0) AS total_import,
                        
                        -- Tổng xuất trong kỳ (Có lọc theo kho nếu được truyền)
                        COALESCE((
                            SELECT SUM(ctpx.quantity) 
                            FROM chi_tiet_phieu_xuat ctpx 
                            JOIN phieu_xuat px ON ctpx.phieu_xuat_id = px.id 
                            WHERE ctpx.product_id = sp.id 
                            AND px.created_at BETWEEN :from_date AND :to_date
                            {$khoConditionXuat}
                        ), 0) AS total_export
                        
                    FROM san_pham sp
                    -- Chỉ JOIN với tồn kho của kho được chỉ định (nếu có)
                    LEFT JOIN kho_ton_kho k ON k.product_id = sp.id {$khoConditionTon}
                    WHERE sp.status = 'active'";

            $params = [
                ':from_date' => $fromDate,
                ':to_date' => $toDate
            ];

            // Thêm tham số cho kho_id nếu có
            if ($khoId) {
                $params[':kho_id'] = $khoId;
            }
            // Lọc thêm theo mo_ta
            if (!empty($moTa)) {
                $sql .= " AND sp.mo_ta LIKE :mo_ta";
                $params[':mo_ta'] = "%$moTa%";
            }
            // Bắt buộc GROUP BY vì có sử dụng hàm SUM(k.so_luong_ton)
            $sql .= " GROUP BY sp.id ORDER BY sp.id DESC";

            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
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