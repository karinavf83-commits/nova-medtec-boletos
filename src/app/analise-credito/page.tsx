"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { BrandHeader } from "@/components/brand-header";
import { PublicNav } from "@/components/public-nav";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ACTIVE_STORES } from "@/lib/stores";
import { maskCpfCnpj, maskPhone, maskCurrency, parseCurrency } from "@/lib/masks";

interface FormState {
  storeName: string;
  requestedByName: string;
  requestedByEmail: string;
  clientDocument: string;
  clientName: string;
  clientPhone: string;
  intendedPurchaseAmount: string;
  notes: string;
}

const initialState: FormState = {
  storeName: "",
  requestedByName: "",
  requestedByEmail: "",
  clientDocument: "",
  clientName: "",
  clientPhone: "",
  intendedPurchaseAmount: "",
  notes: "",
};

export default function CreditAnalysisPage() {
  const [form, setForm] = useState<FormState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<number | null>(null);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/credit-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName: form.storeName,
          requestedByName: form.requestedByName,
          requestedByEmail: form.requestedByEmail || null,
          clientDocument: form.clientDocument,
          clientName: form.clientName,
          clientPhone: form.clientPhone || null,
          intendedPurchaseAmount: parseCurrency(form.intendedPurchaseAmount),
          notes: form.notes || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao enviar solicitação");

      setSuccessId(data.id);
      setForm(initialState);
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
            Análise de Crédito
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Solicite a análise de crédito de um cliente antes de fechar a
            venda. A solicitação ficará com status <strong>Pendente</strong>{" "}
            até ser avaliada pela administração.
          </p>
        </div>

        {successId && (
          <div className="mb-6 flex items-center gap-2 rounded-md border border-success/20 bg-success-bg px-4 py-3 text-sm text-success">
            <CheckCircle2 size={20} />
            <span className="flex-1">
              Solicitação #{successId} enviada com sucesso! Você pode enviar
              uma nova solicitação abaixo.
            </span>
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
              <Field label="Nome do cliente / Razão Social" required>
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
              <Field label="Telefone do cliente (opcional)">
                <Input
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={form.clientPhone}
                  onChange={(e) => update("clientPhone", maskPhone(e.target.value))}
                />
              </Field>
            </div>
          </section>

          <section className="rounded-md border border-border bg-surface p-6 shadow-sm">
            <h2 className="font-display mb-4 text-lg font-semibold">
              Análise de crédito
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Valor de intenção de compra (R$)" required>
                <Input
                  required
                  inputMode="decimal"
                  className="font-mono-num"
                  placeholder="0,00"
                  value={form.intendedPurchaseAmount}
                  onChange={(e) =>
                    update("intendedPurchaseAmount", maskCurrency(e.target.value))
                  }
                />
              </Field>
            </div>

            <Field label="Observações (opcional)" className="mt-4">
              <Textarea
                rows={3}
                placeholder="Ex: Cliente novo, primeira compra a prazo"
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
              />
            </Field>
          </section>

          <Button type="submit" size="lg" disabled={isSubmitting} className="self-start">
            {isSubmitting ? "Enviando..." : "Solicitar análise de crédito"}
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
