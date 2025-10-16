"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMe } from "@/hooks/useMe";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data, isLoading } = useMe();

  return (
    <div className="min-h-screen grid grid-cols-[220px_1fr]">
      <aside className="border-r p-4 space-y-4">
        <h2 className="font-bold text-lg">NoBrokerHood+</h2>

        {/* Navigation */}
        <nav className="flex flex-col gap-2 text-sm">
          <Link
            href="/residents"
            className={`hover:underline ${pathname === "/residents" ? "font-semibold" : ""}`}
          >
            Residents
          </Link>
          <Link
            href="/visitors"
            className={`hover:underline ${pathname === "/visitors" ? "font-semibold" : ""}`}
          >
            Visitor Passes
          </Link>
          <Link
            href="/announcements"
            className={`hover:underline ${pathname === "/announcements" ? "font-semibold" : ""}`}
          >
            Announcements
          </Link>
          <Link
            href="/logs"
            className={`hover:underline ${pathname === "/logs" ? "font-semibold" : ""}`}
          >
            Entry Logs
          </Link>
        </nav>

        {/* Auth status section */}
        <div className="border-t pt-3 text-sm text-muted-foreground">
          {isLoading && <p>Checking login…</p>}

          {!isLoading && data?.authenticated && (
            <div className="flex flex-col gap-1">
              <span className="font-medium">{data.name || data.email}</span>
              <a href="/api/auth/logout" className="underline text-red-600">
                Sign out
              </a>
            </div>
          )}

          {!isLoading && !data?.authenticated && (
            <Link
              href={`/api/auth/start?return_to=${encodeURIComponent(pathname)}`}
              className="underline text-blue-600"
            >
              Sign in
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="p-6">{children}</main>
    </div>
  );
}