import { useState, useEffect } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, Title, Tooltip, Legend
} from "chart.js";
import { Layout } from "../components/layout/Layout";
import { statsService } from "../services/stats.service";

// Đăng ký Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

function StatCard({ icon, label, value, color, trend }) {
  return (
    <div className="card" style={{ display:"flex", alignItems:"center", gap:16 }}>
      <div style={{ width:56, height:56, borderRadius:"var(--r-lg)",
        background:`${color}20`, display:"flex", alignItems:"center",
        justifyContent:"center", fontSize:28 }}>{icon}</div>
      <div>
        <p style={{ margin:0, fontSize:"var(--text-sm)", color:"var(--clr-gray-500)" }}>{label}</p>
        <p style={{ margin:0, fontSize:"var(--text-3xl)", fontWeight:700, color }}>{value ?? "—"}</p>
        {trend && <p style={{ margin:0, fontSize:"var(--text-xs)", color:"var(--clr-secondary)" }}>{trend}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    statsService.getSummary()
      .then(r => { if (r.success) setStats(r.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><div style={{ textAlign:"center",padding:60 }}>Đang tải...</div></Layout>;

  // Dữ liệu biểu đồ cột (số lượng theo tháng)
  const monthly = stats?.monthly_items || [];
  const barData = {
    labels: monthly.map(m => m.month),
    datasets: [{ label:"Bản ghi mới", data: monthly.map(m => m.cnt),
      backgroundColor:"rgba(26,82,118,.7)", borderRadius:6 }],
  };

  // Dữ liệu biểu đồ tròn (người dùng theo vai trò)
  const roleData = stats?.users_by_role || {};
  const doughnutData = {
    labels: Object.keys(roleData),
    datasets: [{ data: Object.values(roleData),
      backgroundColor:["#1a5276","#27ae60","#f39c12","#e74c3c"] }],
  };

  return (
    <Layout>
      <h2 style={{ marginBottom:"var(--sp-6)" }}>Tổng quan hệ thống</h2>

      {/* Stat cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:"var(--sp-4)", marginBottom:"var(--sp-6)" }}>
        <StatCard icon="👥" label="Tổng người dùng" value={stats?.users_total} color="var(--clr-primary)" />
        <StatCard icon="📋" label="Tổng bản ghi" value={stats?.items_total} color="var(--clr-secondary)" />
        <StatCard icon="✅" label="Đang hoạt động" value={stats?.items_active} color="var(--clr-info)" />
      </div>

      {/* Charts */}
      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:"var(--sp-4)", marginBottom:"var(--sp-6)" }}>
        <div className="card">
          <h3 style={{ marginBottom:"var(--sp-4)", fontSize:"var(--text-base)" }}>Tăng trưởng 6 tháng gần nhất</h3>
          <Bar data={barData} options={{ responsive:true, plugins:{ legend:{display:false} } }} />
        </div>
        <div className="card">
          <h3 style={{ marginBottom:"var(--sp-4)", fontSize:"var(--text-base)" }}>Phân bố người dùng</h3>
          <Doughnut data={doughnutData} options={{ responsive:true }} />
        </div>
      </div>

      {/* Recent items */}
      <div className="card">
        <h3 style={{ marginBottom:"var(--sp-4)", fontSize:"var(--text-base)" }}>Bản ghi mới nhất</h3>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>ID</th><th>Tên</th><th>Trạng thái</th><th>Ngày tạo</th></tr></thead>
            <tbody>
              {(stats?.recent_items || []).map(item => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.name}</td>
                  <td><span className={`badge badge-${item.status === "active" ? "success" : "danger"}`}>{item.status}</span></td>
                  <td>{new Date(item.created_at).toLocaleDateString("vi-VN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
