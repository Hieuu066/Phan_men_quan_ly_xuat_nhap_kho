<?php
require_once __DIR__ . "/../config/database.php";
require_once __DIR__ . "/../utils/Response.php";

class UserController {
    
    // Xử lý GET /api/users?page=1&per_page=10&search=&role=
    public static function index() {
        Auth::role("admin");
        $db = getDB();

        // 1. Lấy và chuẩn hóa các tham số từ URL
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $perPage = isset($_GET['per_page']) ? (int)$_GET['per_page'] : 10;
        $search = $_GET['search'] ?? '';
        $role = $_GET['role'] ?? '';

        $offset = ($page - 1) * $perPage;

        try {
            // 2. Xây dựng câu lệnh WHERE động dựa trên tham số search và role
            $whereClause = "1=1"; 
            $params = [];

            if ($search !== '') {
                $whereClause .= " AND (username LIKE :search OR full_name LIKE :search)";
                $params[':search'] = "%{$search}%";
            }

            if ($role !== '') {
                $whereClause .= " AND role = :role";
                $params[':role'] = $role;
            }

            // 3. Đếm tổng số bản ghi (để phục vụ phân trang)
            $countSql = "SELECT COUNT(*) FROM users WHERE {$whereClause}";
            $stmtCount = $db->prepare($countSql);
            $stmtCount->execute($params);
            $total = $stmtCount->fetchColumn();

            // 4. Truy vấn lấy dữ liệu thực tế
            $sql = "SELECT id, username, full_name, role, status, created_at 
                    FROM users 
                    WHERE {$whereClause} 
                    ORDER BY id DESC 
                    LIMIT :limit OFFSET :offset";
            
            $stmt = $db->prepare($sql);
            
            // Bind params cho phần WHERE
            foreach ($params as $key => $val) {
                $stmt->bindValue($key, $val);
            }
            // Bind params cho LIMIT và OFFSET (bắt buộc phải là kiểu INT)
            $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            
            $stmt->execute();
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // 5. Trả về đúng format paged
            $meta = [
                "total" => $total,
                "current_page" => $page,
                "per_page" => $perPage,
                "total_pages" => ceil($total / $perPage) // Tính tổng số trang
            ];
            Response::paged($users, $meta);

        } catch (PDOException $e) {
            Response::err("Không thể lấy danh sách người dùng. Vui lòng thử lại.", 500);
        }
    }

    // Xử lý GET /api/users/{id}
    public static function show($id) {
        Auth::role("admin");
        $db = getDB();
        try {
            $stmt = $db->prepare("SELECT id, username, full_name, role, status, created_at, updated_at FROM users WHERE id = :id");
            $stmt->execute([':id' => $id]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user) {
                Response::err("Không tìm thấy người dùng.", 404);
            }

            Response::ok($user, "Lay thong tin nguoi dung thanh cong.");
        } catch (PDOException $e) {
            Response::err("Không thể lấy thông tin người dùng. Vui lòng thử lại.", 500);
        }
    }

    // Xử lý POST /api/users
    public static function store($body) {
        Auth::role("admin"); // Chỉ admin mới được tạo user
        $db = getDB();
        // 2. Lấy dữ liệu từ Request Body
        $username = trim($body['username'] ?? '');
        $password = $body['password'] ?? '';
        $fullname = trim($body['full_name'] ?? '');
        $role     = trim($body['role'] ?? 'user'); // Mặc định là người dùng bình thường
        $status   = trim($body['status'] ?? 'active');

        // 3. Validate dữ liệu đầu vào (Bắt buộc theo README)
        if (empty($username) || empty($password) || empty($fullname)) {
            Response::err("Vui lòng điền đầy đủ username, password và fullname.", 400);
        }

        if (!in_array($role, ['admin', 'user'])) {
            Response::err("Vai trò không hợp lệ (chỉ nhận 'admin' hoặc 'user').", 400);
        }

        try {
            // 4. Kiểm tra xem username đã tồn tại chưa
            $stmtCheck = $db->prepare("SELECT id FROM users WHERE username = :username");
            $stmtCheck->execute([':username' => $username]);
            if ($stmtCheck->fetch()) {
                Response::err("Tên đăng nhập đã tồn tại trong hệ thống.", 409);
            }

            // 5. Mã hoá mật khẩu bằng Bcrypt
            $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

            // 6. Thực hiện truy vấn thêm mới
            $sql = "INSERT INTO users (username, password, full_name, role, status) 
                    VALUES (:username, :password, :full_name, :role, :status)";
            $stmt = $db->prepare($sql);
            $stmt->execute([
                ':username' => $username,
                ':password' => $hashedPassword,
                ':full_name' => $fullname,
                ':role'     => $role,
                ':status'   => $status
            ]);

            // Lấy ID của user vừa được tạo
            $newId = $db->lastInsertId();

            // 7. Chuẩn bị dữ liệu trả về (Không trả về password đã hash)
            $newUser = [
                "id"       => (int)$newId,
                "username" => $username,
                "full_name" => $fullname,
                "role"     => $role,
                "status"   => $status
            ];

            // Thiết lập mã trạng thái 201 Created và trả về JSON
            http_response_code(201);
            echo json_encode([
                "success" => true,
                "message" => "Tạo người dùng thành công.",
                "data"    => $newUser
            ]);
            exit;

        } catch (PDOException $e) {
            Response::err("Đã xảy ra lỗi. Vui lòng thử lại.", 500);
        }
    }

