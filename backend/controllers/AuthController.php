<?php
// backend/controllers/AuthController.php
class AuthController {
    // Xuất nhập kho nội bộ sẽ không cho phép tự ý đăng kí tài khoản
    // public static function register(array $body): void { }

    public static function login(array $body): void {
        // echo password_hash("Test1234", PASSWORD_BCRYPT, ["cost" => 12]);
        $username = strtolower(trim($body["username"] ?? ""));
        $password = $body["password"] ?? "";
        if (!$username || !$password) Response::err("Vui long nhap ten dang nhap va mat khau.");
        $db = getDB();
        $stmt = $db->prepare("SELECT * FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch();
        // Dùng password_verify — tự động xử lý timing attack
        if (!$user || !password_verify($password, $user["password"])) {
            Response::err("Ten dang nhap hoac mat khau khong dung.", 401);
        }
        // Nếu hash cũ (cost thấp) → tự động nâng cấp hash
        if (password_needs_rehash($user["password"], PASSWORD_BCRYPT, ["cost"=>12])) {
            $newHash = password_hash($password, PASSWORD_BCRYPT, ["cost"=>12]);
            $db->prepare("UPDATE users SET password=? WHERE id=?")->execute([$newHash,$user["id"]]);
        }
        // Kiểm tra trạng thái tài khoản(status)
        if ($user["status"] === 'inactive') {
            Response::err("Tài khoản của bạn đã bị vô hiệu hóa, liên hệ quản trị viên.", 403);
        }
        // Tái tạo session ID — ngăn Session Fixation Attack
        session_regenerate_id(true);
        // Lưu vào session
        $_SESSION["user_id"] = $user["id"];
        $_SESSION["user_name"] = $user["username"];
        $_SESSION["user_role"] = $user["role"];
        // Cập nhật thời điểm đăng nhập cuối
        // $db->prepare("UPDATE users SET last_login=NOW() WHERE id=?")->execute([$user["id"]]);
        Response::ok([
            "id" => $user["id"],
            "username" => $user["username"],
            "full_name" => $user["full_name"],
            "role" => $user["role"]
        ], "Dang nhap thanh cong!");
    }
    public static function logout(): void {
        session_unset(); 
        session_destroy();
        Response::ok(null, "Da dang xuat.");
    }
    public static function me(): void {
        Auth::required();
        $db = getDB();
        $stmt = $db->prepare(
            "SELECT id,name,email,role,avatar,phone,created_at FROM users WHERE id=?"
        );
        $stmt->execute([$_SESSION["user_id"]]);
        $user = $stmt->fetch();
        if (!$user) Response::err("Khong tim thay nguoi dung.", 404);
        Response::ok($user);
    }
    public static function updateProfile(array $body): void {
        Auth::required();
        $name = trim($body["name"] ?? "");
        $phone = trim($body["phone"] ?? "");
        if (mb_strlen($name) < 2) Response::err("Ho ten phai co it nhat 2 ky tu.");
        $db = getDB();
        // Xử lý upload avatar nếu có
        $avatarPath = null;
        if (!empty($_FILES["avatar"]["name"])) {
            try {
            require_once __DIR__ . "/../utils/FileUpload.php";
            $avatarPath = FileUpload::image($_FILES["avatar"], "avatars");
            } catch (RuntimeException $e) {
                Response::err($e->getMessage());
            }
        }
        $sql = "UPDATE users SET name=?, phone=?" . ($avatarPath ? ", avatar=?" : "") . " WHERE id=?";
        $prm = $avatarPath ? [$name,$phone,$avatarPath,$_SESSION["user_id"]] : [$name,$phone,$_SESSION["user_id"]];
        $db->prepare($sql)->execute($prm);
        $_SESSION["user_name"] = $name;
        Response::ok(null, "Cap nhat ho so thanh cong!");
    }
}