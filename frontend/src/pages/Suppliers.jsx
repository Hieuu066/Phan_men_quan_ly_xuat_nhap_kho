import React, { useState, useEffect, useCallback } from 'react';
import { supplierService } from '../services/supplier.service';

function Suppliers() {
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
        await load();
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể thêm nhà cung cấp.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, displayName) => {
    if (!window.confirm(`Vô hiệu hoá nhà cung cấp "${displayName}"?`)) return;
    try {
      const res = await supplierService.remove(id);
      if (res.success) await load();
      else alert(res.message);
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể vô hiệu hoá nhà cung cấp này.');
    }
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
      if (res.success) { setEditingId(null); await load(); }
      else alert(res.message);
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể cập nhật nhà cung cấp.');
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải dữ liệu...</div>;

  return (
    <div>
      <h2>🏭 QUẢN LÝ NHÀ CUNG CẤP</h2>
      {error && <div style={{ padding: 10, marginBottom: 15, backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: 4 }}>{error}</div>}

      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '25px' }}>
        <h3 style={{ marginTop: 0 }}>➕ Thêm nhà cung cấp mới</h3>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <input type="text" placeholder="Tên nhà cung cấp" value={name} onChange={(e) => setName(e.target.value)} required style={{ padding: '8px', flex: 2 }} />
          <input type="text" placeholder="Số điện thoại" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ padding: '8px', flex: 1 }} />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: '8px', flex: 1 }} />
          <input type="text" placeholder="Địa chỉ" value={address} onChange={(e) => setAddress(e.target.value)} style={{ padding: '8px', flex: 2 }} />
          <button type="submit" disabled={submitting} style={{ padding: '8px 20px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', opacity: submitting ? 0.6 : 1 }}>
            {submitting ? 'Đang thêm...' : 'Thêm Mới'}
          </button>
        </form>
      </div>

      <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
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
                    {isEditing ? <input value={editName} onChange={(e) => setEditName(e.target.value)} style={{ padding: '5px', width: '90%' }} /> : s.name}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {isEditing ? <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} style={{ padding: '5px', width: '90%' }} /> : s.phone}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {isEditing ? <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} style={{ padding: '5px', width: '90%' }} /> : s.email}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {isEditing ? <input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} style={{ padding: '5px', width: '90%' }} /> : s.address}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', color: '#fff', backgroundColor: s.status === 'active' ? '#2ecc71' : '#95a5a6' }}>
                      {s.status === 'active' ? 'Đang hợp tác' : 'Ngừng hợp tác'}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {isEditing ? (
                      <>
                        <button onClick={() => handleSaveEdit(s.id)} style={{ marginRight: '5px', padding: '5px 10px', backgroundColor: '#2ecc71', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Lưu</button>
                        <button onClick={() => setEditingId(null)} style={{ padding: '5px 10px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Hủy</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(s)} style={{ marginRight: '5px', padding: '5px 10px', backgroundColor: '#f1c40f', color: 'black', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Sửa</button>
                        <button onClick={() => handleDelete(s.id, s.name)} style={{ padding: '5px 10px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Vô hiệu hoá</button>
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

export default Suppliers;
