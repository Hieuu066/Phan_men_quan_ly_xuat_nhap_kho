import api from "./api";

export const statsService = {
  async getSummary() {
    return (await api.get("/api/stats/summary")).data;
  },
};
