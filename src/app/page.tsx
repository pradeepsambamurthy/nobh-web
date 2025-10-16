// app/page.tsx (server component)
import Link from "next/link";

export default function Home({ searchParams }: { searchParams: { [k: string]: string | undefined } }) {
  const returnTo = searchParams?.return_to ?? "/residents";
  const href = `/api/auth/start?return_to=${encodeURIComponent(returnTo)}`;

  return (
    <main className="min-h-screen grid place-items-center p-8">
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-semibold">NoBrokerHood+ Admin</h1>
        <Link
          href={href}
          className="inline-block rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Login with AWS Cognito
        </Link>
      </div>
    </main>
  );
}