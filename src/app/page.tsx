// src/app/page.tsx
"use client";

export default function Home() {
  const handleLogin = () => {
    // Let the browser navigate (no CORS); the route will set cookie + 302 to Cognito
    window.location.href = "/api/auth/start";
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