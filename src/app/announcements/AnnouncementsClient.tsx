'use client';

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import api from "@/lib/api";
import AppShell from "@/components/AppShell";
import ErrorState from "@/components/ErrorState";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Announcement = { id: string; title: string; date?: string; desc?: string };

async function fetchAnnouncements(): Promise<Announcement[]> {
  const res = await api.get("/api/v1/announcements");
  return res.data.data as Announcement[];
}

function toLogin(returnTo = "/announcements") {
  window.location.href = `/api/auth/start?return_to=${encodeURIComponent(returnTo)}`;
}

export default function AnnouncementsClient() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["announcements"],
    queryFn: fetchAnnouncements,
    retry: false,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!data) return [];
    const s = search.trim().toLowerCase();
    return s
      ? data.filter(a =>
          (a.title || "").toLowerCase().includes(s) ||
          (a.desc || "").toLowerCase().includes(s)
        )
      : data.slice();
  }, [data, search]);

  if (isLoading) return <main className="p-6">Loading…</main>;

  if (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      toLogin("/announcements");
      return <main className="p-6">Redirecting to login…</main>;
    }
    return <ErrorState error={error} what="announcements" />;
  }

  return (
    <AppShell>
      <main className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Announcements</h1>
          <Input
            placeholder="Search announcements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(a => (
            <Card key={a.id} className="p-4">
              <div className="font-semibold">{a.title}</div>
              {a.date && <div className="text-sm text-muted-foreground">{a.date}</div>}
              {a.desc && <div className="mt-2 text-sm">{a.desc}</div>}
              {a.date && <div className="mt-2"><Badge variant="secondary">Scheduled</Badge></div>}
            </Card>
          ))}
          {filtered.length === 0 && <p className="text-muted-foreground">No announcements found.</p>}
        </div>
      </main>
    </AppShell>
  );
}