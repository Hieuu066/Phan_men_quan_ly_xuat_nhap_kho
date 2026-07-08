<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        // Kiểm tra user đã đăng nhập chưa và role_id có nằm trong mảng cho phép không
        if (!$user || !in_array($user->role_id, $roles)) {
            return response()->json([
                'message' => 'Bạn không có quyền truy cập vào chức năng này.'
            ], 403);
        }

        return $next($request);
    }
}