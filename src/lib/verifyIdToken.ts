import { createRemoteJWKSet, jwtVerify } from "jose";

const REGION = process.env.NEXT_PUBLIC_COGNITO_REGION!;
const USER_POOL_ID = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!;
const CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!;

const JWKS = createRemoteJWKSet(
  new URL(`https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}/.well-known/jwks.json`)
);

export async function verifyIdToken(idToken: string) {
  const { payload } = await jwtVerify(idToken, JWKS, {
    issuer: `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`,
    audience: CLIENT_ID, // for ID tokens
  });
  return payload; // contains email, sub, cognito:groups, etc.
}