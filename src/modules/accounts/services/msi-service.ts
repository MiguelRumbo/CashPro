import type { MovementsLedger } from '@/core/contracts/finance';
import { fail, failFromError, ok, type Result } from '@/core/contracts/result';
import { nowIso, type DbHandle } from '@/core/db/handle';

import type { AccountsRepository } from '../data/accounts-repository';
import type { MsiPurchase, MsiRepository } from '../data/msi-repository';
import { monthlyPayment, payInstallment } from '../domain/msi';
import { accountsTexts } from '../texts';

export interface MsiInput {
  account_id?: number;
  description?: string;
  total_amount?: number;
  installments?: number;
  start_date?: string;
}

export function createMsiService(deps: {
  db: DbHandle;
  repo: MsiRepository;
  accounts: AccountsRepository;
  ledger: () => MovementsLedger | undefined;
}) {
  const { db, repo, accounts, ledger } = deps;
  const { errors, messages, msiMovement } = accountsTexts;

  return {
    getMsiPurchases(accountId: number): Result<MsiPurchase[]> {
      try {
        return ok(repo.listByAccount(accountId));
      } catch (error) {
        return failFromError(error);
      }
    },

    /** Una compra a MSI ocupa crédito por su total al registrarse. */
    createMsiPurchase(input: MsiInput): Result<MsiPurchase> {
      const { account_id, description, total_amount, installments } = input;
      if (!account_id || !description || !total_amount || !installments) {
        return fail(errors.msiMissingFields);
      }
      if (accounts.getById(account_id)?.type !== 'credit') return fail(errors.creditAccountNotFound);
      try {
        const created = db.transaction(() => {
          const ts = nowIso();
          const row = repo.insert({
            account_id,
            description,
            total_amount,
            installments,
            monthly_payment: monthlyPayment(total_amount, installments),
            paid_installments: 0,
            remaining_amount: total_amount,
            start_date: input.start_date ?? ts,
            status: 'active',
            created_at: ts,
            updated_at: ts,
          });
          accounts.adjust(account_id, 'current_balance', total_amount);
          return row;
        });
        return ok(created);
      } catch (error) {
        return failFromError(error);
      }
    },

    /** Al borrar, se libera el crédito aún pendiente. */
    deleteMsiPurchase(id: number): Result<null> {
      const purchase = repo.getById(id);
      if (!purchase) return fail(errors.msiNotFound);
      try {
        db.transaction(() => {
          accounts.adjust(purchase.account_id, 'current_balance', -purchase.remaining_amount);
          repo.delete(id);
        });
        return ok(null, messages.msiDeleted);
      } catch (error) {
        return failFromError(error);
      }
    },

    /**
     * Pagar una mensualidad libera crédito y deja un movimiento informativo que
     * NO vuelve a afectar el saldo (affectsBalance: false).
     */
    payMsiInstallment(id: number): Result<MsiPurchase> {
      const msi = repo.getById(id);
      if (!msi) return fail(errors.msiNotFound);
      if (msi.status === 'completed') return fail(errors.msiAlreadyPaid);
      if (msi.paid_installments >= msi.installments) return fail(errors.msiAllInstallmentsPaid);
      if (!accounts.getById(msi.account_id)) return fail(errors.notFound);
      try {
        const next = payInstallment(msi);
        const updated = db.transaction(() => {
          const row = repo.updateProgress(
            id,
            next.paid,
            next.remaining,
            next.completed ? 'completed' : 'active',
          );
          accounts.adjust(msi.account_id, 'current_balance', -msi.monthly_payment);
          const ts = nowIso();
          ledger()?.record(
            {
              type: 'expense',
              amount: msi.monthly_payment,
              title: msiMovement.title(msi.description),
              category_name: msiMovement.categoryName,
              category_icon: msiMovement.categoryIcon,
              category_color: msiMovement.categoryColor,
              account_id: msi.account_id,
              date: ts,
              notes: msiMovement.notes(next.paid, msi.installments, msi.description),
            },
            { origin: 'accounts', affectsBalance: false },
          );
          return row;
        });
        if (!updated) return fail(errors.msiNotFound);
        return ok(
          updated,
          next.completed ? messages.msiCompleted : messages.msiInstallmentPaid(next.paid, msi.installments),
        );
      } catch (error) {
        return failFromError(error);
      }
    },
  };
}

export type MsiService = ReturnType<typeof createMsiService>;
