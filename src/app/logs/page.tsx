"use client";

import AppShell from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import api from "@/lib/api";
import ErrorState from "@/components/ErrorState";

type EntryLog = {
  id: string;
  visitor: string;
  resident: string;
  time: string;
  status: string;
};

async function fetchLogs(): Promise<EntryLog[]> {
  const r = await api.get("/api/v1/logs", { withCredentials: true });
  return r.data.data as EntryLog[];
}

function toLogin(returnTo = "/logs") {
  window.location.href = `/api/auth/start?return_to=${encodeURIComponent(returnTo)}`;
}

export default function LogsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["logs"],
    queryFn: fetchLogs,
    retry: false,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  return (
    <AppShell>
      <main className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Entry Logs</h1>

        {isLoading && <p>Loading…</p>}

        {error
          ? (() => {
              if (axios.isAxiosError(error) && error.response?.status === 401) {
                toLogin("/logs");
                return <p>Redirecting to login…</p>;
              }
              return <ErrorState error={error} what="logs" />;
            })()
          : (
            <>
              {(data?.length ?? 0) === 0 ? (
                <p className="text-muted-foreground">No logs found.</p>
              ) : (
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
                    {data!.map((log) => (
                      <tr key={log.id} className="border-b">
                        <td className="p-2">{log.visitor}</td>
                        <td className="p-2">{log.resident}</td>
                        <td className="p-2">{new Date(log.time).toLocaleString()}</td>
                        <td className="p-2">{log.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )
        }
      </main>
    </AppShell>
  );
}