    // Xử lý PUT /api/users/{id}
    public static function update($id, $body) {
        Auth::role("admin"); // Chỉ admin mới được cập nhật user
        $db = getDB();

        // 2. Lấy dữ liệu từ Request Body
        // Nếu client không gửi trường nào, biến tương ứng sẽ là null
        $password = $body['password'] ?? ''; 
        $fullname = isset($body['full_name']) ? trim($body['full_name']) : null;
        $role     = isset($body['role']) ? trim($body['role']) : null;
        $status   = isset($body['status']) ? trim($body['status']) : null;

        // Validate role (nếu có gửi lên)
        if ($role !== null && !in_array($role, ['admin', 'user'])) {
            Response::err("Vai trò không hợp lệ (chỉ nhận 'admin' hoặc 'user').", 400);
        }

        try {
            // 3. Kiểm tra xem người dùng cần sửa có tồn tại không
            $stmtCheck = $db->prepare("SELECT id FROM users WHERE id = :id");
            $stmtCheck->execute([':id' => $id]);
            if (!$stmtCheck->fetch()) {
                Response::err("Không tìm thấy người dùng.", 404);
            }

            // 4. Xây dựng câu truy vấn UPDATE động
            $updateFields = [];
            $params = [':id' => $id];

            if ($fullname !== null) {
                $updateFields[] = "full_name = :full_name";
                $params[':full_name'] = $fullname;
            }

            if ($role !== null) {
                $updateFields[] = "role = :role";
                $params[':role'] = $role;
            }

            if ($status !== null) {
                $updateFields[] = "status = :status";
                $params[':status'] = $status;
            }

            // Xử lý đặc biệt cho Mật khẩu: Chỉ cập nhật nếu admin nhập mật khẩu mới
            if ($password !== '') {
                $updateFields[] = "password = :password";
                $params[':password'] = password_hash($password, PASSWORD_BCRYPT);
            }

            // Nếu không có trường nào được gửi lên để cập nhật
            // if (empty($updateFields)) {
            //     Response::err("Không có dữ liệu nào được cung cấp để cập nhật.", 400);
            // }

            // 5. Gắn mảng vào câu lệnh SQL và thực thi
            $sql = "UPDATE users SET " . implode(", ", $updateFields) . " WHERE id = :id";
            $stmt = $db->prepare($sql);
            $stmt->execute($params);

            // 6. Trả về kết quả thành công
            http_response_code(200);
            echo json_encode([
                "success" => true,
                "message" => "Cập nhật thông tin người dùng thành công.",
                "data"    => null
            ]);
            exit;

        } catch (PDOException $e) {
            Response::err("Đã xảy ra lỗi. Vui lòng thử lại.", 500);
        }
    }

    // Xử lý DELETE /api/users/{id}
    public static function destroy($id) {
        Auth::role("admin"); // Chỉ admin mới được xoá user
        $db = getDB();
        try {
            // 2. Kiểm tra xem người dùng có tồn tại không
            $stmtCheck = $db->prepare("SELECT id, status FROM users WHERE id = :id");
            $stmtCheck->execute([':id' => $id]);
            $user = $stmtCheck->fetch(PDO::FETCH_ASSOC);

            if (!$user) {
                Response::err("Không tìm thấy người dùng.", 404);
            }

            // Chặn trường hợp vô hiệu hoá tài khoản đã bị inactive từ trước
            if ($user['status'] === 'inactive') {
                Response::err("Người dùng này đã bị vô hiệu hoá từ trước.", 400);
            }

            // (Tuỳ chọn) Chặn Admin tự vô hiệu hoá chính mình để tránh sập hệ thống
            // Giả sử session của bạn có lưu id: $_SESSION['user_id']
            if (isset($_SESSION['user_id']) && $_SESSION['user_id'] == $id) {
                Response::err("Bạn không thể tự vô hiệu hoá tài khoản của chính mình.", 400);
            }

            // 3. Thực hiện xoá mềm bằng lệnh UPDATE
            $sql = "UPDATE users SET status = 'inactive' WHERE id = :id";
            $stmt = $db->prepare($sql);
            $stmt->execute([':id' => $id]);

            // 4. Trả về kết quả thành công
            http_response_code(200);
            echo json_encode([
                "success" => true,
                "message" => "Đã vô hiệu hoá người dùng thành công.",
                "data"    => null
            ]);
            exit;

        } catch (PDOException $e) {
            Response::err("Đã xảy ra lỗi. Vui lòng thử lại.", 500);
        }
    }
}