import React, { useState, useEffect, useCallback } from 'react';
import { productService } from '../services/product.service';
import { supplierService } from '../services/supplier.service';
import { orderService } from '../services/order.service';

function Transactions() {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [type, setType] = useState('import'); // 'import' | 'export'
  const [productId, setProductId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [nguoiNhan, setNguoiNhan] = useState('');
  const [qty, setQty] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [note, setNote] = useState('');

  const loadAll = useCallback(async () => {
    const [prodRes, supRes, impRes, expRes] = await Promise.all([
      productService.getAll({ per_page: 100 }),
      supplierService.getAll({ per_page: 100 }),
      orderService.getImportOrders({ per_page: 20 }),
      orderService.getExportOrders({ per_page: 20 }),
    ]);
    if (prodRes.success) setProducts(prodRes.data);
    if (supRes.success) setSuppliers(supRes.data);

    const imports = (impRes.success ? impRes.data : []).map((o) => ({ ...o, _type: 'Nhập kho' }));
    const exports = (expRes.success ? expRes.data : []).map((o) => ({ ...o, _type: 'Xuất kho' }));
    const merged = [...imports, ...exports].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setHistory(merged);
  }, []);

  useEffect(() => {
    loadAll().finally(() => setLoading(false));
  }, [loadAll]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!productId || !qty || !unitPrice) return alert('Vui lòng điền đủ thông tin bắt buộc!');

    setSubmitting(true);
    try {
      const details = [{ product_id: Number(productId), quantity: Number(qty), unit_price: Number(unitPrice) }];

      if (type === 'import') {
        if (!supplierId) { alert('Vui lòng chọn nhà cung cấp.'); return; }
        await orderService.createImportOrder({ supplier_id: Number(supplierId), note, details });
      } else {
        if (!nguoiNhan.trim()) { alert('Vui lòng nhập người/bộ phận nhận hàng.'); return; }
        await orderService.createExportOrder({ nguoi_nhan: nguoiNhan.trim(), note, details });
      }

      setProductId(''); setSupplierId(''); setNguoiNhan(''); setQty(''); setUnitPrice(''); setNote('');
      alert('Tạo phiếu thành công! Kho hàng đã được cập nhật.');
      await loadAll();
    } catch (err) {
      // Trigger CSDL sẽ chặn nếu xuất vượt tồn kho, thông báo trả về đã có sẵn từ backend
      alert(err.response?.data?.message || 'Không thể tạo phiếu. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải dữ liệu...</div>;

  return (
    <div>
      <h2>🔄 QUẢN LÝ GIAO DỊCH MUA BÁN & XUẤT NHẬP KHO</h2>

      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '25px' }}>
        <h3 style={{ marginTop: 0 }}>📋 Khởi Tạo Chứng Từ (Nhập Mua / Xuất Bán)</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <select value={type} onChange={(e) => { setType(e.target.value); setSupplierId(''); setNguoiNhan(''); }} style={{ padding: '8px', flex: 1 }}>
            <option value="import">📥 Nhập mua linh kiện (Goods Receipt)</option>
            <option value="export">📤 Xuất bán linh kiện (Goods Issue)</option>
          </select>

          <select value={productId} onChange={(e) => setProductId(e.target.value)} required style={{ padding: '8px', flex: 2 }}>
            <option value="">-- Chọn Linh Kiện --</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.sku} - {p.name} (Tồn: {p.quantity_on_hand})</option>)}
          </select>

          {type === 'import' ? (
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} required style={{ padding: '8px', flex: 2 }}>
              <option value="">-- Chọn Nhà Cung Cấp --</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          ) : (
            <input type="text" placeholder="Người / bộ phận nhận hàng" value={nguoiNhan} onChange={(e) => setNguoiNhan(e.target.value)} required style={{ padding: '8px', flex: 2 }} />
          )}

          <input type="number" placeholder="Số lượng" value={qty} onChange={(e) => setQty(e.target.value)} min="1" required style={{ padding: '8px', flex: 1 }} />
          <input type="number" placeholder="Đơn giá" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} min="0" required style={{ padding: '8px', flex: 1 }} />
          <input type="text" placeholder="Mô tả giao dịch" value={note} onChange={(e) => setNote(e.target.value)} style={{ padding: '8px', flex: 2 }} />

          <button type="submit" disabled={submitting} style={{ padding: '8px 20px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', opacity: submitting ? 0.6 : 1 }}>
            {submitting ? 'Đang xử lý...' : 'Xác Nhận Ký Duyệt'}
          </button>
        </form>
      </div>

      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h3>📜 Nhật Ký Giao Dịch Kho Công Nghệ</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
              <th style={{ padding: '12px' }}>Mã phiếu</th>
              <th style={{ padding: '12px' }}>Loại hình</th>
              <th style={{ padding: '12px' }}>Đối tác / Người nhận</th>
              <th style={{ padding: '12px' }}>Tổng giá trị</th>
              <th style={{ padding: '12px' }}>Ngày thực hiện</th>
              <th style={{ padding: '12px' }}>Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {history.map(tx => (
              <tr key={`${tx._type}-${tx.id}`} style={{ borderBottom: '1px solid #dee2e6' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{tx.code || `#${tx.id}`}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', color: 'white', backgroundColor: tx._type === 'Nhập kho' ? '#2ecc71' : '#e67e22' }}>
                    {tx._type === 'Nhập kho' ? 'Nhập Mua' : 'Xuất Bán'}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>{tx._type === 'Nhập kho' ? (tx.supplier_name || `NCC #${tx.supplier_id}`) : tx.nguoi_nhan}</td>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{Number(tx.total_amount).toLocaleString()}đ</td>
                <td style={{ padding: '12px' }}>{new Date(tx.created_at).toLocaleDateString('vi-VN')}</td>
                <td style={{ padding: '12px', color: '#666', fontSize: '14px' }}>{tx.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Transactions;
