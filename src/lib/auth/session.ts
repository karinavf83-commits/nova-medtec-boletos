import "server-only";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { sessions, users } from "../db/schema";
import { signSessionToken, verifySessionToken } from "./jwt";
import { SESSION_COOKIE_NAME, SESSION_TTL_SECONDS } from "./constants";

export { SESSION_COOKIE_NAME, SESSION_TTL_SECONDS };

export interface SessionUser {
  id: number;
  email: string;
  displayName: string;
  role: "admin";
}

export async function createSession(userId: number): Promise<string> {
  const sessionId = randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_SECONDS * 1000);

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    createdAt: now,
    lastAccessed: now,
    expiresAt,
  });

  return signSessionToken({ sessionId });
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const rows = await db
    .select({
      sessionId: sessions.id,
      expiresAt: sessions.expiresAt,
      userId: users.id,
      email: users.email,
      displayName: users.displayName,
      role: users.role,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, payload.sessionId))
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  if (row.expiresAt.getTime() < Date.now()) return null;

  db.update(sessions)
    .set({ lastAccessed: new Date() })
    .where(eq(sessions.id, payload.sessionId))
    .catch(() => {});

  return {
    id: row.userId,
    email: row.email,
    displayName: row.displayName,
    role: row.role,
  };
}

export async function destroyCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    const payload = await verifySessionToken(token);
    if (payload) {
      await db.delete(sessions).where(eq(sessions.id, payload.sessionId));
    }
  }
  await clearSessionCookie();
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("NOT_AUTHENTICATED");
  }
  return user;
}
