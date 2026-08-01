<?php

class WarehouseStockController {
    private const PER_PAGE = 10;
    /**
     * GET /api/warehouse-stock
     * Lấy danh sách tồn kho chi tiết, hợp nhất thông tin từ Kho, Sản phẩm và Nhà cung cấp
     */
    public static function index() {
        Auth::required();
        $db = getDB();
        // Lấy tham số phân trang từ URL
        $page = max(1, (int)($_GET["page"] ?? 1));
        $limit = max(1, min(100, (int)($_GET["per_page"] ?? self::PER_PAGE)));
        $sql = "SELECT ktk.id, ktk.kho_id, k.ten_kho, ktk.product_id, sp.name AS product_name, sp.sku, 
                       COALESCE(ktk.supplier_id, sp.supplier_id) AS supplier_id, ncc.name AS supplier_name,
                       ktk.so_luong_ton, ktk.nguong_canh_bao 
                FROM kho_ton_kho ktk
                JOIN kho_hang k ON ktk.kho_id = k.id
                JOIN san_pham sp ON ktk.product_id = sp.id
                LEFT JOIN nha_cung_cap ncc ON ncc.id = COALESCE(ktk.supplier_id, sp.supplier_id)
                WHERE 1=1";
        
        $params = [];

        // Hỗ trợ tìm kiếm theo từ khóa (Tên sản phẩm hoặc SKU)
        if (!empty($_GET['keyword'])) {
            $sql .= " AND (sp.name LIKE ? OR sp.sku LIKE ?)";
            $keyword = "%" . trim($_GET['keyword']) . "%";
            $params[] = $keyword;
            $params[] = $keyword;
        }

        // Hỗ trợ lọc chi tiết theo ID kho cụ thể
        if (!empty($_GET['kho_id'])) {
            $sql .= " AND ktk.kho_id = ?";
            $params[] = (int)$_GET['kho_id'];
        }

        // Lọc theo 1 sản phẩm cụ thể
        if (!empty($_GET['product_id'])) {
            $sql .= " AND ktk.product_id = ?";
            $params[] = (int)$_GET['product_id'];
        }

        if (!empty($_GET['supplier_id'])) {
            $sql .= " AND COALESCE(ktk.supplier_id, sp.supplier_id) = ?";
            $params[] = (int)$_GET['supplier_id'];
        }

        $sql .= " ORDER BY ktk.id DESC";
        
        // Tích hợp phân trang (Sử dụng class Pagination của hệ thống)
        $result = Pagination::run($sql, $params, $page, $limit);
        Response::paged($result["data"], $result["meta"]);
    }

    /**
     * PUT /api/warehouse-stock/{id}
     * Chỉ cho phép cập nhật cột nguong_canh_bao
     *
     * @param int $id ID của bản ghi trong bảng kho_ton_kho
     */
    public static function updateThreshold($id) {
        Auth::required();
        $db = getDB();
        
        $body = json_decode(file_get_contents('php://input'), true);
        
        // Validation cơ bản
        if (!isset($body['nguong_canh_bao'])) {
            Response::err("Dữ liệu không hợp lệ: Vui lòng cung cấp 'nguong_canh_bao'", 400);
        }
        
        $nguong_canh_bao = (int)$body['nguong_canh_bao'];
        if ($nguong_canh_bao < 0) {
            Response::err("Ngưỡng cảnh báo không hợp lệ (Phải lớn hơn hoặc bằng 0)", 400);
        }

        // Kiểm tra xem bản ghi tồn kho có thực sự tồn tại trong hệ thống hay không
        $stmtCheck = $db->prepare("SELECT id FROM kho_ton_kho WHERE id = ?");
        $stmtCheck->execute([$id]);
        if (!$stmtCheck->fetch()) {
            Response::err("Bản ghi tồn kho không tồn tại", 404);
        }
        
        $stmt = $db->prepare("UPDATE kho_ton_kho SET nguong_canh_bao = ? WHERE id = ?");
        $stmt->execute([$nguong_canh_bao, $id]);
        
        Response::ok(null, "Cập nhật ngưỡng cảnh báo thành công");
    }
}