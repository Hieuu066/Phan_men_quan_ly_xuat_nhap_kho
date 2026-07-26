<?php
class WarehouseController {
    private const TABLE = "kho_hang";

    /**
     * GET /api/warehouses/suggest-import
     * Đề xuất kho còn đủ sức chứa
     */
    public static function suggestImport() {
        Auth::required();
        $db = getDB();
        $productId = (int)($_GET['product_id'] ?? 0);
        $qty = (int)($_GET['quantity'] ?? 0);

        // Logic: Lấy các kho đang active và (sức chứa - tổng tồn kho hiện tại) >= số lượng cần nhập
        $sql = "SELECT k.id AS kho_id, k.ten_kho, 
                       (k.suc_chua - COALESCE((SELECT SUM(so_luong_ton) FROM kho_ton_kho WHERE kho_id = k.id), 0)) AS available_capacity 
                FROM kho_hang k 
                WHERE k.trang_thai = 'active' AND k.suc_chua IS NOT NULL 
                HAVING available_capacity >= ? 
                ORDER BY available_capacity DESC";
        
        $stmt = $db->prepare($sql);
        $stmt->execute([$qty]);
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::ok(["suitable_warehouses" => $data], "Gợi ý kho nhập thành công");
    }

    /**
     * GET /api/warehouses/suggest-export
     * Đề xuất kho còn đủ tồn kho
     */
    public static function suggestExport() {
        Auth::required();
        $db = getDB();
        $productId = (int)($_GET['product_id'] ?? 0);
        $qty = (int)($_GET['quantity'] ?? 0);

        // Logic: Lấy các kho đang active và có số lượng tồn của sản phẩm >= số lượng cần xuất
        $sql = "SELECT k.id AS kho_id, k.ten_kho, ktk.so_luong_ton AS available_stock 
                FROM kho_hang k 
                JOIN kho_ton_kho ktk ON k.id = ktk.kho_id 
                WHERE k.trang_thai = 'active' AND ktk.product_id = ? AND ktk.so_luong_ton >= ?
                ORDER BY available_stock DESC";
        
        $stmt = $db->prepare($sql);
        $stmt->execute([$productId, $qty]);
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        Response::ok(["suitable_warehouses" => $data], "Gợi ý kho xuất thành công");
    }

    /**
     * GET /api/warehouses?page=1&per_page=10&search=keyword&status=active
     * Danh sách kho, tìm theo tên/địa chỉ, lọc theo trạng thái, có phân trang
     */
    public static function index() {
        Auth::required();
        $page = max(1, (int)($_GET["page"] ?? 1));
        $limit = max(1, min(100, (int)($_GET["per_page"] ?? 10)));
        $q = trim($_GET["search"] ?? "");
        $status = trim($_GET["status"] ?? "");

        $where = ["1=1"];
        $params = [];
        if ($q !== "") {
            $where[] = "(ten_kho LIKE ? OR dia_chi LIKE ?)";
            $like = "%{$q}%";
            $params[] = $like;
            $params[] = $like;
        }
        if ($status !== "") {
            $where[] = "trang_thai = ?";
            $params[] = $status;
        }

        $sql = "SELECT k.*,
                       COALESCE((SELECT SUM(so_luong_ton) FROM kho_ton_kho WHERE kho_id = k.id), 0) AS tong_ton_kho
                FROM " . self::TABLE . " k
                WHERE " . implode(" AND ", $where) . "
                ORDER BY k.id DESC";

        $result = Pagination::run($sql, $params, $page, $limit);
        Response::paged($result["data"], $result["meta"]);
    }

