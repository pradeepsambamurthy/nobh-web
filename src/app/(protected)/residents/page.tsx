"use client";

import AppShell from "@/components/AppShell";
import { useEffect, useState } from "react";

type Resident = { id: string; name: string; unit: string; phone?: string };

export default function ResidentsPage() {
  const [items, setItems] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/v1/residents", { credentials: "include", cache: "no-store" });
        if (r.status === 401) {
          window.location.href = `/api/auth/start?return_to=${encodeURIComponent("/residents")}`;
          return;
        }
        if (!r.ok) throw new Error(`residents_failed_${r.status}`);
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
      <main className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Residents</h1>

        {loading && <p>Loading…</p>}
        {!loading && err && <p className="text-red-600">Failed to load residents.</p>}

        {!loading && !err && (
          <div className="space-y-2">
            {items.length === 0 ? (
              <p className="text-muted-foreground">No residents found.</p>
            ) : (
              items.map((r) => (
                <div key={r.id} className="border rounded p-3">
                  <span className="font-semibold">{r.name}</span> — {r.unit}
                  {r.phone ? <> — {r.phone}</> : null}
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </AppShell>
  );
}