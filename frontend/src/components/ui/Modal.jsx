import { useEffect } from "react";

/**
 * Modal hộp thoại tái sử dụng.
 * Sử dụng: <Modal isOpen={bool} onClose={fn} title="Tiêu đề"><Nội dung/></Modal>
 */
export function Modal({ isOpen, onClose, title, children, maxWidth = 560 }) {
  // Đóng modal khi nhấn Escape
  useEffect(() => {
    const fn = (e) => e.key === "Escape" && onClose();
    if (isOpen) document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [isOpen, onClose]);

  // Khóa scroll body khi modal mở
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{ position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      {/* Overlay */}
      <div style={{ position:"absolute",inset:0,background:"rgba(0,0,0,.5)",backdropFilter:"blur(4px)" }}/>
      {/* Dialog */}
      <div style={{ position:"relative",width:"100%",maxWidth,background:"#fff",
        borderRadius:"var(--r-xl)",boxShadow:"var(--shadow-xl)",overflow:"hidden" }}>
        {/* Header */}
        <div style={{ padding:"16px 20px",borderBottom:"1px solid var(--clr-gray-200)",
          display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <h3 style={{ margin:0,fontSize:"var(--text-lg)",fontWeight:600 }}>{title}</h3>
          <button onClick={onClose}
            style={{ background:"none",border:"none",fontSize:22,cursor:"pointer",
              color:"var(--clr-gray-500)",lineHeight:1 }}>×</button>
        </div>
        {/* Body */}
        <div style={{ padding:20 }}>{children}</div>
      </div>
    </div>
  );
}

/** Modal xác nhận xóa (confirm dialog) */
export function ConfirmModal({ isOpen, onClose, onConfirm, title, message, loading }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || "Xac nhan"} maxWidth={400}>
      <p style={{ marginBottom:20, color:"var(--clr-gray-700)" }}>{message}</p>
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
        <button className="btn btn-outline" onClick={onClose} disabled={loading}>Huy</button>
        <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
          {loading ? "Dang xu ly..." : "Xoa"}
        </button>
      </div>
    </Modal>
  );
}
