<?php
class Pagination {
    /**
    * Thực thi câu truy vấn có phân trang.
    * @param string $baseSQL Câu SELECT không có LIMIT/OFFSET
    * @param array $params Tham số bind cho Prepared Statement
    * @param int $page Trang hiện tại (bắt đầu từ 1)
    * @param int $limit Số bản ghi mỗi trang (mặc định 10)
    * @return array ["data"=>[], "meta"=>{}]
    */
    public static function run(
        string $baseSQL,
        array $params = [],
        int $page = 1,
        int $limit = 10
    ): array {
        $db = getDB();
        // 1. Đếm tổng số bản ghi
        $countSQL = "SELECT COUNT(*) FROM ({$baseSQL}) AS _cnt";
        $stmt = $db->prepare($countSQL);
        $stmt->execute($params);
        $total = (int)$stmt->fetchColumn();
        // 2. Tính toán phân trang
        $limit = max(1, min(100, $limit)); // Giới hạn 1–100
        $totalPages = $total > 0 ? (int)ceil($total / $limit) : 1;
        $page = max(1, min($page, $totalPages));
        $offset = ($page - 1) * $limit;
        
        // 3. Lấy dữ liệu trang hiện tại
        // QUAN TRỌNG: PDO không cho phép trộn lẫn placeholder kiểu positional (?)
        // và named (:x) trong CÙNG 1 câu lệnh. Các Controller hiện dùng ? cho điều
        // kiện WHERE, nên LIMIT/OFFSET ở đây cũng phải theo đúng kiểu đó — nếu không
        // sẽ lỗi "SQLSTATE[HY093]: mixed named and positional parameters" ngay khi
        // có filter/search (params không rỗng). Khi $params rỗng hoặc là named,
        // vẫn dùng :lmt/:ofs như cũ để tương thích ngược.
        $isPositional = $params !== [] && array_is_list($params);
        if ($isPositional) {
            $stmt = $db->prepare("{$baseSQL} LIMIT ? OFFSET ?");
            $i = 1;
            foreach ($params as $v) {
                $stmt->bindValue($i++, $v);
            }
            $stmt->bindValue($i++, $limit, PDO::PARAM_INT);
            $stmt->bindValue($i++, $offset, PDO::PARAM_INT);
        } else {
            $stmt = $db->prepare("{$baseSQL} LIMIT :lmt OFFSET :ofs");
            foreach ($params as $k => $v) {
                $stmt->bindValue($k, $v);
            }
            $stmt->bindValue(":lmt", $limit, PDO::PARAM_INT);
            $stmt->bindValue(":ofs", $offset, PDO::PARAM_INT);
        }
        $stmt->execute();
        $data = $stmt->fetchAll();

        return [
                "data" => $data,
                "meta" => [
                "total" => $total,
                "per_page" => $limit,
                "current_page" => $page,
                "total_pages" => $totalPages,
                "from" => $total > 0 ? $offset + 1 : 0,
                "to" => min($offset + $limit, $total),
                "has_prev" => $page > 1,
                "has_next" => $page < $totalPages,
            ],
        ];
    }
}