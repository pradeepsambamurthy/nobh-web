// src/app/residents/page.tsx
// ✅ SERVER COMPONENT (no "use client" here)
export const dynamic = "force-dynamic";
export const revalidate = 0;

import ResidentsClient from "./ResidentsClient";

export default function ResidentsPage() {
  return <ResidentsClient />;
}