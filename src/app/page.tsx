"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";
import { CheckCircle2, FileText, Upload, X } from "lucide-react";
import { BrandHeader } from "@/components/brand-header";
import { PublicNav } from "@/components/public-nav";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ACTIVE_STORES } from "@/lib/stores";
import { maskCpfCnpj, maskPhone, maskCurrency, parseCurrency } from "@/lib/masks";
import { getInstallmentPlan, buildInstallmentSchedule, toIsoDate } from "@/lib/installment-plan";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

interface FormState {
  storeName: string;
  requestedByName: string;
  requestedByEmail: string;
  clientName: string;
  clientDocument: string;
  contactPerson: string;
  clientEmail: string;
  clientPhone: string;
  invoiceNumber: string;
  dueDays: string;
  dueDate: string;
  totalAmount: string;
  paymentType: "cash" | "installments";
  chargeReason: string;
}

const initialState: FormState = {
  storeName: "",
  requestedByName: "",
  requestedByEmail: "",
  clientName: "",
  clientDocument: "",
  contactPerson: "",
  clientEmail: "",
  clientPhone: "",
  invoiceNumber: "",
  dueDays: "",
  dueDate: "",
  totalAmount: "",
  paymentType: "cash",
  chargeReason: "",
};

export default function BoletoRequestPage() {
  const [form, setForm] = useState<FormState>(initialState);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<number | null>(null);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleDueDaysChange = (value: string) => {
    const days = Number(value);
    if (value !== "" && Number.isInteger(days) && days >= 0) {
      const target = new Date();
      target.setDate(target.getDate() + days);
      const iso = target.toISOString().slice(0, 10);
      setForm((prev) => ({ ...prev, dueDays: value, dueDate: iso }));
    } else {
      setForm((prev) => ({ ...prev, dueDays: value }));
    }
  };

  const numericAmount = parseCurrency(form.totalAmount);
  const installmentPlan =
    form.paymentType === "installments" ? getInstallmentPlan(numericAmount) : null;
  const installmentSchedule =
    installmentPlan && Number.isFinite(numericAmount)
      ? buildInstallmentSchedule(new Date(), installmentPlan, numericAmount)
      : null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setError("Anexe a nota fiscal em PDF, JPG, PNG ou WEBP.");
      return;
    }
    if (selected.size > 20 * 1024 * 1024) {
      setError("O arquivo deve ter no máximo 20MB.");
      return;
    }
    setError(null);
    setFile(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let finalDueDate: string;
    let finalInstallmentsCount: number | null;

    if (form.paymentType === "cash") {
      if (!form.dueDate) {
        setError("Informe a quantidade de dias para vencimento.");
        return;
      }
      finalDueDate = form.dueDate;
      finalInstallmentsCount = null;
    } else {
      if (!installmentPlan || !installmentSchedule) {
        setError(
          "Parcelamento disponível apenas para valores a partir de R$ 2.000,00. Informe o valor total ou selecione \"À vista\"."
        );
        return;
      }
      finalDueDate = toIsoDate(installmentSchedule[0].dueDate);
      finalInstallmentsCount = installmentPlan.count;
    }

    setIsSubmitting(true);
    try {
      let invoiceFileUrl: string | null = null;
      let invoiceFilePathname: string | null = null;
      let invoiceFileName: string | null = null;

      if (file) {
        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/upload",
        });
        invoiceFileUrl = blob.url;
        invoiceFilePathname = blob.pathname;
        invoiceFileName = file.name;
      }

      const res = await fetch("/api/boleto-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName: form.storeName,
          requestedByName: form.requestedByName,
          requestedByEmail: form.requestedByEmail || null,
          clientName: form.clientName,
          clientDocument: form.clientDocument,
          contactPerson: form.contactPerson,
          clientEmail: form.clientEmail,
          clientPhone: form.clientPhone,
          invoiceNumber: form.invoiceNumber,
          invoiceFileUrl,
          invoiceFilePathname,
          invoiceFileName,
          dueDate: finalDueDate,
          totalAmount: numericAmount,
          paymentType: form.paymentType,
          installmentsCount: finalInstallmentsCount,
          chargeReason: form.chargeReason || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao enviar solicitação");

      setSuccessId(data.id);
      setForm(initialState);
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao enviar solicitação");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <BrandHeader variant="public" />
      <PublicNav />

      <main className="mx-auto max-w-3xl px-4 py-8 pb-16">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-semibold text-foreground">
            Solicitação de Boleto
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Preencha os dados abaixo para solicitar a emissão de um boleto. Sua
            solicitação ficará com status <strong>Pendente</strong> até ser
            processada pela administração.
          </p>
        </div>

        {successId && (
          <div className="mb-6 flex items-center gap-2 rounded-md border border-success/20 bg-success-bg px-4 py-3 text-sm text-success">
            <CheckCircle2 size={20} />
            <span className="flex-1">
              Solicitação #{successId} enviada com sucesso! Você pode enviar
              uma nova solicitação abaixo.
            </span>
            <button
              type="button"
              onClick={() => setSuccessId(null)}
              aria-label="Fechar"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-md border border-error/20 bg-error-bg px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <section className="rounded-md border border-border bg-surface p-6 shadow-sm">
            <h2 className="font-display mb-4 text-lg font-semibold">
              Quem está solicitando
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Loja solicitante" required>
                <Select
                  required
                  value={form.storeName}
                  onChange={(e) => update("storeName", e.target.value)}
                >
                  <option value="" disabled>
                    Selecione a loja
                  </option>
                  {ACTIVE_STORES.map((store) => (
                    <option key={store} value={store}>
                      {store}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Seu nome" required>
                <Input
                  required
                  value={form.requestedByName}
                  onChange={(e) => update("requestedByName", e.target.value)}
                />
              </Field>
            </div>
            <Field label="Seu e-mail (opcional)" className="mt-4">
              <Input
                type="email"
                placeholder="seu@email.com"
                value={form.requestedByEmail}
                onChange={(e) => update("requestedByEmail", e.target.value)}
              />
              <span className="mt-1 block text-xs text-muted-foreground">
                Se informado, você recebe um e-mail sempre que o status desta
                solicitação mudar.
              </span>
            </Field>
          </section>

          <section className="rounded-md border border-border bg-surface p-6 shadow-sm">
            <h2 className="font-display mb-4 text-lg font-semibold">
              Dados do cliente
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Razão Social / Nome" required>
                <Input
                  required
                  value={form.clientName}
                  onChange={(e) => update("clientName", e.target.value)}
                />
              </Field>
              <Field label="CNPJ / CPF" required>
                <Input
                  required
                  inputMode="numeric"
                  className="font-mono-num"
                  placeholder="00.000.000/0000-00"
                  value={form.clientDocument}
                  onChange={(e) => update("clientDocument", maskCpfCnpj(e.target.value))}
                />
              </Field>
              <Field label="Pessoa de contato" required>
                <Input
                  required
                  value={form.contactPerson}
                  onChange={(e) => update("contactPerson", e.target.value)}
                />
              </Field>
              <Field label="E-mail do cliente" required>
                <Input
                  type="email"
                  required
                  value={form.clientEmail}
                  onChange={(e) => update("clientEmail", e.target.value)}
                />
              </Field>
              <Field label="Telefone para cobrança" required>
                <Input
                  type="tel"
                  required
                  placeholder="(00) 00000-0000"
                  value={form.clientPhone}
                  onChange={(e) => update("clientPhone", maskPhone(e.target.value))}
                />
              </Field>
            </div>
          </section>

          <section className="rounded-md border border-border bg-surface p-6 shadow-sm">
            <h2 className="font-display mb-4 text-lg font-semibold">
              Dados do boleto
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Número da nota fiscal" required>
                <Input
                  required
                  className="font-mono-num"
                  value={form.invoiceNumber}
                  onChange={(e) => update("invoiceNumber", e.target.value)}
                />
              </Field>
              <Field label="Valor total (R$)" required>
                <Input
                  required
                  inputMode="decimal"
                  className="font-mono-num"
                  placeholder="0,00"
                  value={form.totalAmount}
                  onChange={(e) => update("totalAmount", maskCurrency(e.target.value))}
                />
              </Field>
              <Field label="Pagamento" required>
                <Select
                  value={form.paymentType}
                  onChange={(e) =>
                    update("paymentType", e.target.value as "cash" | "installments")
                  }
                >
                  <option value="cash">À vista</option>
                  <option value="installments">Parcelado</option>
                </Select>
              </Field>

              {form.paymentType === "cash" && (
                <Field label="Dias para vencimento" required>
                  <Input
                    type="number"
                    min={0}
                    required
                    inputMode="numeric"
                    placeholder="Ex: 30"
                    value={form.dueDays}
                    onChange={(e) => handleDueDaysChange(e.target.value)}
                  />
                  {form.dueDate && (
                    <span className="mt-1 block text-xs text-muted-foreground">
                      Vencimento: {new Date(`${form.dueDate}T00:00:00`).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                </Field>
              )}

              {form.paymentType === "installments" && (
                <Field label="Parcelamento">
                  {installmentPlan && installmentSchedule ? (
                    <div className="rounded-md border border-border bg-muted px-3 py-2 text-sm">
                      <p className="font-medium">
                        {installmentPlan.count}x — regra automática (
                        {numericAmount >= 5000 ? "acima de R$ 5.000" : "acima de R$ 2.000"})
                      </p>
                      <ul className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
                        {installmentSchedule.map((item, i) => (
                          <li key={i}>
                            {i + 1}ª parcela: {currencyFormatter.format(item.amount)} — vencimento{" "}
                            {item.dueDate.toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <span className="block rounded-md border border-error/20 bg-error-bg px-3 py-2 text-sm text-error">
                      Parcelamento disponível apenas para valores a partir de R$ 2.000,00.
                      Informe o valor total ou selecione &quot;À vista&quot;.
                    </span>
                  )}
                </Field>
              )}
            </div>

            <Field label="Motivo da cobrança (opcional)" className="mt-4">
              <Textarea
                rows={3}
                placeholder="Ex: Venda de instrumental cirúrgico, referente ao pedido 1234"
                value={form.chargeReason}
                onChange={(e) => update("chargeReason", e.target.value)}
              />
            </Field>

            <div className="mt-4 flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">
                Nota fiscal (anexo opcional)
              </label>
              {file ? (
                <div className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2">
                  <FileText size={18} />
                  <span className="flex-1 truncate text-sm">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    aria-label="Remover arquivo"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center gap-2 rounded-md border-2 border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground hover:border-accent hover:text-accent">
                  <Upload size={28} />
                  <span>Clique para anexar a nota fiscal</span>
                  <span className="text-xs">PDF, JPG, PNG ou WEBP — até 20MB</span>
                  <input
                    type="file"
                    accept={ACCEPTED_TYPES.join(",")}
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              )}
            </div>
          </section>

          <Button type="submit" size="lg" disabled={isSubmitting} className="self-start">
            {isSubmitting ? "Enviando solicitação..." : "Enviar solicitação"}
          </Button>
        </form>
      </main>
    </div>
  );
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-error"> *</span>}
      </label>
      {children}
    </div>
  );
}
