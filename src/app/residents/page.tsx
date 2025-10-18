"use client";

import { useEffect, useState } from "react";

export default function ResidentsPage() {
  const [residents, setResidents] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchResidents() {
      try {
        const res = await fetch("/api/v1/residents", {
          credentials: "include",
        });

        if (res.status === 401) {
          console.warn("Unauthorized → redirecting to Cognito login");
          // Redirect to start auth
          window.location.href = "/api/auth/start?returnTo=/residents";
          return;
        }

        if (!res.ok) throw new Error(`Status ${res.status}`);

        const { data } = await res.json();
        setResidents(data || []);
      } catch (err: any) {
        setError(err.message || "Failed to load residents");
      }
    }

    fetchResidents();
  }, []);

  if (error) {
    return (
      <div style={{ color: "red" }}>
        Failed to load residents. Error: {error}
      </div>
    );
  }

  return (
    <main className="p-8">
      <h1 className="text-xl font-bold mb-4">Residents</h1>
      <ul>
        {residents.map((r) => (
          <li key={r.id}>
            <b>{r.name}</b> — {r.unit} — {r.phone}
          </li>
        ))}
      </ul>
    </main>
  );
}