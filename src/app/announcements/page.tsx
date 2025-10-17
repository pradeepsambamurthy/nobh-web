"use client";

import AppShell from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import api from "@/lib/api";
import ErrorState from "@/components/ErrorState";

type Announcement = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  pinned?: boolean;
};

async function fetchAnnouncements(): Promise<Announcement[]> {
  const r = await api.get("/api/v1/announcements", { withCredentials: true });
  return r.data.data as Announcement[];
}

function toLogin(returnTo = "/announcements") {
  window.location.href = `/api/auth/start?return_to=${encodeURIComponent(returnTo)}`;
}

export default function AnnouncementsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["announcements"],
    queryFn: fetchAnnouncements,
    retry: false,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  return (
    <AppShell>
      <main className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Announcements</h1>
        </div>

        {isLoading && <p>Loading…</p>}

        {error
          ? (() => {
              // If unauthorized, bounce to login (preserve return path)
              if (axios.isAxiosError(error) && error.response?.status === 401) {
                toLogin("/announcements");
                return <p>Redirecting to login…</p>;
              }
              return <ErrorState error={error} what="announcements" />;
            })()
          : (
            <div className="space-y-4">
              {(data || []).map((a) => (
                <div key={a.id} className="border rounded p-4">
                  <div className="flex justify-between">
                    <h2 className="font-semibold">{a.title}</h2>
                    <span className="text-xs text-gray-500">
                      {new Date(a.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-2 text-sm whitespace-pre-wrap">{a.body}</p>
                  {a.pinned && (
                    <span className="mt-2 inline-block text-xs text-yellow-600 font-semibold">
                      📌 Pinned
                    </span>
                  )}
                </div>
              ))}
              {(data?.length ?? 0) === 0 && (
                <p className="text-muted-foreground">No announcements.</p>
              )}
            </div>
          )
        }
      </main>
    </AppShell>
  );
}