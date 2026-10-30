import { accountsQueryKey, budgetsQueryKey, movementsLedgerKey } from '@/core/contracts/finance';
import { getAccountsRuntime } from '@/modules/accounts/runtime';
import { getBudgetsRuntime } from '@/modules/budgets/runtime';
import { getMovementsRuntime } from '@/modules/movements/runtime';
import { getSettingsRuntime } from '@/modules/settings/runtime';

import { startApp } from './support';

async function setup() {
  const app = await startApp();
  const accounts = getAccountsRuntime().accounts;
  const debit = accounts.createAccount({ name: 'Débito', type: 'debit', balance: 1000 });
  const credit = accounts.createAccount({ name: 'TDC', type: 'credit', credit_limit: 5000 });
  if (!debit.success || !credit.success) throw new Error('setup');
  getBudgetsRuntime().budgets.createBudget({
    name: 'Comida',
    type: 'expense',
    amount: 500,
    period: 'monthly',
    category_ids: ['1'],
  });
  return { app, debit: debit.data, credit: credit.data };
}

describe('flujo de movimientos entre módulos (BD real en memoria)', () => {
  it('un gasto manual baja el saldo y suma al presupuesto; editar y borrar lo revierte', async () => {
    const { app, debit } = await setup();
    const movements = getMovementsRuntime().movements;
    const accountsQuery = app.registry.resolve(accountsQueryKey);
    const budgets = () => app.registry.resolve(budgetsQueryKey)?.list() ?? [];

    const created = movements.createMovement({
      type: 'expense',
      amount: 200,
      category_id: '1',
      account_id: debit.id,
    });
    expect(created.success).toBe(true);
    expect(accountsQuery?.getById(debit.id)?.balance).toBe(800);
    expect(budgets()[0]?.current_amount).toBe(200);

    if (!created.success) return;
    movements.updateMovement(created.data.id, { amount: 50 });
    expect(accountsQuery?.getById(debit.id)?.balance).toBe(950);
    expect(budgets()[0]?.current_amount).toBe(50);

    movements.deleteMovement(created.data.id);
    expect(accountsQuery?.getById(debit.id)?.balance).toBe(1000);
    expect(budgets()[0]?.current_amount).toBe(0);
    app.dispose();
  });

  it('una transferencia a la tarjeta de crédito reduce su deuda', async () => {
    const { app, debit, credit } = await setup();
    const accounts = getAccountsRuntime().accounts;
    accounts.adjustBalance(credit.id, 'current_balance', 300);
    getMovementsRuntime().movements.createMovement({
      type: 'transfer',
      amount: 100,
      account_id: debit.id,
      to_account_id: credit.id,
    });
    expect(accounts.getById(debit.id)?.balance).toBe(900);
    expect(accounts.getById(credit.id)?.current_balance).toBe(200);
    app.dispose();
  });

  it('el pago de MSI libera crédito sin volver a afectar el saldo', async () => {
    const { app, credit } = await setup();
    const { msi, accounts } = getAccountsRuntime();
    const purchase = msi.createMsiPurchase({
      account_id: credit.id,
      description: 'TV',
      total_amount: 1200,
      installments: 12,
    });
    expect(accounts.getById(credit.id)?.current_balance).toBe(1200);
    if (!purchase.success) throw new Error('msi');
    msi.payMsiInstallment(purchase.data.id);
    expect(accounts.getById(credit.id)?.current_balance).toBe(1100);
    expect(app.registry.resolve(movementsLedgerKey)?.list()).toHaveLength(1);
    app.dispose();
  });

  it('un fallo dentro de la transacción no deja datos a medias', async () => {
    const { app, debit } = await setup();
    const result = getMovementsRuntime().movements.createMovement({
      type: 'expense',
      amount: 10,
      category_id: '1',
      account_id: 9999,
    });
    expect(result.success).toBe(false);
    expect(app.registry.resolve(accountsQueryKey)?.getById(debit.id)?.balance).toBe(1000);
    app.dispose();
  });

  it('respaldo JSON: exportar, borrar todo e importar restaura los datos', async () => {
    const { app, debit } = await setup();
    const settings = getSettingsRuntime().settings;
    getMovementsRuntime().movements.createMovement({
      type: 'income',
      amount: 50,
      category_id: '11',
      account_id: debit.id,
    });
    const backup = settings.exportAllDataAsJSON();
    if (!backup.success) throw new Error('export');
    const snapshot = JSON.parse(JSON.stringify(backup.data));

    expect(settings.resetAllData().success).toBe(true);
    expect(app.registry.resolve(accountsQueryKey)?.list()).toHaveLength(0);

    expect(settings.importDataFromJSON(snapshot).success).toBe(true);
    expect(app.registry.resolve(accountsQueryKey)?.getById(debit.id)?.balance).toBe(1050);
    expect(app.registry.resolve(movementsLedgerKey)?.list()).toHaveLength(1);
    expect(settings.importDataFromJSON({ data: { accounts: 'basura' } }).success).toBe(false);
    app.dispose();
  });
});