    /** GET /api/warehouses/:id */
    public static function show(int $id) {
        Auth::required();
        $db = getDB();
        $stmt = $db->prepare("SELECT * FROM " . self::TABLE . " WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) Response::err("Không tìm thấy kho hàng.", 404);
        Response::ok($row);
    }

    /** POST /api/warehouses — Thêm kho mới */
    public static function store(array $body) {
        Auth::role("admin");
        $tenKho = trim($body["ten_kho"] ?? "");
        $diaChi = trim($body["dia_chi"] ?? "");
        $sucChua = isset($body["suc_chua"]) ? (int)$body["suc_chua"] : 0;
        $trangThai = in_array($body["trang_thai"] ?? "", ["active", "inactive"]) ? $body["trang_thai"] : "active";

        if ($tenKho === "") {
            Response::err("Vui lòng nhập tên kho.", 400);
        }
        if ($sucChua < 0) {
            Response::err("Sức chứa không hợp lệ.", 400);
        }

        $db = getDB();
        $stmt = $db->prepare(
            "INSERT INTO " . self::TABLE . " (ten_kho, dia_chi, suc_chua, trang_thai, created_at)
             VALUES (?, ?, ?, ?, NOW())"
        );
        $stmt->execute([$tenKho, $diaChi, $sucChua, $trangThai]);
        $id = (int)$db->lastInsertId();

        Response::ok(["id" => $id, "ten_kho" => $tenKho], "Thêm kho hàng thành công!", 201);
    }

    /** PUT /api/warehouses/:id — Cập nhật */
    public static function update(int $id, array $body) {
        Auth::role("admin");
        $db = getDB();
        $stmt = $db->prepare("SELECT * FROM " . self::TABLE . " WHERE id = ?");
        $stmt->execute([$id]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$existing) Response::err("Không tìm thấy kho hàng.", 404);

        $tenKho = trim($body["ten_kho"] ?? $existing["ten_kho"]);
        $diaChi = trim($body["dia_chi"] ?? $existing["dia_chi"]);
        $sucChua = isset($body["suc_chua"]) ? (int)$body["suc_chua"] : $existing["suc_chua"];
        $trangThai = in_array($body["trang_thai"] ?? "", ["active", "inactive"]) ? $body["trang_thai"] : $existing["trang_thai"];

        if ($tenKho === "") {
            Response::err("Tên kho không được để trống.", 400);
        }
        if ($sucChua < 0) {
            Response::err("Sức chứa không hợp lệ.", 400);
        }

        $updateStmt = $db->prepare(
            "UPDATE " . self::TABLE . " SET ten_kho=?, dia_chi=?, suc_chua=?, trang_thai=?, updated_at=NOW() WHERE id=?"
        );
        $updateStmt->execute([$tenKho, $diaChi, $sucChua, $trangThai, $id]);

        Response::ok(["id" => $id, "ten_kho" => $tenKho], "Cập nhật kho hàng thành công!");
    }

    /** DELETE /api/warehouses/:id */
    public static function destroy(int $id) {
        Auth::role("admin");
        $db = getDB();
        $stmt = $db->prepare("SELECT * FROM " . self::TABLE . " WHERE id = ?");
        $stmt->execute([$id]);
        if (!$stmt->fetch()) Response::err("Không tìm thấy kho hàng.", 404);

        // Chặn xoá nếu kho vẫn còn hàng tồn — kho_ton_kho có ON DELETE CASCADE nên
        // xoá thẳng sẽ âm thầm mất dữ liệu tồn kho nếu không kiểm tra trước.
        $stockStmt = $db->prepare("SELECT COALESCE(SUM(so_luong_ton), 0) FROM kho_ton_kho WHERE kho_id = ?");
        $stockStmt->execute([$id]);
        if ((int)$stockStmt->fetchColumn() > 0) {
            Response::err("Không thể xoá: kho vẫn còn hàng tồn. Hãy chuyển/xuất hết hàng hoặc đổi trạng thái thành 'inactive'.", 409);
        }

        try {
            $db->prepare("DELETE FROM " . self::TABLE . " WHERE id = ?")->execute([$id]);
            Response::ok(null, "Xoá kho hàng thành công!");
        } catch (PDOException $e) {
            // Kho đã từng phát sinh phiếu nhập/xuất (FK RESTRICT trên phieu_nhap/phieu_xuat)
            if ($e->getCode() == 23000) {
                Response::err("Không thể xoá vì kho đã phát sinh phiếu nhập/xuất. Hãy đổi trạng thái thành 'inactive'.", 409);
            }
            Response::err("Lỗi máy chủ: " . $e->getMessage(), 500);
        }
    }
}