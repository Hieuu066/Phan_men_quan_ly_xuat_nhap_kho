import React, { useState, useEffect, useMemo } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { reportService } from "../services/report.service";
import { productService } from "../services/product.service";
import { orderService } from "../services/order.service";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [lowStockList, setLowStockList] = useState([]);
  const [products, setProducts] = useState([]);
  const [totalMovements, setTotalMovements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [summaryRes, lowStockRes, productsRes, importRes, exportRes] = await Promise.all([
          reportService.getSummary(),
          reportService.getLowStock(),
          productService.getAll({ per_page: 100 }),
          orderService.getImportOrders({ per_page: 1 }),
          orderService.getExportOrders({ per_page: 1 }),
        ]);
        if (cancelled) return;
        if (summaryRes.success) setSummary(summaryRes.data);
        if (lowStockRes.success) setLowStockList(lowStockRes.data);
        if (productsRes.success) setProducts(productsRes.data);
        setTotalMovements((importRes.meta?.total || 0) + (exportRes.meta?.total || 0));
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || "Không thể tải dữ liệu Dashboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // ── Dữ liệu biểu đồ 1: Số lượng mặt hàng theo từng nhóm sản phẩm ──
  const categoryChartData = useMemo(() => {
    const counts = {};
    products.forEach((p) => {
      const cat = p.category || "Chưa phân loại";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    const labels = Object.keys(counts);
    return {
      labels,
      datasets: [
        {
          label: "Số SKU",
          data: labels.map((l) => counts[l]),
          backgroundColor: "rgba(52, 152, 219, 0.75)",
          borderRadius: 6,
        },
      ],
    };
  }, [products]);

  // ── Dữ liệu biểu đồ 2: Tỉ lệ tình trạng tồn kho ──
  const stockStatusChartData = useMemo(() => {
    let ok = 0, low = 0, out = 0;
    products.forEach((p) => {
      const qty = Number(p.quantity_on_hand);
      const min = Number(p.min_stock);
      if (qty === 0) out += 1;
      else if (qty < min) low += 1;
      else ok += 1;
    });
    return {
      labels: ["Đủ hàng bán", "Cần nhập gấp", "Hết hàng"],
      datasets: [
        {
          data: [ok, low, out],
          backgroundColor: ["#2ecc71", "#f1c40f", "#e74c3c"],
          borderWidth: 0,
        },
      ],
    };
  }, [products]);

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Đang tải dữ liệu...</div>;
  if (error) return <div style={{ padding: 20, color: "#e74c3c" }}>{error}</div>;

  const outOfStockCount = lowStockList.filter((p) => Number(p.quantity_on_hand) === 0).length;
  const lowStockCount = lowStockList.length - outOfStockCount;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "2px solid #dee2e6",
          paddingBottom: "15px",
          marginBottom: "25px",
        }}
      >
        <h2 style={{ margin: 0, color: "#2c3e50" }}>
          HỆ THỐNG ĐIỀU HÀNH KHO LINH KIỆN MÁY TÍNH & ĐIỆN TỬ KTS
        </h2>
        <span style={{ fontWeight: "bold", color: "#3498db" }}>
          Vai trò: Quản trị kho hàng công nghệ
        </span>
      </div>

      {/* THẺ CHỈ SỐ KPI */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "30px" }}>
        <div style={{ flex: 1, backgroundColor: "#fff", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", borderLeft: "5px solid #2ecc71" }}>
          <h4 style={{ margin: "0 0 10px 0", color: "#7f8c8d", textTransform: "uppercase", fontSize: "11px" }}>Tổng SKU Linh Kiện</h4>
          <p style={{ fontSize: "28px", fontWeight: "bold", margin: 0, color: "#2c3e50" }}>
            {summary?.total_products ?? 0} <span style={{ fontSize: "14px", color: "#7f8c8d" }}>Mẫu mã</span>
          </p>
        </div>
        <div style={{ flex: 1, backgroundColor: "#fff", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", borderLeft: "5px solid #f1c40f" }}>
          <h4 style={{ margin: "0 0 10px 0", color: "#7f8c8d", textTransform: "uppercase", fontSize: "11px" }}>Sắp cháy hàng (dưới định mức)</h4>
          <p style={{ fontSize: "28px", fontWeight: "bold", margin: 0, color: "#f1c40f" }}>
            {lowStockCount} <span style={{ fontSize: "14px", color: "#7f8c8d" }}>Linh kiện</span>
          </p>
        </div>
        <div style={{ flex: 1, backgroundColor: "#fff", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", borderLeft: "5px solid #e74c3c" }}>
          <h4 style={{ margin: "0 0 10px 0", color: "#7f8c8d", textTransform: "uppercase", fontSize: "11px" }}>Tồn kho bằng 0</h4>
          <p style={{ fontSize: "28px", fontWeight: "bold", margin: 0, color: "#e74c3c" }}>
            {outOfStockCount} <span style={{ fontSize: "14px", color: "#7f8c8d" }}>Chủng loại</span>
          </p>
        </div>
        <div style={{ flex: 1, backgroundColor: "#fff", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", borderLeft: "5px solid #3498db" }}>
          <h4 style={{ margin: "0 0 10px 0", color: "#7f8c8d", textTransform: "uppercase", fontSize: "11px" }}>Lượt mua bán/giao dịch</h4>
          <p style={{ fontSize: "28px", fontWeight: "bold", margin: 0, color: "#3498db" }}>
            {totalMovements} <span style={{ fontSize: "14px", color: "#7f8c8d" }}>Chứng từ</span>
          </p>
        </div>
      </div>

      {/* BIỂU ĐỒ TRỰC QUAN */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px", marginBottom: "30px" }}>
        <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
          <h3 style={{ marginTop: 0, marginBottom: "15px", color: "#2c3e50", fontSize: "16px" }}>📊 Số lượng SKU theo nhóm sản phẩm</h3>
          {products.length === 0 ? (
            <p style={{ color: "#7f8c8d", textAlign: "center", padding: "40px 0" }}>Chưa có dữ liệu sản phẩm.</p>
          ) : (
            <Bar data={categoryChartData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { ticks: { stepSize: 1 } } } }} />
          )}
        </div>
        <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
          <h3 style={{ marginTop: 0, marginBottom: "15px", color: "#2c3e50", fontSize: "16px" }}>🥧 Tỉ lệ tình trạng tồn kho</h3>
          {products.length === 0 ? (
            <p style={{ color: "#7f8c8d", textAlign: "center", padding: "40px 0" }}>Chưa có dữ liệu sản phẩm.</p>
          ) : (
            <Doughnut data={stockStatusChartData} options={{ responsive: true, plugins: { legend: { position: "bottom" } } }} />
          )}
        </div>
      </div>

      {/* BẢNG TỔNG QUAN TỒN KHO THỰC TẾ */}
      <div style={{ backgroundColor: "#fff", padding: "25px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
        <h3 style={{ marginTop: 0, marginBottom: "20px", color: "#2c3e50" }}>📊 Báo Cáo Hiện Trạng Tồn Kho Chi Tiết</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #dee2e6" }}>
              <th style={{ padding: "12px" }}>Mã hàng (SKU)</th>
              <th style={{ padding: "12px" }}>Tên linh kiện điện tử</th>
              <th style={{ padding: "12px" }}>Nhóm sản phẩm</th>
              <th style={{ padding: "12px" }}>Nhà cung cấp</th>
              <th style={{ padding: "12px" }}>Số lượng còn lại</th>
              <th style={{ padding: "12px" }}>Trạng thái phân phối</th>
            </tr>
          </thead>
          <tbody>
            {products.map((item) => {
              const qty = Number(item.quantity_on_hand);
              const minStock = Number(item.min_stock);
              let statusText = "Đủ hàng bán";
              let statusColor = "#2ecc71";
              if (qty === 0) {
                statusText = "Hết hàng";
                statusColor = "#e74c3c";
              } else if (qty < minStock) {
                statusText = "Cần nhập gấp";
                statusColor = "#f1c40f";
              }

              return (
                <tr key={item.id} style={{ borderBottom: "1px solid #dee2e6" }}>
                  <td style={{ padding: "12px", fontWeight: "bold", color: "#34495e" }}>{item.sku}</td>
                  <td style={{ padding: "12px" }}>{item.name}</td>
                  <td style={{ padding: "12px", color: "#7f8c8d" }}>{item.category}</td>
                  <td style={{ padding: "12px" }}>🏭 {item.supplier_name || "Chưa gán NCC"}</td>
                  <td style={{ padding: "12px", fontWeight: "bold" }}>{qty.toLocaleString()} {item.unit}</td>
                  <td style={{ padding: "12px" }}>
                    <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "11px", color: "#fff", fontWeight: "bold", backgroundColor: statusColor }}>
                      {statusText}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;
