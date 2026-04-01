import { SignJWT, jwtVerify, JWTPayload } from "jose";

export const AUTH_COOKIE_NAME = "edugestao_session";

export interface AuthSessionPayload extends JWTPayload {
  userId: string;
  email: string;
  role: string;
}

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET não foi definido.");
  }

  return new TextEncoder().encode(secret);
}

export async function signAuthToken(payload: AuthSessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getAuthSecret());
}

export async function verifyAuthToken(token: string) {
  const { payload } = await jwtVerify(token, getAuthSecret());

  return payload as unknown as AuthSessionPayload;
}