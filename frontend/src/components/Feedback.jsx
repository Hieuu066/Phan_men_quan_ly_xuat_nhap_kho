import React, { useState, useEffect } from 'react';

const styles = {
  success: { bg: '#e6f7ee', border: '#2ecc71', color: '#1e7e4f', icon: '✅' },
  error: { bg: '#fdecea', border: '#e74c3c', color: '#a02f24', icon: '⚠️' },
};

function ToastItem({ toast, onClose }) {
  const s = styles[toast.type] || styles.success;
  return (
    <div style={{
      backgroundColor: s.bg, border: `1px solid ${s.border}`, color: s.color,
      padding: '14px 20px', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      maxWidth: 360, fontSize: 14, display: 'flex', alignItems: 'flex-start', gap: 10,
      marginTop: 10,
    }}>
      <span>{s.icon}</span>
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button onClick={onClose} className="btn-icon" style={{ background: 'none', border: 'none', color: s.color, cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
    </div>
  );
}

/** Đặt 1 lần ở component cha, dùng chung cho cả trang: <ToastContainer toasts={toast.toasts} onRemove={toast.remove} /> */
export function ToastContainer({ toasts, onRemove }) {
  if (!toasts.length) return null;
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
      {toasts.map((t) => <ToastItem key={t.id} toast={t} onClose={() => onRemove(t.id)} />)}
    </div>
  );
}

/**
 * Hộp xác nhận thay cho window.confirm() — bình tĩnh, rõ ràng hơn popup trình duyệt.
 * Dùng: const [confirmState, setConfirmState] = useState(null);
 *       setConfirmState({ message: '...', onConfirm: () => {...} });
 *       <ConfirmModal state={confirmState} onClose={() => setConfirmState(null)} />
 */
export function ConfirmModal({ state, onClose }) {
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (state) setBusy(false); }, [state]);

  if (!state) return null;

  const handleConfirm = async () => {
    setBusy(true);
    await state.onConfirm();
    setBusy(false);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(20,30,40,0.45)', zIndex: 998, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ backgroundColor: '#fff', borderRadius: 10, padding: 26, maxWidth: 380, width: '90%', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50', fontSize: 17 }}>{state.title || 'Xác nhận'}</h3>
        <p style={{ margin: '0 0 22px 0', color: '#5a6c7a', fontSize: 14, lineHeight: 1.5 }}>{state.message}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="btn btn-outline" onClick={onClose} disabled={busy}>Huỷ</button>
          <button className="btn btn-danger" onClick={handleConfirm} disabled={busy}>
            {busy ? 'Đang xử lý...' : (state.confirmLabel || 'Xác nhận')}
          </button>
        </div>
      </div>
    </div>
  );
}
