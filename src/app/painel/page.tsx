"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Eye, FileX, Search, X } from "lucide-react";
import { BrandHeader } from "@/components/brand-header";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";

type BoletoStatus = "pending" | "in_review" | "done";

interface BoletoRequestItem {
  id: number;
  status: BoletoStatus;
  storeName: string;
  clientName: string;
  clientDocument: string;
  dueDate: string;
  invoiceNumber: string;
  invoiceFileUrl: string | null;
  invoiceFileName: string | null;
  chargeReason: string | null;
  totalAmount: string;
  paymentType: "cash" | "installments";
  installmentsCount: number | null;
  clientEmail: string;
  clientPhone: string;
  contactPerson: string;
  requestedByName: string | null;
  requestedByEmail: string | null;
  adminNotes: string | null;
  createdAt: string;
}

interface ListResponse {
  items: BoletoRequestItem[];
  total: number;
  page: number;
  pageSize: number;
  availableStores: string[];
}

const STATUS_META: Record<BoletoStatus, { label: string; variant: "warning" | "info" | "success" }> = {
  pending: { label: "Pendente", variant: "warning" },
  in_review: { label: "Em análise", variant: "info" },
  done: { label: "Feito", variant: "success" },
};

const PAYMENT_LABELS: Record<string, string> = {
  cash: "À vista",
  installments: "Parcelado",
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

const ALL = "__all";

export default function AdminPanelPage() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [storeFilter, setStoreFilter] = useState(ALL);
  const [clientFilter, setClientFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<BoletoRequestItem | null>(null);
  const [statusDraft, setStatusDraft] = useState<BoletoStatus>("pending");
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
      const res = await fetch(`/api/boleto-requests?${buildParams().toString()}`, {
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

  const openDetails = (item: BoletoRequestItem) => {
    setSelected(item);
    setStatusDraft(item.status);
    setNotesDraft(item.adminNotes ?? "");
  };

  const handleSaveStatus = async () => {
    if (!selected) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/boleto-requests/status", {
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

  const handleExport = () => {
    window.open(`/api/boleto-requests/export?${buildParams().toString()}`, "_blank");
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

  return (
    <div className="min-h-screen bg-background">
      <BrandHeader variant="admin" />

      <main className="mx-auto max-w-[90rem] px-6 py-6 pb-16">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-foreground">
              Solicitações de Boleto
            </h1>
            <p className="text-sm text-muted-foreground">
              {data ? `${data.total} solicitação(ões) encontrada(s)` : ""}
            </p>
          </div>
          <Button variant="outline" onClick={handleExport}>
            <Download size={16} />
            Exportar CSV
          </Button>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-md border border-border bg-surface p-3">
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

          {(storeFilter !== ALL || clientFilter || statusFilter !== ALL || dateFrom || dateTo) && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X size={14} /> Limpar filtros
            </Button>
          )}
        </div>

        <div className="overflow-x-auto rounded-md border border-border bg-surface">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {["Loja", "Cliente", "NF", "Vencimento", "Valor", "Status", "Solicitado em", ""].map(
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
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">
                    Carregando...
                  </td>
                </tr>
              ) : data && data.items.length > 0 ? (
                data.items.map((item) => (
                  <tr key={item.id} className="hover:bg-muted">
                    <td className="whitespace-nowrap border-b border-border px-3 py-2">{item.storeName}</td>
                    <td className="whitespace-nowrap border-b border-border px-3 py-2">{item.clientName}</td>
                    <td className="font-mono-num whitespace-nowrap border-b border-border px-3 py-2">
                      {item.invoiceNumber}
                    </td>
                    <td className="font-mono-num whitespace-nowrap border-b border-border px-3 py-2">
                      {formatDate(item.dueDate)}
                    </td>
                    <td className="font-mono-num whitespace-nowrap border-b border-border px-3 py-2">
                      {currencyFormatter.format(Number(item.totalAmount))}
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
                  <td colSpan={8} className="px-3 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <FileX size={24} />
                      <span>Nenhuma solicitação encontrada.</span>
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
        title={selected ? `Solicitação #${selected.id} — ${selected.clientName}` : ""}
      >
        {selected && (
          <div className="max-h-[75vh] overflow-y-auto">
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Detail label="Loja" value={selected.storeName} />
              <Detail label="Solicitado por" value={selected.requestedByName || "—"} />
              <Detail label="CNPJ/CPF" value={selected.clientDocument} mono />
              <Detail label="Nota fiscal" value={selected.invoiceNumber} mono />
              <Detail label="Vencimento" value={formatDate(selected.dueDate)} mono />
              <Detail
                label="Valor"
                value={currencyFormatter.format(Number(selected.totalAmount))}
                mono
              />
              <Detail
                label="Pagamento"
                value={
                  PAYMENT_LABELS[selected.paymentType] +
                  (selected.paymentType === "installments" && selected.installmentsCount
                    ? ` (${selected.installmentsCount}x)`
                    : "")
                }
              />
              <Detail label="E-mail cliente" value={selected.clientEmail} />
              <Detail label="Telefone" value={selected.clientPhone} />
              <Detail label="Pessoa de contato" value={selected.contactPerson} />
            </div>

            {selected.chargeReason && (
              <div className="mb-4">
                <Detail label="Motivo da cobrança" value={selected.chargeReason} />
              </div>
            )}

            <div className="mb-4">
              {selected.invoiceFileUrl ? (
                <a
                  href={selected.invoiceFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
                >
                  <Download size={14} />
                  Ver nota fiscal{selected.invoiceFileName ? ` (${selected.invoiceFileName})` : ""}
                </a>
              ) : (
                <span className="text-sm italic text-muted-foreground">
                  Nenhuma nota fiscal anexada
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 border-t border-border pt-4 sm:grid-cols-[12rem_1fr]">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={statusDraft}
                  onChange={(e) => setStatusDraft(e.target.value as BoletoStatus)}
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
