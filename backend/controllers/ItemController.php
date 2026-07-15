<?php
// backend/controllers/ItemController.php
class ItemController {
    private const TABLE = "san_pham"; // ← Đổi tên bảng
    private const PER_PAGE = 10; // Số bản ghi mỗi trang
    /**
     * GET /api/items?page=1&per_page=10&search=keyword&status=active&sort=created_at&order=desc
     * Danh sách có tìm kiếm, lọc, sắp xếp và phân trang
     */
    public static function index(): void {
        Auth::required();
        
        $page = max(1, (int)($_GET["page"] ?? 1));
        $limit = max(1, min(100, (int)($_GET["per_page"] ?? self::PER_PAGE)));
        $q = trim($_GET["search"] ?? "");
        $status = trim($_GET["status"] ?? "");
        
        // Cập nhật các cột được phép sắp xếp theo bảng san_pham
        $sort = in_array($_GET["sort"] ?? "", [
            "id", "sku", "name", "price", "quantity_on_hand", "created_at", "updated_at"
        ]) ? $_GET["sort"] : "created_at";
        
        $order = strtoupper($_GET["order"] ?? "") === "ASC" ? "ASC" : "DESC";
        $where = ["1=1"];
        $params = [];
        
        if ($q !== "") {
            $where[] = "(i.name LIKE ? OR i.sku LIKE ? OR i.category LIKE ?)";
            $like = "%{$q}%";
            $params[] = $like; 
            $params[] = $like; 
            $params[] = $like;
        }
        
        if ($status !== "") {
            $where[] = "i.status = ?";
            $params[] = $status;
        }
        
        // Sửa: JOIN với nha_cung_cap để lấy tên NCC thay vì lấy tên user
        $sql = "SELECT i.*, n.name AS supplier_name
                FROM " . self::TABLE . " i
                LEFT JOIN nha_cung_cap n ON n.id = i.supplier_id
                WHERE " . implode(" AND ", $where) . "
                ORDER BY i.{$sort} {$order}";
                
        require_once __DIR__ . "/../utils/Pagination.php";
        $result = Pagination::run($sql, $params, $page, $limit);
        
        Response::paged($result["data"], $result["meta"]);
    }
    /** GET /api/items/:id */
    public static function show(int $id): void {
        Auth::required();
        $db = getDB();
        // Sửa: JOIN với nha_cung_cap để lấy đúng supplier_name
        $stmt = $db->prepare(
            "SELECT i.*, n.name AS supplier_name
            FROM " . self::TABLE . " i
            LEFT JOIN nha_cung_cap n ON n.id = i.supplier_id
            WHERE i.id = ?"
        );
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) Response::err("Khong tim thay ban ghi.", 404);
        
