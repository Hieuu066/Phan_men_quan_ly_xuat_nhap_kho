import React, { useState } from 'react';

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    // Giả lập cơ chế phân quyền tài khoản mẫu của Giai đoạn 3
    if (username === 'admin' && password === '111111') {
      onLoginSuccess();
    } else {
      alert('Thông tin tài khoản đăng nhập hệ thống không hợp lệ! Thử lại tài khoản: admin / 111111');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100vw', height: '100vh', backgroundColor: '#2c3e50' }}>
      <form onSubmit={handleLogin} style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', width: '360px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#2c3e50', fontSize: '22px' }}>HỆ THỐNG PHÂN PHỐI SCM</h2>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#34495e', fontSize: '14px' }}>Tên đăng nhập:</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Điền Tên Đăng Nhập" required style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-bottom' }} />
        </div>
        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#34495e', fontSize: '14px' }}>Mật khẩu xác thực:</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Điền Mật Khẩu" required style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-bottom' }} />
        </div>
        <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#1abc9c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}>ĐĂNG NHẬP VẬN HÀNH</button>
      </form>
    </div>
  );
}

export default Login;