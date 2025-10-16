"use client";

import AppShell from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import ErrorState from "@/components/ErrorState";

type Visitor = {
  id: string;
  name: string;
  code: string;
  validTill: string;
  status: "active" | "revoked";
};

async function fetchVisitors(): Promise<Visitor[]> {
  const r = await fetch("/api/v1/visitors", { cache: "no-store" });
  if (!r.ok) throw new Error("failed");
  const json = await r.json();
  return json.data as Visitor[];
}

export default function VisitorsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["visitors"],
    queryFn: fetchVisitors,
  });

  const [query, setQuery] = useState("");

  if (isLoading) return <AppShell><main className="p-6">Loading…</main></AppShell>;
  if (error) return <AppShell><main className="p-6 text-red-600">Failed to load visitors.</main></AppShell>;

  const items = (data || []).filter(v =>
    (v.name + v.code).toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AppShell>
      <main className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Visitor Passes</h1>
          <form action="/api/v1/visitors" method="post" className="inline">
            <button className="rounded bg-blue-600 text-white px-3 py-1.5 hover:bg-blue-700">
              Create Pass
            </button>
          </form>
        </div>

        <input
          className="border rounded px-3 py-2 w-80"
          placeholder="Search by name or code…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(v => (
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
                <form
                  action={`/api/v1/visitors?id=${encodeURIComponent(v.id)}`}
                  method="post"
                  className="mt-3"
                >
                  <input type="hidden" name="_method" value="revoke" />
                  <button className="text-sm underline text-red-600">
                    Revoke
                  </button>
                </form>
              )}
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-muted-foreground">No visitors.</p>
          )}
        </div>
      </main>
    </AppShell>
  );
}