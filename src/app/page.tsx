"use client";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-bold">NoBrokerHood+ Admin</h1>
      <a
        href="/api/auth/start"
        className="rounded-lg bg-blue-600 px-6 py-3 text-white"
      >
        Login with AWS Cognito
      </a>
    </main>
  );
}