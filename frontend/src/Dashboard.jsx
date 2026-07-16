import React from 'react';

function Dashboard({ products, warehouses, transactions }) {
  const totalItems = products.length;
  const lowStockItems = products.filter(p => p.quantity > 0 && p.quantity < 20).length; // Linh kiện điện tử dưới 20 là thấp
  const outOfStockItems = products.filter(p => p.quantity === 0).length;
  const totalMovements = transactions.length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #dee2e6', paddingBottom: '15px', marginBottom: '25px' }}>
        <h2 style={{ margin: 0, color: '#2c3e50' }}>HỆ THỐNG ĐIỀU HÀNH KHO LINH KIỆN MÁY TÍNH & ĐIỆN TỬ KTS</h2>
        <span style={{ fontWeight: 'bold', color: '#3498db' }}>Vai trò: Quản trị kho hàng công nghệ</span>
      </div>

      {/* THẺ CHỈ SỐ KPA */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <div style={{ flex: 1, backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '5px solid #2ecc71' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#7f8c8d', textTransform: 'uppercase', fontSize: '11px' }}>Tổng SKU Linh Kiện</h4>
          <p style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#2c3e50' }}>{totalItems} <span style={{ fontSize: '14px', color: '#7f8c8d' }}>Mẫu mã</span></p>
        </div>
        <div style={{ flex: 1, backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '5px solid #f1c40f' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#7f8c8d', textTransform: 'uppercase', fontSize: '11px' }}>Sắp cháy hàng (&lt;20 chiếc)</h4>
          <p style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#f1c40f' }}>{lowStockItems} <span style={{ fontSize: '14px', color: '#7f8c8d' }}>Linh kiện</span></p>
        </div>
        <div style={{ flex: 1, backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '5px solid #e74c3c' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#7f8c8d', textTransform: 'uppercase', fontSize: '11px' }}>Tồn kho bằng 0</h4>
          <p style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#e74c3c' }}>{outOfStockItems} <span style={{ fontSize: '14px', color: '#7f8c8d' }}>Chủng loại</span></p>
        </div>
        <div style={{ flex: 1, backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '5px solid #3498db' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#7f8c8d', textTransform: 'uppercase', fontSize: '11px' }}>Lượt mua bán/giao dịch</h4>
          <p style={{ fontSize: '28px', fontWeight: 'bold', margin: 0, color: '#3498db' }}>{totalMovements} <span style={{ fontSize: '14px', color: '#7f8c8d' }}>Chứng từ</span></p>
        </div>
      </div>

      {/* BẢNG TỔNG QUAN TỒN KHO THỰC TẾ */}
      <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#2c3e50' }}>📊 Báo Cáo Hiện Trạng Tồn Kho Chi Tiết</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
              <th style={{ padding: '12px' }}>Mã hàng</th>
              <th style={{ padding: '12px' }}>Tên linh kiện điện tử</th>
              <th style={{ padding: '12px' }}>Nhóm sản phẩm</th>
              <th style={{ padding: '12px' }}>Vị trí lưu kho</th>
              <th style={{ padding: '12px' }}>Số lượng còn lại</th>
              <th style={{ padding: '12px' }}>Trạng thái phân phối</th>
            </tr>
          </thead>
          <tbody>
            {products.map((item) => {
              const whName = warehouses.find(w => w.id === item.warehouse_id)?.name || 'Chưa định vị kho';
              let statusText = 'Đủ hàng bán'; let statusColor = '#2ecc71';
              if (item.quantity === 0) {
                statusText = 'Hết hàng'; statusColor = '#e74c3c';
              } else if (item.quantity < 20) {
                statusText = 'Cần nhập gấp'; statusColor = '#f1c40f';
              }

              return (
                <tr key={item.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#34495e' }}>{item.id}</td>
                  <td style={{ padding: '12px' }}>{item.name}</td>
                  <td style={{ padding: '12px', color: '#7f8c8d' }}>{item.category}</td>
                  <td style={{ padding: '12px' }}>🏬 {whName}</td>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{item.quantity.toLocaleString()} chiếc</td>
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