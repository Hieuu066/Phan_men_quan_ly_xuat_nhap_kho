<?php
class AuthController {
    public static function register(array $body): void {
        // 1. Lấy và làm sạch dữ liệu
        $name = trim($body["name"] ?? "");
        $email = strtolower(trim($body["email"] ?? ""));
        $password = $body["password"] ?? "";
        $role = in_array($body["role"] ?? "", ["admin","teacher","student","user"])
        ? $body["role"] : "user";

        // 2. Validate
        $errors = [];
        if (mb_strlen($name) < 2) $errors[] = "Ho ten phai co it nhat 2 ky tu.";
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = "Email khong hop le.";
        if (strlen($password) < 8) $errors[] = "Mat khau phai co it nhat 8 ky tu.";
        if (!preg_match("/[A-Z]/", $password)) $errors[] = "Mat khau phai co chu hoa.";
        if (!preg_match("/[0-9]/", $password)) $errors[] = "Mat khau phai co chu so.";
        if ($errors) Response::err(implode(" ", $errors));

        $db = getDB();
        // 3. Kiểm tra email trùng
        $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) Response::err("Email nay da duoc su dung.", 409);
        // 4. Mã hóa mật khẩu bcrypt (cost=12 — đủ mạnh, không quá chậm)
        $hash = password_hash($password, PASSWORD_BCRYPT, ["cost" => 12]);
        // 5. Lưu vào CSDL
        $stmt = $db->prepare(
            "INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)"
        );
        $stmt->execute([$name, $email, $hash, $role]);
        $id = (int)$db->lastInsertId();
        Response::ok(["id"=>$id,"name"=>$name,"email"=>$email,"role"=>$role], "Dang ky thanh cong!");
    }

    public static function login(array $body): void {
        $email = strtolower(trim($body["email"] ?? ""));
        $password = $body["password"] ?? "";
        if (!$email || !$password) Response::err("Vui long nhap email va mat khau.");
        $db = getDB();
        $stmt = $db->prepare("SELECT * FROM users WHERE email = ? AND
        is_active = 1");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        // Dùng password_verify — tự động xử lý timing attack
        if (!$user || !password_verify($password, $user["password"])) {
            Response::err("Email hoac mat khau khong dung.", 401);
        }
        // Nếu hash cũ (cost thấp) → tự động nâng cấp hash
        if (password_needs_rehash($user["password"], PASSWORD_BCRYPT, ["cost"=>12])) {
            $newHash = password_hash($password, PASSWORD_BCRYPT, ["cost"=>12]);
            $db->prepare("UPDATE users SET password=? WHERE id=?")->execute([$newHash,$user["id"]]);
        }
        // Tái tạo session ID — ngăn Session Fixation Attack
        session_regenerate_id(true);
        // Lưu vào session
        $_SESSION["user_id"] = $user["id"];
        $_SESSION["user_name"] = $user["name"];
        $_SESSION["user_email"] = $user["email"];
        $_SESSION["user_role"] = $user["role"];
        // Cập nhật thời điểm đăng nhập cuối
        $db->prepare("UPDATE users SET last_login=NOW() WHERE id=?")->execute([$user["id"]]);
        Response::ok([
            "id"=>$user["id"], "name"=>$user["name"],
            "email"=>$user["email"], "role"=>$user["role"],
            "avatar"=>$user["avatar"],
        ], "Dang nhap thanh cong!");
    }
    public static function logout(): void {
        session_unset(); session_destroy();
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