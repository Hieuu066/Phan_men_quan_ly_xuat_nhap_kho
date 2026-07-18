import api from "./api";

export const reportService = {
  async getSummary() {
    return (await api.get("/api/stats/summary")).data;
  },
  async getLowStock() {
    return (await api.get("/api/reports/low-stock")).data;
  },
  async getInventory() {
    return (await api.get("/api/reports/inventory")).data;
  },
};
