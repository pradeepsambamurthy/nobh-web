// src/app/providers.tsx
"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";

export default function Providers({ children }: { children: React.ReactNode }) {
  // In dev you can shorten interval to test (e.g., 2 minutes). Prod defaults to 45 inside hook.
  useAutoRefresh(process.env.NODE_ENV === "development" ? 2 : 45);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false, refetchOnWindowFocus: false },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}