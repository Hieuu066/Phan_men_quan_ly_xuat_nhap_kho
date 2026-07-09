import React from 'react';

function Dashboard({ products, warehouses, transactions }) {
  // Thống kê nghiệp vụ SQL thông minh mô phỏng
  const totalItems = products.length;
  const lowStockItems = products.filter(p => p.quantity > 0 && p.quantity < 100).length;
  const outOfStockItems = products.filter(p => p.quantity === 0).length;
  const totalMovements = transactions.length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #dee2e6', paddingBottom: '15px', marginBottom: '25px' }}>
        <h2 style={{ margin: 0, color: '#2c3e50' }}>HỆ THỐNG ĐIỀU HÀNH CHUỖI CUNG ỨNG & TỒN KHO KTS</h2>
        <span style={{ fontWeight: 'bold', color: '#1abc9c' }}>Vai trò: Quản trị viên điều hành Tổng kho</span>
      </div>

      {/* THẺ CHỈ SỐ KPA THỰC TẾ CHUẨN ĐỒ ÁN */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <div style={{ flex: 1, backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '5px solid #2ecc71' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#7f8c8d', textTransform: 'uppercase', fontSize: '12px' }}>Mặt hàng quản lý</h4>
          <p style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#2c3e50' }}>{totalItems} <span style={{ fontSize: '14px', color: '#7f8c8d' }}>SKU</span></p>
        </div>
        <div style={{ flex: 1, backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '5px solid #f1c40f' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#7f8c8d', textTransform: 'uppercase', fontSize: '12px' }}>Cảnh báo tồn kho thấp (&lt;100)</h4>
          <p style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#f1c40f' }}>{lowStockItems} <span style={{ fontSize: '14px', color: '#7f8c8d' }}>Mặt hàng</span></p>
        </div>
        <div style={{ flex: 1, backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '5px solid #e74c3c' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#7f8c8d', textTransform: 'uppercase', fontSize: '12px' }}>Chạm ngưỡng khẩn cấp (Hết hàng)</h4>
          <p style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#e74c3c' }}>{outOfStockItems} <span style={{ fontSize: '14px', color: '#7f8c8d' }}>Chủng loại</span></p>
        </div>
        <div style={{ flex: 1, backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '5px solid #3498db' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#7f8c8d', textTransform: 'uppercase', fontSize: '12px' }}>Tổng lượt xuất/nhập lưu kho</h4>
          <p style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#3498db' }}>{totalMovements} <span style={{ fontSize: '14px', color: '#7f8c8d' }}>Chứng từ</span></p>
        </div>
      </div>

      {/* BẢNG TỔNG QUAN TỒN KHO THỰC TẾ */}
      <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#2c3e50' }}>📊 Báo Cáo Trực Quan Trạng Thái Tồn Kho (Mô phỏng bảng inventories)</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
              <th style={{ padding: '12px' }}>Mã hàng</th>
              <th style={{ padding: '12px' }}>Tên chi tiết vật tư</th>
              <th style={{ padding: '12px' }}>Phân nhóm danh mục</th>
              <th style={{ padding: '12px' }}>Vị trí kho lưu trữ</th>
              <th style={{ padding: '12px' }}>Sản lượng khả dụng</th>
              <th style={{ padding: '12px' }}>Trạng thái vận hành</th>
            </tr>
          </thead>
          <tbody>
            {products.map((item) => {
              const whName = warehouses.find(w => w.id === item.warehouse_id)?.name || 'Chưa định vị kho';
              let statusText = 'An toàn'; let statusColor = '#2ecc71';
              if (item.quantity === 0) {
                statusText = 'Hết sạch hàng'; statusColor = '#e74c3c';
              } else if (item.quantity < 100) {
                statusText = 'Ngưỡng nguy hiểm'; statusColor = '#f1c40f';
              }

              return (
                <tr key={item.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#34495e' }}>{item.id}</td>
                  <td style={{ padding: '12px' }}>{item.name}</td>
                  <td style={{ padding: '12px', color: '#7f8c8d' }}>{item.category}</td>
                  <td style={{ padding: '12px' }}>🏢 {whName}</td>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{item.quantity.toLocaleString()}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', color: '#fff', fontWeight: 'bold', backgroundColor: statusColor }}>
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