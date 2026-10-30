import type { LoanRecord, LoansStats } from '@/core/contracts/finance';

const PERCENT = 100;

/** Estado tras un abono (regla v1): pagado si llega a 0, parcial si bajó del total. */
export function statusAfterPayment(
  loan: Pick<LoanRecord, 'amount' | 'status'>,
  newRemaining: number,
): string {
  if (newRemaining === 0) return 'paid';
  if (newRemaining < loan.amount) return 'partial';
  return loan.status;
}

export function computeLoansStats(loans: readonly LoanRecord[]): LoansStats {
  const active = loans.filter((l) => l.status === 'active' || l.status === 'partial');
  const totalLent = loans.reduce((s, l) => s + l.amount, 0);
  const totalRecovered = loans.reduce((s, l) => s + (l.amount - l.remaining_amount), 0);
  return {
    total_loans: loans.length,
    active_loans: active.length,
    paid_loans: loans.filter((l) => l.status === 'paid').length,
    forgiven_loans: loans.filter((l) => l.status === 'forgiven').length,
    total_lent: totalLent,
    total_pending: active.reduce((s, l) => s + l.remaining_amount, 0),
    total_recovered: totalRecovered,
    recovery_percentage: totalLent > 0 ? (totalRecovered / totalLent) * PERCENT : 0,
  };
}