        Response::ok($row);
    }
    /** POST /api/items — Thêm mới (hỗ trợ cả JSON và multipart/formdata) */
    public static function store(array $body): void {
        Auth::required();
        $sku = trim($body["sku"] ?? "");
        $name = trim($body["name"] ?? "");
        $category = trim($body["category"] ?? "");
        $price = isset($body["price"]) ? (int)$body["price"] : null;
        
        $unit = trim($body["unit"] ?? "cái");
        $supplier_id = !empty($body["supplier_id"]) ? (int)$body["supplier_id"] : null;
        $min_stock = isset($body["min_stock"]) ? (int)$body["min_stock"] : 0;
        $status = in_array($body["status"] ?? "", ["active", "inactive"]) ? $body["status"] : "active";

        // 2. Validate dữ liệu bắt buộc
        if ($sku === "" || $name === "" || $category === "" || $price === null) {
            Response::err("Vui lòng nhập đủ các trường bắt buộc: sku, name, category, price.", 400);
        }
        if (mb_strlen($name) < 2) {
            Response::err("Tên sản phẩm phải có ít nhất 2 ký tự.", 400);
        }
        if ($price < 0) {
            Response::err("Giá sản phẩm không hợp lệ.", 400);
        }
        $db = getDB();
        try{
            $stmt = $db->prepare(
                "INSERT INTO " . self::TABLE . " 
                (sku, name, unit, category, supplier_id, min_stock, price, status, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())"
            );
            
            $stmt->execute([
                $sku, 
                $name, 
                $unit, 
                $category, 
                $supplier_id, 
                $min_stock, 
                $price, 
                $status
            ]);
            
            $id = (int)$db->lastInsertId();
            Response::ok([
                "id" => $id, 
                "sku" => $sku, 
                "name" => $name, 
                "status" => $status
            ], "Thêm mới sản phẩm thành công!", 201);
        } catch (PDOException $e) {
            // Bắt lỗi vi phạm Unique Key (Trùng SKU)
            if ($e->getCode() == 23000) {
                Response::err("Mã SKU '{$sku}' đã tồn tại trong hệ thống. Vui lòng chọn mã khác.", 409);
            }
            // Các lỗi DB khác
            Response::err("Lỗi máy chủ: " . $e->getMessage(), 500);
        }
        
    }
    /** PUT /api/items/:id — Cập nhật */
    public static function update(int $id, array $body): void {
        Auth::required();
        Auth::role("admin");
        $db = getDB();
        // Kiểm tra tồn tại
        $stmt = $db->prepare("SELECT * FROM " . self::TABLE . " WHERE id=?");
        $stmt->execute([$id]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$existing) Response::err("Khong tim thay ban ghi.", 404);

        $sku = trim($body["sku"] ?? $existing["sku"]);
        $name = trim($body["name"] ?? $existing["name"]);
        $unit = trim($body["unit"] ?? $existing["unit"]);
        $category = trim($body["category"] ?? $existing["category"]);
        
        // Lưu ý: supplier_id có thể là NULL, cần check isset thay vì empty
        $supplier_id = array_key_exists("supplier_id", $body) ? $body["supplier_id"] : $existing["supplier_id"];
        $min_stock = isset($body["min_stock"]) ? (int)$body["min_stock"] : $existing["min_stock"];
        $price = isset($body["price"]) ? (int)$body["price"] : $existing["price"];
        $status = in_array($body["status"] ?? "", ["active", "inactive"]) ? $body["status"] : $existing["status"];

        // 3. Validate cơ bản
        if ($sku === "" || $name === "" || $category === "") {
            Response::err("Các trường sku, name, category không được để trống.", 400);
        }
        if (mb_strlen($name) < 2) {
            Response::err("Tên sản phẩm phải có ít nhất 2 ký tự.", 400);
        }
        if ($price < 0) {
            Response::err("Giá sản phẩm không hợp lệ.", 400);
        }
        try {
            $updateStmt = $db->prepare(
                "UPDATE " . self::TABLE . " SET 
                sku=?, name=?, unit=?, category=?, supplier_id=?, min_stock=?, price=?, status=?, updated_at=NOW()
                WHERE id=?"
            );
            
            $updateStmt->execute([
                $sku, $name, $unit, $category, $supplier_id, $min_stock, $price, $status, $id
            ]);
            
            Response::ok([
                "id" => $id, 
                "sku" => $sku, 
                "name" => $name
            ], "Cập nhật thành công!");
            
        } catch (PDOException $e) {
            // Bắt lỗi Unique Key nếu đổi mã SKU trùng với một sản phẩm khác đang có
            if ($e->getCode() == 23000) {
                Response::err("Mã SKU '{$sku}' đã được sử dụng cho một sản phẩm khác.", 409);
            }
            Response::err("Lỗi máy chủ: " . $e->getMessage(), 500);
        }
    }
    /** DELETE /api/items/:id — Xóa */
    public static function destroy(int $id): void {
        Auth::role("admin");
        Auth::required();
        $db = getDB();
        $stmt = $db->prepare("SELECT * FROM " . self::TABLE . " WHERE id=?");
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) Response::err("Khong tim thay ban ghi.", 404);
        try {
            $db->prepare("DELETE FROM " . self::TABLE . " WHERE id=?")->execute([$id]);
            Response::ok(null, "Xóa sản phẩm thành công!");
        } catch (PDOException $e) {
            // Lợi ích: Bắt lỗi 23000 giúp hệ thống không bị crash khi cố xóa sản phẩm đã có lịch sử giao dịch.
            if ($e->getCode() == 23000) {
                Response::err("Không thể xóa vì sản phẩm đã phát sinh giao dịch. Vui lòng cập nhật trạng thái thành 'inactive'.", 409);
            }
            Response::err("Lỗi máy chủ: " . $e->getMessage(), 500);
        }
    }
    /** GET /api/items/export?format=csv — Xuất CSV */
    public static function export(): void {
        Auth::role("admin");
        $db = getDB();
        $stmt = $db->query(
            "SELECT i.sku, i.name, i.category, i.price, i.quantity_on_hand, i.status, 
                    n.name AS supplier_name, i.created_at
            FROM " . self::TABLE . " i
            LEFT JOIN nha_cung_cap n ON n.id = i.supplier_id
            ORDER BY i.id DESC"
        );
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        // Xuất file CSV
        header("Content-Type: text/csv; charset=UTF-8");
        header("Content-Disposition: attachment; filename=export_" .
        date("Ymd_His") . ".csv");
        header("Cache-Control: no-cache");
        $out = fopen("php://output", "w");
        fputs($out, "\xEF\xBB\xBF"); // BOM UTF-8 để Excel mở đúng tiếng Việt
        fputcsv($out, ["SKU","Tên","Danh mục","Giá","Số lượng tồn","Trạng thái","Nhà cung cấp","Ngày tạo"]);
        foreach ($rows as $r) {
            fputcsv($out,
            [$r["sku"],$r["name"],$r["category"],$r["price"],$r["quantity_on_hand"],$r["status"],$r["supplier_name"]?? "Không xác định",$r["created_at"]]);
        }
        fclose($out);
        exit;
    }
}