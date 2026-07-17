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
            "SELECT id,username,full_name,role,created_at FROM users WHERE id=?"
        );
        $stmt->execute([$_SESSION["user_id"]]);
        $user = $stmt->fetch();
        if (!$user) Response::err("Khong tim thay nguoi dung.", 404);
        Response::ok($user);
    }
    public static function updateProfile(array $body): void {
        Auth::required();
        $fullName = trim($body["full_name"] ?? "");
        $password = $body["password"] ?? "";

        if (mb_strlen($fullName) < 2) {
            Response::err("Ho ten phai co it nhat 2 ky tu.", 400);
        }

        $db = getDB();
        $fields = ["full_name = ?"];
        $params = [$fullName];

        // Chỉ đổi mật khẩu nếu người dùng thực sự nhập mật khẩu mới
        if ($password !== "") {
            if (strlen($password) < 8) {
                Response::err("Mat khau moi phai co it nhat 8 ky tu.", 400);
            }
            $fields[] = "password = ?";
            $params[] = password_hash($password, PASSWORD_BCRYPT, ["cost" => 12]);
        }

        $params[] = $_SESSION["user_id"];
        $sql = "UPDATE users SET " . implode(", ", $fields) . " WHERE id = ?";
        $db->prepare($sql)->execute($params);

        $_SESSION["user_name"] = $fullName;
        Response::ok(null, "Cap nhat ho so thanh cong!");
    }
}