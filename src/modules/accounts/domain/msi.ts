const CENTS_PER_UNIT = 100;

export interface MsiProgress {
  paid_installments: number;
  installments: number;
  remaining_amount: number;
  monthly_payment: number;
}

/** Mensualidad redondeada a centavos. */
export function monthlyPayment(totalAmount: number, installments: number): number {
  return Math.round((totalAmount / installments) * CENTS_PER_UNIT) / CENTS_PER_UNIT;
}

/** Estado tras pagar una mensualidad. */
export function payInstallment(msi: MsiProgress): {
  paid: number;
  remaining: number;
  completed: boolean;
} {
  const paid = msi.paid_installments + 1;
  return {
    paid,
    remaining: Math.max(0, msi.remaining_amount - msi.monthly_payment),
    completed: paid >= msi.installments,
  };
}
