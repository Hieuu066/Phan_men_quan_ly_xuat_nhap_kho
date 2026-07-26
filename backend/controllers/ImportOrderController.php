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

        $order['type'] = 'import';

        // JOIN thêm kho_hang để lấy thông tin kho
        $stmtDetail = $db->prepare("
            SELECT c.product_id, s.name AS product_name, c.kho_id, k.ten_kho, c.quantity, c.unit_price, (c.quantity * c.unit_price) AS line_total
            FROM chi_tiet_phieu_nhap c
            LEFT JOIN san_pham s ON c.product_id = s.id
            LEFT JOIN kho_hang k ON c.kho_id = k.id
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
            $detail['kho_id'] = (int)$detail['kho_id'];
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

            // 1. Insert đầu phiếu (tạm thời để total_amount = 0, sẽ update sau khi tính tổng chi tiết)
            $stmt = $db->prepare("INSERT INTO " . self::TABLE . " (supplier_id, created_by, note, total_amount) VALUES (?, ?, ?, 0)");
            $stmt->execute([$body['supplier_id'], $createdBy, $note]);
            $orderId = $db->lastInsertId();

            // 2. Sinh mã tự động
            $code = "PN" . str_pad($orderId, 6, "0", STR_PAD_LEFT);
            $db->prepare("UPDATE " . self::TABLE . " SET code = ? WHERE id = ?")->execute([$code, $orderId]);

            // 3. Insert chi tiết phiếu
            // Chuẩn bị các statement cần thiết
            $stmtDetail = $db->prepare("INSERT INTO chi_tiet_phieu_nhap (phieu_nhap_id, product_id, kho_id, quantity, unit_price) VALUES (?, ?, ?, ?, ?)");
            $stmtCheckCapacity = $db->prepare("
                SELECT k.id, k.ten_kho, k.suc_chua, COALESCE(SUM(ktk.so_luong_ton), 0) AS current_stock
                FROM kho_hang k
                LEFT JOIN kho_ton_kho ktk ON k.id = ktk.kho_id
                WHERE k.id = ? FOR UPDATE
            ");
            $stmtUpsertStock = $db->prepare("
                INSERT INTO kho_ton_kho (kho_id, product_id, supplier_id, so_luong_ton) 
                VALUES (?, ?, ?, ?) 
                ON DUPLICATE KEY UPDATE 
                    so_luong_ton = so_luong_ton + VALUES(so_luong_ton),
                    supplier_id = VALUES(supplier_id)
            ");
            $stmtFindAlternative = $db->prepare("
                SELECT k.id AS kho_id, k.ten_kho, 
                       (k.suc_chua - COALESCE((SELECT SUM(so_luong_ton) FROM kho_ton_kho WHERE kho_id = k.id), 0)) AS available_capacity
                FROM kho_hang k
                WHERE k.trang_thai = 'active' AND k.suc_chua IS NOT NULL
                HAVING available_capacity >= ?
                ORDER BY available_capacity DESC
                LIMIT 3
            ");
            $totalAmount = 0;
            // 2. Xử lý từng dòng chi tiết
            foreach ($body['details'] as $item) {
                if (empty($item['product_id']) || empty($item['quantity']) || empty($item['unit_price']) || empty($item['kho_id'])) {
                    throw new Exception("Thông tin chi tiết sản phẩm bị thiếu hoặc chưa chọn kho (cần có kho_id)", 400);
                }

                $qty = (int)$item['quantity'];
                $khoId = (int)$item['kho_id'];
                $productId = (int)$item['product_id'];
                $unitPrice = (int)$item['unit_price'];

                // Cộng dồn tổng tiền
                $totalAmount += ($qty * $unitPrice);

                // Insert chi tiết
                $stmtDetail->execute([$orderId, $productId, $khoId, $qty, $unitPrice]);

                // 3. Kiểm tra sức chứa (Real-time bằng FOR UPDATE)
                $stmtCheckCapacity->execute([$khoId]);
                $khoInfo = $stmtCheckCapacity->fetch(PDO::FETCH_ASSOC);

                if (!$khoInfo) {
                    throw new Exception("Kho ID {$khoId} không tồn tại.", 404);
                }

                if ($khoInfo['suc_chua'] !== null) {
                    $available = (int)$khoInfo['suc_chua'] - (int)$khoInfo['current_stock'];
                    if ($available < $qty) {
                        // Tìm kho thay thế
                        $stmtFindAlternative->execute([$qty]);
                        $alternatives = $stmtFindAlternative->fetchAll(PDO::FETCH_ASSOC);
                        
                        // Ném lỗi 409 để Rollback
                        http_response_code(409);
                        echo json_encode([
                            "success" => false,
                            "message" => "Không đủ chỗ trống trong kho {$khoInfo['ten_kho']} (Còn trống: {$available}).",
                            "suggestions" => [
                                "alternative_warehouses" => $alternatives
                            ]
                        ]);
                        $db->rollBack();
                        exit;
                    }
                }

                // 4. Cập nhật tồn kho (Thay thế Trigger bằng UPSERT) — ghi luôn nhà cung cấp của phiếu nhập này
                $stmtUpsertStock->execute([$khoId, $productId, $body['supplier_id'], $qty]);
            }
            $db->prepare("UPDATE " . self::TABLE . " SET total_amount = ? WHERE id = ?")->execute([$totalAmount, $orderId]);
            $db->commit();

            // 5. Lấy lại thông tin phiếu vừa tạo để trả về Front-end
            $stmtGet = $db->prepare("SELECT * FROM " . self::TABLE . " WHERE id = ?");
            $stmtGet->execute([$orderId]);
            $createdOrder = $stmtGet->fetch(PDO::FETCH_ASSOC);

            $createdOrder['type'] = 'import';
            
            // JOIN thêm kho_hang để lấy chi tiết kho cho response
            $stmtGetDetail = $db->prepare("
                SELECT c.product_id, s.name AS product_name, c.kho_id, k.ten_kho, c.quantity, c.unit_price, (c.quantity * c.unit_price) AS line_total
                FROM chi_tiet_phieu_nhap c
                LEFT JOIN san_pham s ON c.product_id = s.id
                LEFT JOIN kho_hang k ON c.kho_id = k.id
                WHERE c.phieu_nhap_id = ?
            ");
            $stmtGetDetail->execute([$orderId]);
            $createdOrder['details'] = $stmtGetDetail->fetchAll(PDO::FETCH_ASSOC);

            // Ép kiểu chuẩn JSON để FE không bị lỗi parse String thành Number
            $createdOrder['id'] = (int)$createdOrder['id'];
            $createdOrder['supplier_id'] = (int)$createdOrder['supplier_id'];
            $createdOrder['created_by'] = (int)$createdOrder['created_by'];
            $createdOrder['total_amount'] = (int)$createdOrder['total_amount'];

            foreach ($createdOrder['details'] as &$detail) {
                $detail['product_id'] = (int)$detail['product_id'];
                $detail['kho_id'] = (int)$detail['kho_id'];
                $detail['quantity'] = (int)$detail['quantity'];
                $detail['unit_price'] = (int)$detail['unit_price'];
                $detail['line_total'] = (int)$detail['line_total'];
            }

            // Trả về đúng HTTP 201 Created cùng cấu trúc chuẩn
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