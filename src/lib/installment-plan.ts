// Business rule for suggested installment schedules by charge amount.
// >= R$5.000,00 -> 3x at 30/60/90 days; >= R$2.000,00 -> 3x at 15/30/45 days.
export interface InstallmentPlan {
  count: number;
  intervalsDays: number[];
}

export interface InstallmentItem {
  dueDate: Date;
  amount: number;
}

export const MIN_INSTALLMENT_AMOUNT = 2000;

export function getInstallmentPlan(amount: number): InstallmentPlan | null {
  if (!Number.isFinite(amount)) return null;
  if (amount >= 5000) return { count: 3, intervalsDays: [30, 60, 90] };
  if (amount >= MIN_INSTALLMENT_AMOUNT) return { count: 3, intervalsDays: [15, 30, 45] };
  return null;
}

// Splits a total into cent-accurate installments (last one absorbs rounding).
export function splitInstallments(totalAmount: number, count: number): number[] {
  const totalCents = Math.round(totalAmount * 100);
  const baseCents = Math.floor(totalCents / count);
  const amounts = Array(count).fill(baseCents);
  amounts[count - 1] += totalCents - baseCents * count;
  return amounts.map((cents) => cents / 100);
}

export function buildInstallmentSchedule(
  anchor: Date,
  plan: InstallmentPlan,
  totalAmount: number
): InstallmentItem[] {
  const amounts = splitInstallments(totalAmount, plan.count);
  return plan.intervalsDays.map((days, i) => {
    const d = new Date(anchor);
    d.setDate(d.getDate() + days);
    return { dueDate: d, amount: amounts[i] };
  });
}

export function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
