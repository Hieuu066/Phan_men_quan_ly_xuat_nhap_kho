import React, { useState } from 'react';

// Nhận vào thuộc tính onLoginSuccess từ file App.jsx truyền sang
function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    
    // Giả lập kiểm tra tài khoản (Sau này bạn Back-end sẽ làm phần xác thực này)
    if (username === 'admin' && password === '333333') {
      alert('Đăng nhập hệ thống kho thành công!');
      onLoginSuccess(); // Kích hoạt chuyển sang trang Dashboard
    } else {
      alert('Sai tài khoản hoặc mật khẩu rồi! (Thử lại với tài khoản: admin, mật khẩu: 333333)');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', fontFamily: 'Arial' }}>
      <h2 style={{ textAlign: 'center', color: '#333' }}>QUẢN LÝ KHO HÀNG</h2>
      <h3 style={{ textAlign: 'center', color: '#666' }}>Đăng Nhập Hệ Thống</h3>
      
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Tên đăng nhập:</label>
          <input 
            type="text" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Điền Tên Đăng Nhập" 
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            required
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Mật khẩu:</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Điền Mật Khẩu" 
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            required
          />
        </div>

        <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Đăng Nhập
        </button>
      </form>
    </div>
  );
}

export default Login;