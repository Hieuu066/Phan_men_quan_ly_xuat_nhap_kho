<?php
// ── 1. CORS Headers ────────────────────────────────────────────
$allowed = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://ten-ban.infinityfreeapp.com", // ← Cập nhật URL thực tế
];
$origin = $_SERVER["HTTP_ORIGIN"] ?? "";
if (in_array($origin, $allowed, true)) {
    header("Access-Control-Allow-Origin: {$origin}");
    header("Access-Control-Allow-Credentials: true");
} else {
    header("Access-Control-Allow-Origin: *");
}
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-Requested-With, XCSRF-Token");
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: DENY");

// ── 2. Preflight OPTIONS request ────────────────────────────────
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(200); exit; }

// ── 3. Nạp dependencies ─────────────────────────────────────────
require_once __DIR__ . "/config/database.php";
require_once __DIR__ . "/utils/Response.php";
require_once __DIR__ . "/middleware/Auth.php";

// ── 4. Cấu hình Session bảo mật ─────────────────────────────────
session_set_cookie_params([
    "lifetime" => 86400, // Tồn tại 24 giờ
    "path" => "/",
    "secure" => isset($_SERVER["HTTPS"]), // true trên HTTPS
    "httponly" => true, // Không thể đọc từ JavaScript
    "samesite" => "Lax", // Bảo vệ CSRF cơ bản
]);
session_start();

// ── 5. Phân tích URI và Method ──────────────────────────────────
$uri = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);
$method = $_SERVER["REQUEST_METHOD"];
// Chuẩn hóa URI: xóa prefix dự án
// Nếu dự án ở /ten-du-an/backend → xóa phần đó, chỉ giữ /api/...
$uri = preg_replace("#^(?:/.+)?/backend(?=/api|$)#", "", $uri) ?: "/";
// Tách path: /api/items/5 → ["api","items","5"]
$parts = array_values(array_filter(explode("/", $uri)));
$segment = $parts[1] ?? ""; // "auth", "items", "stats"
$sub = $parts[2] ?? ""; // "login", "register", "export", hoặc ID
$id = ctype_digit($sub) ? (int)$sub : null;
$action = $id === null ? $sub : ($parts[3] ?? "");

// ── 6. Đọc body JSON hoặc multipart ────────────────────────────
$contentType = $_SERVER["CONTENT_TYPE"] ?? "";
if (str_starts_with($contentType, "application/json")) {
    $body = json_decode(file_get_contents("php://input"), true) ?? [];
} else {
    $body = $_POST; // Dùng cho multipart/form-data (upload file)
}

// ── 7. Routing Table ────────────────────────────────────────────
switch ($segment) {
    case "auth":
        require_once __DIR__ . "/controllers/AuthController.php";
        match ("$method:$action") {
            "POST:register" => AuthController::register($body),
            "POST:login" => AuthController::login($body),
            "POST:logout" => AuthController::logout(),
            "GET:me" => AuthController::me(),
            "PUT:profile" => AuthController::updateProfile($body),
            default => Response::err("Endpoint khong ton tai.", 404),
        };
        break;
    case "items":
        require_once __DIR__ . "/controllers/ItemController.php";
        if ($action === "export") { ItemController::export(); break; }
        if ($id !== null) {
            match ($method) {
                "GET" => ItemController::show($id),
                "PUT",
                "POST" => ItemController::update($id, $body), // POST cho multipart
                "DELETE" => ItemController::destroy($id),
                default => Response::err("Method khong hop le.", 405),
            };
        } else {
            match ($method) {
                "GET" => ItemController::index(),
                "POST" => ItemController::store($body),
                default => Response::err("Method khong hop le.", 405),
            };
        }
        break;
    case "stats":
        require_once __DIR__ . "/controllers/StatsController.php";
        match ("$method:$action") {
            "GET:summary" => StatsController::summary(),
            default => Response::err("Endpoint thong ke khong ton tai.", 404),
        };
        break;
    // ── THÊM RESOURCE MỚI Ở ĐÂY (copy pattern của "items") ──
    default:
        Response::err("API endpoint [{$method} /api/{$segment}] khong ton tai.", 404);
}