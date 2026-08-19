"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Clock, Eye, FileSearch, FileX, Search, Wallet, X } from "lucide-react";
import { BrandHeader } from "@/components/brand-header";
import { PanelNav } from "@/components/panel-nav";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";

type CreditStatus = "pending" | "in_review" | "done";

interface CreditAnalysisItem {
  id: number;
  status: CreditStatus;
  storeName: string;
  clientName: string;
  clientDocument: string;
  clientPhone: string | null;
  intendedPurchaseAmount: string;
  notes: string | null;
  requestedByName: string | null;
  requestedByEmail: string | null;
  adminNotes: string | null;
  createdAt: string;
}

interface ListResponse {
  items: CreditAnalysisItem[];
  total: number;
  page: number;
  pageSize: number;
  availableStores: string[];
  summary: {
    pending: number;
    in_review: number;
    done: number;
    totalAmount: number;
  };
}

const STATUS_META: Record<CreditStatus, { label: string; variant: "warning" | "info" | "success" }> = {
  pending: { label: "Pendente", variant: "warning" },
  in_review: { label: "Em análise", variant: "info" },
  done: { label: "Feito", variant: "success" },
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

const ALL = "__all";

export default function CreditAnalysisPanelPage() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [storeFilter, setStoreFilter] = useState(ALL);
  const [clientFilter, setClientFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<CreditAnalysisItem | null>(null);
  const [statusDraft, setStatusDraft] = useState<CreditStatus>("pending");
  const [notesDraft, setNotesDraft] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const buildParams = useCallback(() => {
    const params = new URLSearchParams();
    if (storeFilter !== ALL) params.set("storeName", storeFilter);
    if (clientFilter) params.set("clientName", clientFilter);
    if (statusFilter !== ALL) params.set("status", statusFilter);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    params.set("page", String(page));
    return params;
  }, [storeFilter, clientFilter, statusFilter, dateFrom, dateTo, page]);

  const fetchList = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/credit-analysis?${buildParams().toString()}`, {
        credentials: "include",
      });
      if (res.ok) {
        setData(await res.json());
      }
    } finally {
      setIsLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- refetch when filters/page change
    fetchList();
  }, [fetchList]);

  const openDetails = (item: CreditAnalysisItem) => {
    setSelected(item);
    setStatusDraft(item.status);
    setNotesDraft(item.adminNotes ?? "");
  };

  const handleSaveStatus = async () => {
    if (!selected) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/credit-analysis/status", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selected.id,
          status: statusDraft,
          adminNotes: notesDraft || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Falha ao atualizar status");
      }
      setSelected(null);
      fetchList();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Falha ao atualizar status");
    } finally {
      setIsSaving(false);
    }
  };

  const clearFilters = () => {
    setStoreFilter(ALL);
    setClientFilter("");
    setStatusFilter(ALL);
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const hasActiveFilters =
    storeFilter !== ALL || !!clientFilter || statusFilter !== ALL || !!dateFrom || !!dateTo;

  return (
    <div className="min-h-screen bg-background">
      <BrandHeader variant="admin" />
      <PanelNav />

      <main className="mx-auto max-w-[90rem] px-6 py-8 pb-16">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-foreground">
              Análise de Crédito
            </h1>
            <p className="text-sm text-muted-foreground">
              {data ? `${data.total} solicitação(ões) encontrada(s)` : ""}
            </p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={<Clock size={18} />}
            label="Pendentes"
            value={data ? String(data.summary.pending) : "—"}
            tone="warning"
            isLoading={isLoading && !data}
          />
          <StatCard
            icon={<FileSearch size={18} />}
            label="Em análise"
            value={data ? String(data.summary.in_review) : "—"}
            tone="info"
            isLoading={isLoading && !data}
          />
          <StatCard
            icon={<CheckCircle2 size={18} />}
            label="Feitas"
            value={data ? String(data.summary.done) : "—"}
            tone="success"
            isLoading={isLoading && !data}
          />
          <StatCard
            icon={<Wallet size={18} />}
            label="Valor pretendido total"
            value={data ? currencyFormatter.format(data.summary.totalAmount) : "—"}
            tone="neutral"
            isLoading={isLoading && !data}
          />
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-3 shadow-sm">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente..."
              className="w-60 pl-8"
              value={clientFilter}
              onChange={(e) => {
                setClientFilter(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <Select
            className="w-44"
            value={storeFilter}
            onChange={(e) => {
              setStoreFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value={ALL}>Todas as lojas</option>
            {data?.availableStores.map((store) => (
              <option key={store} value={store}>
                {store}
              </option>
            ))}
          </Select>

          <Select
            className="w-44"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value={ALL}>Todos os status</option>
            <option value="pending">Pendente</option>
            <option value="in_review">Em análise</option>
            <option value="done">Feito</option>
          </Select>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Input
              type="date"
              className="w-40"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
            />
            <span>até</span>
            <Input
              type="date"
              className="w-40"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X size={14} /> Limpar filtros
            </Button>
          )}
        </div>

        <div className="overflow-x-auto rounded-lg border border-border bg-surface shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {["Loja", "Cliente", "CNPJ/CPF", "Telefone", "Valor pretendido", "Status", "Solicitado em", ""].map(
                  (h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap border-b border-border px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {isLoading && !data ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="border-b border-border px-3 py-3">
                        <div
                          className="h-4 animate-pulse rounded bg-muted"
                          style={{ width: j === 7 ? "3rem" : `${60 + ((i + j) % 3) * 15}%` }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data && data.items.length > 0 ? (
                data.items.map((item) => (
                  <tr key={item.id} className="hover:bg-muted">
                    <td className="whitespace-nowrap border-b border-border px-3 py-2">{item.storeName}</td>
                    <td className="whitespace-nowrap border-b border-border px-3 py-2">{item.clientName}</td>
                    <td className="font-mono-num whitespace-nowrap border-b border-border px-3 py-2">
                      {item.clientDocument}
                    </td>
                    <td className="font-mono-num whitespace-nowrap border-b border-border px-3 py-2">
                      {item.clientPhone || "—"}
                    </td>
                    <td className="font-mono-num whitespace-nowrap border-b border-border px-3 py-2">
                      {currencyFormatter.format(Number(item.intendedPurchaseAmount))}
                    </td>
                    <td className="whitespace-nowrap border-b border-border px-3 py-2">
                      <Badge variant={STATUS_META[item.status].variant}>
                        {STATUS_META[item.status].label}
                      </Badge>
                    </td>
                    <td className="font-mono-num whitespace-nowrap border-b border-border px-3 py-2">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="whitespace-nowrap border-b border-border px-3 py-2 text-right">
                      <Button variant="ghost" size="sm" onClick={() => openDetails(item)}>
                        <Eye size={14} /> Detalhes
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-3 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <FileX size={22} />
                      </span>
                      <div>
                        <p className="font-medium text-foreground">
                          Nenhuma solicitação encontrada
                        </p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {hasActiveFilters
                            ? "Tente ajustar ou limpar os filtros acima."
                            : "As solicitações de análise de crédito enviadas pelas lojas vão aparecer aqui."}
                        </p>
                      </div>
                      {hasActiveFilters && (
                        <Button variant="outline" size="sm" onClick={clearFilters}>
                          <X size={14} /> Limpar filtros
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data && data.total > data.pageSize && (
          <div className="mt-4 flex items-center justify-center gap-4 text-sm">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Anterior
            </Button>
            <span className="text-muted-foreground">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Próxima
            </Button>
          </div>
        )}
      </main>

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Análise #${selected.id} — ${selected.clientName}` : ""}
      >
        {selected && (
          <div className="max-h-[75vh] overflow-y-auto">
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Detail label="Loja" value={selected.storeName} />
              <Detail label="Solicitado por" value={selected.requestedByName || "—"} />
              <Detail label="CNPJ/CPF do cliente" value={selected.clientDocument} mono />
              <Detail label="Telefone do cliente" value={selected.clientPhone || "—"} mono />
              <Detail
                label="Valor de intenção de compra"
                value={currencyFormatter.format(Number(selected.intendedPurchaseAmount))}
                mono
              />
              <Detail label="Solicitado em" value={formatDate(selected.createdAt)} mono />
            </div>

            {selected.notes && (
              <div className="mb-4">
                <Detail label="Observações da loja" value={selected.notes} />
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 border-t border-border pt-4 sm:grid-cols-[12rem_1fr]">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={statusDraft}
                  onChange={(e) => setStatusDraft(e.target.value as CreditStatus)}
                >
                  <option value="pending">Pendente</option>
                  <option value="in_review">Em análise</option>
                  <option value="done">Feito</option>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Observações internas</label>
                <Textarea
                  rows={3}
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  placeholder="Observações visíveis apenas para a administração"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setSelected(null)}>
                Cancelar
              </Button>
              <Button disabled={isSaving} onClick={handleSaveStatus}>
                {isSaving ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

const STAT_TONE_CLASSES: Record<"warning" | "info" | "success" | "neutral", string> = {
  warning: "bg-warning-bg text-warning",
  info: "bg-info-bg text-info",
  success: "bg-success-bg text-success",
  neutral: "bg-accent/10 text-accent",
};

function StatCard({
  icon,
  label,
  value,
  tone,
  isLoading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "warning" | "info" | "success" | "neutral";
  isLoading?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm">
      <span
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${STAT_TONE_CLASSES[tone]}`}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        {isLoading ? (
          <div className="mt-1.5 h-6 w-16 animate-pulse rounded bg-muted" />
        ) : (
          <p className="font-display truncate text-xl font-semibold text-foreground">{value}</p>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className={mono ? "font-mono-num text-sm" : "text-sm"}>{value}</span>
    </div>
  );
}
