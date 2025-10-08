"use client";
import Link from "next/link";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-[220px_1fr]">
      <aside className="border-r p-4 space-y-3">
        <h2 className="font-bold">NoBrokerHood+</h2>
        <nav className="flex flex-col gap-2 text-sm">
          <Link href="/residents" className="underline">Residents</Link>
          <Link href="/visitors" className="underline">Visitor Passes</Link>
          <Link href="/announcements" className="underline">Announcements</Link>
          <Link href="/logs" className="underline">Entry Logs</Link>
          <a href="/api/auth/logout" className="underline">Sign out</a>
        </nav>
      </aside>
      <main className="p-6">{children}</main>
    </div>
  );
}