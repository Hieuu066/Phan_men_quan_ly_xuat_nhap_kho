import React, { useState, useEffect, useCallback } from 'react';
import { supplierService } from '../services/supplier.service';
import { useToast } from '../hooks/useToast';
import { ToastContainer, ConfirmModal } from '../components/Feedback';

function Suppliers() {
  const toast = useToast();
  const [confirmState, setConfirmState] = useState(null);

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await supplierService.getAll({ per_page: 100 });
      if (res.success) setSuppliers(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách nhà cung cấp.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await supplierService.create({ name, phone, email, address });
      if (res.success) {
        setName(''); setPhone(''); setEmail(''); setAddress('');
        toast.success('Đã thêm nhà cung cấp mới.');
        await load();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể thêm nhà cung cấp.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id, displayName) => {
    setConfirmState({
      title: 'Vô hiệu hoá nhà cung cấp',
      message: `Vô hiệu hoá nhà cung cấp "${displayName}"? Có thể mở lại sau nếu cần.`,
      confirmLabel: 'Vô hiệu hoá',
      onConfirm: async () => {
        try {
          const res = await supplierService.remove(id);
          if (res.success) { toast.success('Đã vô hiệu hoá nhà cung cấp.'); await load(); }
          else toast.error(res.message);
        } catch (err) {
          toast.error(err.response?.data?.message || 'Không thể vô hiệu hoá nhà cung cấp này.');
        }
      },
    });
  };

  const startEdit = (s) => {
    setEditingId(s.id);
    setEditName(s.name);
    setEditPhone(s.phone || '');
    setEditEmail(s.email || '');
    setEditAddress(s.address || '');
  };

  const handleSaveEdit = async (id) => {
    try {
      const res = await supplierService.update(id, { name: editName, phone: editPhone, email: editEmail, address: editAddress, status: 'active' });
      if (res.success) { setEditingId(null); toast.success('Đã cập nhật nhà cung cấp.'); await load(); }
      else toast.error(res.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật nhà cung cấp.');
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải dữ liệu...</div>;

  return (
    <div>
      <ToastContainer toasts={toast.toasts} onRemove={toast.remove} />
      <ConfirmModal state={confirmState} onClose={() => setConfirmState(null)} />

      <h2>🏭 QUẢN LÝ NHÀ CUNG CẤP</h2>
      {error && <div style={{ padding: 10, marginBottom: 15, backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: 4 }}>{error}</div>}

      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '25px' }}>
        <h3 style={{ marginTop: 0 }}>➕ Thêm nhà cung cấp mới</h3>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 2, minWidth: 180 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', color: '#5a6c7a', marginBottom: 5 }}>Tên nhà cung cấp</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={{ padding: '9px', width: '100%', boxSizing: 'border-box', border: '1px solid #dcdfe3', borderRadius: 6 }} />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', color: '#5a6c7a', marginBottom: 5 }}>Số điện thoại</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ padding: '9px', width: '100%', boxSizing: 'border-box', border: '1px solid #dcdfe3', borderRadius: 6 }} />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', color: '#5a6c7a', marginBottom: 5 }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: '9px', width: '100%', boxSizing: 'border-box', border: '1px solid #dcdfe3', borderRadius: 6 }} />
          </div>
          <div style={{ flex: 2, minWidth: 180 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', color: '#5a6c7a', marginBottom: 5 }}>Địa chỉ</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} style={{ padding: '9px', width: '100%', boxSizing: 'border-box', border: '1px solid #dcdfe3', borderRadius: 6 }} />
          </div>
          <button type="submit" disabled={submitting} className="btn btn-primary">
            {submitting ? 'Đang thêm...' : 'Thêm Mới'}
          </button>
        </form>
      </div>

      <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <div className="app-table-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#2c3e50', color: 'white' }}>
                <th style={{ padding: '12px' }}>Tên</th>
                <th style={{ padding: '12px' }}>SĐT</th>
                <th style={{ padding: '12px' }}>Email</th>
                <th style={{ padding: '12px' }}>Địa chỉ</th>
                <th style={{ padding: '12px' }}>Trạng thái</th>
                <th style={{ padding: '12px' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => {
                const isEditing = editingId === s.id;
                return (
                  <tr key={s.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>
                      {isEditing ? <input value={editName} onChange={(e) => setEditName(e.target.value)} style={{ padding: '6px', width: '90%', border: '1px solid #dcdfe3', borderRadius: 4 }} /> : s.name}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {isEditing ? <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} style={{ padding: '6px', width: '90%', border: '1px solid #dcdfe3', borderRadius: 4 }} /> : s.phone}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {isEditing ? <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} style={{ padding: '6px', width: '90%', border: '1px solid #dcdfe3', borderRadius: 4 }} /> : s.email}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {isEditing ? <input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} style={{ padding: '6px', width: '90%', border: '1px solid #dcdfe3', borderRadius: 4 }} /> : s.address}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', color: '#fff', backgroundColor: s.status === 'active' ? '#2ecc71' : '#95a5a6' }}>
                        {s.status === 'active' ? 'Đang hợp tác' : 'Ngừng hợp tác'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {isEditing ? (
                        <>
                          <button onClick={() => handleSaveEdit(s.id)} className="btn btn-success btn-sm" style={{ marginRight: 6 }}>Lưu</button>
                          <button onClick={() => setEditingId(null)} className="btn btn-outline btn-sm">Hủy</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(s)} className="btn btn-warning btn-sm" style={{ marginRight: 6 }}>Sửa</button>
                          <button onClick={() => handleDelete(s.id, s.name)} className="btn btn-danger btn-sm">Vô hiệu hoá</button>
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

export default Suppliers;
