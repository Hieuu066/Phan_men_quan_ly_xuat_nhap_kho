import api from "./api";

const BASE = "/api/items";

export const itemService = {
  /** Lấy danh sách có lọc, tìm kiếm và phân trang */
  async getAll(params = {}) {
    const res = await api.get(BASE, { params });
    return res.data; // { success, data, meta }
  },

  async getById(id) {
    return (await api.get(`${BASE}/${id}`)).data;
  },

  /** Tạo mới — hỗ trợ cả JSON và FormData (có file upload) */
  async create(data) {
    const payload = data instanceof FormData ? data : data;
    return (await api.post(BASE, payload)).data;
  },

  /** Cập nhật — dùng POST (không phải PUT) khi có file upload */
  async update(id, data) {
    // Server chấp nhận cả PUT JSON và POST multipart
    const isForm = data instanceof FormData;
    const res = isForm
      ? await api.post(`${BASE}/${id}`, data) // multipart
      : await api.put(`${BASE}/${id}`, data); // JSON
    return res.data;
  },

  async remove(id) {
    return (await api.delete(`${BASE}/${id}`)).data;
  },

  /** Xuất file CSV — mở URL trong tab mới */
  exportCSV() {
    const base = import.meta.env.VITE_API_BASE || "/backend";
    window.open(`${base}/api/items/export`, "_blank");
  },
};
