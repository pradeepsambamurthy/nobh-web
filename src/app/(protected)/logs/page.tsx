"use client";

import AppShell from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";

type Log = { id: string; time: string; unit: string; event: string };

async function fetchLogs(): Promise<Log[]> {
  const r = await fetch("/api/v1/logs", { cache: "no-store", credentials: "include" });
  if (r.status === 401) {
    window.location.href = `/api/auth/start?return_to=${encodeURIComponent("/logs")}`;
    return new Promise<Log[]>(_ => {});
  }
  if (!r.ok) throw new Error("logs_load_failed");
  const json = await r.json();
  return Array.isArray(json?.data) ? json.data : [];
}

export default function LogsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["logs"],
    queryFn: fetchLogs,
    retry: false,
    refetchOnWindowFocus: false,
  });

  return (
    <AppShell>
      <main className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Entry Logs</h1>
        {isLoading && <p>Loading…</p>}
        {error && <p className="text-red-600">Failed to load logs.</p>}
        {!isLoading && !error && (
          <ul className="space-y-2">
            {(data ?? []).map((l) => (
              <li key={l.id} className="border rounded p-3">
                <div className="text-sm text-gray-600">
                  {new Date(l.time).toLocaleString()} • {l.unit}
                </div>
                <div className="font-medium">{l.event}</div>
              </li>
            ))}
            {(data?.length ?? 0) === 0 && <p className="text-muted-foreground">No logs.</p>}
          </ul>
        )}
      </main>
    </AppShell>
  );
}