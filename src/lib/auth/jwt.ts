import { jwtVerify, SignJWT } from "jose";

const encoder = new TextEncoder();

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET não configurada.");
  }
  return encoder.encode(secret);
}

export interface SessionTokenPayload {
  sessionId: string;
}

export async function signSessionToken(
  payload: SessionTokenPayload
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string
): Promise<SessionTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.sessionId !== "string") return null;
    return { sessionId: payload.sessionId };
  } catch {
    return null;
  }
}
