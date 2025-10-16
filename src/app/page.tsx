// app/page.tsx (server component)
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  // Next 15 requires awaiting the searchParams promise
  const params = await searchParams;
  const returnTo = params?.return_to ?? "/residents";
  const href = `/api/auth/start?return_to=${encodeURIComponent(returnTo)}`;

  return (
    <main className="min-h-screen grid place-items-center p-8">
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-semibold">NoBrokerHood+ Admin</h1>
        {/* Use a plain <a> for API redirect endpoints to avoid prefetch */}
        <a
          href={href}
          className="inline-block rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Login with AWS Cognito
        </a>
      </div>
    </main>
  );
}