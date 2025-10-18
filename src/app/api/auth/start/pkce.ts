import { webcrypto as nodeCrypto } from "crypto";

const wc = nodeCrypto;

function base64url(buf: ArrayBuffer | Uint8Array) {
  const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  return Buffer.from(b).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function s256(input: string) {
  const data = new TextEncoder().encode(input);
  const digest = await wc.subtle.digest("SHA-256", data);
  return base64url(digest);
}

export async function makePkce() {
  const rand = wc.getRandomValues(new Uint8Array(32));
  const verifier = base64url(rand);
  const challenge = await s256(verifier);
  return { verifier, challenge };
}