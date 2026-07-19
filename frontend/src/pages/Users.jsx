import React, { useState, useEffect, useCallback } from 'react';
import { userService } from '../services/user.service';
import { useAuth } from '../contexts/AuthContext';

function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('user');
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editFullName, setEditFullName] = useState('');
  const [editRole, setEditRole] = useState('user');
  const [editStatus, setEditStatus] = useState('active');

  const load = useCallback(async () => {
    try {
      const res = await userService.getAll({ per_page: 100 });
      if (res.success) setUsers(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (currentUser && currentUser.role !== 'admin') {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#e74c3c' }}>
        Chỉ Quản trị viên (admin) mới có quyền truy cập trang này.
      </div>
    );
  }

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await userService.create({ username, password, full_name: fullName, role });
      if (res.success) {
        setUsername(''); setPassword(''); setFullName(''); setRole('user');
        await load();
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể tạo tài khoản.');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (u) => {
    setEditingId(u.id);
    setEditFullName(u.full_name);
    setEditRole(u.role);
    setEditStatus(u.status);
  };

  const handleSaveEdit = async (id) => {
    try {
      const res = await userService.update(id, { full_name: editFullName, role: editRole, status: editStatus });
      if (res.success) { setEditingId(null); await load(); }
      else alert(res.message);
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể cập nhật người dùng.');
    }
  };

  const handleToggleStatus = async (u) => {
    const newStatus = u.status === 'active' ? 'inactive' : 'active';
    if (!window.confirm(`${newStatus === 'inactive' ? 'Khóa' : 'Mở khóa'} tài khoản "${u.username}"?`)) return;
    try {
      const res = await userService.update(u.id, { status: newStatus });
      if (res.success) await load();
      else alert(res.message);
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể đổi trạng thái tài khoản.');
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải dữ liệu...</div>;

  return (
    <div>
      <h2>👤 QUẢN LÝ NGƯỜI DÙNG HỆ THỐNG</h2>
      {error && <div style={{ padding: 10, marginBottom: 15, backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: 4 }}>{error}</div>}

      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '25px' }}>
        <h3 style={{ marginTop: 0 }}>➕ Tạo tài khoản mới</h3>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <input type="text" placeholder="Tên đăng nhập" value={username} onChange={(e) => setUsername(e.target.value)} required style={{ padding: '8px', flex: 1 }} />
          <input type="password" placeholder="Mật khẩu (tối thiểu 8 ký tự)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} style={{ padding: '8px', flex: 1 }} />
          <input type="text" placeholder="Họ và tên" value={fullName} onChange={(e) => setFullName(e.target.value)} required style={{ padding: '8px', flex: 1 }} />
          <select value={role} onChange={(e) => setRole(e.target.value)} style={{ padding: '8px', flex: 1 }}>
            <option value="user">Nhân viên (user)</option>
            <option value="admin">Quản trị viên (admin)</option>
          </select>
          <button type="submit" disabled={submitting} style={{ padding: '8px 20px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', opacity: submitting ? 0.6 : 1 }}>
            {submitting ? 'Đang tạo...' : 'Tạo Tài Khoản'}
          </button>
        </form>
      </div>

      <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#2c3e50', color: 'white' }}>
              <th style={{ padding: '12px' }}>Tên đăng nhập</th>
              <th style={{ padding: '12px' }}>Họ tên</th>
              <th style={{ padding: '12px' }}>Vai trò</th>
              <th style={{ padding: '12px' }}>Trạng thái</th>
              <th style={{ padding: '12px' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isEditing = editingId === u.id;
              return (
                <tr key={u.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{u.username}</td>
                  <td style={{ padding: '12px' }}>
                    {isEditing ? <input value={editFullName} onChange={(e) => setEditFullName(e.target.value)} style={{ padding: '5px', width: '90%' }} /> : u.full_name}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {isEditing ? (
                      <select value={editRole} onChange={(e) => setEditRole(e.target.value)} style={{ padding: '5px' }}>
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    ) : u.role}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', color: '#fff', backgroundColor: u.status === 'active' ? '#2ecc71' : '#e74c3c' }}>
                      {u.status === 'active' ? 'Hoạt động' : 'Đã khoá'}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {isEditing ? (
                      <>
                        <button onClick={() => handleSaveEdit(u.id)} style={{ marginRight: '5px', padding: '5px 10px', backgroundColor: '#2ecc71', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Lưu</button>
                        <button onClick={() => setEditingId(null)} style={{ padding: '5px 10px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Hủy</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(u)} style={{ marginRight: '5px', padding: '5px 10px', backgroundColor: '#f1c40f', color: 'black', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Sửa</button>
                        <button onClick={() => handleToggleStatus(u)} style={{ padding: '5px 10px', backgroundColor: u.status === 'active' ? '#e74c3c' : '#2ecc71', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                          {u.status === 'active' ? 'Khoá' : 'Mở khoá'}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Users;
