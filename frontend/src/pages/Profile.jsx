import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth.service';
import api from '../services/api';

function Profile() {
  const { user, login } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');
    setSubmitting(true);
    try {
      const body = { full_name: fullName };
      if (password) body.password = password;
      const res = await api.put('/api/auth/profile', body);
      if (res.data.success) {
        setMessage('Cập nhật hồ sơ thành công!');
        setPassword('');
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể cập nhật hồ sơ.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2>🙍 HỒ SƠ CÁ NHÂN</h2>
      <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', maxWidth: '480px' }}>
        <p style={{ color: '#7f8c8d', marginBottom: 20 }}>
          Tên đăng nhập: <strong>{user?.username}</strong> &nbsp;·&nbsp; Vai trò: <strong>{user?.role}</strong>
        </p>

        {message && <div style={{ padding: 10, marginBottom: 15, backgroundColor: '#d1fae5', color: '#065f46', borderRadius: 4 }}>{message}</div>}
        {error && <div style={{ padding: 10, marginBottom: 15, backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: 4 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 15 }}>
            <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold', fontSize: 14 }}>Họ và tên</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold', fontSize: 14 }}>Mật khẩu mới (để trống nếu không đổi)</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Tối thiểu 8 ký tự" style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }} />
          </div>
          <button type="submit" disabled={submitting} style={{ padding: '10px 24px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', opacity: submitting ? 0.6 : 1 }}>
            {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Profile;
