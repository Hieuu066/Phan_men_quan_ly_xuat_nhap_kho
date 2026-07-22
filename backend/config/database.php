<?php
// backend/config/database.php
/**
* Kết nối MySQL thông qua PDO
* Sử dụng Singleton pattern: chỉ tạo 1 connection duy nhất mỗi request
*
* TRIỂN KHAI TRÊN INFINITYFREE:
* - DB_HOST : hostname từ hPanel → MySQL Databases (vd: sql304.epizy.com)
* - DB_NAME : epiz_xxxxxxxx_tên_db
* - DB_USER : epiz_xxxxxxxx
*
* CẤU HÌNH RIÊNG CHO MÁY BẠN:
* Nếu MySQL trên máy bạn KHÔNG chạy đúng các giá trị mặc định bên dưới
* (ví dụ cổng khác 3306), ĐỪNG sửa trực tiếp các dòng bên dưới — tạo file
* backend/config/database.local.php (đã có trong .gitignore, không bị
* commit lên Git, không ảnh hưởng người khác) với nội dung ví dụ:
*
*   <?php
*   $port = 3307;
*
* File đó sẽ tự động được nạp và ghi đè giá trị mặc định bên dưới.
*/
function getDB(): PDO {
    $host    = 'localhost';
    $port    = 3306; // Mặc định chuẩn XAMPP — đổi riêng qua database.local.php nếu máy bạn khác
    $db      = 'quanly_xuat_nhap_kho';
    $user    = 'root';
    $pass    = '';
    $charset = 'utf8mb4';

    // Cho phép mỗi máy tự ghi đè cấu hình riêng qua file KHÔNG commit lên Git
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
