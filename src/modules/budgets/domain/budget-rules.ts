import type { BudgetPeriod, BudgetRecord, BudgetType } from '@/core/contracts/finance';

export const isBudgetType = (v: string): v is BudgetType => v === 'saving' || v === 'expense';
export const isBudgetPeriod = (v: string): v is BudgetPeriod => v === 'weekly' || v === 'monthly';

/** Un presupuesto de gasto sin categorías aplica a todas; con categorías, solo a esas (regla v1). */
export function budgetCoversCategory(
  budget: Pick<BudgetRecord, 'category_ids'>,
  categoryId: string,
): boolean {
  if (!budget.category_ids || budget.category_ids === 'null') return true;
  try {
    const ids: unknown = JSON.parse(budget.category_ids);
    return Array.isArray(ids) && ids.map(String).includes(categoryId);
  } catch {
    // category_ids corrupto: no se aplica (comportamiento v1)
    return false;
  }
}

/** Nuevo acumulado; al restar nunca baja de 0. */
export function nextBudgetAmount(current: number, amount: number, operation: 'add' | 'subtract'): number {
  return operation === 'add' ? current + amount : Math.max(0, current - amount);
}

export function serializeCategoryIds(ids: unknown): string | null {
  return Array.isArray(ids) ? JSON.stringify(ids) : null;
}
