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
        $q = trim($_GET["search"] ?? ""); // Từ khóa tìm kiếm
        $status = trim($_GET["status"] ?? ""); // Lọc theo trạng thái
        $sort = in_array($_GET["sort"] ?? "", [
            "id","name","created_at","updated_at"
        ]) ? $_GET["sort"] : "created_at";
        $order = strtoupper($_GET["order"] ?? "") === "ASC" ? "ASC" : "DESC";
        $where = ["1=1"];
        $params = [];
        // Tìm kiếm full-text trên tên và mô tả
        if ($q !== "") {
            $where[] = "(name LIKE ? OR description LIKE ?)";
            $like = "%{$q}%";
            $params[] = $like; $params[] = $like;
        }
        // Lọc theo trạng thái
        if ($status !== "") {
            $where[] = "status = ?";
            $params[] = $status;
        }
        $sql = "SELECT i.*, u.name AS creator_name
                FROM " . self::TABLE . " i
                LEFT JOIN users u ON u.id = i.user_id
                WHERE " . implode(" AND ", $where) .
                " ORDER BY i.{$sort} {$order}";
        require_once __DIR__ . "/../utils/Pagination.php";
        $result = Pagination::run($sql, $params, $page, $limit);
        Response::paged($result["data"], $result["meta"]);
    }
    /** GET /api/items/:id */
    public static function show(int $id): void {
        Auth::required();
        $db = getDB();
        $stmt = $db->prepare(
            "SELECT i.*, u.name AS creator_name
            FROM " . self::TABLE . " i
            LEFT JOIN users u ON u.id = i.user_id
            WHERE i.id = ?"
        );
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) Response::err("Khong tim thay ban ghi.", 404);
        // Thêm URL đầy đủ cho ảnh nếu có
        if (!empty($row["image"])) {
            require_once __DIR__ . "/../utils/FileUpload.php";
            $row["image_url"] = FileUpload::url($row["image"]);
        }
        Response::ok($row);
    }
    /** POST /api/items — Thêm mới (hỗ trợ cả JSON và multipart/formdata) */
    public static function store(array $body): void {
        Auth::required();
        $name = trim($body["name"] ?? "");
        $description = trim($body["description"] ?? "");
        $status = in_array($body["status"]??"",["active","inactive"]) ? $body["status"] : "active";
        if (mb_strlen($name) < 2) Response::err("Ten phai co it nhat 2 ky tu.");
        $db = getDB();
        // Xử lý upload ảnh nếu có
        $imagePath = null;
        if (!empty($_FILES["image"]["name"])) {
            require_once __DIR__ . "/../utils/FileUpload.php";
            try {
            $imagePath = FileUpload::image($_FILES["image"], "items");
            } catch (RuntimeException $e) {
                Response::err($e->getMessage());
            }
        }
        $stmt = $db->prepare(
            "INSERT INTO " . self::TABLE . "
            (name,description,image,status,user_id,created_at)
            VALUES (?,?,?,?,?,NOW())"
        );
        $stmt->execute([$name,$description,$imagePath,$status,$_SESSION["user_id"]]);
        $id = (int)$db->lastInsertId();
        Response::ok(["id"=>$id,"name"=>$name,"status"=>$status], "Them moi thanh cong!");
    }
    /** PUT /api/items/:id — Cập nhật */
    public static function update(int $id, array $body): void {
        Auth::required();
        $db = getDB();
        // Kiểm tra tồn tại
        $stmt = $db->prepare("SELECT * FROM " . self::TABLE . " WHERE id=?");
        $stmt->execute([$id]);
        $existing = $stmt->fetch();
        if (!$existing) Response::err("Khong tim thay ban ghi.", 404);
        // Kiểm tra quyền (chủ sở hữu hoặc admin)
        Auth::owns((int)$existing["user_id"]);
        $name = trim($body["name"] ?? $existing["name"]);
        $description = trim($body["description"] ?? $existing["description"]);
        $status = in_array($body["status"]??"",["active","inactive"]) ? $body["status"] : $existing["status"];
        if (mb_strlen($name) < 2) Response::err("Ten phai co it nhat 2 ky tu.");
        // Xử lý ảnh mới nếu có
        $imagePath = $existing["image"];
        if (!empty($_FILES["image"]["name"])) {
            require_once __DIR__ . "/../utils/FileUpload.php";
            try {
                $imagePath = FileUpload::image($_FILES["image"], "items");
                // Xóa ảnh cũ
                if ($existing["image"])
                    FileUpload::delete($existing["image"]);
            } catch (RuntimeException $e) {
                Response::err($e->getMessage());
            }
        }
        $db->prepare(
            "UPDATE " . self::TABLE . " SET
            name=?,description=?,image=?,status=?,updated_at=NOW()
            WHERE id=?"
        )->execute([$name,$description,$imagePath,$status,$id]);
        Response::ok(["id"=>$id], "Cap nhat thanh cong!");
    }
    /** DELETE /api/items/:id — Xóa */
    public static function destroy(int $id): void {
        Auth::required();
        $db = getDB();
        $stmt = $db->prepare("SELECT * FROM " . self::TABLE . " WHERE id=?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) Response::err("Khong tim thay ban ghi.", 404);

        Auth::owns((int)$row["user_id"]);
        // Xóa file ảnh nếu có
        if (!empty($row["image"])) {
            require_once __DIR__ . "/../utils/FileUpload.php";
            FileUpload::delete($row["image"]);
        }
        $db->prepare("DELETE FROM " . self::TABLE . " WHERE id=?")->execute([$id]);
        Response::ok(null, "Xoa thanh cong!");
    }
    /** GET /api/items/export?format=csv — Xuất CSV */
    public static function export(): void {
        Auth::role("admin", "teacher");
        $db = getDB();
        $stmt = $db->query(
            "SELECT i.id,i.name,i.description,i.status,
            u.name AS creator, i.created_at
            FROM " . self::TABLE . " i
            LEFT JOIN users u ON u.id=i.user_id
            ORDER BY i.id"
        );
        $rows = $stmt->fetchAll();
        // Xuất file CSV
        header("Content-Type: text/csv; charset=UTF-8");
        header("Content-Disposition: attachment; filename=export_" .
        date("Ymd_His") . ".csv");
        header("Cache-Control: no-cache");
        $out = fopen("php://output", "w");
        fputs($out, "\xEF\xBB\xBF"); // BOM UTF-8 để Excel mở đúng tiếng Việt
        fputcsv($out, ["ID","Ten","Mo ta","Trang thai","Nguoi tao","Ngay tao"]);
        foreach ($rows as $r) {
            fputcsv($out,
            [$r["id"],$r["name"],$r["description"],$r["status"],$r["creator"],$r["cr
            eated_at"]]);
        }
        fclose($out);
        exit;
    }
}