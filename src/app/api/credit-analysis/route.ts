import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { count, desc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { creditAnalysisRequests } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import {
  buildCreditAnalysisWhere,
  parseCreditAnalysisFiltersFromSearchParams,
} from "@/lib/credit-analysis-filters";

const createSchema = z.object({
  storeName: z.string().min(1, "Informe a loja/CNPJ solicitante"),
  requestedByName: z.string().min(1, "Informe seu nome"),
  requestedByEmail: z.string().email().optional().nullable(),
  clientDocument: z.string().min(11, "Informe um CNPJ/CPF válido"),
  clientName: z.string().min(1, "Informe o nome do cliente"),
  clientPhone: z.string().optional().nullable(),
  intendedPurchaseAmount: z
    .coerce.number()
    .positive("Informe um valor maior que zero"),
  notes: z.string().max(2000).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const input = createSchema.parse(await request.json());

    const [created] = await db
      .insert(creditAnalysisRequests)
      .values({
        storeName: input.storeName,
        requestedByName: input.requestedByName,
        requestedByEmail: input.requestedByEmail?.trim() || null,
        clientDocument: input.clientDocument,
        clientName: input.clientName,
        clientPhone: input.clientPhone?.trim() || null,
        intendedPurchaseAmount: input.intendedPurchaseAmount.toFixed(2),
        notes: input.notes?.trim() || null,
        status: "pending",
      })
      .returning({ id: creditAnalysisRequests.id });

    return NextResponse.json({ id: created.id, status: "pending" as const });
  } catch (error) {
    console.error("Failed to create credit analysis request:", error);
    const message =
      error instanceof z.ZodError
        ? error.errors[0]?.message
        : "Não foi possível enviar a solicitação.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

const PAGE_SIZE = 25;

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filters = parseCreditAnalysisFiltersFromSearchParams(searchParams);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const where = buildCreditAnalysisWhere(filters);

  const [items, totalRow, storeRows, statusRows] = await Promise.all([
    db
      .select()
      .from(creditAnalysisRequests)
      .where(where)
      .orderBy(desc(creditAnalysisRequests.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ value: count() }).from(creditAnalysisRequests).where(where),
    db
      .selectDistinct({ storeName: creditAnalysisRequests.storeName })
      .from(creditAnalysisRequests)
      .orderBy(creditAnalysisRequests.storeName),
    db
      .select({
        status: creditAnalysisRequests.status,
        count: count(),
        totalAmount: sql<string>`coalesce(sum(${creditAnalysisRequests.intendedPurchaseAmount}), 0)`,
      })
      .from(creditAnalysisRequests)
      .groupBy(creditAnalysisRequests.status),
  ]);

  const summary = { pending: 0, in_review: 0, done: 0, totalAmount: 0 };
  for (const row of statusRows) {
    summary[row.status] = row.count;
    summary.totalAmount += Number(row.totalAmount);
  }

  return NextResponse.json({
    items,
    total: totalRow[0]?.value ?? 0,
    page,
    pageSize: PAGE_SIZE,
    availableStores: storeRows.map((r) => r.storeName),
    summary,
  });
}
