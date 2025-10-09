export function requireEnv(name: string, v?: string) {
  if (!v) throw new Error(`Missing ${name}. Add it to env and restart the server.`);
  return v;
}

export const COGNITO_REGION     = requireEnv('NEXT_PUBLIC_COGNITO_REGION',     process.env.NEXT_PUBLIC_COGNITO_REGION);
export const COGNITO_USER_POOL  = requireEnv('NEXT_PUBLIC_COGNITO_USER_POOL_ID', process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID);
export const COGNITO_CLIENT_ID  = requireEnv('NEXT_PUBLIC_COGNITO_CLIENT_ID',  process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID);

// normalize domain (no trailing slash)
export const COGNITO_DOMAIN = requireEnv('NEXT_PUBLIC_COGNITO_DOMAIN', process.env.NEXT_PUBLIC_COGNITO_DOMAIN)
  .replace(/\/$/, '');

export const REDIRECT_URI = requireEnv('NEXT_PUBLIC_REDIRECT_URI', process.env.NEXT_PUBLIC_REDIRECT_URI);
export const SIGNOUT_URI  = requireEnv('NEXT_PUBLIC_SIGNOUT_URI',  process.env.NEXT_PUBLIC_SIGNOUT_URI);

export const OAUTH_SCOPES = ['openid', 'email', 'profile'].join(' ');