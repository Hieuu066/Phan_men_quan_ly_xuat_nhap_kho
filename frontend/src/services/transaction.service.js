import api from "./api";

// Goi dung endpoint hop nhat GET /api/transactions (UNION ALL nhap+xuat),
// thay vi tu gop /api/import-orders + /api/export-orders o Front-end.
// Ho tro san filter: type ('import'|'export'), from_date, to_date, keyword (ma phieu/doi tac).
export const transactionService = {
  async getAll(params = {}) {
    return (await api.get("/api/transactions", { params })).data;
  },
};
