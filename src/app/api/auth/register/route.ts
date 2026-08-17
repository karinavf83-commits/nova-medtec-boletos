import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, userPasswords } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { isEmailAllowedAdmin } from "@/lib/auth/allowlist";
import { createSession, setSessionCookie } from "@/lib/auth/session";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "A senha deve ter ao menos 8 caracteres"),
  displayName: z.string().min(1, "Informe seu nome"),
});

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await request.json());
    const email = body.email.trim().toLowerCase();

    if (!isEmailAllowedAdmin(email)) {
      return NextResponse.json(
        {
          error:
            "Cadastro restrito às administradoras autorizadas da Nova Medtec.",
        },
        { status: 403 }
      );
    }

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Este e-mail já está cadastrado." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(body.password);

    const [user] = await db
      .insert(users)
      .values({ email, displayName: body.displayName, role: "admin" })
      .returning({ id: users.id, email: users.email, displayName: users.displayName });

    await db.insert(userPasswords).values({ userId: user.id, passwordHash });

    const token = await createSession(user.id);
    await setSessionCookie(token);

    return NextResponse.json({
      user: { ...user, role: "admin" as const },
    });
  } catch (error) {
    console.error("Registration error:", error);
    const message =
      error instanceof z.ZodError
        ? error.errors[0]?.message
        : error instanceof Error
          ? error.message
          : "Falha no cadastro";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
