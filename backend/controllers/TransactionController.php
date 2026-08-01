<?php
class TransactionController {
    private const PER_PAGE = 10;
    /**
     * GET /api/transactions
     * Lấy danh sách lịch sử giao dịch hợp nhất (Nhập kho & Xuất kho)
     */
    public static function index() {
        Auth::required();
        $db = getDB();
        // Lấy tham số phân trang từ URL
        $page = max(1, (int)($_GET["page"] ?? 1));
        $limit = max(1, min(100, (int)($_GET["per_page"] ?? self::PER_PAGE)));
        $baseSql = "
            SELECT * FROM (
                SELECT id, code, 'import' AS type, total_amount, created_at, note,
                       (SELECT name FROM nha_cung_cap WHERE id = phieu_nhap.supplier_id) AS counterparty
                FROM phieu_nhap
                
                UNION ALL
                
                SELECT id, code, 'export' AS type, total_amount, created_at, note,
                       nguoi_nhan AS counterparty
                FROM phieu_xuat
            ) AS transactions
            WHERE 1=1
        ";
        
        $params = [];

        // Lọc theo loại giao dịch (import / export)
        if (!empty($_GET['type'])) {
            $baseSql .= " AND type = ?";
            $params[] = $_GET['type'];
        }

        // Lọc theo khoảng thời gian (Từ ngày)
        if (!empty($_GET['from_date'])) {
            $baseSql .= " AND DATE(created_at) >= ?";
            $params[] = $_GET['from_date'];
        }

        // Lọc theo khoảng thời gian (Đến ngày)
        if (!empty($_GET['to_date'])) {
            $baseSql .= " AND DATE(created_at) <= ?";
            $params[] = $_GET['to_date'];
        }

        // Lọc theo mã phiếu hoặc đối tác
        if (!empty($_GET['keyword'])) {
            $baseSql .= " AND (code LIKE ? OR counterparty LIKE ?)";
            $keyword = "%" . trim($_GET['keyword']) . "%";
            $params[] = $keyword;
            $params[] = $keyword;
        }

        // Sắp xếp giao dịch mới nhất lên đầu
        $baseSql .= " ORDER BY created_at DESC";
        
        $result = Pagination::run($baseSql, $params, $page, $limit);
        Response::paged($result["data"], $result["meta"]);
    }
}