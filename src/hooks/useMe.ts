"use client";
import { useQuery } from "@tanstack/react-query";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await fetch("/api/me", { cache: "no-store" });
      if (res.status === 401) return { authenticated: false };
      if (!res.ok) throw new Error("me_fetch_failed");
      return res.json();
    },
    retry: false,
    staleTime: 0,
  });
}