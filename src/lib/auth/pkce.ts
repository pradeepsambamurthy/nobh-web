// src/lib/auth/pkce.ts
const KEY = 'pkce_code_verifier';

function setCookie(value: string) {
  // ✅ SameSite=None ensures cross-site redirect keeps it
  document.cookie = `${KEY}=${encodeURIComponent(value)}; Max-Age=300; Path=/; SameSite=None; Secure`;
}

function getCookie(): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${KEY}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function clearCookie() {
  document.cookie = `${KEY}=; Max-Age=0; Path=/; SameSite=None; Secure`;
}

export function setPkceVerifier(v: string) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(KEY, v); } catch {}
  setCookie(v);
}

export function getPkceVerifier(): string {
  if (typeof window === 'undefined') throw new Error('Not in browser');
  let v: string | null = null;
  try { v = localStorage.getItem(KEY); } catch {}
  if (!v) v = getCookie();
  if (!v) throw new Error('PKCE verifier missing');
  return v;
}

export function clearPkce() {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(KEY); } catch {}
  clearCookie();
}

function toBase64Url(bytes: Uint8Array) {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function createCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return toBase64Url(new Uint8Array(digest));
}

export async function createPkcePair(): Promise<{ verifier: string; challenge: string }> {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let verifier = '';
  for (let i = 0; i < 64; i++) verifier += alphabet[Math.floor(Math.random() * alphabet.length)];
  const challenge = await createCodeChallenge(verifier);
  return { verifier, challenge };
}