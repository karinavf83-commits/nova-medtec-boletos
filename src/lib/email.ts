import "server-only";
import { Resend } from "resend";

let client: Resend | null = null;

function getClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!client) client = new Resend(apiKey);
  return client;
}

export async function sendStatusChangeEmail(params: {
  to: string;
  requestedByName: string | null;
  clientName: string;
  invoiceNumber: string;
  storeName: string;
  statusLabel: string;
  adminNotes: string | null;
}) {
  const resend = getClient();
  const from =
    process.env.EMAIL_FROM ?? "Nova Medtec Boletos <onboarding@resend.dev>";

  if (!resend) {
    console.warn(
      "RESEND_API_KEY não configurada — e-mail de notificação não enviado."
    );
    return { ok: false as const, error: "RESEND_API_KEY não configurada" };
  }

  const notesHtml = params.adminNotes
    ? `<p><strong>Observações:</strong> ${params.adminNotes}</p>`
    : "";

  try {
    const result = await resend.emails.send({
      from,
      to: params.to,
      subject: `Boleto NF ${params.invoiceNumber} — status: ${params.statusLabel}`,
      html: `<p>Olá${params.requestedByName ? `, ${params.requestedByName}` : ""},</p>
<p>A solicitação de boleto para <strong>${params.clientName}</strong> (NF ${params.invoiceNumber}, loja ${params.storeName}) teve o status atualizado para:</p>
<p style="font-size:18px;font-weight:600;">${params.statusLabel}</p>
${notesHtml}
<p>Nova Medtec Cirúrgica</p>`,
      text: `A solicitação de boleto para ${params.clientName} (NF ${params.invoiceNumber}, loja ${params.storeName}) teve o status atualizado para: ${params.statusLabel}.`,
    });
    if (result.error) {
      console.error("Resend error:", result.error);
      return { ok: false as const, error: result.error.message };
    }
    return { ok: true as const };
  } catch (error) {
    console.error("Failed to send status e-mail:", error);
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Falha ao enviar e-mail",
    };
  }
}

export async function sendCreditAnalysisStatusEmail(params: {
  to: string;
  requestedByName: string | null;
  clientName: string;
  storeName: string;
  statusLabel: string;
  adminNotes: string | null;
}) {
  const resend = getClient();
  const from =
    process.env.EMAIL_FROM ?? "Nova Medtec Boletos <onboarding@resend.dev>";

  if (!resend) {
    console.warn(
      "RESEND_API_KEY não configurada — e-mail de notificação não enviado."
    );
    return { ok: false as const, error: "RESEND_API_KEY não configurada" };
  }

  const notesHtml = params.adminNotes
    ? `<p><strong>Observações:</strong> ${params.adminNotes}</p>`
    : "";

  try {
    const result = await resend.emails.send({
      from,
      to: params.to,
      subject: `Análise de crédito — ${params.clientName}: ${params.statusLabel}`,
      html: `<p>Olá${params.requestedByName ? `, ${params.requestedByName}` : ""},</p>
<p>A solicitação de análise de crédito para <strong>${params.clientName}</strong> (loja ${params.storeName}) teve o status atualizado para:</p>
<p style="font-size:18px;font-weight:600;">${params.statusLabel}</p>
${notesHtml}
<p>Nova Medtec Cirúrgica</p>`,
      text: `A solicitação de análise de crédito para ${params.clientName} (loja ${params.storeName}) teve o status atualizado para: ${params.statusLabel}.`,
    });
    if (result.error) {
      console.error("Resend error:", result.error);
      return { ok: false as const, error: result.error.message };
    }
    return { ok: true as const };
  } catch (error) {
    console.error("Failed to send credit analysis status e-mail:", error);
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Falha ao enviar e-mail",
    };
  }
}
