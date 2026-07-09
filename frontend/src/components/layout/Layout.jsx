import { useState } from "react";
import { Sidebar } from "./Sidebar";

export function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display:"flex", minHeight:"100vh" }}>
      <Sidebar isOpen={sidebarOpen} />

      {/* Overlay đóng sidebar trên mobile */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.4)",zIndex:99 }}/>
      )}

      <main style={{ flex:1, marginLeft:"var(--sidebar-w)", minHeight:"100vh",
        background:"var(--clr-gray-100)", display:"flex", flexDirection:"column" }}>
        {/* Mobile header */}
        <header style={{ display:"none",padding:"var(--sp-3) var(--sp-4)",
          background:"var(--clr-white)", boxShadow:"var(--shadow-sm)",
          alignItems:"center", gap:"var(--sp-3)" }}
          className="mobile-header">
          <button onClick={() => setSidebarOpen(o => !o)}
            style={{ background:"none",border:"none",fontSize:24,cursor:"pointer" }}>☰</button>
          <h2 style={{ margin:0, fontSize:"var(--text-lg)" }}>Hệ Thống</h2>
        </header>

        <div style={{ flex:1, padding:"var(--sp-6) var(--sp-8)", maxWidth:"var(--content-max)" }}
          className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
}
