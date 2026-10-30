import {
  movementTypes,
  type MovementRecord,
  type MovementType,
  type NewMovementInput,
} from '@/core/contracts/finance';
import type { MovementSnapshot } from '@/core/events/event-map';

import { movementsTexts } from '../texts';

export interface MovementDraft {
  type?: string;
  amount?: number;
  title?: string | null;
  category_id?: string | null;
  category_name?: string | null;
  category_icon?: string | null;
  category_color?: string | null;
  account_id?: number;
  to_account_id?: number | null;
  date?: string;
  notes?: string | null;
}

export const isMovementType = (value: string): value is MovementType =>
  (movementTypes as readonly string[]).includes(value);

/** Valida un movimiento capturado a mano (reglas de v1). Devuelve el input tipado o el error. */
export function validateManualMovement(
  draft: MovementDraft,
): { ok: true; input: NewMovementInput } | { ok: false; error: string } {
  const { errors } = movementsTexts;
  const { type, amount, account_id } = draft;
  if (!type || !amount) return { ok: false, error: errors.typeAndAmountRequired };
  if (!isMovementType(type)) return { ok: false, error: errors.invalidType };
  if (type !== 'transfer' && !draft.category_id) return { ok: false, error: errors.categoryRequired };
  if (!account_id) return { ok: false, error: errors.accountRequired };
  if (type === 'transfer' && !draft.to_account_id) return { ok: false, error: errors.toAccountRequired };
  return { ok: true, input: { ...draft, type, amount, account_id } };
}

export function snapshotOf(movement: MovementRecord): MovementSnapshot {
  const { id, type, amount, account_id, to_account_id, category_id, date } = movement;
  return { id, type, amount, account_id, to_account_id, category_id, date };
}

/** CSV de movimientos (formato v1: comas en notas se sustituyen por ';'). */
export function buildMovementsCsv(
  movements: readonly MovementRecord[],
  accountName: (accountId: number) => string,
  locale: string,
): string {
  const { header, typeLabels } = movementsTexts.csv;
  const rows = movements.map((m) => {
    const date = new Date(m.date).toLocaleDateString(locale);
    const notes = (m.notes ?? '').replace(/,/g, ';');
    return `${date},${typeLabels[m.type]},${m.title ?? ''},${m.category_name ?? ''},${m.amount},${accountName(m.account_id)},${notes}`;
  });
  return `${header}\n${rows.join('\n')}`;
}
