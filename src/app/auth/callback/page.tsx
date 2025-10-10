// app/auth/callback/page.tsx  (SERVER component)
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import CallbackClient from "./CallbackClient";

type SP = { [key: string]: string | string[] | undefined };

export default function CallbackPage({ searchParams }: { searchParams: SP }) {
  const code  = (searchParams.code as string) || "";
  const error = (searchParams.error as string) || "";
  const error_description = (searchParams.error_description as string) || "";
  const state = (searchParams.state as string) || "";

  return (
    <CallbackClient
      code={code}
      error={error}
      error_description={error_description}
      state={state}
    />
  );
}