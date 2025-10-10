import { setPkceVerifier, createCodeChallenge } from './pkce';
import { COGNITO_DOMAIN, COGNITO_CLIENT_ID, REDIRECT_URI } from './config';


export async function startLogin() {
  // 1) PKCE verifier + challenge
  const codeVerifier = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => ('0' + b.toString(16)).slice(-2))
    .join('');
  setPkceVerifier(codeVerifier);
  const codeChallenge = await createCodeChallenge(codeVerifier);

  // 2) where to return after login
  const current = typeof window !== 'undefined'
    ? window.location.pathname + window.location.search
    : '/';
  const state = encodeURIComponent(current || '/residents');

  // 3) Build authorize URL
  const authorize = new URL(`${COGNITO_DOMAIN}/oauth2/authorize`);
  authorize.searchParams.set('client_id', COGNITO_CLIENT_ID);
  authorize.searchParams.set('response_type', 'code');
  authorize.searchParams.set('redirect_uri', REDIRECT_URI);
  authorize.searchParams.set('scope', 'openid email profile');
  authorize.searchParams.set('state', state);
  authorize.searchParams.set('code_challenge', codeChallenge);
  authorize.searchParams.set('code_challenge_method', 'S256');

  console.log('[login] set pkce_v cookie/localStorage. document.cookie =', document.cookie);
  window.location.href = authorize.toString();
  
}