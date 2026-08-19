import { and, eq, gte, lte, ilike, SQL } from "drizzle-orm";
import { creditAnalysisRequests, BoletoStatus } from "./db/schema";

export interface CreditAnalysisFilters {
  storeName?: string;
  clientName?: string;
  status?: BoletoStatus;
  dateFrom?: Date;
  dateTo?: Date;
}

export function buildCreditAnalysisWhere(
  filters: CreditAnalysisFilters
): SQL | undefined {
  const clauses: SQL[] = [];

  if (filters.storeName) {
    clauses.push(ilike(creditAnalysisRequests.storeName, `%${filters.storeName}%`));
  }
  if (filters.clientName) {
    clauses.push(ilike(creditAnalysisRequests.clientName, `%${filters.clientName}%`));
  }
  if (filters.status) {
    clauses.push(eq(creditAnalysisRequests.status, filters.status));
  }
  if (filters.dateFrom) {
    clauses.push(gte(creditAnalysisRequests.createdAt, filters.dateFrom));
  }
  if (filters.dateTo) {
    const endOfDay = new Date(filters.dateTo);
    endOfDay.setHours(23, 59, 59, 999);
    clauses.push(lte(creditAnalysisRequests.createdAt, endOfDay));
  }

  return clauses.length > 0 ? and(...clauses) : undefined;
}

export function parseCreditAnalysisFiltersFromSearchParams(
  searchParams: URLSearchParams
): CreditAnalysisFilters {
  const status = searchParams.get("status");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  return {
    storeName: searchParams.get("storeName") || undefined,
    clientName: searchParams.get("clientName") || undefined,
    status:
      status === "pending" || status === "in_review" || status === "done"
        ? status
        : undefined,
    dateFrom: dateFrom ? new Date(dateFrom) : undefined,
    dateTo: dateTo ? new Date(dateTo) : undefined,
  };
}
