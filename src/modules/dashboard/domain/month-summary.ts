import type { MovementRecord } from '@/core/contracts/finance';

const PERCENT = 100;

export interface MonthSummary<T extends MovementRecord> {
  totalIncome: number;
  totalExpense: number;
  /** Variación % del gasto contra el mes anterior (100 si antes no hubo gasto). */
  expenseChange: number;
  /** Gastos del mes en curso (para estadísticas por categoría). */
  monthExpenses: T[];
}

const sum = (list: readonly MovementRecord[]) => list.reduce((s, m) => s + m.amount, 0);

/** Ingresos y gastos del mes en curso (hasta `now`) y cambio contra el mes anterior. */
export function summarizeMonth<T extends MovementRecord>(
  movements: readonly T[],
  now: Date,
): MonthSummary<T> {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  const inRange = (from: Date, to: Date) => (m: MovementRecord) => {
    const date = new Date(m.date);
    return date >= from && date <= to;
  };
  const current = movements.filter(inRange(monthStart, now));
  const monthExpenses = current.filter((m) => m.type === 'expense');
  const totalExpense = sum(monthExpenses);
  const lastMonthTotal = sum(
    movements.filter(inRange(lastMonthStart, lastMonthEnd)).filter((m) => m.type === 'expense'),
  );
  let expenseChange = 0;
  if (lastMonthTotal > 0) expenseChange = ((totalExpense - lastMonthTotal) / lastMonthTotal) * PERCENT;
  else if (totalExpense > 0) expenseChange = PERCENT;
  return {
    totalIncome: sum(current.filter((m) => m.type === 'income')),
    totalExpense,
    expenseChange,
    monthExpenses,
  };
}
