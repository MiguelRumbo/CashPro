import type { AccountRecord, AccountsStats, AccountType } from '@/core/contracts/finance';
import type { MovementSnapshot } from '@/core/events/event-map';

export type BalanceColumn = 'balance' | 'current_balance';

export interface BalanceEffect {
  accountId: number;
  column: BalanceColumn;
  delta: number;
}

/**
 * Efectos de un movimiento sobre los saldos (regla de v1):
 * - débito/efectivo/banco: `balance` (gasto resta, ingreso suma);
 * - crédito: `current_balance` es deuda (gasto suma, ingreso/pago resta).
 * Una transferencia es gasto en la cuenta origen e ingreso en la destino.
 * `sign` = 1 aplica, -1 revierte.
 */
export function balanceEffects(
  movement: MovementSnapshot,
  sign: 1 | -1,
  accountTypeOf: (accountId: number) => AccountType | undefined,
): BalanceEffect[] {
  const effect = (accountId: number, direction: 'out' | 'in'): BalanceEffect => {
    const isCredit = accountTypeOf(accountId) === 'credit';
    const outflow = direction === 'out';
    // En crédito una salida aumenta la deuda; en las demás reduce el saldo.
    const delta = (isCredit === outflow ? 1 : -1) * movement.amount * sign;
    return { accountId, column: isCredit ? 'current_balance' : 'balance', delta };
  };

  switch (movement.type) {
    case 'expense':
      return [effect(movement.account_id, 'out')];
    case 'income':
      return [effect(movement.account_id, 'in')];
    case 'transfer':
      return movement.to_account_id === null
        ? [effect(movement.account_id, 'out')]
        : [effect(movement.account_id, 'out'), effect(movement.to_account_id, 'in')];
  }
}

/** Patrimonio: saldo de cuentas incluidas + crédito disponible de tarjetas incluidas. */
export function computeAccountsStats(accounts: readonly AccountRecord[]): AccountsStats {
  let assets = 0;
  let creditAvailable = 0;
  for (const account of accounts) {
    if (account.include_in_balance !== 1) continue;
    if (account.type === 'credit') creditAvailable += account.credit_limit - account.current_balance;
    else assets += account.balance;
  }
  return { total_balance: assets + creditAvailable, assets, credit_available: creditAvailable };
}

/** Últimos dígitos de una tarjeta (nunca se guarda el número completo). */
export function cardLastDigits(cardNumber: string | undefined, digits: number): string | null {
  if (!cardNumber || cardNumber.length < digits) return null;
  return cardNumber.replace(/\s/g, '').slice(-digits);
}

/** Por defecto, las tarjetas de crédito no suman al patrimonio. */
export function defaultIncludeInBalance(type: AccountType): number {
  return type === 'credit' ? 0 : 1;
}
