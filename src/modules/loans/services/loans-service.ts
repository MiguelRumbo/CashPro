import type { LoanRecord, LoansStats, MovementsLedger } from '@/core/contracts/finance';
import { fail, failFromError, ok, type Result } from '@/core/contracts/result';
import { nowIso, type DbHandle } from '@/core/db/handle';

import type { LoanPayment, LoansRepository } from '../data/loans-repository';
import { computeLoansStats, statusAfterPayment } from '../domain/loan-rules';
import { loansTexts } from '../texts';

export interface LoanInput {
  person_name?: string;
  amount?: number;
  date?: string;
  due_date?: string | null;
  notes?: string | null;
  account_id?: number;
  status?: string;
  remaining_amount?: number;
  /** Registrar la salida de dinero como gasto en la cuenta. */
  create_movement?: boolean;
}

export interface LoanPaymentInput {
  amount: number;
  date: string;
  notes?: string | null;
  account_id?: number;
}

export function createLoansService(deps: {
  db: DbHandle;
  repo: LoansRepository;
  ledger: () => MovementsLedger | undefined;
}) {
  const { db, repo, ledger } = deps;
  const { errors, messages, movement } = loansTexts;

  return {
    list: (): LoanRecord[] => repo.list(),
    stats: (): LoansStats => computeLoansStats(repo.list()),

    getLoans(): Result<LoanRecord[]> {
      try {
        return ok(repo.list());
      } catch (error) {
        return failFromError(error);
      }
    },

    getLoanById(id: number): Result<LoanRecord> {
      const loan = repo.getById(id);
      return loan ? ok(loan) : fail(errors.notFound);
    },

    createLoan(input: LoanInput): Result<LoanRecord> {
      const { person_name, amount, date, account_id } = input;
      if (!person_name || !amount || !date || !account_id) return fail(errors.missingFields);
      if (amount <= 0) return fail(errors.amountMustBePositive);
      const movementsLedger = ledger();
      if (input.create_movement && !movementsLedger) return fail(errors.ledgerUnavailable);
      try {
        const created = db.transaction(() => {
          const ts = nowIso();
          const loan = repo.insert({
            person_name,
            amount,
            remaining_amount: amount,
            date,
            due_date: input.due_date ?? null,
            notes: input.notes ?? null,
            account_id,
            status: 'active',
            created_at: ts,
            updated_at: ts,
          });
          if (input.create_movement) {
            movementsLedger?.record(
              {
                type: 'expense',
                amount,
                title: movement.lentTitle(person_name),
                category_name: movement.categoryName,
                category_icon: movement.categoryIcon,
                category_color: movement.lentColor,
                account_id,
                date,
                notes: input.notes || movement.lentNotes(person_name),
              },
              { origin: 'loans', affectsBalance: true },
            );
          }
          return loan;
        });
        return ok(created);
      } catch (error) {
        return failFromError(error);
      }
    },

    updateLoan(id: number, input: LoanInput): Result<LoanRecord> {
      const loan = repo.getById(id);
      if (!loan) return fail(errors.notFound);
      try {
        const updated = repo.update(id, {
          person_name: input.person_name ?? loan.person_name,
          amount: input.amount ?? loan.amount,
          date: input.date || loan.date,
          due_date: input.due_date !== undefined ? input.due_date : loan.due_date,
          notes: input.notes !== undefined ? input.notes : loan.notes,
          status: input.status || loan.status,
          remaining_amount: input.remaining_amount ?? loan.remaining_amount,
        });
        return updated ? ok(updated) : fail(errors.notFound);
      } catch (error) {
        return failFromError(error);
      }
    },

    deleteLoan(id: number): Result<null> {
      if (!repo.getById(id)) return fail(errors.notFound);
      try {
        db.transaction(() => repo.delete(id));
        return ok(null, messages.deleted);
      } catch (error) {
        return failFromError(error);
      }
    },

    /** Un abono reduce lo pendiente y registra un ingreso en la cuenta destino. */
    addLoanPayment(loanId: number, input: LoanPaymentInput): Result<{ loan: LoanRecord }> {
      const loan = repo.getById(loanId);
      if (!loan) return fail(errors.notFound);
      const { amount, date, notes } = input;
      if (!amount || !date) return fail(errors.paymentMissingFields);
      if (amount <= 0) return fail(errors.amountMustBePositive);
      if (amount > loan.remaining_amount) return fail(errors.paymentExceedsRemaining);
      const movementsLedger = ledger();
      if (!movementsLedger) return fail(errors.ledgerUnavailable);
      const targetAccountId = input.account_id || loan.account_id;
      if (!targetAccountId) return fail(errors.missingFields);
      try {
        const updated = db.transaction(() => {
          const ts = nowIso();
          repo.addPayment({ loan_id: loanId, amount, date, notes: notes ?? null, created_at: ts });
          const newRemaining = loan.remaining_amount - amount;
          const row = repo.update(loanId, {
            remaining_amount: newRemaining,
            status: statusAfterPayment(loan, newRemaining),
          });
          movementsLedger.record(
            {
              type: 'income',
              amount,
              title: movement.paymentTitle(loan.person_name),
              category_name: movement.categoryName,
              category_icon: movement.categoryIcon,
              category_color: movement.paymentColor,
              account_id: targetAccountId,
              date,
              notes: notes || movement.paymentNotes(loan.person_name),
            },
            { origin: 'loans', affectsBalance: true },
          );
          return row;
        });
        return updated ? ok({ loan: updated }) : fail(errors.notFound);
      } catch (error) {
        return failFromError(error);
      }
    },

    getLoanPayments(loanId: number): Result<LoanPayment[]> {
      try {
        return ok(repo.payments(loanId));
      } catch (error) {
        return failFromError(error);
      }
    },
  };
}

export type LoansService = ReturnType<typeof createLoansService>;
