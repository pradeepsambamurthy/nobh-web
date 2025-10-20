"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMe } from "@/hooks/useMe";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const { data, isLoading, error } = useMe();

  const NavLink = ({ href, label }: { href: string; label: string }) => {
    const active = pathname === href || pathname.startsWith(href + "/");
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={`hover:underline ${active ? "font-semibold" : ""}`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen grid grid-cols-[220px_1fr]">
      <aside className="border-r p-4 space-y-4">
        <h2 className="font-bold text-lg">NoBrokerHood+</h2>

        <nav className="flex flex-col gap-2 text-sm">
          <NavLink href="/residents" label="Residents" />
          <NavLink href="/visitors" label="Visitor Passes" />
          <NavLink href="/announcements" label="Announcements" />
          <NavLink href="/logs" label="Entry Logs" />
        </nav>

        <div className="border-t pt-3 text-sm text-muted-foreground">
          {isLoading && <p>Checking login…</p>}
          {!isLoading && error && <p className="text-red-600">Failed to check session.</p>}

          {!isLoading && data?.authenticated && (
            <div className="flex flex-col gap-1">
              <span className="font-medium">{data.name || data.email || "Signed in"}</span>
              <a href="/api/auth/logout" className="underline text-red-600">Sign out</a>
            </div>
          )}

          {!isLoading && !data?.authenticated && (
            <a
              href={`/api/auth/start?return_to=${encodeURIComponent(pathname)}`}
              className="underline text-blue-600"
            >
              Sign in
            </a>
          )}
        </div>
      </aside>

      <main className="p-6">{children}</main>
    </div>
  );
}