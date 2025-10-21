"use client";

import AppShell from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

type Resident = { id: string; name: string; unit: string; phone: string };

export default function ResidentsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["residents"],
    queryFn: () => apiFetch<Resident[]>("/api/v1/residents", { expect: "array", returnTo: "/residents" }),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const items = Array.isArray(data) ? data : [];

  return (
    <AppShell>
      <main className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Residents</h1>

        {isLoading && <p>Loading…</p>}
        {!isLoading && error && <p className="text-red-600">Failed to load residents.</p>}
        {!isLoading && !error && (
          <div className="space-y-2">
            {items.length === 0 ? (
              <p className="text-muted-foreground">No residents found.</p>
            ) : (
              items.map((r) => (
                <div key={r.id} className="border rounded p-3">
                  <span className="font-semibold">{r.name}</span> — {r.unit} — {r.phone}
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </AppShell>
  );
}