"use client";

import AppShell from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

type Visitor = {
  id: string;
  name: string;
  code: string;
  validTill: string;
  status: "active" | "revoked";
};

async function fetchVisitors(): Promise<Visitor[]> {
  const r = await fetch("/api/v1/visitors", { cache: "no-store", credentials: "include" });
  if (r.status === 401) {
    window.location.href = `/api/auth/start?state=${encodeURIComponent("/visitors")}`;
    return new Promise<Visitor[]>(_ => {});
  }
  if (!r.ok) throw new Error("visitors_load_failed");
  const json = await r.json();
  return Array.isArray(json?.data) ? (json.data as Visitor[]) : [];
}

export default function VisitorsPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["visitors"],
    queryFn: fetchVisitors,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const list = Array.isArray(data) ? data : [];
    const q = query.trim().toLowerCase();
    return q ? list.filter(v => (v.name + v.code).toLowerCase().includes(q)) : list;
  }, [data, query]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/v1/visitors", { method: "POST", credentials: "include" });
    refetch();
  }

  async function handleRevoke(id: string) {
    await fetch(`/api/v1/visitors?_method=revoke&id=${encodeURIComponent(id)}`, {
      method: "POST",
      credentials: "include",
    });
    refetch();
  }

  return (
    <AppShell>
      <main className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Visitor Passes</h1>
          <form onSubmit={handleCreate}>
            <button className="rounded bg-blue-600 text-white px-3 py-1.5 hover:bg-blue-700">
              Create Pass
            </button>
          </form>
        </div>

        <input
          className="border rounded px-3 py-2 w-80"
          placeholder="Search by name or code…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {isLoading && <p>Loading…</p>}
        {error && <p className="text-red-600">Failed to load visitors.</p>}

        {!isLoading && !error && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((v) => (
              <div key={v.id} className="border rounded p-4">
                <div className="font-semibold">{v.name}</div>
                <div className="text-sm text-muted-foreground">Code: {v.code}</div>
                <div className="text-sm">
                  Valid till: {new Date(v.validTill).toLocaleString()}
                </div>
                <div className="mt-2 text-xs uppercase">
                  {v.status === "active" ? "Active" : "Revoked"}
                </div>
                {v.status === "active" && (
                  <button
                    onClick={() => handleRevoke(v.id)}
                    className="mt-3 text-sm underline text-red-600"
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
            {filtered.length === 0 && <p className="text-muted-foreground">No visitors.</p>}
          </div>
        )}
      </main>
    </AppShell>
  );
}