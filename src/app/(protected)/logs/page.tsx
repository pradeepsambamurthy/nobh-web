"use client";

import AppShell from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";

type Log = { id: string; time: string; unit: string; event: string };

async function fetchLogs(): Promise<Log[]> {
  const r = await fetch("/api/v1/logs", { cache: "no-store", credentials: "include" });
  if (r.status === 401) {
    window.location.href = `/api/auth/start?return_to=${encodeURIComponent("/logs")}`;
    return [];
  }
  if (!r.ok) throw new Error("logs_load_failed");
  const json = await r.json().catch(() => ({}));
  return Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
}

export default function LogsPage() {
  const { data = [], isLoading, error } = useQuery({
    queryKey: ["logs"],
    queryFn: fetchLogs,
    retry: false,
    refetchOnWindowFocus: false,
  });

  return (
    <AppShell>
      <main className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Entry Logs</h1>
          <input
            className="w-64 border rounded px-3 py-2"
            placeholder="(no search on logs sample)"
            disabled
          />
        </div>

        {isLoading && <p>Loading…</p>}
        {error && <p className="text-red-600">Failed to load logs.</p>}

        {!isLoading && !error && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((l) => (
              <div key={l.id} className="border rounded p-4">
                <div className="font-semibold">{l.event}</div>
                <div className="text-sm text-muted-foreground">
                  {l.unit} • {new Date(l.time).toLocaleString()}
                </div>
              </div>
            ))}
            {data.length === 0 && <p className="text-muted-foreground">No logs found.</p>}
          </div>
        )}
      </main>
    </AppShell>
  );
}