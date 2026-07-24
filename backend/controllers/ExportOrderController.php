<?php

class ExportOrderController {
    private const TABLE = "phieu_xuat";

    // GET /api/export-orders
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

    // GET /api/export-orders/{id}
    public static function show($id) {
        Auth::required();
        $db = getDB();
        
        $stmt = $db->prepare("SELECT * FROM " . self::TABLE . " WHERE id = ?");
        $stmt->execute([$id]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$order) {
            Response::err("Không tìm thấy phiếu xuất", 404);
        }

        // Bổ sung thuộc tính type theo api-spec.md
        $order['type'] = 'export';

        // 2. Lấy danh sách chi tiết (JOIN với san_pham và kho_hang để lấy product_name, ten_kho và tính line_total)
        $stmtDetail = $db->prepare("
            SELECT c.product_id, s.name AS product_name, c.kho_id, k.ten_kho, c.quantity, c.unit_price, (c.quantity * c.unit_price) AS line_total
            FROM chi_tiet_phieu_xuat c
            LEFT JOIN san_pham s ON c.product_id = s.id
            LEFT JOIN kho_hang k ON c.kho_id = k.id
            WHERE c.phieu_xuat_id = ?
        ");
        $stmtDetail->execute([$id]);
        $order['details'] = $stmtDetail->fetchAll(PDO::FETCH_ASSOC);

        // Ép kiểu chuẩn JSON
        $order['id'] = (int)$order['id'];
        $order['created_by'] = (int)$order['created_by'];
        $order['total_amount'] = (int)$order['total_amount'];
        
        // Ép kiểu customer_id nếu bảng phiếu xuất của bạn có trường này
        if (isset($order['customer_id'])) {
            $order['customer_id'] = (int)$order['customer_id'];
        }

        foreach ($order['details'] as &$detail) {
            $detail['product_id'] = (int)$detail['product_id'];
            $detail['kho_id'] = (int)$detail['kho_id']; // Bổ sung ép kiểu kho_id
            $detail['quantity'] = (int)$detail['quantity'];
            $detail['unit_price'] = (int)$detail['unit_price'];
            $detail['line_total'] = (int)$detail['line_total'];
        }

        Response::ok($order);
    }

    // POST /api/export-orders
    public static function store($body) {
        Auth::required();
        $db = getDB();

        if (empty($body['nguoi_nhan']) || empty($body['details']) || !is_array($body['details'])) {
            Response::err("Vui lòng cung cấp đủ thông tin người nhận và danh sách sản phẩm", 400);
        }

        try {
            $db->beginTransaction();

            $createdBy = $_SESSION['user_id'] ?? 1; // Fallback
            $note = $body['note'] ?? null;
            $totalAmount = 0;
            // 1. Insert đầu phiếu xuất (khởi tạo total_amount = 0)
            $stmt = $db->prepare("INSERT INTO " . self::TABLE . " (nguoi_nhan, created_by, note, total_amount) VALUES (?, ?, ?, 0)");
            $stmt->execute([$body['nguoi_nhan'], $createdBy, $note]);
            $orderId = $db->lastInsertId();

            // 2. Sinh mã tự động (PX)
            $code = "PX" . str_pad($orderId, 6, "0", STR_PAD_LEFT);
            $db->prepare("UPDATE " . self::TABLE . " SET code = ? WHERE id = ?")->execute([$code, $orderId]);
            // 3. Chuẩn bị các Statement xử lý chi tiết và tồn kho
            $stmtDetail = $db->prepare("INSERT INTO chi_tiet_phieu_xuat (phieu_xuat_id, product_id, kho_id, quantity, unit_price) VALUES (?, ?, ?, ?, ?)");
            // Lock dòng dữ liệu tồn kho bằng FOR UPDATE
            $stmtCheckStock = $db->prepare("SELECT so_luong_ton FROM kho_ton_kho WHERE kho_id = ? AND product_id = ? FOR UPDATE");
            
            // Update trừ tồn kho
            $stmtUpdateStock = $db->prepare("UPDATE kho_ton_kho SET so_luong_ton = so_luong_ton - ? WHERE kho_id = ? AND product_id = ?");
            
            // Tìm kho gợi ý thay thế
            $stmtFindAlternatives = $db->prepare("
                SELECT k.id AS kho_id, k.ten_kho, ktk.so_luong_ton AS available_stock
                FROM kho_hang k
                JOIN kho_ton_kho ktk ON k.id = ktk.kho_id
                WHERE ktk.product_id = ? AND ktk.so_luong_ton > 0 AND k.id != ?
                ORDER BY available_stock DESC
                LIMIT 3
            ");
            // Xử lý từng dòng chi tiết
            foreach ($body['details'] as $item) {
                if (empty($item['product_id']) || empty($item['quantity']) || !isset($item['unit_price']) || empty($item['kho_id'])) {
                    throw new Exception("Thông tin chi tiết sản phẩm bị thiếu hoặc chưa chọn kho (cần có kho_id)", 400);
                }

                $qty = (int)$item['quantity'];
                $khoId = (int)$item['kho_id'];
                $productId = (int)$item['product_id'];
                $unitPrice = (int)$item['unit_price'];

                // 4. Kiểm tra tồn kho Real-time (Tránh Race Condition)
                $stmtCheckStock->execute([$khoId, $productId]);
                $stockData = $stmtCheckStock->fetch(PDO::FETCH_ASSOC);
                $currentStock = $stockData ? (int)$stockData['so_luong_ton'] : 0;

                // Nếu không đủ tồn kho -> Gợi ý & Rollback
                if ($currentStock < $qty) {
                    $stmtFindAlternatives->execute([$productId, $khoId]);
                    $alternatives = $stmtFindAlternatives->fetchAll(PDO::FETCH_ASSOC);

                    $db->rollBack();
                    
                    http_response_code(409); // Conflict
                    echo json_encode([
                        "success" => false,
                        "message" => "Sản phẩm ID {$productId} không đủ tồn tại kho ID {$khoId} (Tồn: {$currentStock}, Cần: {$qty}).",
                        "suggestions" => [
                            "alternative_warehouses" => $alternatives,
                            "split_option" => "Bạn có thể xuất {$currentStock} từ kho này và tạo thêm phiếu lấy từ các kho khác."
                        ]
                    ]);
                    exit;
                }

                // Đủ tồn kho -> Trừ số lượng bằng PHP
                $stmtUpdateStock->execute([$qty, $khoId, $productId]);

                // Insert chi tiết phiếu xuất
                $stmtDetail->execute([$orderId, $productId, $khoId, $qty, $unitPrice]);
                
                // Cộng dồn tổng tiền
                $totalAmount += ($qty * $unitPrice);
            }
            // Cập nhật lại tổng tiền cho đầu phiếu
            $db->prepare("UPDATE " . self::TABLE . " SET total_amount = ? WHERE id = ?")->execute([$totalAmount, $orderId]);
            $db->commit();

            // 4. Trả về toàn bộ dữ liệu vừa tạo (Giống Import)
            $stmtGet = $db->prepare("SELECT * FROM " . self::TABLE . " WHERE id = ?");
            $stmtGet->execute([$orderId]);
            $createdOrder = $stmtGet->fetch(PDO::FETCH_ASSOC);

            $createdOrder['type'] = 'export';
            
            // JOIN với san_pham và kho_hang để lấy chi tiết hiển thị đầy đủ
            $stmtGetDetail = $db->prepare("
                SELECT c.product_id, s.name AS product_name, c.kho_id, k.ten_kho, c.quantity, c.unit_price, (c.quantity * c.unit_price) AS line_total
                FROM chi_tiet_phieu_xuat c
                LEFT JOIN san_pham s ON c.product_id = s.id
                LEFT JOIN kho_hang k ON c.kho_id = k.id
                WHERE c.phieu_xuat_id = ?
            ");
            $stmtGetDetail->execute([$orderId]);
            $createdOrder['details'] = $stmtGetDetail->fetchAll(PDO::FETCH_ASSOC);

            // Ép kiểu
            $createdOrder['id'] = (int)$createdOrder['id'];
            $createdOrder['created_by'] = (int)$createdOrder['created_by'];
            $createdOrder['total_amount'] = (int)$createdOrder['total_amount'];

            foreach ($createdOrder['details'] as &$detail) {
                $detail['product_id'] = (int)$detail['product_id'];
                $detail['kho_id'] = (int)$detail['kho_id'];
                $detail['quantity'] = (int)$detail['quantity'];
                $detail['unit_price'] = (int)$detail['unit_price'];
                $detail['line_total'] = (int)$detail['line_total'];
            }

            http_response_code(201);
            echo json_encode([
                "success" => true,
                "message" => "Tạo phiếu xuất thành công",
                "data" => $createdOrder
            ]);
            exit;

        } catch (Exception $e) {
            $db->rollBack();
            // Xử lý các lỗi hệ thống/code (Do ta đã tự ném 409 ở trên nên block catch 45000 của Trigger đã được gỡ bỏ)
            $statusCode = is_numeric($e->getCode()) && $e->getCode() >= 400 ? $e->getCode() : 500;
            Response::err("Lỗi tạo phiếu xuất: " . $e->getMessage(), $statusCode);
        }
    }
}