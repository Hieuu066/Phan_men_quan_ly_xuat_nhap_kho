import React from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Transactions from './pages/Transactions';

function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div style={{ display: 'flex', fontFamily: 'Arial, sans-serif', minHeight: '100vh', backgroundColor: '#f4f6f9' }}>
      <div style={{ width: '260px', backgroundColor: '#1a252f', color: 'white', padding: '20px 15px' }}>
        <h3 style={{ textAlign: 'center', color: '#3498db', marginBottom: '30px', fontSize: '16px' }}>PC & ELECTRONICS SCM</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={() => navigate('/dashboard')} style={{ padding: '12px', textAlign: 'left', backgroundColor: isActive('/dashboard') ? '#34495e' : 'transparent', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>📊 Bảng Điều Khiển</button>
          <button onClick={() => navigate('/products')} style={{ padding: '12px', textAlign: 'left', backgroundColor: isActive('/products') ? '#34495e' : 'transparent', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>📦 Kho Linh Kiện (CRUD)</button>
          <button onClick={() => navigate('/transactions')} style={{ padding: '12px', textAlign: 'left', backgroundColor: isActive('/transactions') ? '#34495e' : 'transparent', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>🔄 Mua / Bán Linh Kiện</button>
        </div>
        <div style={{ marginTop: '50px', borderTop: '1px solid #4f5d73', paddingTop: '15px', textAlign: 'center' }}>
          {user && <p style={{ fontSize: 12, color: '#8fa3b3', marginBottom: 10 }}>{user.full_name} ({user.role})</p>}
          <button onClick={handleLogout} style={{ width: '100%', padding: '8px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🚪 Đăng xuất</button>
        </div>
      </div>
      <div style={{ flex: 1, padding: '25px', overflowY: 'auto' }}>
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
      <Route path="/transactions" element={<ProtectedRoute><Layout><Transactions /></Layout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
