import React from 'react';

function Dashboard({ products, categories, onNavigateToProducts }) {
  const totalItems = products.length;
  const lowStockItems = products.filter(p => p.quantity > 0 && p.quantity < 100).length;
  const outOfStockItems = products.filter(p => p.quantity === 0).length;

  return (
    <div style={{ fontFamily: 'Arial', padding: '20px', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #dee2e6', paddingBottom: '10px', marginBottom: '20px' }}>
        <h2>HỆ THỐNG QUẢN TRỊ CHUỖI CUNG ỨNG & KHO HÀNG (LARAVEL 12 & REACT)</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={onNavigateToProducts} style={{ padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            ⚙ Vào Quản Lý Kho Hàng
          </button>
          <span style={{ fontWeight: 'bold', color: '#28a745' }}>Xin chào, Admin</span>
        </div>
      </div>

      {/* Hộp số liệu thống kê sử dụng SQL nâng cao mô phỏng */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <div style={{ flex: 1, backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', borderLeft: '5px solid #28a745' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#666' }}>Tổng số mặt hàng</h4>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{totalItems} loại</p>
        </div>
        <div style={{ flex: 1, backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', borderLeft: '5px solid #ffc107' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#666' }}>Mặt hàng sắp hết (dưới 100)</h4>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#ffc107' }}>{lowStockItems} mặt hàng</p>
        </div>
        <div style={{ flex: 1, backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', borderLeft: '5px solid #dc3545' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#666' }}>Cảnh báo hết hàng trong kho</h4>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#dc3545' }}>{outOfStockItems} mặt hàng</p>
        </div>
      </div>

      {/* Bảng theo dõi thực tế */}
      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#333' }}>Danh Sách Kiểm Tra Tồn Kho Thực Tế (Bảng điều khiển)</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#e9ecef', borderBottom: '2px solid #dee2e6' }}>
              <th style={{ padding: '12px' }}>Mã SP</th>
              <th style={{ padding: '12px' }}>Tên Sản Phẩm</th>
              <th style={{ padding: '12px' }}>Danh Mục Hệ Thống</th>
              <th style={{ padding: '12px' }}>Số Lượng Tồn</th>
              <th style={{ padding: '12px' }}>Trạng Thái</th>
            </tr>
          </thead>
          <tbody>
            {products.map((item) => {
              const catName = categories.find(c => c.id === item.category_id)?.name || 'Chưa phân loại';
              let statusText = 'Còn hàng';
              let statusColor = '#28a745';
              if (item.quantity === 0) {
                statusText = 'Hết hàng'; statusColor = '#dc3545';
              } else if (item.quantity < 100) {
                statusText = 'Sắp hết hàng'; statusColor = '#ffc107';
              }

              return (
                <tr key={item.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{item.id}</td>
                  <td style={{ padding: '12px' }}>{item.name}</td>
                  <td style={{ padding: '12px' }}>{catName}</td>
                  <td style={{ padding: '12px' }}>{item.quantity}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', color: '#fff', backgroundColor: statusColor }}>
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