import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import Papa from "papaparse";
import { db } from "@/lib/db";
import { boletoRequests } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import {
  buildBoletoRequestWhere,
  parseFiltersFromSearchParams,
} from "@/lib/boleto-filters";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  in_review: "Em análise",
  done: "Feito",
};

const PAYMENT_LABELS: Record<string, string> = {
  cash: "À vista",
  installments: "Parcelado",
};

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Não autenticado", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filters = parseFiltersFromSearchParams(searchParams);
  const where = buildBoletoRequestWhere(filters);

  const rows = await db
    .select()
    .from(boletoRequests)
    .where(where)
    .orderBy(desc(boletoRequests.createdAt))
    .limit(5000);

  const csvRows = rows.map((r) => ({
    Loja: r.storeName,
    Cliente: r.clientName,
    "CNPJ/CPF": r.clientDocument,
    Vencimento: r.dueDate.toISOString().slice(0, 10),
    "Nota Fiscal": r.invoiceNumber,
    "Motivo da cobrança": r.chargeReason ?? "",
    "Valor (R$)": Number(r.totalAmount).toFixed(2).replace(".", ","),
    Pagamento: PAYMENT_LABELS[r.paymentType] ?? r.paymentType,
    Parcelas: r.installmentsCount ?? "",
    "E-mail cliente": r.clientEmail,
    "Telefone cobrança": r.clientPhone,
    "Pessoa de contato": r.contactPerson,
    "Solicitado por": r.requestedByName ?? "",
    "E-mail solicitante": r.requestedByEmail ?? "",
    Status: STATUS_LABELS[r.status] ?? r.status,
    "Observações admin": r.adminNotes ?? "",
    "Criado em": r.createdAt.toISOString(),
  }));

  const csv = Papa.unparse(csvRows, { delimiter: ";" });
  const csvWithBom = "﻿" + csv;

  return new NextResponse(csvWithBom, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="solicitacoes-boletos-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}
