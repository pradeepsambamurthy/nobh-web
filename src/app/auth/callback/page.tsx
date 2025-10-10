// app/auth/callback/page.tsx (SERVER)
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import CallbackClient from "./CallbackClient";

type SP = { [k: string]: string | string[] | undefined };

export default function Page({ searchParams }: { searchParams: SP }) {
  return (
    <CallbackClient
      code={(searchParams.code as string) || ""}
      error={(searchParams.error as string) || ""}
      error_description={(searchParams.error_description as string) || ""}
      state={(searchParams.state as string) || ""}
    />
  );
}