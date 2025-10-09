// src/app/page.tsx
"use client";

export default function Home() {
  const handleLogin = async () => {
    // Ask our server route to: (1) create PKCE, (2) set cookie, (3) give us the Cognito URL
    const resp = await fetch("/api/auth/start", { method: "POST" });
    if (!resp.ok) {
      console.error("[login] /api/auth/start failed", await resp.text());
      alert("Login init failed. Check console.");
      return;
    }

    const redirectUrl = resp.headers.get("Location");
    if (!redirectUrl) {
      console.error("[login] missing Location header from /api/auth/start");
      alert("Login init failed (no redirect).");
      return;
    }

    // Go to Cognito Hosted UI
    window.location.href = redirectUrl;
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-bold">NoBrokerHood+ Admin</h1>
      <button
        className="rounded-lg bg-blue-600 px-6 py-3 text-white"
        onClick={handleLogin}
      >
        Login with AWS Cognito
      </button>
    </main>
  );
}