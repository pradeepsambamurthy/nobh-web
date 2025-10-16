"use client";

export default function ErrorState({ error, what = "data" }: { error: any; what?: string }) {
  const msg = typeof error === "object" && error && "message" in error ? String((error as any).message) : "";

  // hide loud error for expected 401/unauthorized (middleware will redirect)
  if (msg.includes("401") || msg.toLowerCase().includes("unauthorized")) {
    return <main className="p-6">Redirecting to login…</main>;
  }

  return (
    <main className="p-6 text-red-600">
      Failed to load {what}.
    </main>
  );
}