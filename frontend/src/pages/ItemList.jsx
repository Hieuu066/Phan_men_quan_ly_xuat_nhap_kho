import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Layout } from "../components/layout/Layout";
import { Pagination } from "../components/ui/Pagination";
import { ConfirmModal } from "../components/ui/Modal";
import { ToastContainer } from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";
import { useDebounce } from "../hooks/useDebounce";
import { itemService } from "../services/item.service";

export default function ItemList() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [delId, setDelId] = useState(null); // ID đang chờ xóa
  const [delLoading, setDelLoading] = useState(false);
  const toast = useToast();
  const debouncedSearch = useDebounce(search, 400);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await itemService.getAll({
        page, limit: 10,
        q: debouncedSearch,
        status,
      });
      if (res.success) { setItems(res.data); setMeta(res.meta); }
    } catch { toast.error("Khong the tai du lieu."); }
    finally { setLoading(false); }
  }, [page, debouncedSearch, status]);

  useEffect(() => { load(); }, [load]);

  // Reset về trang 1 khi tìm kiếm/lọc thay đổi
  useEffect(() => { setPage(1); }, [debouncedSearch, status]);

  const handleDelete = async () => {
    if (!delId) return;
    setDelLoading(true);
    try {
      const res = await itemService.remove(delId);
      if (res.success) { toast.success("Xoa thanh cong!"); load(); }
      else toast.error(res.message);
    } catch (err) { toast.error(err.response?.data?.message || "Loi xoa."); }
    finally { setDelLoading(false); setDelId(null); }
  };

  return (
    <Layout>
      <ToastContainer toasts={toast.toasts} onRemove={toast.remove} />

      {/* Page header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
        marginBottom:"var(--sp-4)", flexWrap:"wrap", gap:"var(--sp-2)" }}>
        <h2 style={{ margin:0 }}>Quản lý dữ liệu</h2>
        <div style={{ display:"flex", gap:"var(--sp-2)" }}>
          <button className="btn btn-outline btn-sm" onClick={itemService.exportCSV}>
            📥 Xuất CSV
          </button>
          <Link to="/items/new"><button className="btn btn-primary btn-sm">+ Thêm mới</button></Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom:"var(--sp-4)", display:"flex", gap:"var(--sp-3)", flexWrap:"wrap" }}>
        <input className="form-control" placeholder="🔍 Tìm kiếm tên, mô tả..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex:1, minWidth:200 }} />
        <select className="form-control" value={status} onChange={e => setStatus(e.target.value)} style={{ width:160 }}>
          <option value="">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="inactive">Ngừng hoạt động</option>
        </select>
        {(search || status) && (
          <button className="btn btn-outline btn-sm" onClick={() => { setSearch(""); setStatus(""); }}>
            ✕ Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div style={{ textAlign:"center", padding:40, color:"var(--clr-gray-500)" }}>Đang tải...</div>
        ) : items.length === 0 ? (
          <div style={{ textAlign:"center", padding:40 }}>
            <p style={{ fontSize:48, marginBottom:8 }}>📭</p>
            <p style={{ color:"var(--clr-gray-500)" }}>Không tìm thấy dữ liệu phù hợp.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width:60 }}>ID</th>
                  <th>Tên</th>
                  <th className="hide-mobile">Mô tả</th>
                  <th style={{ width:120 }}>Trạng thái</th>
                  <th className="hide-mobile">Ngày tạo</th>
                  <th style={{ width:120 }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td style={{ color:"var(--clr-gray-500)", fontFamily:"var(--font-mono)" }}>{item.id}</td>
                    <td style={{ fontWeight:500 }}>{item.name}</td>
                    <td className="hide-mobile truncate" style={{ maxWidth:200 }}>{item.description}</td>
                    <td>
                      <span className={`badge badge-${item.status==="active"?"success":"danger"}`}>
                        {item.status === "active" ? "Hoạt động" : "Ngừng"}
                      </span>
                    </td>
                    <td className="hide-mobile">{new Date(item.created_at).toLocaleDateString("vi-VN")}</td>
                    <td>
                      <div className="actions">
                        <Link to={`/items/edit/${item.id}`}>
                          <button className="btn btn-outline btn-sm">✏️</button>
                        </Link>
                        <button className="btn btn-danger btn-sm" onClick={() => setDelId(item.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination meta={meta} onPageChange={setPage} />
      </div>

      {/* Confirm delete modal */}
      <ConfirmModal
        isOpen={!!delId} onClose={() => setDelId(null)}
        onConfirm={handleDelete} loading={delLoading}
        title="Xác nhận xóa"
        message="Bạn có chắc chắn muốn xóa bản ghi này? Hành động không thể hoàn tác."
      />
    </Layout>
  );
}
