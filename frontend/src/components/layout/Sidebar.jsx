import { NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

// Định nghĩa menu theo vai trò
const MENUS = {
  admin: [
    { to:"/dashboard", icon:"📊", label:"Tổng quan" },
    { to:"/items", icon:"📋", label:"Quản lý dữ liệu" },
    { to:"/users", icon:"👥", label:"Người dùng" },
    { to:"/profile", icon:"👤", label:"Hồ sơ" },
  ],
  teacher: [
    { to:"/dashboard", icon:"📊", label:"Tổng quan" },
    { to:"/items", icon:"📋", label:"Quản lý" },
    { to:"/profile", icon:"👤", label:"Hồ sơ" },
  ],
  student: [
    { to:"/dashboard", icon:"📊", label:"Tổng quan" },
    { to:"/items", icon:"📋", label:"Danh sách" },
    { to:"/profile", icon:"👤", label:"Hồ sơ" },
  ],
  user: [
    { to:"/dashboard", icon:"📊", label:"Tổng quan" },
    { to:"/items", icon:"📋", label:"Danh sách" },
    { to:"/profile", icon:"👤", label:"Hồ sơ" },
  ],
};

export function Sidebar({ isOpen }) {
  const { user, logout } = useAuth();
  const menu = MENUS[user?.role] || MENUS.user;

  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`} style={{
      position:"fixed", top:0, left:0, bottom:0, width:"var(--sidebar-w)",
      background:"var(--clr-primary)", color:"#fff", display:"flex",
      flexDirection:"column", zIndex:100, transition:"transform var(--transition-slow)",
    }}>
      {/* Logo */}
      <div style={{ padding:"var(--sp-6) var(--sp-4)", borderBottom:"1px solid rgba(255,255,255,.1)" }}>
        <h1 style={{ fontSize:"var(--text-xl)", fontWeight:700, margin:0 }}>📦 Hệ Thống</h1>
        <p style={{ fontSize:"var(--text-xs)", opacity:.7, marginTop:4 }}>CSE702051 — Phenikaa</p>
      </div>

      {/* Navigation */}
      <nav style={{ flex:1, padding:"var(--sp-4) 0", overflowY:"auto" }}>
        {menu.map(item => (
          <NavLink key={item.to} to={item.to} style={({ isActive }) => ({
            display:"flex", alignItems:"center", gap:"var(--sp-3)",
            padding:"var(--sp-3) var(--sp-4)",
            color: isActive ? "#fff" : "rgba(255,255,255,.75)",
            background: isActive ? "rgba(255,255,255,.15)" : "transparent",
            borderLeft: isActive ? "3px solid #fff" : "3px solid transparent",
            textDecoration:"none", fontWeight: isActive ? 600 : 400,
            transition:"all var(--transition)",
          })}>
            <span style={{ fontSize:20 }}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div style={{ padding:"var(--sp-4)", borderTop:"1px solid rgba(255,255,255,.1)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"var(--sp-3)", marginBottom:"var(--sp-3)" }}>
          <div style={{ width:36, height:36, borderRadius:"50%",
            background:"rgba(255,255,255,.2)",
            display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>
            {user?.name?.[0]?.toUpperCase() || "?"}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontWeight:600, fontSize:"var(--text-sm)",
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user?.name}</div>
            <div style={{ fontSize:"var(--text-xs)", opacity:.7 }}>{user?.role}</div>
          </div>
        </div>
        <button onClick={logout} className="btn" style={{
          width:"100%", background:"rgba(255,255,255,.1)",
          color:"#fff", justifyContent:"center", fontSize:"var(--text-sm)",
        }}>🚪 Đăng xuất</button>
      </div>
    </aside>
  );
}
