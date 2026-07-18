import api from "./api";

export const orderService = {
  // ── Phiếu nhập ──────────────────────────────────────
  async getImportOrders(params = {}) {
    return (await api.get("/api/import-orders", { params })).data;
  },
  async getImportOrder(id) {
    return (await api.get(`/api/import-orders/${id}`)).data;
  },
  async createImportOrder({ supplier_id, note, details }) {
    return (await api.post("/api/import-orders", { supplier_id, note, details })).data;
  },

  // ── Phiếu xuất ──────────────────────────────────────
  async getExportOrders(params = {}) {
    return (await api.get("/api/export-orders", { params })).data;
  },
  async getExportOrder(id) {
    return (await api.get(`/api/export-orders/${id}`)).data;
  },
  async createExportOrder({ nguoi_nhan, note, details }) {
    return (await api.post("/api/export-orders", { nguoi_nhan, note, details })).data;
  },
};
