import { useState, useRef } from "react";

/**
 * Component upload file có drag-and-drop và preview ảnh.
 * Sử dụng: <FileUpload name="image" accept="image/*" onSelect={setFile} preview={url} />
 */
export function FileUpload({ name, accept, onSelect, preview, label }) {
  const [drag, setDrag] = useState(false);
  const [localPreview, setLocalPreview] = useState(preview || null);
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    onSelect(file);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setLocalPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const onDrop = (e) => {
    e.preventDefault(); setDrag(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${drag ? "var(--clr-primary-l)" : "var(--clr-gray-300)"}`,
          borderRadius:"var(--r-lg)", padding:24, textAlign:"center", cursor:"pointer",
          background: drag ? "var(--clr-primary-bg)" : "var(--clr-gray-100)",
          transition:"all var(--transition)",
        }}
      >
        {localPreview ? (
          <img src={localPreview} alt="preview" style={{ maxHeight:160, borderRadius:"var(--r-md)", objectFit:"cover" }} />
        ) : (
          <div>
            <p style={{ fontSize:32, marginBottom:8 }}>📁</p>
            <p style={{ color:"var(--clr-gray-600)", fontSize:"var(--text-sm)" }}>
              {label || "Kéo thả file vào đây hoặc nhấn để chọn"}
            </p>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" name={name} accept={accept || "image/*"}
        style={{ display:"none" }} onChange={(e) => handleFile(e.target.files[0])} />
      {localPreview && (
        <button type="button" onClick={() => { setLocalPreview(null); onSelect(null); }}
          style={{ marginTop:8, fontSize:"var(--text-sm)", color:"var(--clr-danger)", background:"none", border:"none", cursor:"pointer" }}>
          ✕ Xóa ảnh
        </button>
      )}
    </div>
  );
}
