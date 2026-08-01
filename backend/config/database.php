<?php
function getDB(): PDO {
    // Kết nối CSDL local
    $host    = 'localhost';
    $port    = 3306;
    $db      = 'quanly_xuat_nhap_kho';
    $user    = 'root';
    $pass    = '';
    $charset = 'utf8mb4';

    $localOverride = __DIR__ . '/database.local.php';
    if (file_exists($localOverride)) {
        require $localOverride;
    }

    static $pdo = null;
    if ($pdo !== null) return $pdo;
    try {
        $dsn = "mysql:host=$host;port=$port;dbname=$db;charset=$charset";
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, // Trả về mảng kết hợp
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        $pdo = new PDO($dsn, $user, $pass, $options);
    } catch (\PDOException $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Lỗi kết nối CSDL",
            "data" => null
            ]);
        exit;
    }
    return $pdo;
}