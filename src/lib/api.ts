// src/lib/api.ts
export type Json = Record<string, unknown> | unknown[] | null;

export async function apiFetch<T = unknown>(
  path: string,
  opts: RequestInit & { expect?: "array" | "object"; returnTo?: string } = {}
): Promise<T> {
  const {
    expect = "array",
    returnTo = typeof window !== "undefined" ? window.location.pathname : "/",
    ...init
  } = opts;

  const res = await fetch(path, {
    credentials: "include",
    cache: "no-store",
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers || {}),
    },
  });

  // Handle 401 (unauthorized)
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      window.location.href = `/api/auth/start?state=${encodeURIComponent(returnTo)}`;
    }
    // prevent further .then/.map crashes after redirect
    return new Promise<T>(() => {});
  }

  // Handle non-OK responses
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`api_error_${res.status}:${text.slice(0, 200)}`);
  }

  // Parse JSON safely
  const json = (await res.json().catch(() => null)) as { data?: unknown } | null;
  const payload = (json && "data" in json ? (json.data as unknown) : json) as unknown;

  // Normalize: always return array or object as requested
  if (expect === "array") {
    return (Array.isArray(payload) ? payload : []) as T;
  }
  return (payload && typeof payload === "object" ? payload : ({} as T)) as T;
}