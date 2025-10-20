'use client';

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import api from "@/lib/api";
import AppShell from "@/components/AppShell";
import ErrorState from "@/components/ErrorState";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type EntryLog = { id: string; time: string; unit: string; event: string };

async function fetchLogs(): Promise<EntryLog[]> {
  const res = await api.get("/api/v1/logs");
  return res.data.data as EntryLog[];
}

function toLogin(returnTo = "/logs") {
  window.location.href = `/api/auth/start?return_to=${encodeURIComponent(returnTo)}`;
}

export default function LogsClient() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["logs"],
    queryFn: fetchLogs,
    retry: false,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!data) return [];
    const s = search.trim().toLowerCase();
    return s
      ? data.filter(l =>
          (l.unit || "").toLowerCase().includes(s) ||
          (l.event || "").toLowerCase().includes(s) ||
          (l.time || "").toLowerCase().includes(s)
        )
      : data.slice();
  }, [data, search]);

  if (isLoading) return <main className="p-6">Loading…</main>;

  if (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      toLogin("/logs");
      return <main className="p-6">Redirecting to login…</main>;
    }
    return <ErrorState error={error} what="logs" />;
  }

  return (
    <AppShell>
      <main className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Entry Logs</h1>
          <Input
            placeholder="Search by unit / event / time..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(l => (
            <Card key={l.id} className="p-4">
              <div className="font-semibold">{l.event}</div>
              <div className="text-sm text-muted-foreground">{l.unit} • {new Date(l.time).toLocaleString()}</div>
            </Card>
          ))}
          {filtered.length === 0 && <p className="text-muted-foreground">No logs found.</p>}
        </div>
      </main>
    </AppShell>
  );
}