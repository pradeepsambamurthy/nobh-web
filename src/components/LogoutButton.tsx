"use client";

export default function LogoutButton() {
  const logout = async () => {
    // Clear our cookies server-side
    await fetch("/api/auth/logout", { method: "POST" });
    // Then go home
    window.location.href = "/";
  };

  return (
    <button className="rounded border px-3 py-2" onClick={logout}>
      Logout
    </button>
  );
}