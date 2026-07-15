import { useEffect } from "react";

const ICONS = { success:"✓", error:"✗", warning:"⚠", info:"ℹ" };
const COLORS = {
  success:"#d1fae5","success-border":"#34d399",
  error:"#fee2e2", "error-border": "#f87171",
  warning:"#fef3c7","warning-border":"#fbbf24",
  info:"#dbeafe", "info-border": "#60a5fa",
};

function Toast({ id, message, type, onRemove }) {
  useEffect(() => {
    const t = setTimeout(() => onRemove(id), 4000);
    return () => clearTimeout(t);
  }, [id, onRemove]);

  return (
    <div style={{
      display:"flex", alignItems:"center", gap:10, padding:"12px 16px",
      background: COLORS[type] || "#fff",
      borderLeft: `4px solid ${COLORS[type+"-border"] || "#ccc"}`,
      borderRadius:"var(--r-md)", boxShadow:"var(--shadow-lg)",
      marginBottom:8, minWidth:280, maxWidth:380,
      animation:"slideIn .25s ease",
    }}>
      <span style={{ fontSize:18, fontWeight:700 }}>{ICONS[type]}</span>
      <span style={{ flex:1, fontSize:"var(--text-sm)" }}>{message}</span>
      <button onClick={() => onRemove(id)}
        style={{ background:"none",border:"none",cursor:"pointer",fontSize:18,opacity:.6 }}>
        ×
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onRemove }) {
  if (!toasts.length) return null;
  return (
    <div style={{ position:"fixed", bottom:20, right:20, zIndex:9999 }}>
      <style>{`@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:none;opacity:1}}`}</style>
      {toasts.map(t => <Toast key={t.id} {...t} onRemove={onRemove} />)}
    </div>
  );
}
