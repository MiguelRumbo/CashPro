import type { AccountRecord } from '@/core/contracts/finance';

/** Lo que muestra una tarjeta: saldo para débito/efectivo/banco; crédito disponible para tarjetas de crédito. */
export function cardAmount(account: AccountRecord): { amount: number; debt: number | null } {
  if (account.type === 'credit') {
    return { amount: account.credit_limit - account.current_balance, debt: account.current_balance };
  }
  return { amount: account.balance, debt: null };
}

/**
 * Orden de la pila: la tarjeta seleccionada va al frente (última). Si no hay selección válida,
 * se elige la principal o la primera.
 */
export function stackOrder(
  accounts: readonly AccountRecord[],
  selectedId: number | null,
): {
  ordered: AccountRecord[];
  selected: AccountRecord | undefined;
} {
  const selected =
    accounts.find((a) => a.id === selectedId) ?? accounts.find((a) => a.is_primary === 1) ?? accounts[0];
  if (!selected) return { ordered: [], selected: undefined };
  return { ordered: [...accounts.filter((a) => a.id !== selected.id), selected], selected };
}
