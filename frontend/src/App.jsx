import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Transactions from './pages/Transactions';
import Suppliers from './pages/Suppliers';
import Users from './pages/Users';
import Profile from './pages/Profile';
import './App.css';

function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/dashboard', icon: '📊', label: 'Bảng Điều Khiển' },
    { path: '/products', icon: '📦', label: 'Kho Linh Kiện' },
    { path: '/suppliers', icon: '🏭', label: 'Nhà Cung Cấp' },
    { path: '/transactions', icon: '🔄', label: 'Mua / Bán Linh Kiện' },
    ...(user?.role === 'admin' ? [{ path: '/users', icon: '👤', label: 'Người Dùng Hệ Thống' }] : []),
    { path: '/profile', icon: '🙍', label: 'Hồ Sơ Cá Nhân' },
  ];

  const goTo = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  return (
    <div className="app-shell">
      <div className="app-mobile-toggle">
        <strong>PC & ELECTRONICS SCM</strong>
        <button onClick={() => setMobileOpen((o) => !o)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer' }}>☰</button>
      </div>

      <div className={`app-sidebar-overlay ${mobileOpen ? 'open' : ''}`} onClick={() => setMobileOpen(false)} />

      <div className={`app-sidebar ${mobileOpen ? 'open' : ''}`}>
        <h3 style={{ textAlign: 'center', color: '#3498db', marginBottom: '30px', fontSize: '16px' }}>PC & ELECTRONICS SCM</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => goTo(item.path)}
              style={{
                padding: '12px',
                textAlign: 'left',
                backgroundColor: isActive(item.path) ? '#34495e' : 'transparent',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>
        <div style={{ marginTop: '40px', borderTop: '1px solid #4f5d73', paddingTop: '15px', textAlign: 'center' }}>
          {user && <p style={{ fontSize: 12, color: '#8fa3b3', marginBottom: 10 }}>{user.full_name} ({user.role})</p>}
          <button onClick={handleLogout} style={{ width: '100%', padding: '8px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🚪 Đăng xuất</button>
        </div>
      </div>

      <div className="app-content">
        {children}
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/products" element={<ProtectedRoute><Layout><Products /></Layout></ProtectedRoute>} />
      <Route path="/suppliers" element={<ProtectedRoute><Layout><Suppliers /></Layout></ProtectedRoute>} />
      <Route path="/transactions" element={<ProtectedRoute><Layout><Transactions /></Layout></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute roles={["admin"]}><Layout><Users /></Layout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
