<?php
// require_once __DIR__ . '/../utils/Response.php';

class SupplierController {
    private const TABLE = "nha_cung_cap";

    // GET /api/suppliers?page=1&per_page=10&search=
    public static function index() {
        $db = getDB();
        
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $perPage = isset($_GET['per_page']) ? (int)$_GET['per_page'] : 10;
        $search = isset($_GET['search']) ? trim($_GET['search']) : '';
        
        $where = ["1=1"];
        $params = [];
        
        if ($search !== '') {
            $where[] = "(name LIKE ? OR phone LIKE ? OR email LIKE ?)";
            $searchTerm = "%$search%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        $whereSql = implode(" AND ", $where);
        
        // Đếm tổng số bản ghi
        $stmtCount = $db->prepare("SELECT COUNT(*) FROM " . self::TABLE . " WHERE $whereSql");
        $stmtCount->execute($params);
        $total = $stmtCount->fetchColumn();
        
        // Lấy dữ liệu phân trang
        $limit = $perPage;
        $offset = ($page - 1) * $limit;
        
        $sql = "SELECT id, name, phone, email, address, status, created_at, updated_at 
                FROM " . self::TABLE . " 
                WHERE $whereSql 
                ORDER BY id DESC 
                LIMIT $limit OFFSET $offset";
                
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $suppliers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::paged($suppliers, [
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage
        ]);
    }

    // GET /api/suppliers/{id}
    public static function show($id) {
        $db = getDB();
        $stmt = $db->prepare("SELECT * FROM " . self::TABLE . " WHERE id = ?");
        $stmt->execute([$id]);
        $supplier = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$supplier) {
            Response::err("Không tìm thấy nhà cung cấp", 404);
        }
        
        Response::ok($supplier);
    }

    // POST /api/suppliers
    public static function store($body) {
        $db = getDB();
        
        // Validate
        if (empty($body['name'])) {
            Response::err("Vui lòng nhập tên nhà cung cấp", 400);
        }
        
        $phone = $body['phone'] ?? null;
        $email = $body['email'] ?? null;
        $address = $body['address'] ?? null;
        
        $stmt = $db->prepare("INSERT INTO " . self::TABLE . " (name, phone, email, address) VALUES (?, ?, ?, ?)");
        
        try {
            $stmt->execute([$body['name'], $phone, $email, $address]);
            http_response_code(201);
            Response::ok(null, "Tạo nhà cung cấp thành công");
        } catch (PDOException $e) {
            Response::err("Không thể tạo nhà cung cấp. Vui lòng thử lại.", 500);
        }
    }

    // PUT /api/suppliers/{id}
    public static function update($id, $body) {
        $db = getDB();
        
        if (empty($body['name'])) {
            Response::err("Tên nhà cung cấp không được để trống", 400);
        }
        
        $phone = $body['phone'] ?? null;
        $email = $body['email'] ?? null;
        $address = $body['address'] ?? null;
        $status = $body['status'] ?? 'active';
        
        $stmt = $db->prepare("UPDATE " . self::TABLE . " SET name = ?, phone = ?, email = ?, address = ?, status = ? WHERE id = ?");
        $stmt->execute([$body['name'], $phone, $email, $address, $status, $id]);
        
        if ($stmt->rowCount() === 0) {
            // Kiểm tra xem ID có tồn tại không
            $check = $db->prepare("SELECT id FROM " . self::TABLE . " WHERE id = ?");
            $check->execute([$id]);
            if (!$check->fetch()) {
                Response::err("Không tìm thấy nhà cung cấp", 404);
            }
        }
        
        Response::ok(null, "Cập nhật thành công");
    }

    // DELETE /api/suppliers/{id}
    public static function destroy($id) {
        $db = getDB();
        
        // Soft delete: chuyển trạng thái thành inactive
        $stmt = $db->prepare("UPDATE " . self::TABLE . " SET status = 'inactive' WHERE id = ?");
        $stmt->execute([$id]);
        
        if ($stmt->rowCount() === 0) {
            $check = $db->prepare("SELECT status FROM " . self::TABLE . " WHERE id = ?");
            $check->execute([$id]);
            $supplier = $check->fetch();
            
            if (!$supplier) {
                Response::err("Không tìm thấy nhà cung cấp", 404);
            }
            if ($supplier['status'] === 'inactive') {
                Response::err("Nhà cung cấp này đã bị vô hiệu hoá từ trước", 400);
            }
        }
        
        Response::ok(null, "Đã vô hiệu hoá nhà cung cấp thành công");
    }
}