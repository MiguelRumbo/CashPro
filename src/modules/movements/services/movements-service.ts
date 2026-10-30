import type { FrozenAppConfig } from '@/config/schema';
import type {
  AccountsQuery,
  MovementPatch,
  MovementRecord,
  MovementsLedger,
  MovementWithAccount,
  NewMovementInput,
  RecordMovementOptions,
} from '@/core/contracts/finance';
import { fail, failFromError, ok, type Result } from '@/core/contracts/result';
import { nowIso, type DbHandle } from '@/core/db/handle';
import type { EventBus } from '@/core/events/bus';

import type { MovementsRepository } from '../data/movements-repository';
import { buildMovementsCsv, isMovementType, snapshotOf, validateManualMovement, type MovementDraft } from '../domain/movement-rules';
import { movementsTexts } from '../texts';

/** Origen de los movimientos capturados a mano. */
export const MANUAL_ORIGIN = 'movements';

const PATCHABLE_FIELDS = [
  'type',
  'amount',
  'title',
  'category_id',
  'category_name',
  'category_icon',
  'category_color',
  'account_id',
  'to_account_id',
  'date',
  'notes',
] as const satisfies readonly (keyof MovementPatch & keyof MovementDraft)[];

export function createMovementsService(deps: {
  db: DbHandle;
  repo: MovementsRepository;
  events: EventBus;
  config: FrozenAppConfig;
  accounts: () => AccountsQuery | undefined;
}) {
  const { db, repo, events, config, accounts } = deps;
  const { errors, messages } = movementsTexts;

  const withAccount = (m: MovementRecord): MovementWithAccount => {
    const account = accounts()?.getById(m.account_id);
    return { ...m, account_name: account?.name, account_type: account?.type };
  };

  const ledger: MovementsLedger = {
    list: () => repo.list().map(withAccount),
    getById: (id) => repo.getById(id),
    record(input: NewMovementInput, options: RecordMovementOptions) {
      return db.transaction(() => {
        const ts = nowIso();
        const created = repo.insert({
          ...input,
          date: input.date ?? ts,
          created_at: ts,
          updated_at: ts,
        });
        events.emit('movement.recorded', {
          movement: snapshotOf(created),
          origin: options.origin,
          affectsBalance: options.affectsBalance,
        });
        return created;
      });
    },
    update(id, patch) {
      return db.transaction(() => {
        const before = repo.getById(id);
        if (!before) return undefined;
        const after = repo.update(id, patch);
        if (after) events.emit('movement.updated', { before: snapshotOf(before), after: snapshotOf(after) });
        return after;
      });
    },
    remove(id) {
      return db.transaction(() => {
        const existing = repo.getById(id);
        if (!existing) return false;
        repo.delete(id);
        events.emit('movement.deleted', { movement: snapshotOf(existing) });
        return true;
      });
    },
    findLatest: (match) => repo.findLatest(match),
    exportCsv() {
      const all = repo.list();
      if (all.length === 0) return fail(errors.nothingToExport);
      const csv = buildMovementsCsv(all, (id) => accounts()?.getById(id)?.name ?? '', config.app.locale);
      return ok(csv);
    },
  };

  return {
    ledger,

    getMovements(): Result<MovementWithAccount[]> {
      try {
        return ok(ledger.list());
      } catch (error) {
        return failFromError(error);
      }
    },

    getMovementById(id: number): Result<MovementRecord> {
      const movement = repo.getById(id);
      return movement ? ok(movement) : fail(errors.notFound);
    },

    createMovement(draft: MovementDraft): Result<MovementRecord> {
      const validation = validateManualMovement(draft);
      if (!validation.ok) return fail(validation.error);
      const { input } = validation;
      if (!accounts()?.getById(input.account_id)) return fail(errors.accountNotFound);
      if (input.type === 'transfer' && !accounts()?.getById(input.to_account_id ?? -1)) {
        return fail(errors.toAccountNotFound);
      }
      try {
        return ok(ledger.record(input, { origin: MANUAL_ORIGIN, affectsBalance: true }), messages.created);
      } catch (error) {
        return failFromError(error);
      }
    },

    updateMovement(id: number, draft: MovementDraft): Result<MovementRecord> {
      if (!repo.getById(id)) return fail(errors.notFound);
      const patch: MovementPatch = {};
      for (const key of PATCHABLE_FIELDS) {
        if (draft[key] !== undefined) Object.assign(patch, { [key]: draft[key] });
      }
      if (patch.type !== undefined && !isMovementType(patch.type)) return fail(errors.invalidType);
      if (Object.keys(patch).length === 0) return fail(errors.nothingToUpdate);
      try {
        const updated = ledger.update(id, patch);
        return updated ? ok(updated, messages.updated) : fail(errors.notFound);
      } catch (error) {
        return failFromError(error);
      }
    },

    deleteMovement(id: number): Result<null> {
      try {
        return ledger.remove(id) ? ok(null, messages.deleted) : fail(errors.notFound);
      } catch (error) {
        return failFromError(error);
      }
    },
  };
}

export type MovementsService = ReturnType<typeof createMovementsService>;
