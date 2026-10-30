import { sql } from 'drizzle-orm';

import { createTestDb } from './testing';

describe('DbHandle', () => {
  it('aplica la migración base con las 14 tablas de v1', async () => {
    const db = await createTestDb();
    const rows = db.orm.all<{ name: string }>(
      sql`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '__drizzle%' ORDER BY name`,
    );
    expect(rows.map((r) => r.name)).toEqual([
      'accounts',
      'budgets',
      'fuel_loads',
      'goal_contributions',
      'loan_payments',
      'loans',
      'maintenance',
      'movements',
      'msi_purchases',
      'notification_settings',
      'recurring_payments',
      'savings_goals',
      'user_profile',
      'vehicles',
    ]);
  });

  it('respeta el CHECK de tipo de cuenta', async () => {
    const db = await createTestDb();
    expect(() => db.orm.run(sql`INSERT INTO accounts (name, type) VALUES ('x', 'wallet')`)).toThrow();
  });

  it('revierte la transacción si falla y une transacciones anidadas', async () => {
    const db = await createTestDb();
    expect(() =>
      db.transaction(() => {
        db.orm.run(
          sql`INSERT INTO budgets (name, type, amount, period) VALUES ('a', 'expense', 1, 'monthly')`,
        );
        db.transaction(() => {
          throw new Error('boom');
        });
      }),
    ).toThrow('boom');
    expect(db.orm.all(sql`SELECT * FROM budgets`)).toHaveLength(0);

    db.transaction(() => {
      db.orm.run(sql`INSERT INTO budgets (name, type, amount, period) VALUES ('a', 'expense', 1, 'monthly')`);
      db.transaction(() => {
        db.orm.run(
          sql`INSERT INTO budgets (name, type, amount, period) VALUES ('b', 'expense', 1, 'monthly')`,
        );
      });
    });
    expect(db.orm.all(sql`SELECT * FROM budgets`)).toHaveLength(2);
  });

  it('es idempotente sobre una BD v1 existente (IF NOT EXISTS)', async () => {
    const db = await createTestDb();
    db.orm.run(sql`INSERT INTO budgets (name, type, amount, period) VALUES ('a', 'expense', 1, 'monthly')`);
    const { readFileSync } = jest.requireActual<typeof import('node:fs')>('node:fs');
    const path = jest.requireActual<typeof import('node:path')>('node:path');
    const baseline = readFileSync(path.resolve(__dirname, '../../../drizzle/0000_baseline_v1.sql'), 'utf8');
    for (const statement of baseline.split('--> statement-breakpoint')) db.orm.run(sql.raw(statement));
    expect(db.orm.all(sql`SELECT * FROM budgets`)).toHaveLength(1);
  });
});
