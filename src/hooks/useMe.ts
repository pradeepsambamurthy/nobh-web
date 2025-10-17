// src/hooks/useMe.ts
"use client";
import { useQuery } from "@tanstack/react-query";

type Me =
  | { authenticated: false }
  | { authenticated: true; email: string | null; name: string | null; sub: string | null; groups: string[] };

export function useMe() {
  return useQuery<Me>({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await fetch("/api/me", { cache: "no-store", credentials: "include" });
      if (res.status === 401) return { authenticated: false } as Me;
      if (!res.ok) throw new Error("me_fetch_failed");
      return (await res.json()) as Me;
    },
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}