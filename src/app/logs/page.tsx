"use client";

import AppShell from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";
import ErrorState from "@/components/ErrorState";

type EntryLog = {
  id: string;
  visitor: string;
  resident: string;
  time: string;
  status: string;
};

async function fetchLogs(): Promise<EntryLog[]> {
  const r = await fetch("/api/v1/logs", { cache: "no-store" });
  if (!r.ok) throw new Error("failed");
  const j = await r.json();
  return j.data as EntryLog[];
}

export default function LogsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["logs"],
    queryFn: fetchLogs,
  });

  return (
    <AppShell>
      <main className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Entry Logs</h1>
        {isLoading && <p>Loading…</p>}
        {error && <ErrorState error={error} what="logs" />}.  

        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="p-2 text-left">Visitor</th>
              <th className="p-2 text-left">Resident</th>
              <th className="p-2 text-left">Time</th>
              <th className="p-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {(data || []).map((log) => (
              <tr key={log.id} className="border-b">
                <td className="p-2">{log.visitor}</td>
                <td className="p-2">{log.resident}</td>
                <td className="p-2">
                  {new Date(log.time).toLocaleString()}
                </td>
                <td className="p-2">{log.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </AppShell>
  );
}