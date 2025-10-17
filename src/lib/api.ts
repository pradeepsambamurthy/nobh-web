import axios from "axios";

const api = axios.create();

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const status = err?.response?.status;
    const original = err?.config || {};
    if (status === 401 && !original.__retried) {
      original.__retried = true;
      // Ask server to refresh using our cookie refresh_token
      await fetch("/api/auth/refresh", { method: "POST" });
      // Retry once
      return api(original);
    }
    return Promise.reject(err);
  }
);

export default api;