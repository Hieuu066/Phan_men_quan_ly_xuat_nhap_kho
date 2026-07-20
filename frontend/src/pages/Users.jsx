import React, { useState, useEffect, useCallback } from 'react';
import { userService } from '../services/user.service';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import { ToastContainer, ConfirmModal } from '../components/Feedback';

function Users() {
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const [confirmState, setConfirmState] = useState(null);

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
        toast.success('Đã tạo tài khoản mới.');
        await load();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể tạo tài khoản.');
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
      if (res.success) { setEditingId(null); toast.success('Đã cập nhật người dùng.'); await load(); }
      else toast.error(res.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật người dùng.');
    }
  };

  const handleToggleStatus = (u) => {
    const newStatus = u.status === 'active' ? 'inactive' : 'active';
    setConfirmState({
      title: newStatus === 'inactive' ? 'Khoá tài khoản' : 'Mở khoá tài khoản',
      message: `${newStatus === 'inactive' ? 'Khóa' : 'Mở khóa'} tài khoản "${u.username}"?`,
      confirmLabel: newStatus === 'inactive' ? 'Khoá' : 'Mở khoá',
      onConfirm: async () => {
        try {
          const res = await userService.update(u.id, { status: newStatus });
          if (res.success) { toast.success('Đã cập nhật trạng thái tài khoản.'); await load(); }
          else toast.error(res.message);
        } catch (err) {
          toast.error(err.response?.data?.message || 'Không thể đổi trạng thái tài khoản.');
        }
      },
    });
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải dữ liệu...</div>;

  return (
    <div>
      <ToastContainer toasts={toast.toasts} onRemove={toast.remove} />
      <ConfirmModal state={confirmState} onClose={() => setConfirmState(null)} />

      <h2>👤 QUẢN LÝ NGƯỜI DÙNG HỆ THỐNG</h2>
      {error && <div style={{ padding: 10, marginBottom: 15, backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: 4 }}>{error}</div>}

      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '25px' }}>
        <h3 style={{ marginTop: 0 }}>➕ Tạo tài khoản mới</h3>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 150 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', color: '#5a6c7a', marginBottom: 5 }}>Tên đăng nhập</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required style={{ padding: '9px', width: '100%', boxSizing: 'border-box', border: '1px solid #dcdfe3', borderRadius: 6 }} />
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', color: '#5a6c7a', marginBottom: 5 }}>Mật khẩu (tối thiểu 8 ký tự)</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} style={{ padding: '9px', width: '100%', boxSizing: 'border-box', border: '1px solid #dcdfe3', borderRadius: 6 }} />
          </div>
          <div style={{ flex: 1, minWidth: 150 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', color: '#5a6c7a', marginBottom: 5 }}>Họ và tên</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required style={{ padding: '9px', width: '100%', boxSizing: 'border-box', border: '1px solid #dcdfe3', borderRadius: 6 }} />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', color: '#5a6c7a', marginBottom: 5 }}>Vai trò</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} style={{ padding: '9px', width: '100%', boxSizing: 'border-box', border: '1px solid #dcdfe3', borderRadius: 6 }}>
              <option value="user">Nhân viên (user)</option>
              <option value="admin">Quản trị viên (admin)</option>
            </select>
          </div>
          <button type="submit" disabled={submitting} className="btn btn-primary">
            {submitting ? 'Đang tạo...' : 'Tạo Tài Khoản'}
          </button>
        </form>
      </div>

      <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <div className="app-table-wrap">
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
                      {isEditing ? <input value={editFullName} onChange={(e) => setEditFullName(e.target.value)} style={{ padding: '6px', width: '90%', border: '1px solid #dcdfe3', borderRadius: 4 }} /> : u.full_name}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {isEditing ? (
                        <select value={editRole} onChange={(e) => setEditRole(e.target.value)} style={{ padding: '6px', border: '1px solid #dcdfe3', borderRadius: 4 }}>
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
                          <button onClick={() => handleSaveEdit(u.id)} className="btn btn-success btn-sm" style={{ marginRight: 6 }}>Lưu</button>
                          <button onClick={() => setEditingId(null)} className="btn btn-outline btn-sm">Hủy</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(u)} className="btn btn-warning btn-sm" style={{ marginRight: 6 }}>Sửa</button>
                          <button onClick={() => handleToggleStatus(u)} className={`btn btn-sm ${u.status === 'active' ? 'btn-danger' : 'btn-success'}`}>
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
    </div>
  );
}

export default Users;
