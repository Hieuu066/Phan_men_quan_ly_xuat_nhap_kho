/**
 * Component phân trang với nút first/prev/numbers/next/last.
 * meta = { total, per_page, current_page, total_pages, from, to }
 */
export function Pagination({ meta, onPageChange }) {
  if (!meta || meta.total_pages <= 1) return null;
  const { current_page: cur, total_pages: total, from, to, total: cnt } = meta;

  // Tạo danh sách số trang với dấu "..."
  const pages = () => {
    const r = [], delta = 2;
    let prev = null;
    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= cur - delta && i <= cur + delta)) {
        if (prev !== null && i - prev > 1) r.push("...");
        r.push(i); prev = i;
      }
    }
    return r;
  };

  return (
    <div className="pagination">
      <span className="pagination-info">
        Hiển thị {from}–{to} / {cnt} bản ghi
      </span>
      <div className="pagination-controls">
        <button onClick={() => onPageChange(1)} disabled={cur === 1} title="Trang đầu">«</button>
        <button onClick={() => onPageChange(cur - 1)} disabled={cur === 1} title="Trang trước">‹</button>
        {pages().map((p, i) =>
          p === "..." ? <span key={i} style={{ padding:"0 6px",alignSelf:"center" }}>…</span> :
          <button key={i} className={p === cur ? "active" : ""} onClick={() => onPageChange(p)}>{p}</button>
        )}
        <button onClick={() => onPageChange(cur + 1)} disabled={cur === total} title="Trang sau">›</button>
        <button onClick={() => onPageChange(total)} disabled={cur === total} title="Trang cuối">»</button>
      </div>
    </div>
  );
}
