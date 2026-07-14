<?php
class Auth {
    /** Bắt buộc đăng nhập — trả về 401 nếu chưa có session */
    public static function required(): void {
    if (empty($_SESSION["user_id"])) {
        Response::err("Phien lam viec het han. Vui long dang nhap lai.", 401);
    }
    }

    /**
    * Kiểm tra vai trò — trả về 403 nếu không đủ quyền
    * Sử dụng: Auth::role("admin") hoặc Auth::role("admin","teacher")
    */

    public static function role(string ...$roles): void {
        self::required();
        if (!in_array($_SESSION["user_role"] ?? "", $roles, true)) {
            Response::err("Ban khong co quyen thuc hien thao tac nay.", 403);
        }
    }
    /** Trả về mảng thông tin người dùng hiện tại từ session */
    public static function current(): array {
        return [
            "id" => (int)($_SESSION["user_id"] ?? 0),
            "name" => $_SESSION["user_name"] ?? "",
            "role" => $_SESSION["user_role"] ?? "",
        ];
    }
    /** Kiểm tra người dùng hiện tại có sở hữu tài nguyên không */
    public static function owns(int $ownerId): void {
        self::required();
        $uid = (int)$_SESSION["user_id"];
        $role = $_SESSION["user_role"] ?? "";
        if ($uid !== $ownerId && $role !== "admin") {
            Response::err("Ban khong co quyen chinh sua tai nguyen nay.", 403);
        }
    }
}