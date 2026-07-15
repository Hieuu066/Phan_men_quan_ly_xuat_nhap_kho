import React, { useState } from 'react';
import Login from './Login';
import Dashboard from './Dashboard';
import Products from './Products';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('dashboard'); // Các màn hình: dashboard, products, stock-transactions

  // 1. Quản lý kho hàng (warehouses)
  const [warehouses] = useState([
    { id: 'K01', name: 'Kho Tổng Hà Nội', location: 'Cầu Giấy, Hà Nội' },
    { id: 'K02', name: 'Kho Vật Tư Miền Trung', location: 'Liên Chiểu, Đà Nẵng' }
  ]);

  // 2. Đối tác (suppliers & customers)
  const [suppliers] = useState([
    { id: 'NCC01', name: 'Công ty Nhôm Kính Toàn Cầu' },
    { id: 'NCC02', name: 'Tập đoàn Vật liệu An Phát' }
  ]);
  
  const [customers] = useState([
    { id: 'KH01', name: 'Nhà máy Cơ khí Chế tạo 1' },
    { id: 'KH02', name: 'Công ty Xây dựng Minh Đức' }
  ]);

  // 3. Danh sách sản phẩm (products - Cột category trực tiếp theo lộ trình)
  const [products, setProducts] = useState([
    { id: 'SP001', name: 'Thép thanh vằn D10', category: 'Vật liệu xây dựng', quantity: 1500, warehouse_id: 'K01' },
    { id: 'SP002', name: 'Kính cường lực 10mm', category: 'Nhôm kính', quantity: 80, warehouse_id: 'K01' },
    { id: 'SP003', name: 'Sơn chống rỉ Alkyd', category: 'Hóa chất vật tư', quantity: 200, warehouse_id: 'K02' },
    { id: 'SP004', name: 'Đinh vít tôn 4 phân', category: 'Linh kiện phụ trợ', quantity: 0, warehouse_id: 'K02' },
  ]);

  // 4. Lịch sử giao dịch kho (stock_transactions) - Nghiệp vụ SQL nâng cao
  const [transactions, setTransactions] = useState([
    { id: 'TX001', type: 'Nhập kho', product_id: 'SP001', quantity: 500, date: '2026-07-08', note: 'Nhập hàng từ NCC01' },
    { id: 'TX002', type: 'Xuất kho', product_id: 'SP002', quantity: 20, date: '2026-07-09', note: 'Xuất cho KH01' }
  ]);

  if (!isLoggedIn) {
    return <Login onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  // Hàm xử lý tạo Phiếu Nhập/Xuất thực tế (Cập nhật trực tiếp số lượng tồn kho inventories)
  const handleCreateTransaction = (newTx) => {
    // 1. Thêm vào lịch sử giao dịch
    setTransactions([newTx, ...transactions]);

    // 2. Cập nhật số lượng tồn kho của sản phẩm tương ứng
    const updatedProducts = products.map(p => {
      if (p.id === newTx.product_id) {
        const delta = newTx.type === 'Nhập kho' ? newTx.quantity : -newTx.quantity;
        return { ...p, quantity: Math.max(0, p.quantity + delta) };
      }
      return p;
    });
    setProducts(updatedProducts);
  };

  return (
    <div style={{ display: 'flex', fontFamily: 'Arial, sans-serif', minHeight: '100vh', backgroundColor: '#f4f6f9' }}>
      
      {/* THANH SIDEBAR MENU CHUẨN */}
      <div style={{ width: '260px', backgroundColor: '#2c3e50', color: 'white', padding: '20px 15px' }}>
        <h3 style={{ textAlign: 'center', color: '#1abc9c', marginBottom: '30px', fontSize: '18px' }}>LOGISTICS & SCM</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={() => setCurrentScreen('dashboard')} style={{ padding: '12px', textAlign: 'left', backgroundColor: currentScreen === 'dashboard' ? '#34495e' : 'transparent', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>📊 Bảng Điều Khiển</button>
          <button onClick={() => setCurrentScreen('products')} style={{ padding: '12px', textAlign: 'left', backgroundColor: currentScreen === 'products' ? '#34495e' : 'transparent', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>📦 Quản Lý Vật Tư (CRUD)</button>
          <button onClick={() => setCurrentScreen('stock-transactions')} style={{ padding: '12px', textAlign: 'left', backgroundColor: currentScreen === 'stock-transactions' ? '#34495e' : 'transparent', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>🔄 Nhập / Xuất Kho</button>
        </div>
        <div style={{ marginTop: '50px', borderTop: '1px solid #4f5d73', paddingTop: '15px', textAlign: 'center' }}>
          <button onClick={() => setIsLoggedIn(false)} style={{ width: '100%', padding: '8px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🚪 Đăng xuất</button>
        </div>
      </div>

      {/* VÙNG HIỂN THỊ NỘI DUNG CHÍNH */}
      <div style={{ flex: 1, padding: '25px', overflowY: 'auto' }}>
        {currentScreen === 'dashboard' && <Dashboard products={products} warehouses={warehouses} transactions={transactions} />}
        {currentScreen === 'products' && <Products products={products} setProducts={setProducts} warehouses={warehouses} />}
        {currentScreen === 'stock-transactions' && (
          <StockTransactions 
            products={products} 
            warehouses={warehouses} 
            suppliers={suppliers} 
            customers={customers} 
            transactions={transactions} 
            onCreateTransaction={handleCreateTransaction} 
          />
        )}
      </div>

    </div>
  );
}

// Component phụ nội bộ để xử lý giao dịch kho nhằm gọn cấu trúc file
function StockTransactions({ products, suppliers, customers, transactions, onCreateTransaction }) {
  const [type, setType] = useState('Nhập kho');
  const [productId, setProductId] = useState('');
  const [partnerId, setPartnerId] = useState('');
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!productId || !qty) return alert('Vui lòng điền đủ thông tin bắt buộc!');

    const selectedProduct = products.find(p => p.id === productId);
    if (type === 'Xuất kho' && selectedProduct.quantity < Number(qty)) {
      return alert(`Lỗi nghiêm trọng: Số lượng tồn kho hiện tại không đủ để xuất! (Hiện có: ${selectedProduct.quantity})`);
    }

    const partnerName = type === 'Nhập kho' ? suppliers.find(s => s.id === partnerId)?.name : customers.find(c => c.id === partnerId)?.name;

    onCreateTransaction({
      id: 'TX' + Date.now().toString().slice(-4),
      type,
      product_id: productId,
      quantity: Number(qty),
      date: new Date().toISOString().split('T')[0],
      note: note || `${type} hàng với đối tác: ${partnerName || 'N/A'}`
    });

    setQty(''); setNote('');
    alert('Xử lý phiếu kho thành công! Số lượng tồn kho đã được cập nhật tự động.');
  };

  return (
    <div>
      <h2>🔄 ĐIỀU PHỐI LOGISTICS: PHIẾU NHẬP / XUẤT KHO</h2>
      
      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '25px' }}>
        <h3 style={{ marginTop: 0 }}>📋 Tạo Lệnh Khởi Tác Chứng Từ Kho</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <select value={type} onChange={(e) => { setType(e.target.value); setPartnerId(''); }} style={{ padding: '8px', flex: 1 }}>
            <option value="Nhập kho">📥 Nhập kho (Goods Receipt)</option>
            <option value="Xuất kho">📤 Xuất kho (Goods Issue)</option>
          </select>

          <select value={productId} onChange={(e) => setProductId(e.target.value)} required style={{ padding: '8px', flex: 2 }}>
            <option value="">-- Chọn Vật Tư Sản Phẩm --</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.id} - {p.name} (Tồn: {p.quantity})</option>)}
          </select>

          <select value={partnerId} onChange={(e) => setPartnerId(e.target.value)} required style={{ padding: '8px', flex: 2 }}>
            <option value="">-- Chọn Đối Tác Tương Tác --</option>
            {type === 'Nhập kho' 
              ? suppliers.map(s => <option key={s.id} value={s.id}>{s.name} (Nhà cung cấp)</option>)
              : customers.map(c => <option key={c.id} value={c.id}>{c.name} (Khách hàng)</option>)
            }
          </select>

          <input type="number" placeholder="Số lượng thực tế" value={qty} onChange={(e) => setQty(e.target.value)} min="1" required style={{ padding: '8px', flex: 1 }} />
          <input type="text" placeholder="Ghi chú nội dung lệnh" value={note} onChange={(e) => setNote(e.target.value)} style={{ padding: '8px', flex: 2 }} />
          
          <button type="submit" style={{ padding: '8px 20px', backgroundColor: '#1abc9c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Xác Nhận Ký Duyệt</button>
        </form>
      </div>

      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h3>📜 Nhật Ký Biến Động Kho Thực Tế (Bảng stock_transactions)</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
              <th style={{ padding: '12px' }}>Mã giao dịch</th>
              <th style={{ padding: '12px' }}>Nghiệp vụ</th>
              <th style={{ padding: '12px' }}>Mã Sản Phẩm</th>
              <th style={{ padding: '12px' }}>Số Lượng Biến Động</th>
              <th style={{ padding: '12px' }}>Ngày thực thi</th>
              <th style={{ padding: '12px' }}>Chi tiết chứng từ</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(tx => (
              <tr key={tx.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{tx.id}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', color: 'white', backgroundColor: tx.type === 'Nhập kho' ? '#2ecc71' : '#e67e22' }}>{tx.type}</span>
                </td>
                <td style={{ padding: '12px' }}>{tx.product_id}</td>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{tx.type === 'Nhập kho' ? `+${tx.quantity}` : `-${tx.quantity}`}</td>
                <td style={{ padding: '12px' }}>{tx.date}</td>
                <td style={{ padding: '12px', color: '#666', fontSize: '14px' }}>{tx.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;