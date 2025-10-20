// src/lib/api.ts
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

const api = axios.create({
  // same-origin API calls like /api/v1/...
  withCredentials: true,
});

let refreshPromise: Promise<Response> | null = null;

async function runRefreshOnce() {
  if (!refreshPromise) {
    refreshPromise = fetch("/api/auth/refresh", { method: "POST", cache: "no-store" })
      .finally(() => {
        // release after it settles so subsequent 401s can refresh again later
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function redirectToLogin() {
  const here = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
  window.location.href = `/api/auth/start?return_to=${encodeURIComponent(here)}`;
}

api.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const original = (error.config || {}) as AxiosRequestConfig & { __retried?: boolean };

    // If unauthorized, try a single refresh once
    if (status === 401 && !original.__retried) {
      original.__retried = true;

      try {
        const r = await runRefreshOnce();

        // refresh ok? retry original
        if (r.ok) return api(original);

        // refresh failed —> go to login
        redirectToLogin();
        // throw to stop further handling
        return Promise.reject(error);
      } catch {
        redirectToLogin();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;