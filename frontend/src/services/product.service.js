import api from "./api";

const BASE = "/api/items";

export const productService = {
  async getAll(params = {}) {
    return (await api.get(BASE, { params })).data;
  },
  async getById(id) {
    return (await api.get(`${BASE}/${id}`)).data;
  },
  async create(data) {
    return (await api.post(BASE, data)).data;
  },
  async update(id, data) {
    return (await api.put(`${BASE}/${id}`, data)).data;
  },
  async remove(id) {
    return (await api.delete(`${BASE}/${id}`)).data;
  },
};
