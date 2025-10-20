// app/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const store = await cookies();
  const hasSession =
    store.get("access_token")?.value || store.get("id_token")?.value;

  // already logged in → redirect
  if (hasSession) redirect("/residents");

  // otherwise, show login launcher
  const href = `/api/auth/start?return_to=${encodeURIComponent("/residents")}`;

  return (
    <main className="min-h-screen grid place-items-center p-8">
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-semibold">NoBrokerHood+ Admin</h1>
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