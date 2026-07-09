<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Product;
use App\Models\Warehouse;
use App\Models\Supplier;
use App\Models\Customer;
use App\Models\Inventory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Tài khoản test — mỗi role 1 tài khoản
        User::create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);

        User::create([
            'name' => 'Nhan Vien Kho',
            'email' => 'staff@example.com',
            'password' => Hash::make('password'),
            'role' => 'staff',
        ]);

        // Kho
        $warehouse = Warehouse::create([
            'name' => 'Kho chính',
            'address' => 'Hà Nội',
        ]);

        // Nhà cung cấp
        Supplier::create([
            'name' => 'Công ty ABC',
            'phone' => '0900000000',
            'address' => 'Hà Nội',
        ]);

        // Khách hàng
        Customer::create([
            'name' => 'Cửa hàng XYZ',
            'phone' => '0911111111',
            'address' => 'Hà Nội',
        ]);

        // Sản phẩm mẫu, mỗi sản phẩm có sẵn tồn kho ban đầu
        $products = [
            ['sku' => 'SP001', 'name' => 'Áo thun', 'category' => 'Thời trang', 'unit' => 'cái', 'reorder_level' => 10],
            ['sku' => 'SP002', 'name' => 'Quần jean', 'category' => 'Thời trang', 'unit' => 'cái', 'reorder_level' => 5],
            ['sku' => 'SP003', 'name' => 'Giày thể thao', 'category' => 'Giày dép', 'unit' => 'đôi', 'reorder_level' => 8],
        ];

        foreach ($products as $data) {
            $product = Product::create($data);

            Inventory::create([
                'product_id' => $product->id,
                'warehouse_id' => $warehouse->id,
                'quantity' => 50,
            ]);
        }
    }
}
