"use client";

import AppShell from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";

type Ann = { id: string; title: string; body: string; createdAt: string; pinned?: boolean };

async function fetchAnnouncements(): Promise<Ann[]> {
  const r = await fetch("/api/v1/announcements", { cache: "no-store", credentials: "include" });
  if (r.status === 401) {
    window.location.href = `/api/auth/start?state=${encodeURIComponent("/announcements")}`;
    // return a never-resolving promise to stop rendering after redirect
    return new Promise<Ann[]>(_ => {});
  }
  if (!r.ok) throw new Error("announcements_load_failed");
  const json = await r.json();
  // IMPORTANT: turn any shape into an array
  return Array.isArray(json?.data) ? (json.data as Ann[]) : [];
}

export default function AnnouncementsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["announcements"],
    queryFn: fetchAnnouncements,
    retry: false,
    refetchOnWindowFocus: false,
  });

  return (
    <AppShell>
      <main className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Announcements</h1>

        {isLoading && <p>Loading…</p>}
        {error && <p className="text-red-600">Failed to load announcements.</p>}

        {!isLoading && !error && (
          <div className="space-y-4">
            {(Array.isArray(data) ? data : []).map((a) => (
              <div key={a.id} className="border rounded p-4">
                <div className="flex justify-between">
                  <h2 className="font-semibold">{a.title}</h2>
                  <span className="text-xs text-gray-500">
                    {new Date(a.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-2 text-sm whitespace-pre-wrap">{a.body}</p>
                {a?.pinned && (
                  <span className="mt-2 inline-block text-xs text-yellow-600 font-semibold">
                    📌 Pinned
                  </span>
                )}
              </div>
            ))}

            {(!Array.isArray(data) || data.length === 0) && (
              <p className="text-muted-foreground">No announcements.</p>
            )}
          </div>
        )}
      </main>
    </AppShell>
  );
}