import api from "./api";

const BASE = "/api/warehouse-stock";

export const warehouseStockService = {
  async getAll(params = {}) {
    return (await api.get(BASE, { params })).data;
  },
  async updateThreshold(id, nguong_canh_bao) {
    return (await api.put(`${BASE}/${id}`, { nguong_canh_bao })).data;
  },
};
