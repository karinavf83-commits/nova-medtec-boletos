import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { boletoRequests } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { sendStatusChangeEmail } from "@/lib/email";

const schema = z.object({
  id: z.number().int().positive(),
  status: z.enum(["pending", "in_review", "done"]),
  adminNotes: z.string().max(4000).optional().nullable(),
});

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  in_review: "Em análise",
  done: "Feito",
};

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const input = schema.parse(await request.json());

    const existingRows = await db
      .select()
      .from(boletoRequests)
      .where(eq(boletoRequests.id, input.id))
      .limit(1);
    const existing = existingRows[0];
    if (!existing) {
      return NextResponse.json(
        { error: "Solicitação não encontrada." },
        { status: 404 }
      );
    }

    const now = new Date();
    const [updated] = await db
      .update(boletoRequests)
      .set({
        status: input.status,
        adminNotes:
          input.adminNotes !== undefined ? input.adminNotes : existing.adminNotes,
        updatedAt: now,
        completedAt: input.status === "done" ? now : null,
        completedByUserId: input.status === "done" ? user.id : null,
      })
      .where(eq(boletoRequests.id, input.id))
      .returning({ id: boletoRequests.id, status: boletoRequests.status });

    if (existing.status !== input.status && existing.requestedByEmail) {
      const emailResult = await sendStatusChangeEmail({
        to: existing.requestedByEmail,
        requestedByName: existing.requestedByName,
        clientName: existing.clientName,
        invoiceNumber: existing.invoiceNumber,
        storeName: existing.storeName,
        statusLabel: STATUS_LABELS[input.status] ?? input.status,
        adminNotes: input.adminNotes ?? null,
      });
      if (!emailResult.ok) {
        console.error("Status e-mail not sent:", emailResult.error);
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update boleto request status:", error);
    const message =
      error instanceof z.ZodError
        ? error.errors[0]?.message
        : error instanceof Error
          ? error.message
          : "Não foi possível atualizar o status.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
