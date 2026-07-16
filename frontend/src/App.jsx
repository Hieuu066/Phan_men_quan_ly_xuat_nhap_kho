import React, { useState } from 'react';
import Login from './Login';
import Dashboard from './Dashboard';
import Products from './Products';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('dashboard'); // Các màn hình: dashboard, products, stock-transactions

  // 1. Quản lý kho hàng linh kiện (warehouses)
  const [warehouses] = useState([
    { id: 'K-HN', name: 'Kho Linh Kiện Hà Nội', location: 'Thanh Xuân, Hà Nội' },
    { id: 'K-HCM', name: 'Kho Linh Kiện TP.HCM', location: 'Quận 10, TP. Hồ Chí Minh' }
  ]);

  // 2. Đối tác (suppliers & customers)
  const [suppliers] = useState([
    { id: 'NCC-ASUS', name: 'Nhà Phân Phối ASUS Việt Nam' },
    { id: 'NCC-INTEL', name: 'Công Ty Công Nghệ Intel Viễn Đông' }
  ]);
  
  const [customers] = useState([
    { id: 'KH-ANPHAT', name: 'Công ty Máy tính An Phát PC' },
    { id: 'KH-GEARVN', name: 'Chuỗi cửa hàng công nghệ GEARVN' }
  ]);

  // 3. Danh sách sản phẩm linh kiện máy tính (products)
  const [products, setProducts] = useState([
    { id: 'CPU001', name: 'Bộ vi xử lý Intel Core i5-13400F', category: 'Vi xử lý (CPU)', quantity: 85, warehouse_id: 'K-HN' },
    { id: 'VGA002', name: 'Card đồ họa ASUS ROG Strix RTX 4060 Ti', category: 'Card màn hình (VGA)', quantity: 30, warehouse_id: 'K-HN' },
    { id: 'RAM003', name: 'RAM Corsair Vengeance LPX 16GB DDR4', category: 'Bộ nhớ trong (RAM)', quantity: 240, warehouse_id: 'K-HCM' },
    { id: 'SSD004', name: 'Ổ cứng SSD Samsung 980 Pro 1TB NVMe', category: 'Ổ cứng lưu trữ (SSD)', quantity: 0, warehouse_id: 'K-HCM' },
  ]);

  // 4. Lịch sử giao dịch kho (stock_transactions)
  const [transactions, setTransactions] = useState([
    { id: 'TX001', type: 'Nhập kho', product_id: 'CPU001', quantity: 100, date: '2026-07-12', note: 'Nhập hàng từ NCC-INTEL' },
    { id: 'TX002', type: 'Xuất kho', product_id: 'VGA002', quantity: 15, date: '2026-07-15', note: 'Xuất giao hàng cho KH-GEARVN' }
  ]);

  if (!isLoggedIn) {
    return <Login onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  // Hàm xử lý tạo Phiếu Nhập/Xuất thực tế (Cập nhật trực tiếp số lượng tồn kho)
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
      <div style={{ width: '260px', backgroundColor: '#1a252f', color: 'white', padding: '20px 15px' }}>
        <h3 style={{ textAlign: 'center', color: '#3498db', marginBottom: '30px', fontSize: '16px' }}>PC & ELECTRONICS SCM</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={() => setCurrentScreen('dashboard')} style={{ padding: '12px', textAlign: 'left', backgroundColor: currentScreen === 'dashboard' ? '#34495e' : 'transparent', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>📊 Bảng Điều Khiển</button>
          <button onClick={() => setCurrentScreen('products')} style={{ padding: '12px', textAlign: 'left', backgroundColor: currentScreen === 'products' ? '#34495e' : 'transparent', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>📦 Kho Linh Kiện (CRUD)</button>
          <button onClick={() => setCurrentScreen('stock-transactions')} style={{ padding: '12px', textAlign: 'left', backgroundColor: currentScreen === 'stock-transactions' ? '#34495e' : 'transparent', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>🔄 Mua / Bán Linh Kiện</button>
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
      return alert(`Lỗi: Số lượng tồn kho linh kiện không đủ để xuất bán! (Hiện có: ${selectedProduct.quantity})`);
    }

    const partnerName = type === 'Nhập kho' ? suppliers.find(s => s.id === partnerId)?.name : customers.find(c => c.id === partnerId)?.name;

    onCreateTransaction({
      id: 'TX' + Date.now().toString().slice(-4),
      type,
      product_id: productId,
      quantity: Number(qty),
      date: new Date().toISOString().split('T')[0],
      note: note || `${type} hàng với: ${partnerName || 'N/A'}`
    });

    setQty(''); setNote('');
    alert('Tạo phiếu mua bán thành công! Kho hàng đã được cập nhật.');
  };

  return (
    <div>
      <h2>🔄 QUẢN LÝ GIAO DỊCH MUA BÁN & XUẤT NHẬP KHO</h2>
      
      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '25px' }}>
        <h3 style={{ marginTop: 0 }}>📋 Khởi Tạo Chứng Từ (Nhập Mua / Xuất Bán)</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <select value={type} onChange={(e) => { setType(e.target.value); setPartnerId(''); }} style={{ padding: '8px', flex: 1 }}>
            <option value="Nhập kho">📥 Nhập mua linh kiện (Goods Receipt)</option>
            <option value="Xuất kho">📤 Xuất bán linh kiện (Goods Issue)</option>
          </select>

          <select value={productId} onChange={(e) => setProductId(e.target.value)} required style={{ padding: '8px', flex: 2 }}>
            <option value="">-- Chọn Linh Kiện --</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.id} - {p.name} (Tồn: {p.quantity})</option>)}
          </select>

          <select value={partnerId} onChange={(e) => setPartnerId(e.target.value)} required style={{ padding: '8px', flex: 2 }}>
            <option value="">-- Chọn Đối Tác Giao Dịch --</option>
            {type === 'Nhập kho' 
              ? suppliers.map(s => <option key={s.id} value={s.id}>{s.name} (Nhà cung cấp)</option>)
              : customers.map(c => <option key={c.id} value={c.id}>{c.name} (Khách hàng đại lý)</option>)
            }
          </select>

          <input type="number" placeholder="Số lượng" value={qty} onChange={(e) => setQty(e.target.value)} min="1" required style={{ padding: '8px', flex: 1 }} />
          <input type="text" placeholder="Mô tả giao dịch" value={note} onChange={(e) => setNote(e.target.value)} style={{ padding: '8px', flex: 2 }} />
          
          <button type="submit" style={{ padding: '8px 20px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Xác Nhận Ký Duyệt</button>
        </form>
      </div>

      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h3>📜 Nhật Ký Giao Dịch Kho Công Nghệ</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
              <th style={{ padding: '12px' }}>Mã giao dịch</th>
              <th style={{ padding: '12px' }}>Loại hình</th>
              <th style={{ padding: '12px' }}>Mã Linh Kiện</th>
              <th style={{ padding: '12px' }}>Biến Động</th>
              <th style={{ padding: '12px' }}>Ngày thực hiện</th>
              <th style={{ padding: '12px' }}>Nội dung chi tiết</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(tx => (
              <tr key={tx.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{tx.id}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', color: 'white', backgroundColor: tx.type === 'Nhập kho' ? '#2ecc71' : '#e67e22' }}>{tx.type === 'Nhập kho' ? 'Nhập Mua' : 'Xuất Bán'}</span>
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