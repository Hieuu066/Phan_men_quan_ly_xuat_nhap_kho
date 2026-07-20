import React, { useState, useEffect, useCallback } from 'react';
import { productService } from '../services/product.service';
import { supplierService } from '../services/supplier.service';
import { formatCurrency } from '../utils/format';
import { useToast } from '../hooks/useToast';
import { ToastContainer, ConfirmModal } from '../components/Feedback';

function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function Products() {
  const toast = useToast();
  const [confirmState, setConfirmState] = useState(null);

  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 400);

  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editSupplierId, setEditSupplierId] = useState('');

  const loadProducts = useCallback(async () => {
    try {
      const res = await productService.getAll({ page, per_page: 10, search: debouncedSearch });
      if (res.success) { setProducts(res.data); setMeta(res.meta); }
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách linh kiện.');
    }
  }, [page, debouncedSearch]);

  useEffect(() => { setPage(1); }, [debouncedSearch]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      productService.getAll({ page, per_page: 10, search: debouncedSearch }),
      supplierService.getAll({ per_page: 100 }),
    ])
      .then(([prodRes, supRes]) => {
        if (prodRes.success) { setProducts(prodRes.data); setMeta(prodRes.meta); }
        if (supRes.success) setSuppliers(supRes.data);
      })
      .catch((err) => setError(err.response?.data?.message || 'Không thể tải dữ liệu.'))
      .finally(() => setLoading(false));
  }, [page, debouncedSearch]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await productService.create({
        sku, name, category,
        price: Number(price),
        supplier_id: supplierId || null,
      });
      if (res.success) {
        setSku(''); setName(''); setCategory(''); setPrice(''); setSupplierId('');
        toast.success('Đã thêm linh kiện mới vào kho.');
        await loadProducts();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể thêm linh kiện. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id, displaySku) => {
    setConfirmState({
      title: 'Xoá linh kiện',
      message: `Xác nhận xóa mã linh kiện "${displaySku}" khỏi hệ thống quản lý? Hành động này không thể hoàn tác.`,
      confirmLabel: 'Xoá',
      onConfirm: async () => {
        try {
          const res = await productService.remove(id);
          if (res.success) { toast.success('Đã xoá linh kiện.'); await loadProducts(); }
          else toast.error(res.message);
        } catch (err) {
          toast.error(err.response?.data?.message || 'Không thể xoá linh kiện này (có thể đã phát sinh giao dịch nhập/xuất).');
        }
      },
    });
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
        name: editName, category: editCategory,
        price: Number(editPrice),
        supplier_id: editSupplierId || null,
      });
      if (res.success) {
        setEditingId(null);
        toast.success('Đã cập nhật thông tin linh kiện.');
        await loadProducts();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật linh kiện.');
    }
  };

  const handleExportCSV = () => {
    const base = import.meta.env.VITE_API_BASE || '';
    window.open(`${base}/api/items/export`, '_blank');
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải dữ liệu...</div>;

  return (
    <div>
      <ToastContainer toasts={toast.toasts} onRemove={toast.remove} />
      <ConfirmModal state={confirmState} onClose={() => setConfirmState(null)} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>📦 QUẢN LÝ DANH MỤC LINH KIỆN MÁY TÍNH & ĐIỆN TỬ</h2>
        <button onClick={handleExportCSV} className="btn btn-success">📥 Xuất CSV</button>
      </div>
      {error && <div style={{ padding: 10, marginBottom: 15, backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: 4 }}>{error}</div>}

      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '25px' }}>
        <h3 style={{ marginTop: 0 }}>➕ Khai báo thêm mã linh kiện mới</h3>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', color: '#5a6c7a', marginBottom: 5 }}>Mã SKU</label>
            <input type="text" placeholder="VD: RAM004" value={sku} onChange={(e) => setSku(e.target.value)} required style={{ padding: '9px', width: '100%', boxSizing: 'border-box', border: '1px solid #dcdfe3', borderRadius: 6 }} />
          </div>
          <div style={{ flex: 2, minWidth: 180 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', color: '#5a6c7a', marginBottom: 5 }}>Tên linh kiện</label>
            <input type="text" placeholder="Tên chi tiết linh kiện" value={name} onChange={(e) => setName(e.target.value)} required style={{ padding: '9px', width: '100%', boxSizing: 'border-box', border: '1px solid #dcdfe3', borderRadius: 6 }} />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', color: '#5a6c7a', marginBottom: 5 }}>Phân loại</label>
            <input type="text" placeholder="CPU/RAM/VGA..." value={category} onChange={(e) => setCategory(e.target.value)} required style={{ padding: '9px', width: '100%', boxSizing: 'border-box', border: '1px solid #dcdfe3', borderRadius: 6 }} />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', color: '#5a6c7a', marginBottom: 5 }}>Nhà cung cấp</label>
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} style={{ padding: '9px', width: '100%', boxSizing: 'border-box', border: '1px solid #dcdfe3', borderRadius: 6 }}>
              <option value="">-- Chọn --</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 130 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', color: '#5a6c7a', marginBottom: 5 }}>Đơn giá (VNĐ)</label>
            <input type="number" placeholder="0" value={price} onChange={(e) => setPrice(e.target.value)} min="0" required style={{ padding: '9px', width: '100%', boxSizing: 'border-box', border: '1px solid #dcdfe3', borderRadius: 6 }} />
          </div>
          <button type="submit" disabled={submitting} className="btn btn-primary">
            {submitting ? 'Đang thêm...' : 'Thêm Mới'}
          </button>
        </form>
        <p style={{ fontSize: 12, color: '#7f8c8d', marginTop: 12, marginBottom: 0 }}>
          Lưu ý: linh kiện mới bắt đầu với tồn kho = 0. Muốn có hàng, lập phiếu nhập ở trang "Mua / Bán Linh Kiện".
        </p>
      </div>

      <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
          <h3 style={{ margin: 0 }}>📦 Cơ Sở Dữ Liệu Tồn Kho Toàn Hệ Thống</h3>
          <input
            type="text"
            placeholder="🔍 Tìm theo tên hoặc mã SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: '9px 12px', width: '280px', border: '1px solid #dcdfe3', borderRadius: '6px' }}
          />
        </div>

        <div className="app-table-wrap">
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
              {products.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 30, textAlign: 'center', color: '#7f8c8d' }}>Không tìm thấy linh kiện phù hợp.</td></tr>
              ) : products.map(item => {
                const isEditing = editingId === item.id;
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{item.sku}</td>
                    <td style={{ padding: '12px' }}>
                      {isEditing ? <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ padding: '6px', width: '90%', border: '1px solid #dcdfe3', borderRadius: 4 }} /> : item.name}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {isEditing ? <input type="text" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} style={{ padding: '6px', width: '90%', border: '1px solid #dcdfe3', borderRadius: 4 }} /> : item.category}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {isEditing ? (
                        <select value={editSupplierId} onChange={(e) => setEditSupplierId(e.target.value)} style={{ padding: '6px', border: '1px solid #dcdfe3', borderRadius: 4 }}>
                          <option value="">-- Không có --</option>
                          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      ) : (item.supplier_name || 'Chưa gán NCC')}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {isEditing ? <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} style={{ padding: '6px', width: '100px', border: '1px solid #dcdfe3', borderRadius: 4 }} /> : formatCurrency(item.price)}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{item.quantity_on_hand} {item.unit}</td>
                    <td style={{ padding: '12px' }}>
                      {isEditing ? (
                        <>
                          <button onClick={() => handleSaveEdit(item.id)} className="btn btn-success btn-sm" style={{ marginRight: 6 }}>Lưu</button>
                          <button onClick={() => setEditingId(null)} className="btn btn-outline btn-sm">Hủy</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(item)} className="btn btn-warning btn-sm" style={{ marginRight: 6 }}>Sửa</button>
                          <button onClick={() => handleDelete(item.id, item.sku)} className="btn btn-danger btn-sm">Xóa</button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {meta && meta.total_pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
            <span style={{ fontSize: 13, color: '#7f8c8d' }}>Hiển thị {meta.from}–{meta.to} / {meta.total} linh kiện</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setPage(p => p - 1)} disabled={!meta.has_prev} className="btn btn-outline btn-sm">‹ Trước</button>
              <span style={{ padding: '6px 12px' }}>Trang {meta.current_page}/{meta.total_pages}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={!meta.has_next} className="btn btn-outline btn-sm">Sau ›</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Products;
