"use client";

import AppShell from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";
import ErrorState from "@/components/ErrorState";

type Announcement = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  pinned?: boolean;
};

async function fetchAnnouncements(): Promise<Announcement[]> {
  const r = await fetch("/api/v1/announcements", { cache: "no-store" });
  if (!r.ok) throw new Error("failed");
  const j = await r.json();
  return j.data as Announcement[];
}

export default function AnnouncementsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["announcements"],
    queryFn: fetchAnnouncements,
  });

  return (
    <AppShell>
      <main className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Announcements</h1>
        </div>

        {isLoading && <p>Loading…</p>}
{error && <ErrorState error={error} what="announcements" />}

        <div className="space-y-4">
          {(data || []).map((a) => (
            <div key={a.id} className="border rounded p-4">
              <div className="flex justify-between">
                <h2 className="font-semibold">{a.title}</h2>
                <span className="text-xs text-gray-500">
                  {new Date(a.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="mt-2 text-sm">{a.body}</p>
              {a.pinned && (
                <span className="text-xs text-yellow-600 font-semibold">📌 Pinned</span>
              )}
            </div>
          ))}
        </div>
      </main>
    </AppShell>
  );
}