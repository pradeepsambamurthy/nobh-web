// This is a SERVER COMPONENT (do not add "use client")
export const dynamic = "force-dynamic";  // disables static generation
export const runtime = "nodejs";         // ensures Node.js runtime, not edge
export const revalidate = 0;             // no caching or ISR

import { Suspense } from "react";
import CallbackClient from "./CallbackClient";

// Server-side wrapper component
export default function CallbackPage() {
  return (
    <Suspense fallback={<p className="text-center mt-10">Loading…</p>}>
      <CallbackClient />
    </Suspense>
  );
}