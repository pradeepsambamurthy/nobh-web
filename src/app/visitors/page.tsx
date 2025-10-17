// src/app/visitors/page.tsx
"use client";

import AppShell from "@/components/AppShell";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

type Visitor = {
  id: string;
  name: string;
  code: string;
  validTill: string;
  status: "active" | "revoked";
};

async function fetchVisitors(): Promise<Visitor[]> {
  const r = await fetch("/api/v1/visitors", { cache: "no-store" });
  if (r.status === 401) {
    // 401 → go to login preserving return path
    window.location.href = `/api/auth/start?return_to=${encodeURIComponent("/visitors")}`;
    // ensure a neutral render after triggering nav
    return new Promise<Visitor[]>(() => {});
  }
  if (!r.ok) throw new Error("failed");
  const json = await r.json();
  return json.data as Visitor[];
}

export default function VisitorsPage() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["visitors"],
    queryFn: fetchVisitors,
    retry: false,
    staleTime: 0,
  });

  const [query, setQuery] = useState("");

  if (isLoading) {
    return (
      <AppShell>
        <main className="p-6">Loading…</main>
      </AppShell>
    );
  }
  if (error) {
    return (
      <AppShell>
        <main className="p-6 text-red-600">Failed to load visitors.</main>
      </AppShell>
    );
  }

  const items = (data || []).filter((v) =>
    (v.name + v.code).toLowerCase().includes(query.toLowerCase())
  );

  // helper to refetch after form submission completes
  async function handleFormSubmit(ev: React.FormEvent<HTMLFormElement>) {
    // let the form POST happen
    // then, wait a tick and refetch
    setTimeout(() => {
      qc.invalidateQueries({ queryKey: ["visitors"] });
    }, 250);
  }

  return (
    <AppShell>
      <main className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Visitor Passes</h1>

          <form action="/api/v1/visitors" method="post" className="inline" onSubmit={handleFormSubmit}>
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

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((v) => (
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
                  action={`/api/v1/visitors?_method=revoke&id=${encodeURIComponent(v.id)}`}
                  method="post"
                  className="mt-3"
                  onSubmit={handleFormSubmit}
                >
                  <button className="text-sm underline text-red-600">
                    Revoke
                  </button>
                </form>
              )}
            </div>
          ))}

          {items.length === 0 && <p className="text-muted-foreground">No visitors.</p>}
        </div>
      </main>
    </AppShell>
  );
}