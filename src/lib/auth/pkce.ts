// src/lib/auth/pkce.ts
function b64url(input: ArrayBuffer | Uint8Array) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  let str = "";
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function createPkcePair() {
  const verifierBytes = crypto.getRandomValues(new Uint8Array(32));
  const verifier = b64url(verifierBytes);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  const challenge = b64url(digest);
  sessionStorage.setItem("pkce_verifier", verifier);
  return { verifier, challenge };
}

export function getPkceVerifier() {
  const v = sessionStorage.getItem("pkce_verifier");
  if (!v) throw new Error("Missing PKCE verifier");
  return v;
}

export function clearPkce() {
  sessionStorage.removeItem("pkce_verifier");
}