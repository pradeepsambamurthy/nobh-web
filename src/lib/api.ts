// nobh-web-admin/src/lib/api.ts
import axios from "axios";

const api = axios.create({
  // no baseURL on purpose – use same-origin (/api/…)
  withCredentials: true,
});

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const status = err?.response?.status;
    const original = err?.config || {};
    if (status === 401 && !original.__retried) {
      original.__retried = true;
      await fetch("/api/auth/refresh", { method: "POST" });
      return api(original);
    }
    return Promise.reject(err);
  }
);

export default api;