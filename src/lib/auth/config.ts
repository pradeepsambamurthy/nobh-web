function requireEnv(name: string, value?: string) {
  if (!value) {
    console.error(`❌ Missing ${name}. Add it to .env.local and restart dev server.`);
  }
  return value || "";
}

export const COGNITO_DOMAIN   = requireEnv("NEXT_PUBLIC_COGNITO_DOMAIN", process.env.NEXT_PUBLIC_COGNITO_DOMAIN);
export const COGNITO_CLIENT_ID= requireEnv("NEXT_PUBLIC_COGNITO_CLIENT_ID", process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID);
export const REDIRECT_URI     = requireEnv("NEXT_PUBLIC_REDIRECT_URI", process.env.NEXT_PUBLIC_REDIRECT_URI);
export const SIGNOUT_URI      = process.env.NEXT_PUBLIC_SIGNOUT_URI || "/";
export const OAUTH_SCOPES = ['openid', 'email', 'phone'].join(' ')