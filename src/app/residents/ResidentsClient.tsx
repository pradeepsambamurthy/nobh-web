// src/app/residents/ResidentsClient.tsx
'use client';

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import AppShell from "@/components/AppShell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Resident = { id: string; name: string; unit: string; phone?: string };

async function fetchResidents(): Promise<Resident[]> {
  const res = await axios.get("/api/v1/residents");
  return res.data.data as Resident[];
}

export default function ResidentsClient() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["residents"],
    queryFn: fetchResidents,
  });

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "unit">("name");

  const filtered = useMemo(() => {
    if (!data) return [];
    const s = search.trim().toLowerCase();
    const arr = s
      ? data.filter(
          (r) =>
            r.name.toLowerCase().includes(s) ||
            r.unit.toLowerCase().includes(s)
        )
      : data.slice();

    arr.sort((a, b) =>
      sortBy === "unit"
        ? a.unit.localeCompare(b.unit)
        : a.name.localeCompare(b.name)
    );
    return arr;
  }, [data, search, sortBy]);

  if (isLoading) return <main className="p-6">Loading…</main>;
  if (error) return <main className="p-6 text-red-600">Failed to load residents.</main>;

  return (
    <AppShell>
      <main className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">Residents</h1>

          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              <Input
                placeholder="Search by name or unit..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-56"
              />
              <Select value={sortBy} onValueChange={(v: "name" | "unit") => setSortBy(v)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="unit">Unit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <button
              className="text-sm underline"
              onClick={() => (window.location.href = "/api/auth/logout")}
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="font-semibold">{r.name}</div>
              <div className="text-sm text-muted-foreground">Unit {r.unit}</div>
              <div className="mt-2">
                <Badge variant="secondary">{r.phone ?? "No phone"}</Badge>
              </div>
            </Card>
          ))}
          {filtered.length === 0 && (
            <p className="text-muted-foreground">No residents found.</p>
          )}
        </div>
      </main>
    </AppShell>
  );
}