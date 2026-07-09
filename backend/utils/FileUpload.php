<?php
class FileUpload {
    private static string $uploadDir = __DIR__ . "/../uploads/";
    private static int $maxSize = 5 * 1024 * 1024; // 5MB
    private static array $imgTypes =["image/jpeg","image/png","image/gif","image/webp"];
    private static array $docTypes =["application/pdf","application/msword"];
    
    /**
    * Xử lý upload 1 file ảnh.
    * @param array $file $_FILES["field_name"]
    * @param string $subDir Thư mục con trong uploads/ (vd: "avatars",
    "products")
    * @return string Tên file đã lưu (chỉ lưu tên, không lưu toàn bộ
    path)
    */

    public static function image(array $file, string $subDir ="images"): string {
        return self::handle($file, $subDir, self::$imgTypes);
    }
    public static function document(array $file, string $subDir ="docs"): string {
        return self::handle($file, $subDir, self::$docTypes);
    }
    private static function handle(array $file, string $subDir, array
    $allowed): string {
        // 1. Kiểm tra lỗi upload
        if ($file["error"] !== UPLOAD_ERR_OK) {
            $messages = [
                UPLOAD_ERR_INI_SIZE => "File vuot qua gioi han
                php.ini.",
                UPLOAD_ERR_FORM_SIZE => "File vuot qua gioi han form.",
                UPLOAD_ERR_PARTIAL => "File chi upload mot phan.",
                UPLOAD_ERR_NO_FILE => "Khong co file nao duoc chon.",
            ];
            throw new RuntimeException($messages[$file["error"]] ?? "Loi upload khong xac dinh.");
        }
        // 2. Kiểm tra kích thước
        if ($file["size"] > self::$maxSize) {
            throw new RuntimeException("File qua lon. Toi da " . (self::$maxSize / 1024 / 1024) . "MB.");
        }
        // 3. Kiểm tra loại file (dùng finfo, không tin $_FILES["type"])
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($file["tmp_name"]);
        if (!in_array($mimeType, $allowed)) {
            throw new RuntimeException("Loai file khong duoc phep:{$mimeType}.");
        }
        // 4. Tạo tên file an toàn và duy nhất
        $ext = match($mimeType) {
            "image/jpeg" => "jpg", "image/png" => "png",
            "image/gif" => "gif", "image/webp" => "webp",
            "application/pdf" => "pdf",
            default => pathinfo($file["name"], PATHINFO_EXTENSION),
        };
        $filename = sprintf("%s_%s.%s", uniqid(), bin2hex(random_bytes(4)), $ext);
        // 5. Tạo thư mục đích nếu chưa có
        $destDir = self::$uploadDir . trim($subDir, "/") . "/";
        if (!is_dir($destDir)) mkdir($destDir, 0755, true);
        // 6. Lưu file
        if (!move_uploaded_file($file["tmp_name"], $destDir . $filename)) {
            throw new RuntimeException("Khong the luu file len may chu.");
        }
        return $subDir . "/" . $filename; // Trả về path tương đối
    }
    public static function delete(string $relativePath): bool {
        $full = self::$uploadDir . ltrim($relativePath, "/");
        return file_exists($full) && unlink($full);
    }
    public static function url(string $relativePath): string {
        $base = rtrim($_ENV["APP_URL"] ?? ("http://" .$_SERVER["HTTP_HOST"]), "/");
        return $base . "/backend/uploads/" . ltrim($relativePath, "/");
    }
}