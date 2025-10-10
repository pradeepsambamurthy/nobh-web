"use client";

export default function Home() {
  const handleLogin = async () => {
    const r = await fetch("/api/auth/start", {
      method: "POST",
      credentials: "same-origin",
    });

    if (!r.ok) {
      console.error("[login] /api/auth/start failed", r.status, await r.text().catch(() => ""));
      alert("Login init failed. See console.");
      return;
    }

    const { authorizeUrl } = (await r.json().catch(() => ({}))) as { authorizeUrl?: string };
    if (!authorizeUrl) {
      console.error("[login] missing authorizeUrl");
      alert("Login init failed (no url).");
      return;
    }

    // top-level navigation to Cognito
    window.location.href = authorizeUrl;
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-bold">NoBrokerHood+ Admin</h1>
      <button className="rounded-lg bg-blue-600 px-6 py-3 text-white" onClick={handleLogin}>
        Login with AWS Cognito
      </button>
    </main>
  );
}