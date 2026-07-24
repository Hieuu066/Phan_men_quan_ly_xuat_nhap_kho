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
}