import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/**
 * Bọc quanh 1 trang cần đăng nhập mới xem được.
 * Dùng thêm prop `roles` để giới hạn theo vai trò, ví dụ:
 *   <ProtectedRoute roles={["admin"]}><Users /></ProtectedRoute>
 * Không truyền `roles` thì chỉ cần đăng nhập là đủ (giữ đúng hành vi cũ).
 */
export function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        Đang tải...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && roles.length > 0 && !roles.includes(user?.role)) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#e74c3c" }}>
        Bạn không có quyền truy cập trang này.
      </div>
    );
  }

  return children;
}
