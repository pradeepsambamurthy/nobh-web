'use client';

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import api from "@/lib/api";
import AppShell from "@/components/AppShell";
import ErrorState from "@/components/ErrorState";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

type Visitor = { id: string; name: string; unit: string; purpose?: string; time?: string };

async function fetchVisitors(): Promise<Visitor[]> {
  const res = await api.get("/api/v1/visitors");
  return res.data.data as Visitor[];
}

function toLogin(returnTo = "/visitors") {
  window.location.href = `/api/auth/start?return_to=${encodeURIComponent(returnTo)}`;
}

export default function VisitorsClient() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["visitors"],
    queryFn: fetchVisitors,
    retry: false,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!data) return [];
    const s = search.trim().toLowerCase();
    return s
      ? data.filter(v =>
          (v.name || "").toLowerCase().includes(s) ||
          (v.unit || "").toLowerCase().includes(s) ||
          (v.purpose || "").toLowerCase().includes(s)
        )
      : data.slice();
  }, [data, search]);

  if (isLoading) return <main className="p-6">Loading…</main>;

  if (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      toLogin("/visitors");
      return <main className="p-6">Redirecting to login…</main>;
    }
    return <ErrorState error={error} what="visitors" />;
  }

  return (
    <AppShell>
      <main className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Visitor Passes</h1>
          <Input
            placeholder="Search by name / unit / purpose..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(v => (
            <Card key={v.id} className="p-4">
              <div className="font-semibold">{v.name}</div>
              <div className="text-sm text-muted-foreground">Unit {v.unit}</div>
              <div className="mt-2 flex gap-2">
                {v.purpose && <Badge variant="secondary">{v.purpose}</Badge>}
                {v.time && <Badge variant="outline">{v.time}</Badge>}
              </div>
            </Card>
          ))}
          {filtered.length === 0 && <p className="text-muted-foreground">No visitors found.</p>}
        </div>
      </main>
    </AppShell>
  );
}