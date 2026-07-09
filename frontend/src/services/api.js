import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "/backend",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

// Request interceptor: thêm Content-Type cho multipart nếu cần
api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"]; // Để axios tự set boundary
  }
  return config;
});

// Response interceptor: xử lý lỗi toàn cục
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      if (window.location.pathname !== "/login") {
        window.location.href = "/login?expired=1";
      }
    }
    return Promise.reject(err);
  }
);

export default api;
