import api from "./api";

export const authService = {
  async login(username, password) {
    return (await api.post("/api/auth/login", { username, password })).data;
  },
  async logout() {
    return (await api.post("/api/auth/logout")).data;
  },
  async me() {
    return (await api.get("/api/auth/me")).data;
  },
};
