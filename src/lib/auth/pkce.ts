// src/lib/auth/pkce.ts
// Robust PKCE storage: cookie + sessionStorage

const KEY = "pkce_code_verifier";
const COOKIE = `${KEY}=`;
const TEN_MIN = 600; // seconds

function setCookie(val: string) {
  // Lax allows OAuth redirects to send the cookie
  document.cookie =
    `${COOKIE}${encodeURIComponent(val)}; Max-Age=${TEN_MIN}; Path=/; SameSite=Lax; Secure`;
}
function readCookie(): string | null {
  const m = document.cookie.split("; ").find(p => p.startsWith(COOKIE));
  if (!m) return null;
  try { return decodeURIComponent(m.slice(COOKIE.length)); } catch { return null; }
}
function clearCookie() {
  document.cookie = `${COOKIE}; Max-Age=0; Path=/; SameSite=Lax; Secure`;
}

/** Store the verifier (both places) */
export function setPkceVerifier(v: string) {
  if (typeof window === "undefined") return;
  try { sessionStorage.setItem(KEY, v); } catch {}
  try { setCookie(v); } catch {}
}

/** Read it back from cookie first (most reliable), then sessionStorage */
export function getPkceVerifier(): string {
  if (typeof window === "undefined") throw new Error("Not in browser");
  const fromCookie = readCookie();
  if (fromCookie) return fromCookie;

  const fromSS = sessionStorage.getItem(KEY);
  if (fromSS) return fromSS;

  throw new Error("PKCE verifier missing");
}

/** Clear both after successful token exchange */
export function clearPkce() {
  if (typeof window === "undefined") return;
  try { sessionStorage.removeItem(KEY); } catch {}
  try { clearCookie(); } catch {}
}

/** Base64URL encode a byte array */
function toBase64Url(bytes: Uint8Array) {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** SHA-256(code_verifier) -> base64url */
export async function createCodeChallenge(verifier: string): Promise<string> {
  if (!crypto?.subtle) throw new Error("PKCE needs browser crypto.subtle");
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toBase64Url(new Uint8Array(digest));
}

/** Generate verifier + challenge and persist */
export async function createPkcePair(): Promise<{ verifier: string; challenge: string }> {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let verifier = "";
  for (let i = 0; i < 64; i++) verifier += alphabet[Math.floor(Math.random() * alphabet.length)];
  const challenge = await createCodeChallenge(verifier);
  setPkceVerifier(verifier);
  return { verifier, challenge };
}