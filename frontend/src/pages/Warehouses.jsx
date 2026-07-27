import React, { useState, useEffect, useCallback } from 'react';
import { warehouseService } from '../services/warehouse.service';
import { warehouseStockService } from '../services/warehouseStock.service';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import { ToastContainer, ConfirmModal } from '../components/Feedback';

const cardStyle = { backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '25px' };
const inputStyle = { padding: '9px', width: '100%', boxSizing: 'border-box', border: '1px solid #dcdfe3', borderRadius: 6 };
const cellInputStyle = { padding: '6px', width: '90%', border: '1px solid #dcdfe3', borderRadius: 4 };
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 'bold', color: '#5a6c7a', marginBottom: 5 };

function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function Warehouses() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const toast = useToast();
  const [confirmState, setConfirmState] = useState(null);

  // ───────────────────────── Phần 1: Danh sách kho hàng ─────────────────────────
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [tenKho, setTenKho] = useState('');
  const [diaChi, setDiaChi] = useState('');
  const [sucChua, setSucChua] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editTenKho, setEditTenKho] = useState('');
  const [editDiaChi, setEditDiaChi] = useState('');
  const [editSucChua, setEditSucChua] = useState('');
  const [editTrangThai, setEditTrangThai] = useState('active');

  const loadWarehouses = useCallback(async () => {
    try {
      const res = await warehouseService.getAll({ per_page: 100 });
      if (res.success) setWarehouses(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách kho.');
    }
  }, []);

  useEffect(() => { loadWarehouses().finally(() => setLoading(false)); }, [loadWarehouses]);

  const handleAddWarehouse = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await warehouseService.create({ ten_kho: tenKho, dia_chi: diaChi, suc_chua: Number(sucChua) || 0 });
      if (res.success) {
        setTenKho(''); setDiaChi(''); setSucChua('');
        toast.success('Đã thêm kho hàng mới.');
        await loadWarehouses();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể thêm kho hàng.');
    } finally {
      setSubmitting(false);
    }
  };

  const startEditWarehouse = (w) => {
    setEditingId(w.id);
    setEditTenKho(w.ten_kho);
    setEditDiaChi(w.dia_chi || '');
    setEditSucChua(w.suc_chua ?? '');
    setEditTrangThai(w.trang_thai);
  };

  const handleSaveWarehouse = async (id) => {
    try {
      const res = await warehouseService.update(id, {
        ten_kho: editTenKho, dia_chi: editDiaChi, suc_chua: Number(editSucChua) || 0, trang_thai: editTrangThai,
      });
      if (res.success) {
        setEditingId(null);
        toast.success('Đã cập nhật kho hàng.');
        await loadWarehouses();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật kho hàng.');
    }
  };

  const handleDeleteWarehouse = (id, name) => {
    setConfirmState({
      title: 'Xoá kho hàng',
      message: `Xác nhận xoá kho "${name}"? Chỉ xoá được khi kho không còn hàng tồn và chưa phát sinh phiếu nhập/xuất — nếu không, hãy đổi trạng thái sang "Ngừng hoạt động" thay vì xoá.`,
      confirmLabel: 'Xoá',
      onConfirm: async () => {
        try {
          const res = await warehouseService.remove(id);
          if (res.success) {
            toast.success('Đã xoá kho hàng.');
            await loadWarehouses();
            await loadStock();
          } else {
            toast.error(res.message);
          }
        } catch (err) {
          toast.error(err.response?.data?.message || 'Không thể xoá kho này.');
        }
      },
    });
  };

  // ───────────────────── Phần 2: Tồn kho chi tiết theo kho ─────────────────────
  const [stockRows, setStockRows] = useState([]);
  const [stockMeta, setStockMeta] = useState(null);
  const [stockLoading, setStockLoading] = useState(true);
  const [filterKhoId, setFilterKhoId] = useState('');
  const [filterKeyword, setFilterKeyword] = useState('');
  const [stockPage, setStockPage] = useState(1);
  const debouncedKeyword = useDebounce(filterKeyword, 400);

  const [editingStockId, setEditingStockId] = useState(null);
  const [editThreshold, setEditThreshold] = useState('');

  const loadStock = useCallback(async () => {
    setStockLoading(true);
    try {
      const params = { page: stockPage, per_page: 10 };
      if (filterKhoId) params.kho_id = filterKhoId;
      if (debouncedKeyword) params.keyword = debouncedKeyword;
      const res = await warehouseStockService.getAll(params);
      if (res.success) { setStockRows(res.data); setStockMeta(res.meta); }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể tải tồn kho.');
    } finally {
      setStockLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockPage, filterKhoId, debouncedKeyword]);

  useEffect(() => { setStockPage(1); }, [filterKhoId, debouncedKeyword]);
  useEffect(() => { loadStock(); }, [loadStock]);

  const startEditThreshold = (row) => {
    setEditingStockId(row.id);
    setEditThreshold(row.nguong_canh_bao);
  };

  const handleSaveThreshold = async (id) => {
    try {
      const res = await warehouseStockService.updateThreshold(id, Number(editThreshold) || 0);
      if (res.success) {
        setEditingStockId(null);
        toast.success('Đã cập nhật ngưỡng cảnh báo.');
        await loadStock();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật ngưỡng cảnh báo.');
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải dữ liệu...</div>;

  return (
    <div>
      <ToastContainer toasts={toast.toasts} onRemove={toast.remove} />
      <ConfirmModal state={confirmState} onClose={() => setConfirmState(null)} />

      <h2>🏢 QUẢN LÝ KHO HÀNG</h2>
      {error && <div style={{ padding: 10, marginBottom: 15, backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: 4 }}>{error}</div>}

      {isAdmin && (
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>➕ Thêm kho mới</h3>
          <form onSubmit={handleAddWarehouse} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 2, minWidth: 180 }}>
              <label style={labelStyle}>Tên kho</label>
              <input type="text" placeholder="VD: Kho Chi nhánh Đà Nẵng" value={tenKho} onChange={(e) => setTenKho(e.target.value)} required style={inputStyle} />
            </div>
            <div style={{ flex: 2, minWidth: 200 }}>
              <label style={labelStyle}>Địa chỉ</label>
              <input type="text" value={diaChi} onChange={(e) => setDiaChi(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ flex: 1, minWidth: 130 }}>
              <label style={labelStyle}>Sức chứa</label>
              <input type="number" placeholder="0" min="0" value={sucChua} onChange={(e) => setSucChua(e.target.value)} style={inputStyle} />
            </div>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? 'Đang thêm...' : 'Thêm Mới'}
            </button>
          </form>
        </div>
      )}

      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>📋 Danh sách kho hàng</h3>
        <div className="app-table-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#2c3e50', color: 'white' }}>
                <th style={{ padding: '12px' }}>Tên kho</th>
                <th style={{ padding: '12px' }}>Địa chỉ</th>
                <th style={{ padding: '12px' }}>Sức chứa</th>
                <th style={{ padding: '12px' }}>Tổng tồn kho</th>
                <th style={{ padding: '12px' }}>Trạng thái</th>
                {isAdmin && <th style={{ padding: '12px' }}>Hành động</th>}
              </tr>
            </thead>
            <tbody>
              {warehouses.length === 0 ? (
                <tr><td colSpan={isAdmin ? 6 : 5} style={{ padding: 30, textAlign: 'center', color: '#7f8c8d' }}>Chưa có kho hàng nào.</td></tr>
              ) : warehouses.map((w) => {
                const isEditing = editingId === w.id;
                return (
                  <tr key={w.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>
                      {isEditing ? <input value={editTenKho} onChange={(e) => setEditTenKho(e.target.value)} style={cellInputStyle} /> : w.ten_kho}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {isEditing ? <input value={editDiaChi} onChange={(e) => setEditDiaChi(e.target.value)} style={cellInputStyle} /> : (w.dia_chi || '—')}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {isEditing ? <input type="number" value={editSucChua} onChange={(e) => setEditSucChua(e.target.value)} style={{ ...cellInputStyle, width: 100 }} /> : (w.suc_chua ?? '—')}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{w.tong_ton_kho ?? 0}</td>
                    <td style={{ padding: '12px' }}>
                      {isEditing ? (
                        <select value={editTrangThai} onChange={(e) => setEditTrangThai(e.target.value)} style={{ padding: '6px', border: '1px solid #dcdfe3', borderRadius: 4 }}>
                          <option value="active">Hoạt động</option>
                          <option value="inactive">Ngừng hoạt động</option>
                        </select>
                      ) : (
                        <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', color: '#fff', backgroundColor: w.trang_thai === 'active' ? '#2ecc71' : '#95a5a6' }}>
                          {w.trang_thai === 'active' ? 'Hoạt động' : 'Ngừng hoạt động'}
                        </span>
                      )}
                    </td>
                    {isAdmin && (
                      <td style={{ padding: '12px' }}>
                        {isEditing ? (
                          <>
                            <button onClick={() => handleSaveWarehouse(w.id)} className="btn btn-success btn-sm" style={{ marginRight: 6 }}>Lưu</button>
                            <button onClick={() => setEditingId(null)} className="btn btn-outline btn-sm">Hủy</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEditWarehouse(w)} className="btn btn-warning btn-sm" style={{ marginRight: 6 }}>Sửa</button>
                            <button onClick={() => handleDeleteWarehouse(w.id, w.ten_kho)} className="btn btn-danger btn-sm">Xóa</button>
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, flexWrap: 'wrap', gap: 10 }}>
          <h3 style={{ margin: 0 }}>📊 Tồn kho chi tiết theo kho</h3>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <select value={filterKhoId} onChange={(e) => setFilterKhoId(e.target.value)} style={{ padding: '9px 12px', border: '1px solid #dcdfe3', borderRadius: '6px' }}>
              <option value="">-- Tất cả kho --</option>
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.ten_kho}</option>)}
            </select>
            <input
              type="text"
              placeholder="🔍 Tìm theo tên hàng hóa hoặc SKU..."
              value={filterKeyword}
              onChange={(e) => setFilterKeyword(e.target.value)}
              style={{ padding: '9px 12px', width: '260px', border: '1px solid #dcdfe3', borderRadius: '6px' }}
            />
          </div>
        </div>

        <div className="app-table-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#2c3e50', color: 'white' }}>
                <th style={{ padding: '12px' }}>Kho</th>
                <th style={{ padding: '12px' }}>Hàng hóa</th>
                <th style={{ padding: '12px' }}>Nhà cung cấp</th>
                <th style={{ padding: '12px' }}>Số lượng tồn</th>
                <th style={{ padding: '12px' }}>Ngưỡng cảnh báo</th>
                <th style={{ padding: '12px' }}></th>
              </tr>
            </thead>
            <tbody>
              {stockLoading ? (
                <tr><td colSpan={6} style={{ padding: 30, textAlign: 'center', color: '#7f8c8d' }}>Đang tải...</td></tr>
              ) : stockRows.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 30, textAlign: 'center', color: '#7f8c8d' }}>Không có dữ liệu tồn kho phù hợp.</td></tr>
              ) : stockRows.map((row) => {
                const isLow = row.so_luong_ton <= row.nguong_canh_bao;
                const isEditingThreshold = editingStockId === row.id;
                return (
                  <tr key={row.id} style={{ borderBottom: '1px solid #dee2e6', backgroundColor: isLow ? '#fff5f5' : 'transparent' }}>
                    <td style={{ padding: '12px' }}>{row.ten_kho}</td>
                    <td style={{ padding: '12px' }}>{row.sku} — {row.product_name}</td>
                    <td style={{ padding: '12px' }}>{row.supplier_name || '—'}</td>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>
                      {row.so_luong_ton}
                      {isLow && (
                        <span style={{ marginLeft: 8, padding: '3px 8px', borderRadius: '20px', fontSize: '11px', color: '#fff', backgroundColor: '#e74c3c' }}>
                          ⚠ Sắp hết
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {isEditingThreshold ? (
                        <input type="number" min="0" value={editThreshold} onChange={(e) => setEditThreshold(e.target.value)} style={{ ...cellInputStyle, width: 90 }} />
                      ) : row.nguong_canh_bao}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {isEditingThreshold ? (
                        <>
                          <button onClick={() => handleSaveThreshold(row.id)} className="btn btn-success btn-sm" style={{ marginRight: 6 }}>Lưu</button>
                          <button onClick={() => setEditingStockId(null)} className="btn btn-outline btn-sm">Hủy</button>
                        </>
                      ) : (
                        <button onClick={() => startEditThreshold(row)} className="btn btn-warning btn-sm">Sửa ngưỡng</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {stockMeta && stockMeta.total_pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
            <span style={{ fontSize: 13, color: '#7f8c8d' }}>Hiển thị {stockMeta.from}–{stockMeta.to} / {stockMeta.total} dòng</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setStockPage((p) => p - 1)} disabled={!stockMeta.has_prev} className="btn btn-outline btn-sm">‹ Trước</button>
              <span style={{ padding: '6px 12px' }}>Trang {stockMeta.current_page}/{stockMeta.total_pages}</span>
              <button onClick={() => setStockPage((p) => p + 1)} disabled={!stockMeta.has_next} className="btn btn-outline btn-sm">Sau ›</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Warehouses;
