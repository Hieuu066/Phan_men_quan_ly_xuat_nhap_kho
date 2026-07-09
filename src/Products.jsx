import React, { useState } from 'react';

function Products({ products, setProducts, warehouses }) {
  // States cho form thêm mới
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [quantity, setQuantity] = useState('');

  // States hỗ trợ tính năng sửa (Update) trực tiếp dòng dữ liệu
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editWarehouseId, setEditWarehouseId] = useState('');
  const [editQuantity, setEditQuantity] = useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (products.some(p => p.id === id)) return alert('Mã vật tư này đã tồn tại!');

    const newProduct = {
      id,
      name,
      category,
      warehouse_id: warehouseId || warehouses[0]?.id,
      quantity: Number(quantity || 0)
    };

    setProducts([...products, newProduct]);
    setId(''); setName(''); setCategory(''); setWarehouseId(''); setQuantity('');
    alert('Khởi tạo mã danh mục vật tư mới thành công!');
  };

  const handleDelete = (prodId) => {
    if (window.confirm(`Xác nhận xóa vĩnh viễn sản phẩm ${prodId} khỏi hệ thống?`)) {
      setProducts(products.filter(p => p.id !== prodId));
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditCategory(item.category);
    setEditWarehouseId(item.warehouse_id);
    setEditQuantity(item.quantity);
  };

  const handleSaveEdit = (prodId) => {
    const updated = products.map(p => {
      if (p.id === prodId) {
        return { ...p, name: editName, category: editCategory, warehouse_id: editWarehouseId, quantity: Number(editQuantity) };
      }
      return p;
    });
    setProducts(updated);
    setEditingId(null);
    alert('Cập nhật dữ liệu chứng từ gốc thành công!');
  };

  return (
    <div>
      <h2>📦 QUẢN LÝ DANH MỤC VẬT TƯ & HÀNG HÓA TỒN KHO</h2>

      {/* FORM KHỞI TẠO VẬT TƯ MỚI */}
      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '25px' }}>
        <h3 style={{ marginTop: 0 }}>➕ Đăng ký danh mục sản phẩm mới</h3>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <input type="text" placeholder="Mã Vật Tư (Ví dụ: SP005)" value={id} onChange={(e) => setId(e.target.value)} required style={{ padding: '8px', flex: 1 }} />
          <input type="text" placeholder="Tên sản phẩm thiết bị" value={name} onChange={(e) => setName(e.target.value)} required style={{ padding: '8px', flex: 2 }} />
          <input type="text" placeholder="Phân nhóm danh mục" value={category} onChange={(e) => setCategory(e.target.value)} required style={{ padding: '8px', flex: 1 }} />
          
          <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} required style={{ padding: '8px', flex: 1 }}>
            <option value="">-- Chỉ định lưu kho --</option>
            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          
          <input type="number" placeholder="Số lượng khởi tạo ban đầu" value={quantity} onChange={(e) => setQuantity(e.target.value)} min="0" required style={{ padding: '8px', flex: 1 }} />
          
          <button type="submit" style={{ padding: '8px 20px', backgroundColor: '#2ecc71', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Thêm Mới</button>
        </form>
      </div>

      {/* BẢNG CHỨA CÁC THAO TÁC CRUD */}
      <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <h3>📦 Dữ liệu tổng hợp cấu trúc sản phẩm</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#34495e', color: 'white' }}>
              <th style={{ padding: '12px' }}>Mã Vật Tư</th>
              <th style={{ padding: '12px' }}>Tên Sản Phẩm Vật Tư</th>
              <th style={{ padding: '12px' }}>Danh Mục Gốc</th>
              <th style={{ padding: '12px' }}>Vị Trí Kho Chỉ Định</th>
              <th style={{ padding: '12px' }}>Số Lượng Tồn</th>
              <th style={{ padding: '12px' }}>Hành Động Hệ Thống</th>
            </tr>
          </thead>
          <tbody>
            {products.map(item => {
              const isEditing = editingId === item.id;
              return (
                <tr key={item.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{item.id}</td>
                  <td style={{ padding: '12px' }}>
                    {isEditing ? <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ padding: '5px', width: '90%' }} /> : item.name}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {isEditing ? <input type="text" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} style={{ padding: '5px', width: '90%' }} /> : item.category}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {isEditing ? (
                      <select value={editWarehouseId} onChange={(e) => setEditWarehouseId(e.target.value)} style={{ padding: '5px' }}>
                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                      </select>
                    ) : (warehouses.find(w => w.id === item.warehouse_id)?.name || 'N/A')}
                  </td>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>
                    {isEditing ? <input type="number" value={editQuantity} onChange={(e) => setEditQuantity(e.target.value)} style={{ padding: '5px', width: '80px' }} /> : item.quantity}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {isEditing ? (
                      <>
                        <button onClick={() => handleSaveEdit(item.id)} style={{ marginRight: '5px', padding: '5px 10px', backgroundColor: '#2ecc71', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Lưu</button>
                        <button onClick={() => setEditingId(null)} style={{ padding: '5px 10px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Hủy</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(item)} style={{ marginRight: '5px', padding: '5px 10px', backgroundColor: '#f1c40f', color: 'black', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Sửa</button>
                        <button onClick={() => handleDelete(item.id)} style={{ padding: '5px 10px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Xóa</button>
                      </>
                    )}
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

export default Products;