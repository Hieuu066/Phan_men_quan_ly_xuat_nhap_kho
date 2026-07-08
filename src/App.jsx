import React, { useState } from 'react';
import Login from './Login';
import Dashboard from './Dashboard';
import Products from './Products';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('dashboard');

  // 1. DỮ LIỆU GỐC: Danh mục sản phẩm (Categories)
  const [categories] = useState([
    { id: 1, name: 'Bao bì & Đóng gói' },
    { id: 2, name: 'Thiết bị kho bãi' }
  ]);

  // 2. DỮ LIỆU GỐC: Đối tác (Suppliers & Customers)
  const [suppliers] = useState([
    { id: 1, name: 'Công ty Bao Bì Toàn Cầu' },
    { id: 2, name: 'Tổng kho Pallet Hà Nội' }
  ]);

  // 3. DỮ LIỆU TRUNG TÂM: Sản phẩm (Khớp bảng `products` và `inventories`)
  const [products, setProducts] = useState([
    { id: 'SP001', name: 'Thùng Carton Kích Thước A', category_id: 1, quantity: 1500, price: 12000 },
    { id: 'SP002', name: 'Băng keo dán thùng 5cm', category_id: 1, quantity: 80, price: 25000 },
    { id: 'SP003', name: 'Pallet gỗ nâng hàng', category_id: 2, quantity: 200, price: 180000 },
    { id: 'SP004', name: 'Màng PE quấn pallet', category_id: 1, quantity: 0, price: 95000 },
  ]);

  if (!isLoggedIn) {
    return <Login onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  return (
    <div>
      {currentScreen === 'dashboard' ? (
        <Dashboard 
          products={products} 
          categories={categories}
          onNavigateToProducts={() => setCurrentScreen('products')} 
        />
      ) : (
        <Products 
          products={products} 
          setProducts={setProducts} 
          categories={categories}
          suppliers={suppliers}
          onBackToDashboard={() => setCurrentScreen('dashboard')} 
        />
      )}
    </div>
  );
}

export default App;