<?php
class AlertController {
    /**
     * GET /api/alerts/low-stock
     * Lấy danh sách các sản phẩm có số lượng tồn kho chạm hoặc rơi xuống dưới ngưỡng cảnh báo tại các kho.
     * Phục vụ hiển thị Badge và danh sách nhắc nhở nhập hàng.
     */
    public static function lowStock() {
        Auth::required();
        $db = getDB();
        
        //Tìm các bản ghi trong kho_ton_kho có so_luong_ton <= nguong_canh_bao
        $sql = "SELECT ktk.id AS kho_ton_kho_id, 
                       ktk.kho_id, k.ten_kho, 
                       ktk.product_id, sp.name AS product_name, sp.sku, 
                       ktk.so_luong_ton, ktk.nguong_canh_bao 
                FROM kho_ton_kho ktk
                JOIN kho_hang k ON ktk.kho_id = k.id
                JOIN san_pham sp ON ktk.product_id = sp.id
                WHERE ktk.so_luong_ton <= ktk.nguong_canh_bao";
                
        $params = [];

        //Hỗ trợ lọc cảnh báo theo kho cụ thể (nếu Front-end cần)
        if (!empty($_GET['kho_id'])) {
            $sql .= " AND ktk.kho_id = ?";
            $params[] = (int)$_GET['kho_id'];
        }

        //Ưu tiên hiển thị những mặt hàng có tồn kho thấp nhất (nguy cấp nhất) lên trên cùng
        $sql .= " ORDER BY ktk.so_luong_ton ASC";
                
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $alerts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $responseData = [
            'total_alerts' => count($alerts),
            'alerts'       => $alerts
        ];
        
        Response::ok($responseData, "Lấy dữ liệu cảnh báo tồn kho thành công");
    }
}