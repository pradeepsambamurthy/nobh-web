// src/lib/auth/config.ts
export const COGNITO_REGION      = process.env.NEXT_PUBLIC_COGNITO_REGION ?? "";
export const COGNITO_USER_POOL_ID= process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID ?? "";
export const COGNITO_CLIENT_ID   = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ?? "";
export const COGNITO_DOMAIN      = (process.env.NEXT_PUBLIC_COGNITO_DOMAIN ?? "").replace(/\/$/, "");
export const REDIRECT_URI        = process.env.NEXT_PUBLIC_REDIRECT_URI ?? "";
export const SIGNOUT_URI         = process.env.NEXT_PUBLIC_SIGNOUT_URI ?? "";
export const OAUTH_SCOPES        = ["email","openid","phone","profile"].join(" ");

export function assertAuthEnv(required: Array<[string,string]>) {
  const missing = required.filter(([,v]) => !v).map(([k]) => k);
  if (missing.length) {
    // Only throws where *you* call it (client/runtime), not at import time.
    throw new Error(`Missing env: ${missing.join(", ")}`);
  }
}