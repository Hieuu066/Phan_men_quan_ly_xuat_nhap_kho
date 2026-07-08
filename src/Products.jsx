import React, { useState } from 'react';

function Products({ products, setProducts, categories, suppliers, onBackToDashboard }) {
  // Biến form thêm mới
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [newPrice, setNewPrice] = useState('');

  // Biến trạng thái sửa sản phẩm
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editPrice, setEditPrice] = useState('');

  // Hàm thêm sản phẩm mới
  const handleAddProduct = (e) => {
    e.preventDefault();
    if (products.some(p => p.id === newId)) {
      alert('Mã sản phẩm này đã tồn tại!');
      return;
    }

    const newProduct = {
      id: newId,
      name: newName,
      category_id: Number(newCategoryId || categories[0]?.id),
      quantity: Number(newQuantity),
      price: Number(newPrice)
    };

    setProducts([...products, newProduct]);
    // Reset form
    setNewId(''); setNewName(''); setNewCategoryId(''); setNewQuantity(''); setNewPrice('');
    alert('Thêm hàng vào danh mục thành công!');
  };

  // Hàm xóa sản phẩm
  const handleDeleteProduct = (id) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa mã sản phẩm ${id}?`)) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  // Kích hoạt sửa
  const startEdit = (item) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditCategoryId(item.category_id);
    setEditQuantity(item.quantity);
    setEditPrice(item.price);
  };

  // Lưu sửa đổi
  const handleSaveEdit = (id) => {
    const updated = products.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          name: editName,
          category_id: Number(editCategoryId),
          quantity: Number(editQuantity),
          price: Number(editPrice)
        };
      }
      return p;
    });
    setProducts(updated);
    setEditingId(null);
    alert('Cập nhật thông tin sản phẩm thành công!');
  };

  return (
    <div style={{ fontFamily: 'Arial', padding: '20px', backgroundColor: '#fff', minHeight: '100vh' }}>
      <button onClick={onBackToDashboard} style={{ marginBottom: '20px', padding: '8px 15px', cursor: 'pointer', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }}>
        ⬅ Quay lại Tổng quan
      </button>

      <h2>📦 QUẢN LÝ DANH MỤC & VẬT TƯ HÀNG HÓA (CRUD)</h2>

      {/* FORM THÊM MỚI */}
      <div style={{ border: '1px solid #dee2e6', padding: '20px', borderRadius: '8px', marginBottom: '30px', backgroundColor: '#f8f9fa' }}>
        <h3 style={{ marginTop: 0 }}>➕ Nhập Thêm Mặt Hàng Vào Hệ Thống</h3>
        <form onSubmit={handleAddProduct} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <input type="text" placeholder="Mã SP (VD: SP005)" value={newId} onChange={(e) => setNewId(e.target.value)} required style={{ padding: '8px', flex: 1 }} />
          <input type="text" placeholder="Tên sản phẩm" value={newName} onChange={(e) => setNewName(e.target.value)} required style={{ padding: '8px', flex: 2 }} />
          
          {/* Dropdown chọn danh mục từ bảng Categories */}
          <select value={newCategoryId} onChange={(e) => setNewCategoryId(e.target.value)} required style={{ padding: '8px', flex: 1 }}>
            <option value="">-- Chọn Danh Mục --</option>
            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>

          <input type="number" placeholder="Giá nhập định biên" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} required min="0" style={{ padding: '8px', flex: 1 }} />
          <input type="number" placeholder="Số lượng khởi tạo" value={newQuantity} onChange={(e) => setNewQuantity(e.target.value)} required min="0" style={{ padding: '8px', flex: 1 }} />
          
          <button type="submit" style={{ padding: '8px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Xác Nhận Thêm</button>
        </form>
      </div>

      {/* BẢNG SẢN PHẨM */}
      <h3>📦 Danh Sách Vật Tư Trong Kho Hiện Có</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ backgroundColor: '#007bff', color: 'white' }}>
            <th style={{ padding: '12px' }}>Mã SP</th>
            <th style={{ padding: '12px' }}>Tên Sản Phẩm</th>
            <th style={{ padding: '12px' }}>Danh Mục</th>
            <th style={{ padding: '12px' }}>Giá Dự Kiến</th>
            <th style={{ padding: '12px' }}>Số Lượng Tồn</th>
            <th style={{ padding: '12px' }}>Hành Động</th>
          </tr>
        </thead>
        <tbody>
          {products.map((item) => {
            const isEditing = editingId === item.id;
            // Tìm tên danh mục dựa trên ID liên kết bảng
            const categoryName = categories.find(c => c.id === item.category_id)?.name || 'Chưa phân loại';

            return (
              <tr key={item.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{item.id}</td>
                
                <td style={{ padding: '12px' }}>
                  {isEditing ? <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ padding: '5px', width: '90%' }} /> : item.name}
                </td>

                <td style={{ padding: '12px' }}>
                  {isEditing ? (
                    <select value={editCategoryId} onChange={(e) => setEditCategoryId(e.target.value)} style={{ padding: '5px' }}>
                      {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                  ) : categoryName}
                </td>

                <td style={{ padding: '12px' }}>
                  {isEditing ? <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} style={{ padding: '5px', width: '100px' }} /> : `${item.price.toLocaleString()} đ`}
                </td>

                <td style={{ padding: '12px' }}>
                  {isEditing ? <input type="number" value={editQuantity} onChange={(e) => setEditQuantity(e.target.value)} style={{ padding: '5px', width: '80px' }} /> : item.quantity}
                </td>

                <td style={{ padding: '12px', display: 'flex', gap: '8px' }}>
                  {isEditing ? (
                    <>
                      <button onClick={() => handleSaveEdit(item.id)} style={{ padding: '5px 10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Lưu</button>
                      <button onClick={() => setEditingId(null)} style={{ padding: '5px 10px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Hủy</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(item)} style={{ padding: '5px 10px', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Sửa</button>
                      <button onClick={() => handleDeleteProduct(item.id)} style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Xóa</button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default Products;