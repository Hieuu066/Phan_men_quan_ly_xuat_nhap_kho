import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    server: {
      port: 5173,
      open: true, // Tự mở trình duyệt khi chạy npm run dev
      proxy: {
      // Mọi request tới /api/* chuyển về PHP backend
      "/api": {
      target: "http://localhost/ten-du-an/backend",
      changeOrigin: true,
      // Giữ nguyên /api prefix (backend đã handle /api/...)
      },
      // Proxy thư mục uploads để xem file đã upload
      "/uploads": {
      target: "http://localhost/ten-du-an/backend",
      changeOrigin: true,
      },
      },
    },
    build: {
    outDir: "dist",
    sourcemap: false, // Tắt sourcemap khi build production
    },
  };
});