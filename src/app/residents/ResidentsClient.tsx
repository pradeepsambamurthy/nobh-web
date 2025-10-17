// src/app/residents/ResidentsClient.tsx
"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import api from "@/lib/api";

import AppShell from "@/components/AppShell";
import ErrorState from "@/components/ErrorState";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Resident = {
  id: string;
  name: string;
  unit: string;
  phone?: string;
};

type ResidentsResponse = { data: Resident[] };

// ---- data fetching ----------------------------------------------------------

async function fetchResidents(): Promise<Resident[]> {
  const res = await api.get<ResidentsResponse>("/api/v1/residents", {
    withCredentials: true, // cookies for auth, if any
  });

  const payload = res.data;
  if (
    payload &&
    typeof payload === "object" &&
    Array.isArray((payload as ResidentsResponse).data)
  ) {
    return (payload as ResidentsResponse).data;
  }

  // Fallback: never return a non-array to callers that expect an array
  return [];
}

// ---- helpers ----------------------------------------------------------------

function toLogin(returnTo = "/residents") {
  window.location.href = `/api/auth/start?return_to=${encodeURIComponent(
    returnTo
  )}`;
}

// ---- component --------------------------------------------------------------

export default function ResidentsClient() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["residents"],
    queryFn: fetchResidents,
    retry: false,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "unit">("name");

  const filtered: Resident[] = useMemo(() => {
    const list = Array.isArray(data) ? data : [];
    const q = search.trim().toLowerCase();

    const base = q
      ? list.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            r.unit.toLowerCase().includes(q)
        )
      : list.slice(); // safe: list is always an array

    base.sort((a, b) =>
      sortBy === "unit"
        ? a.unit.localeCompare(b.unit)
        : a.name.localeCompare(b.name)
    );

    return base;
  }, [data, search, sortBy]);

  // ---- states ---------------------------------------------------------------

  if (isLoading) {
    return (
      <AppShell>
        <main className="p-6">Loading…</main>
      </AppShell>
    );
  }

  if (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      toLogin("/residents");
      return (
        <AppShell>
          <main className="p-6">Redirecting to login…</main>
        </AppShell>
      );
    }
    return (
      <AppShell>
        <ErrorState error={error} what="residents" />
      </AppShell>
    );
  }

  // ---- UI -------------------------------------------------------------------

  return (
    <AppShell>
      <main className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">Residents</h1>

          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              <Input
                placeholder="Search by name or unit…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-56"
              />

              <Select
                value={sortBy}
                onValueChange={(v: "name" | "unit") => setSortBy(v)}
              >
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

        </div>

        {filtered.length === 0 && (
          <p className="text-muted-foreground">No residents found.</p>
        )}
      </main>
    </AppShell>
  );
}