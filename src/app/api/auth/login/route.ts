import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, userPasswords } from "@/lib/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, setSessionCookie } from "@/lib/auth/session";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await request.json());
    const email = body.email.trim().toLowerCase();

    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        passwordHash: userPasswords.passwordHash,
      })
      .from(users)
      .innerJoin(userPasswords, eq(userPasswords.userId, users.id))
      .where(eq(users.email, email))
      .limit(1);

    const row = rows[0];
    if (!row || !(await verifyPassword(body.password, row.passwordHash))) {
      return NextResponse.json(
        { error: "E-mail ou senha incorretos." },
        { status: 401 }
      );
    }

    const token = await createSession(row.id);
    await setSessionCookie(token);

    return NextResponse.json({
      user: {
        id: row.id,
        email: row.email,
        displayName: row.displayName,
        role: "admin" as const,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    const message =
      error instanceof z.ZodError
        ? error.errors[0]?.message
        : "Falha no login";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
