import React, { useState, useEffect, useCallback } from 'react';
import { productService } from '../services/product.service';
import { supplierService } from '../services/supplier.service';
import { orderService } from '../services/order.service';
import { formatCurrency, formatDate } from '../utils/format';
import { useToast } from '../hooks/useToast';
import { ToastContainer } from '../components/Feedback';

// Bước 1-2 dùng chung 1 màu (xanh dương) khi đang "có thể thao tác" —
// tránh nhầm với xanh lá (thường hiểu là "đã xong, khoá lại") vì các bước này vẫn sửa được bình thường.
const stepStyle = (reachable) => ({
  width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontWeight: 'bold', fontSize: 14, flexShrink: 0,
  backgroundColor: reachable ? '#3498db' : '#e0e4e8',
  color: reachable ? '#fff' : '#8a94a0',
});

function Transactions() {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [type, setType] = useState('import');
  const [supplierId, setSupplierId] = useState('');
  const [nguoiNhan, setNguoiNhan] = useState('');
  const [note, setNote] = useState('');

  const [cart, setCart] = useState([]);
  const [lineProductId, setLineProductId] = useState('');
  const [lineQty, setLineQty] = useState('');
  const [lineUnitPrice, setLineUnitPrice] = useState('');

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

  useEffect(() => { loadAll().finally(() => setLoading(false)); }, [loadAll]);

  const handleChangeType = (newType) => {
    setType(newType);
    setSupplierId('');
    setNguoiNhan('');
    setCart([]);
  };

  const selectedProduct = products.find((p) => String(p.id) === String(lineProductId));

  const handleAddLine = () => {
    if (!lineProductId || !lineQty || !lineUnitPrice) {
      toast.error('Chọn sản phẩm và nhập đủ số lượng, đơn giá trước khi thêm.');
      return;
    }
    const qty = Number(lineQty);
    if (type === 'export' && selectedProduct && qty > Number(selectedProduct.quantity_on_hand)) {
      toast.error(`"${selectedProduct.name}" chỉ còn ${selectedProduct.quantity_on_hand}, không đủ để xuất ${qty}.`);
      return;
    }
    setCart((c) => [...c, {
      key: Date.now(),
      product_id: Number(lineProductId),
      name: selectedProduct?.name || '',
      sku: selectedProduct?.sku || '',
      quantity: qty,
      unit_price: Number(lineUnitPrice),
    }]);
    setLineProductId(''); setLineQty(''); setLineUnitPrice('');
  };

  const removeLine = (key) => setCart((c) => c.filter((l) => l.key !== key));

  const cartTotal = cart.reduce((sum, l) => sum + l.quantity * l.unit_price, 0);

  const canGoStep2 = type === 'export' ? nguoiNhan.trim() !== '' : supplierId !== '';
  const canSubmit = cart.length > 0;

  const handleSubmitOrder = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const details = cart.map(({ product_id, quantity, unit_price }) => ({ product_id, quantity, unit_price }));
      if (type === 'import') {
        await orderService.createImportOrder({ supplier_id: Number(supplierId), note, details });
      } else {
        await orderService.createExportOrder({ nguoi_nhan: nguoiNhan.trim(), note, details });
      }
      toast.success(`Tạo phiếu ${type === 'import' ? 'nhập' : 'xuất'} thành công với ${cart.length} mặt hàng!`);
      setSupplierId(''); setNguoiNhan(''); setNote(''); setCart([]);
      await loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể tạo phiếu. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải dữ liệu...</div>;

  return (
    <div>
      <ToastContainer toasts={toast.toasts} onRemove={toast.remove} />
      <h2 style={{ marginBottom: 4 }}>🔄 Quản Lý Giao Dịch Mua Bán & Xuất Nhập Kho</h2>
      <p style={{ color: '#7f8c8d', marginTop: 0, marginBottom: 24, fontSize: 14 }}>
        Tạo 1 phiếu cho nhiều mặt hàng cùng lúc — chỉ 3 bước, không cần lặp lại form cho từng sản phẩm.
      </p>

      <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '25px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={stepStyle(true)}>1</div>
          <h3 style={{ margin: 0, fontSize: 16, color: '#2c3e50' }}>Thông tin phiếu</h3>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 8, paddingLeft: 42 }}>
          <div style={{ flex: '1 1 220px' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', color: '#5a6c7a', marginBottom: 6 }}>Loại phiếu</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => handleChangeType('import')} className="btn" style={{ flex: 1, border: type === 'import' ? '2px solid #2ecc71' : '1px solid #dcdfe3', backgroundColor: type === 'import' ? '#eafaf1' : '#fff', color: type === 'import' ? '#1e7e4f' : '#5a6c7a' }}>📥 Nhập mua</button>
              <button type="button" onClick={() => handleChangeType('export')} className="btn" style={{ flex: 1, border: type === 'export' ? '2px solid #e67e22' : '1px solid #dcdfe3', backgroundColor: type === 'export' ? '#fef2e7' : '#fff', color: type === 'export' ? '#a4560c' : '#5a6c7a' }}>📤 Xuất bán</button>
            </div>
          </div>

          <div style={{ flex: '1 1 220px' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', color: '#5a6c7a', marginBottom: 6 }}>
              {type === 'import' ? 'Nhà cung cấp' : 'Người / bộ phận nhận'}
            </label>
            {type === 'import' ? (
              <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid #dcdfe3', boxSizing: 'border-box' }}>
                <option value="">-- Chọn nhà cung cấp --</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            ) : (
              <input type="text" placeholder="VD: Phòng Kỹ thuật" value={nguoiNhan} onChange={(e) => setNguoiNhan(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid #dcdfe3', boxSizing: 'border-box' }} />
            )}
          </div>

          <div style={{ flex: '1 1 220px' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', color: '#5a6c7a', marginBottom: 6 }}>Ghi chú (không bắt buộc)</label>
            <input type="text" placeholder="Mô tả giao dịch..." value={note} onChange={(e) => setNote(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid #dcdfe3', boxSizing: 'border-box' }} />
          </div>
        </div>

        <div style={{ borderTop: '1px solid #eef0f2', margin: '20px 0' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, opacity: canGoStep2 ? 1 : 0.4 }}>
          <div style={stepStyle(canGoStep2)}>2</div>
          <h3 style={{ margin: 0, fontSize: 16, color: '#2c3e50' }}>Thêm từng mặt hàng vào phiếu</h3>
        </div>

        {canGoStep2 && (
          <div style={{ paddingLeft: 42 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              <select value={lineProductId} onChange={(e) => setLineProductId(e.target.value)} style={{ flex: '2 1 220px', padding: '10px', borderRadius: 6, border: '1px solid #dcdfe3' }}>
                <option value="">-- Chọn sản phẩm --</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.sku} - {p.name} (Tồn: {p.quantity_on_hand})</option>)}
              </select>
              <input type="number" placeholder="Số lượng" value={lineQty} onChange={(e) => setLineQty(e.target.value)} min="1" style={{ flex: '1 1 110px', padding: '10px', borderRadius: 6, border: '1px solid #dcdfe3' }} />
              <input type="number" placeholder="Đơn giá" value={lineUnitPrice} onChange={(e) => setLineUnitPrice(e.target.value)} min="0" style={{ flex: '1 1 130px', padding: '10px', borderRadius: 6, border: '1px solid #dcdfe3' }} />
              <button type="button" onClick={handleAddLine} className="btn btn-primary">+ Thêm vào phiếu</button>
            </div>

            {cart.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
                <thead>
                  <tr style={{ fontSize: 12, color: '#8a94a0', textAlign: 'left' }}>
                    <th style={{ padding: '6px 8px' }}>Sản phẩm</th>
                    <th style={{ padding: '6px 8px' }}>SL</th>
                    <th style={{ padding: '6px 8px' }}>Đơn giá</th>
                    <th style={{ padding: '6px 8px' }}>Thành tiền</th>
                    <th style={{ padding: '6px 8px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((l) => (
                    <tr key={l.key} style={{ borderTop: '1px solid #eef0f2' }}>
                      <td style={{ padding: '8px' }}>{l.sku} — {l.name}</td>
                      <td style={{ padding: '8px' }}>{l.quantity}</td>
                      <td style={{ padding: '8px' }}>{formatCurrency(l.unit_price)}</td>
                      <td style={{ padding: '8px', fontWeight: 'bold' }}>{formatCurrency(l.quantity * l.unit_price)}</td>
                      <td style={{ padding: '8px' }}>
                        <button onClick={() => removeLine(l.key)} className="btn btn-outline btn-sm" style={{ color: '#e74c3c' }}>Xoá</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        <div style={{ borderTop: '1px solid #eef0f2', margin: '20px 0' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, opacity: canSubmit ? 1 : 0.4 }}>
          <div style={stepStyle(canSubmit)}>3</div>
          <h3 style={{ margin: 0, fontSize: 16, color: '#2c3e50' }}>Xác nhận & gửi phiếu</h3>
        </div>
        <div style={{ paddingLeft: 42, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 15 }}>
            Tổng giá trị phiếu: <strong style={{ fontSize: 18, color: '#2c3e50' }}>{formatCurrency(cartTotal)}</strong>
            <span style={{ color: '#8a94a0', fontSize: 13 }}> ({cart.length} mặt hàng)</span>
          </span>
          <button
            onClick={handleSubmitOrder}
            disabled={!canSubmit || submitting}
            className="btn"
            style={{ padding: '12px 28px', fontSize: 15, backgroundColor: canSubmit ? '#2ecc71' : '#c9ced3', color: '#fff' }}
          >
            {submitting ? 'Đang gửi...' : `✓ Tạo phiếu ${type === 'import' ? 'nhập' : 'xuất'}`}
          </button>
        </div>
      </div>

      <div className="app-table-wrap" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h3 style={{ marginTop: 0 }}>📜 Nhật Ký Giao Dịch Kho Công Nghệ</h3>
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
            {history.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 30, textAlign: 'center', color: '#7f8c8d' }}>Chưa có giao dịch nào.</td></tr>
            ) : history.map(tx => (
              <tr key={`${tx._type}-${tx.id}`} style={{ borderBottom: '1px solid #dee2e6' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{tx.code || `#${tx.id}`}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', color: 'white', backgroundColor: tx._type === 'Nhập kho' ? '#2ecc71' : '#e67e22' }}>
                    {tx._type === 'Nhập kho' ? 'Nhập Mua' : 'Xuất Bán'}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>{tx._type === 'Nhập kho' ? (tx.supplier_name || `NCC #${tx.supplier_id}`) : tx.nguoi_nhan}</td>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{formatCurrency(tx.total_amount)}</td>
                <td style={{ padding: '12px' }}>{formatDate(tx.created_at)}</td>
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
