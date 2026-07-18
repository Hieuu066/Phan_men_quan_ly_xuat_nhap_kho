import React, { useState, useEffect, useCallback } from 'react';
import { productService } from '../services/product.service';
import { supplierService } from '../services/supplier.service';

function Products() {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // States cho form thêm mới
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // States hỗ trợ tính năng sửa (Update) trực tiếp dòng dữ liệu
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editSupplierId, setEditSupplierId] = useState('');

  const loadProducts = useCallback(async () => {
    try {
      const res = await productService.getAll({ per_page: 100 });
      if (res.success) setProducts(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách linh kiện.');
    }
  }, []);

  useEffect(() => {
    Promise.all([
      productService.getAll({ per_page: 100 }),
      supplierService.getAll({ per_page: 100 }),
    ])
      .then(([prodRes, supRes]) => {
        if (prodRes.success) setProducts(prodRes.data);
        if (supRes.success) setSuppliers(supRes.data);
      })
      .catch((err) => setError(err.response?.data?.message || 'Không thể tải dữ liệu.'))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await productService.create({
        sku,
        name,
        category,
        price: Number(price),
        supplier_id: supplierId || null,
      });
      if (res.success) {
        setSku(''); setName(''); setCategory(''); setPrice(''); setSupplierId('');
        alert('Thêm linh kiện mới vào kho thành công!');
        await loadProducts();
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể thêm linh kiện. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, displaySku) => {
    if (!window.confirm(`Xác nhận xóa mã linh kiện ${displaySku} khỏi hệ thống quản lý?`)) return;
    try {
      const res = await productService.remove(id);
      if (res.success) {
        await loadProducts();
      } else {
        alert(res.message);
      }
    } catch (err) {
      // Backend chặn xoá nếu sản phẩm đã phát sinh giao dịch nhập/xuất (lỗi 409/500 tuỳ cấu hình)
      alert(err.response?.data?.message || 'Không thể xoá linh kiện này (có thể đã phát sinh giao dịch nhập/xuất).');
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditCategory(item.category);
    setEditPrice(item.price);
    setEditSupplierId(item.supplier_id || '');
  };

  const handleSaveEdit = async (id) => {
    try {
      const res = await productService.update(id, {
        name: editName,
        category: editCategory,
        price: Number(editPrice),
        supplier_id: editSupplierId || null,
      });
      if (res.success) {
        setEditingId(null);
        alert('Cập nhật thông tin linh kiện thành công!');
        await loadProducts();
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể cập nhật linh kiện.');
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải dữ liệu...</div>;

  return (
    <div>
      <h2>📦 QUẢN LÝ DANH MỤC LINH KIỆN MÁY TÍNH & ĐIỆN TỬ</h2>
      {error && <div style={{ padding: 10, marginBottom: 15, backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: 4 }}>{error}</div>}

      {/* FORM KHỞI TẠO VẬT TƯ MỚI */}
      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '25px' }}>
        <h3 style={{ marginTop: 0 }}>➕ Khai báo thêm mã linh kiện mới</h3>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <input type="text" placeholder="Mã SKU (Ví dụ: RAM004)" value={sku} onChange={(e) => setSku(e.target.value)} required style={{ padding: '8px', flex: 1 }} />
          <input type="text" placeholder="Tên chi tiết linh kiện" value={name} onChange={(e) => setName(e.target.value)} required style={{ padding: '8px', flex: 2 }} />
          <input type="text" placeholder="Phân loại (CPU/RAM/VGA...)" value={category} onChange={(e) => setCategory(e.target.value)} required style={{ padding: '8px', flex: 1 }} />

          <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} style={{ padding: '8px', flex: 1 }}>
            <option value="">-- Chọn nhà cung cấp --</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <input type="number" placeholder="Đơn giá (VNĐ)" value={price} onChange={(e) => setPrice(e.target.value)} min="0" required style={{ padding: '8px', flex: 1 }} />

          <button type="submit" disabled={submitting} style={{ padding: '8px 20px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', opacity: submitting ? 0.6 : 1 }}>
            {submitting ? 'Đang thêm...' : 'Thêm Mới'}
          </button>
        </form>
        <p style={{ fontSize: 12, color: '#7f8c8d', marginTop: 10, marginBottom: 0 }}>
          Lưu ý: linh kiện mới bắt đầu với tồn kho = 0. Muốn có hàng, lập phiếu nhập ở trang "Mua / Bán Linh Kiện".
        </p>
      </div>

      {/* BẢNG CHỨA CÁC THAO TÁC CRUD */}
      <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h3>📦 Cơ Sở Dữ Liệu Tồn Kho Toàn Hệ Thống</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#2c3e50', color: 'white' }}>
              <th style={{ padding: '12px' }}>Mã SKU</th>
              <th style={{ padding: '12px' }}>Tên Linh Kiện</th>
              <th style={{ padding: '12px' }}>Phân Loại</th>
              <th style={{ padding: '12px' }}>Nhà Cung Cấp</th>
              <th style={{ padding: '12px' }}>Đơn Giá</th>
              <th style={{ padding: '12px' }}>Số Tồn</th>
              <th style={{ padding: '12px' }}>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {products.map(item => {
              const isEditing = editingId === item.id;
              return (
                <tr key={item.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{item.sku}</td>
                  <td style={{ padding: '12px' }}>
                    {isEditing ? <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ padding: '5px', width: '90%' }} /> : item.name}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {isEditing ? <input type="text" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} style={{ padding: '5px', width: '90%' }} /> : item.category}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {isEditing ? (
                      <select value={editSupplierId} onChange={(e) => setEditSupplierId(e.target.value)} style={{ padding: '5px' }}>
                        <option value="">-- Không có --</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    ) : (item.supplier_name || 'Chưa gán NCC')}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {isEditing ? <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} style={{ padding: '5px', width: '100px' }} /> : `${Number(item.price).toLocaleString()}đ`}
                  </td>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{item.quantity_on_hand} {item.unit}</td>
                  <td style={{ padding: '12px' }}>
                    {isEditing ? (
                      <>
                        <button onClick={() => handleSaveEdit(item.id)} style={{ marginRight: '5px', padding: '5px 10px', backgroundColor: '#2ecc71', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Lưu</button>
                        <button onClick={() => setEditingId(null)} style={{ padding: '5px 10px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Hủy</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(item)} style={{ marginRight: '5px', padding: '5px 10px', backgroundColor: '#f1c40f', color: 'black', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Sửa</button>
                        <button onClick={() => handleDelete(item.id, item.sku)} style={{ padding: '5px 10px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Xóa</button>
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

export default Products;
