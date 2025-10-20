"use client";

import AppShell from "@/components/AppShell";
import { useEffect, useState } from "react";

type Announcement = { id: string; title: string; body: string; createdAt: string; pinned?: boolean };

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/v1/announcements", { credentials: "include", cache: "no-store" });
        if (r.status === 401) {
          window.location.href = `/api/auth/start?return_to=${encodeURIComponent("/announcements")}`;
          return;
        }
        if (!r.ok) throw new Error(`announcements_failed_${r.status}`);
        const json = await r.json();
        setItems(Array.isArray(json?.data) ? json.data : []);
      } catch (e: any) {
        setErr(e?.message ?? "failed");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AppShell>
      <main className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Announcements</h1>

        {loading && <p>Loading…</p>}
        {!loading && err && <p className="text-red-600">Failed to load announcements.</p>}

        {!loading && !err && (
          <div className="space-y-4">
            {items.length === 0 ? (
              <p className="text-muted-foreground">No announcements.</p>
            ) : (
              items.map((a) => (
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
              ))
            )}
          </div>
        )}
      </main>
    </AppShell>
  );
}