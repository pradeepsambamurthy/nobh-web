function requireEnv(name: string, value?: string) {
  if (!value) throw new Error(`Missing ${name}. Add it to .env.local and restart dev server.`);
  return value;
}

export const COGNITO_DOMAIN   = requireEnv("NEXT_PUBLIC_COGNITO_DOMAIN",   process.env.NEXT_PUBLIC_COGNITO_DOMAIN).replace(/\/$/, "");
export const COGNITO_CLIENT_ID= requireEnv("NEXT_PUBLIC_COGNITO_CLIENT_ID",process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID);
export const REDIRECT_URI     = requireEnv("NEXT_PUBLIC_REDIRECT_URI",     process.env.NEXT_PUBLIC_REDIRECT_URI);
export const SIGNOUT_URI      = requireEnv("NEXT_PUBLIC_SIGNOUT_URI",      process.env.NEXT_PUBLIC_SIGNOUT_URI);
export const OAUTH_SCOPES     = ["email","openid","phone"].join(" ");