<?php

class ImportOrderController {
    private const TABLE = "phieu_nhap";

    // GET /api/import-orders
    public static function index() {
        Auth::required();
        $db = getDB();
        
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $perPage = isset($_GET['per_page']) ? (int)$_GET['per_page'] : 10;
        $fromDate = $_GET['from_date'] ?? null;
        $toDate = $_GET['to_date'] ?? null;

        $where = ["1=1"];
        $params = [];

        if ($fromDate) {
            $where[] = "created_at >= ?";
            $params[] = $fromDate . " 00:00:00";
        }
        if ($toDate) {
            $where[] = "created_at <= ?";
            $params[] = $toDate . " 23:59:59";
        }

        $sql = "SELECT * FROM " . self::TABLE . " WHERE " . implode(" AND ", $where) . " ORDER BY created_at DESC";
        require_once __DIR__ . "/../utils/Pagination.php";
        $result = Pagination::run($sql, $params, $page, $perPage);

        Response::paged($result['data'], $result['meta']);
    }

    // GET /api/import-orders/{id}
    public static function show($id) {
        Auth::required();
        $db = getDB();
        
        // 1. Lấy thông tin đầu phiếu
        $stmt = $db->prepare("SELECT * FROM " . self::TABLE . " WHERE id = ?");
        $stmt->execute([$id]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$order) {
            Response::err("Không tìm thấy phiếu nhập", 404);
        }

        // Bổ sung thuộc tính type theo api-spec.md
        $order['type'] = 'import';

        // 2. Lấy danh sách chi tiết (JOIN với san_pham để lấy product_name và tính line_total)
        $stmtDetail = $db->prepare("
            SELECT c.product_id, s.name AS product_name, c.quantity, c.unit_price, (c.quantity * c.unit_price) AS line_total
            FROM chi_tiet_phieu_nhap c
            LEFT JOIN san_pham s ON c.product_id = s.id
            WHERE c.phieu_nhap_id = ?
        ");
        $stmtDetail->execute([$id]);
        $order['details'] = $stmtDetail->fetchAll(PDO::FETCH_ASSOC);

        // Ép kiểu chuẩn JSON (đảm bảo FE không bị lỗi parse String thành Number)
        $order['id'] = (int)$order['id'];
        $order['supplier_id'] = (int)$order['supplier_id'];
        $order['created_by'] = (int)$order['created_by'];
        $order['total_amount'] = (int)$order['total_amount'];

        foreach ($order['details'] as &$detail) {
            $detail['product_id'] = (int)$detail['product_id'];
            $detail['quantity'] = (int)$detail['quantity'];
            $detail['unit_price'] = (int)$detail['unit_price'];
            $detail['line_total'] = (int)$detail['line_total'];
        }

        Response::ok($order);
    }

    // POST /api/import-orders
    public static function store($body) {
        Auth::required();
        $db = getDB();

        if (empty($body['supplier_id']) || empty($body['details']) || !is_array($body['details'])) {
            Response::err("Vui lòng cung cấp đủ thông tin nhà cung cấp và danh sách sản phẩm", 400);
        }

        try {
            $db->beginTransaction();

            $createdBy = $_SESSION['user_id'] ?? 1; // Fallback nếu dev chưa gắn session
            $note = $body['note'] ?? null;

            // 1. Insert đầu phiếu
            $stmt = $db->prepare("INSERT INTO " . self::TABLE . " (supplier_id, created_by, note) VALUES (?, ?, ?)");
            $stmt->execute([$body['supplier_id'], $createdBy, $note]);
            $orderId = $db->lastInsertId();

            // 2. Sinh mã tự động
            $code = "PN" . str_pad($orderId, 6, "0", STR_PAD_LEFT);
            $db->prepare("UPDATE " . self::TABLE . " SET code = ? WHERE id = ?")->execute([$code, $orderId]);

            // 3. Insert chi tiết phiếu
            $stmtDetail = $db->prepare("INSERT INTO chi_tiet_phieu_nhap (phieu_nhap_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)");
            
            foreach ($body['details'] as $item) {
                if (empty($item['product_id']) || empty($item['quantity']) || empty($item['unit_price'])) {
                    throw new Exception("Thông tin chi tiết sản phẩm bị thiếu hoặc không hợp lệ", 400);
                }
                $stmtDetail->execute([$orderId, $item['product_id'], $item['quantity'], $item['unit_price']]);
            }

            $db->commit();

            $stmtGet = $db->prepare("SELECT * FROM " . self::TABLE . " WHERE id = ?");
            $stmtGet->execute([$orderId]);
            $createdOrder = $stmtGet->fetch(PDO::FETCH_ASSOC);

            $createdOrder['type'] = 'import';
            
            $stmtGetDetail = $db->prepare("
                SELECT c.product_id, s.name AS product_name, c.quantity, c.unit_price, (c.quantity * c.unit_price) AS line_total
                FROM chi_tiet_phieu_nhap c
                LEFT JOIN san_pham s ON c.product_id = s.id
                WHERE c.phieu_nhap_id = ?
            ");
            $stmtGetDetail->execute([$orderId]);
            $createdOrder['details'] = $stmtGetDetail->fetchAll(PDO::FETCH_ASSOC);

            // Ép kiểu
            $createdOrder['id'] = (int)$createdOrder['id'];
            $createdOrder['supplier_id'] = (int)$createdOrder['supplier_id'];
            $createdOrder['created_by'] = (int)$createdOrder['created_by'];
            $createdOrder['total_amount'] = (int)$createdOrder['total_amount'];

            foreach ($createdOrder['details'] as &$detail) {
                $detail['product_id'] = (int)$detail['product_id'];
                $detail['quantity'] = (int)$detail['quantity'];
                $detail['unit_price'] = (int)$detail['unit_price'];
                $detail['line_total'] = (int)$detail['line_total'];
            }

            // Trả về đúng HTTP 201 Created
            http_response_code(201);
            echo json_encode([
                "success" => true,
                "message" => "Tạo phiếu nhập thành công",
                "data" => $createdOrder
            ]);
            exit;

        } catch (Exception $e) {
            $db->rollBack();
            $statusCode = is_numeric($e->getCode()) && $e->getCode() >= 400 ? $e->getCode() : 500;
            Response::err("Lỗi tạo phiếu nhập: " . $e->getMessage(), $statusCode);
        }
    }
}