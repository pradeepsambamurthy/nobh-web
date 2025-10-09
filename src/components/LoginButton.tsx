"use client";

export default function LoginButton() {
  async function handleLogin() {
    try {
      console.log("[login] calling /api/auth/start");
      const resp = await fetch("/api/auth/start", { method: "POST" });
      if (!resp.ok) throw new Error("Failed to start login");
      // The server responds with a redirect to Cognito
      const redirectUrl = resp.headers.get("Location");
      if (!redirectUrl) throw new Error("No redirect URL from /api/auth/start");
      window.location.href = redirectUrl;
    } catch (e) {
      console.error("[login] error", e);
      alert("Login failed — check console");
    }
  }

  return (
    <button
      onClick={handleLogin}
      className="bg-blue-600 text-white px-4 py-2 rounded"
    >
      Login with AWS Cognito
    </button>
  );
}