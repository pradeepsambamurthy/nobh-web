// src/components/LoginButton.tsx
"use client";

export default function LoginButton() {
  const handleLogin = async () => {
    const resp = await fetch("/api/auth/start", { method: "POST" });
    if (!resp.ok) {
      console.error("[login] /api/auth/start failed", await resp.text());
      alert("Login init failed. Check console.");
      return;
    }
    const redirectUrl = resp.headers.get("Location");
    if (!redirectUrl) {
      console.error("[login] missing Location header");
      alert("Login init failed (no redirect).");
      return;
    }
    window.location.href = redirectUrl;
  };

  return (
    <button
      onClick={handleLogin}
      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
    >
      Sign In
    </button>
  );
}