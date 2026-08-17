import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { count, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { boletoRequests } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import {
  buildBoletoRequestWhere,
  parseFiltersFromSearchParams,
} from "@/lib/boleto-filters";

const createSchema = z
  .object({
    storeName: z.string().min(1, "Informe a loja/CNPJ solicitante"),
    clientName: z.string().min(1, "Informe a razão social/nome do cliente"),
    clientDocument: z.string().min(11, "Informe um CNPJ/CPF válido"),
    dueDate: z.coerce.date({ errorMap: () => ({ message: "Informe o vencimento" }) }),
    invoiceNumber: z.string().min(1, "Informe o número da nota fiscal"),
    invoiceFileUrl: z.string().url().nullable().optional(),
    invoiceFilePathname: z.string().nullable().optional(),
    invoiceFileName: z.string().nullable().optional(),
    chargeReason: z.string().max(2000).optional(),
    totalAmount: z.coerce.number().positive("Informe um valor maior que zero"),
    paymentType: z.enum(["cash", "installments"]),
    installmentsCount: z.coerce.number().int().positive().optional().nullable(),
    clientEmail: z.string().email("Informe um e-mail válido do cliente"),
    clientPhone: z.string().min(8, "Informe um telefone válido"),
    contactPerson: z.string().min(1, "Informe a pessoa de contato"),
    requestedByName: z.string().min(1, "Informe seu nome"),
    requestedByEmail: z.string().email().optional().nullable(),
  })
  .refine(
    (data) =>
      data.paymentType !== "installments" ||
      (data.installmentsCount != null && data.installmentsCount > 1),
    { message: "Informe o número de parcelas", path: ["installmentsCount"] }
  );

export async function POST(request: NextRequest) {
  try {
    const input = createSchema.parse(await request.json());

    const [created] = await db
      .insert(boletoRequests)
      .values({
        storeName: input.storeName,
        clientName: input.clientName,
        clientDocument: input.clientDocument,
        dueDate: input.dueDate,
        invoiceNumber: input.invoiceNumber,
        invoiceFileUrl: input.invoiceFileUrl ?? null,
        invoiceFilePathname: input.invoiceFilePathname ?? null,
        invoiceFileName: input.invoiceFileName ?? null,
        chargeReason: input.chargeReason?.trim() || null,
        totalAmount: input.totalAmount.toFixed(2),
        paymentType: input.paymentType,
        installmentsCount:
          input.paymentType === "installments"
            ? (input.installmentsCount ?? null)
            : null,
        clientEmail: input.clientEmail,
        clientPhone: input.clientPhone,
        contactPerson: input.contactPerson,
        requestedByName: input.requestedByName,
        requestedByEmail: input.requestedByEmail?.trim() || null,
        status: "pending",
      })
      .returning({ id: boletoRequests.id });

    return NextResponse.json({ id: created.id, status: "pending" as const });
  } catch (error) {
    console.error("Failed to create boleto request:", error);
    const message =
      error instanceof z.ZodError
        ? error.errors[0]?.message
        : error instanceof Error
          ? error.message
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
  const filters = parseFiltersFromSearchParams(searchParams);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const where = buildBoletoRequestWhere(filters);

  const [items, totalRow, storeRows] = await Promise.all([
    db
      .select()
      .from(boletoRequests)
      .where(where)
      .orderBy(desc(boletoRequests.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ value: count() }).from(boletoRequests).where(where),
    db
      .selectDistinct({ storeName: boletoRequests.storeName })
      .from(boletoRequests)
      .orderBy(boletoRequests.storeName),
  ]);

  return NextResponse.json({
    items,
    total: totalRow[0]?.value ?? 0,
    page,
    pageSize: PAGE_SIZE,
    availableStores: storeRows.map((r) => r.storeName),
  });
}
