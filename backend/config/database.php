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
*/
// define("DB_HOST", getenv("DB_HOST") ?: "localhost");
// define("DB_NAME", getenv("DB_NAME") ?: "lms_db");
// define("DB_USER", getenv("DB_USER") ?: "root");
// define("DB_PASS", getenv("DB_PASS") ?: "");
// define("DB_CHARSET", "utf8mb4");

// function getDB(): PDO {
//     static $pdo = null;
//     if ($pdo !== null) return $pdo;
//     $dsn = sprintf(
//         "mysql:host=%s;dbname=%s;charset=%s;port=3306",
//         DB_HOST, DB_NAME, DB_CHARSET
//     );

//     try {
//         $pdo = new PDO($dsn, DB_USER, DB_PASS, [
//         PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
//         PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
//         PDO::ATTR_EMULATE_PREPARES => false,
//         PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
//         ]);
//     } catch (PDOException $e) {
//         http_response_code(500);
//         die(json_encode(["success"=>false, "message"=>"Loi ket noi CSDL"],
//         JSON_UNESCAPED_UNICODE));
//     }
//     return $pdo;
// }
function getDB(): PDO {

    $host = 'localhost';
    $port = 3307; //Máy tôi dùng port 3307, bạn có thể thay đổi mặc định: 3306
    $db   = 'quanly_xuat_nhap_kho';
    $user = 'root'; // Thay bằng user DB của bạn
    $pass = '';     // Thay bằng mật khẩu DB của bạn
    $charset = 'utf8mb4';

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
?>