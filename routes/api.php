<?php

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Route;

// Các Route công khai (Không cần đăng nhập)
Route::post('/register', [Controller::class, 'register']);
Route::post('/login', [Controller::class, 'login']);

// Các Route yêu cầu phải xác thực qua Sanctum
Route::middleware('auth:sanctum')->group(function () {
    
    Route::post('/logout', [Controller::class, 'logout']);
    Route::get('/me', [Controller::class, 'me']);

    // Ví dụ phân quyền: Giả định 1: Quản lý kho, 2: Nhân viên, 3: Kế toán
    Route::middleware('role:1')->group(function () {
        // Chỉ Quản lý kho truy cập được các route trong này
        // Ví dụ: Route::post('/warehouses', [WarehouseController::class, 'store']);
    });

    Route::middleware('role:1,2')->group(function () {
        // Cả quản lý và nhân viên đều truy cập được
    });
});