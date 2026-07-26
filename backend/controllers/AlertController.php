<?php
class AlertController {
    /**
     * GET /api/alerts/low-stock
     * Lấy danh sách các sản phẩm có số lượng tồn kho chạm hoặc rơi xuống dưới ngưỡng cảnh báo tại các kho.
     * Phục vụ hiển thị Badge và danh sách nhắc nhở nhập hàng.
     */
    public static function lowStock() {
        // Yêu cầu người dùng phải đăng nhập hợp lệ
        Auth::required();
        $db = getDB();
        
        // Câu truy vấn: Tìm các bản ghi có is_low_stock = 1 từ VIEW v_ton_kho_chi_tiet
        // (VIEW đã gộp sẵn JOIN kho_hang + san_pham và tính sẵn cột is_low_stock)
        $sql = "SELECT kho_ton_kho_id AS kho_ton_kho_id, 
                       kho_id, ten_kho, 
                       product_id, product_name, sku, 
                       so_luong_ton, nguong_canh_bao 
                FROM v_ton_kho_chi_tiet
                WHERE is_low_stock = 1";
                
        $params = [];

        // Tính năng bổ sung: Hỗ trợ lọc cảnh báo theo kho cụ thể (nếu Front-end cần)
        if (!empty($_GET['kho_id'])) {
            $sql .= " AND kho_id = ?";
            $params[] = (int)$_GET['kho_id'];
        }

        // Ưu tiên hiển thị những mặt hàng có tồn kho thấp nhất (nguy cấp nhất) lên trên cùng
        $sql .= " ORDER BY so_luong_ton ASC";
                
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $alerts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Cấu trúc lại Data trả về, đếm sẵn số lượng để tiện cho việc hiển thị Badge
        $responseData = [
            'total_alerts' => count($alerts),
            'alerts'       => $alerts
        ];
        
        Response::ok($responseData, "Lấy dữ liệu cảnh báo tồn kho thành công");
    }
}