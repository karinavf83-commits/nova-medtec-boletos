// Business rule for suggested installment schedules by charge amount.
// >= R$5.000,00 -> 3x at 30/60/90 days; >= R$2.000,00 -> 3x at 15/30/45 days.
export interface InstallmentPlan {
  count: number;
  intervalsDays: number[];
}

export function getInstallmentPlan(amount: number): InstallmentPlan | null {
  if (!Number.isFinite(amount)) return null;
  if (amount >= 5000) return { count: 3, intervalsDays: [30, 60, 90] };
  if (amount >= 2000) return { count: 3, intervalsDays: [15, 30, 45] };
  return null;
}

export function formatScheduleDates(anchor: Date, intervalsDays: number[]): string {
  return intervalsDays
    .map((days) => {
      const d = new Date(anchor);
      d.setDate(d.getDate() + days);
      return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
    })
    .join(", ");
}
