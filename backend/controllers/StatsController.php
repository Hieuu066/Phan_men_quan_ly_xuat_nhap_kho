<?php
class StatsController {
    /** GET /api/stats/summary — Tổng quan cho Dashboard */
    public static function summary(): void {
        Auth::required();
        $db = getDB();
        $res = [];
        // Tổng số người dùng theo vai trò
        $stmt = $db->query("SELECT role, COUNT(*) AS cnt FROM users GROUP BY role");
        foreach ($stmt->fetchAll() as $row)
        $res["users_by_role"][$row["role"]] = (int)$row["cnt"];
        $res["users_total"] = array_sum($res["users_by_role"] ?? [0]);
        // Tổng số thực thể chính
        $res["items_total"] = (int)$db->query("SELECT COUNT(*) FROM
        items")->fetchColumn();
        $res["items_active"] = (int)$db->query("SELECT COUNT(*) FROM
        items WHERE status='active'")->fetchColumn();
        // Tăng trưởng 6 tháng gần nhất (dữ liệu cho biểu đồ)
        $stmt = $db->query(
            "SELECT DATE_FORMAT(created_at,'%Y-%m') AS month, COUNT(*) AS cnt
            FROM items
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY month ORDER BY month"
        );
        $res["monthly_items"] = $stmt->fetchAll();
        // 5 bản ghi mới nhất
        $stmt = $db->query("SELECT id,name,status,created_at FROM items ORDER BY id DESC LIMIT 5");
        $res["recent_items"] = $stmt->fetchAll();
        Response::ok($res);
    }
}