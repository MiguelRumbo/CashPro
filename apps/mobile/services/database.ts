import * as SQLite from 'expo-sqlite';

// =============================================
// TYPES
// =============================================
type DBResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

// =============================================
// DATABASE INSTANCE
// =============================================
let db: SQLite.SQLiteDatabase;

export function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync('cashpro.db');
  }
  return db;
}

// =============================================
// INITIALIZATION
// =============================================
export function initDatabase(): void {
  const database = getDb();

  database.execSync('PRAGMA journal_mode = WAL;');
  database.execSync('PRAGMA foreign_keys = ON;');

  database.execSync(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('cash', 'bank', 'debit', 'credit')),
      balance REAL DEFAULT 0,
      currency TEXT DEFAULT 'MXN',
      icon TEXT,
      color TEXT,
      clabe TEXT,
      bank_name TEXT,
      card_last_four TEXT,
      generates_interest INTEGER DEFAULT 0,
      interest_rate REAL DEFAULT 0,
      credit_limit REAL DEFAULT 0,
      current_balance REAL DEFAULT 0,
      cut_off_day INTEGER,
      payment_due_day INTEGER,
      is_primary INTEGER DEFAULT 0,
      include_in_balance INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  database.execSync(`
    CREATE TABLE IF NOT EXISTS movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('expense', 'income', 'transfer')),
      amount REAL NOT NULL,
      title TEXT,
      category_id TEXT,
      category_name TEXT,
      category_icon TEXT,
      category_color TEXT,
      account_id INTEGER NOT NULL,
      to_account_id INTEGER,
      date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  database.execSync(`
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('saving', 'expense')),
      amount REAL NOT NULL,
      period TEXT NOT NULL CHECK(period IN ('weekly', 'monthly')),
      start_date TEXT,
      icon TEXT,
      color TEXT,
      current_amount REAL DEFAULT 0,
      category_ids TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  database.execSync(`
    CREATE TABLE IF NOT EXISTS user_profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL DEFAULT 'Usuario',
      email TEXT DEFAULT '',
      currency TEXT DEFAULT 'MXN',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  database.execSync(`
    CREATE TABLE IF NOT EXISTS savings_goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      target_amount REAL NOT NULL,
      current_amount REAL DEFAULT 0,
      deadline TEXT,
      icon TEXT DEFAULT 'target',
      color TEXT DEFAULT '#20df60',
      account_id INTEGER,
      auto_deduct INTEGER DEFAULT 0,
      auto_deduct_amount REAL DEFAULT 0,
      auto_deduct_period TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  database.execSync(`
    CREATE TABLE IF NOT EXISTS goal_contributions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      goal_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (goal_id) REFERENCES savings_goals(id) ON DELETE CASCADE
    );
  `);

  database.execSync(`
    CREATE TABLE IF NOT EXISTS loans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      person_name TEXT NOT NULL,
      amount REAL NOT NULL,
      remaining_amount REAL NOT NULL,
      date TEXT NOT NULL,
      due_date TEXT,
      notes TEXT,
      account_id INTEGER,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  database.execSync(`
    CREATE TABLE IF NOT EXISTS loan_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loan_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE
    );
  `);

  database.execSync(`
    CREATE TABLE IF NOT EXISTS recurring_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      frequency TEXT NOT NULL,
      day_of_month INTEGER,
      day_of_week INTEGER,
      specific_dates TEXT,
      category_id TEXT,
      account_id INTEGER NOT NULL,
      icon TEXT DEFAULT 'creditcard',
      color TEXT DEFAULT '#6b7280',
      is_active INTEGER DEFAULT 1,
      next_date TEXT,
      auto_register INTEGER DEFAULT 0,
      notify_before_days INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  database.execSync(`
    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      year INTEGER NOT NULL,
      license_plate TEXT,
      odometer REAL NOT NULL,
      fuel_type TEXT NOT NULL,
      tank_capacity REAL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  database.execSync(`
    CREATE TABLE IF NOT EXISTS fuel_loads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id INTEGER NOT NULL,
      liters REAL NOT NULL,
      price_per_liter REAL NOT NULL,
      total_cost REAL NOT NULL,
      odometer REAL NOT NULL,
      station_name TEXT,
      is_full_tank INTEGER DEFAULT 0,
      date TEXT NOT NULL,
      account_id INTEGER NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
    );
  `);

  database.execSync(`
    CREATE TABLE IF NOT EXISTS maintenance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      cost REAL NOT NULL,
      odometer REAL NOT NULL,
      workshop_name TEXT,
      date TEXT NOT NULL,
      next_date TEXT,
      next_odometer REAL,
      account_id INTEGER NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
    );
  `);

  database.execSync(`
    CREATE TABLE IF NOT EXISTS notification_settings (
      id INTEGER PRIMARY KEY,
      daily_reminder INTEGER DEFAULT 1,
      daily_reminder_time TEXT DEFAULT '20:00',
      credit_card_alerts INTEGER DEFAULT 1,
      budget_alerts INTEGER DEFAULT 1,
      loan_alerts INTEGER DEFAULT 1,
      subscription_alerts INTEGER DEFAULT 1,
      salary_alerts INTEGER DEFAULT 1,
      savings_goal_alerts INTEGER DEFAULT 1,
      vacation_mode INTEGER DEFAULT 0,
      vacation_mode_until TEXT,
      push_token TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  database.execSync(`
    CREATE TABLE IF NOT EXISTS msi_purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      total_amount REAL NOT NULL,
      installments INTEGER NOT NULL,
      monthly_payment REAL NOT NULL,
      paid_installments INTEGER DEFAULT 0,
      remaining_amount REAL NOT NULL,
      start_date TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    );
  `);

  // Seed defaults
  const profile = database.getFirstSync<any>('SELECT id FROM user_profile WHERE id = 1');
  if (!profile) {
    database.runSync(
      `INSERT INTO user_profile (id, name, email, currency) VALUES (1, 'Usuario', '', 'MXN')`
    );
  }

  const notifSettings = database.getFirstSync<any>('SELECT id FROM notification_settings WHERE id = 1');
  if (!notifSettings) {
    database.runSync(
      `INSERT INTO notification_settings (id) VALUES (1)`
    );
  }
}

// =============================================
// INTERNAL HELPERS
// =============================================
function now(): string {
  return new Date().toISOString();
}

function updateAccountBalance(accountId: number, amount: number, operation: 'add' | 'subtract'): void {
  const database = getDb();
  const account = database.getFirstSync<any>('SELECT type FROM accounts WHERE id = ?', [accountId]);
  if (!account) return;

  if (account.type === 'credit') {
    // Para crédito: 'subtract' = gasto = deuda SUBE, 'add' = pago/reversa = deuda BAJA
    if (operation === 'subtract') {
      database.runSync('UPDATE accounts SET current_balance = current_balance + ?, updated_at = ? WHERE id = ?', [amount, now(), accountId]);
    } else {
      database.runSync('UPDATE accounts SET current_balance = current_balance - ?, updated_at = ? WHERE id = ?', [amount, now(), accountId]);
    }
  } else {
    if (operation === 'add') {
      database.runSync('UPDATE accounts SET balance = balance + ?, updated_at = ? WHERE id = ?', [amount, now(), accountId]);
    } else {
      database.runSync('UPDATE accounts SET balance = balance - ?, updated_at = ? WHERE id = ?', [amount, now(), accountId]);
    }
  }
}

function updateBudgetsForMovement(categoryId: string | null, amount: number, operation: 'add' | 'subtract'): void {
  if (!categoryId) return;
  const database = getDb();
  const budgets = database.getAllSync<any>('SELECT * FROM budgets WHERE type = ?', ['expense']);

  budgets.forEach((budget: any) => {
    let shouldUpdate = false;

    if (!budget.category_ids || budget.category_ids === 'null') {
      shouldUpdate = true;
    } else {
      try {
        const ids: string[] = JSON.parse(budget.category_ids);
        shouldUpdate = ids.includes(categoryId.toString());
      } catch {
        shouldUpdate = false;
      }
    }

    if (shouldUpdate) {
      const current = budget.current_amount || 0;
      let newAmount = current;
      if (operation === 'add') {
        newAmount = current + amount;
      } else {
        newAmount = Math.max(0, current - amount);
      }
      database.runSync('UPDATE budgets SET current_amount = ?, updated_at = ? WHERE id = ?', [newAmount, now(), budget.id]);
    }
  });
}

// =============================================
// ACCOUNTS
// =============================================
export function getAccounts(): DBResponse {
  try {
    const database = getDb();
    const accounts = database.getAllSync<any>('SELECT * FROM accounts ORDER BY is_primary DESC, created_at DESC');
    return { success: true, data: accounts };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function getAccountById(id: number): DBResponse {
  try {
    const database = getDb();
    const account = database.getFirstSync<any>('SELECT * FROM accounts WHERE id = ?', [id]);
    if (!account) return { success: false, error: 'Cuenta no encontrada' };
    return { success: true, data: account };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function createAccount(data: any): DBResponse {
  try {
    const database = getDb();
    const {
      name, type, balance = 0, currency = 'MXN', icon, color,
      clabe, bank_name, card_number, generates_interest = 0,
      interest_rate = 0, credit_limit = 0, current_balance = 0,
      cut_off_day, payment_due_day, is_primary = 0, include_in_balance
    } = data;

    if (!name || !type) return { success: false, error: 'El nombre y tipo de cuenta son requeridos' };
    if (!['cash', 'bank', 'debit', 'credit'].includes(type)) return { success: false, error: 'Tipo de cuenta inválido' };

    let card_last_four: string | null = null;
    if (card_number && card_number.length >= 4) {
      card_last_four = card_number.replace(/\s/g, '').slice(-4);
    }

    const shouldInclude = include_in_balance !== undefined ? include_in_balance : (type === 'credit' ? 0 : 1);
    const ts = now();

    const result = database.runSync(
      `INSERT INTO accounts (name, type, balance, currency, icon, color, clabe, bank_name, card_last_four, generates_interest, interest_rate, credit_limit, current_balance, cut_off_day, payment_due_day, is_primary, include_in_balance, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, type, balance, currency, icon ?? null, color ?? null, clabe ?? null, bank_name ?? null, card_last_four, generates_interest, interest_rate, credit_limit, current_balance, cut_off_day ?? null, payment_due_day ?? null, is_primary, shouldInclude, ts, ts]
    );

    const newAccount = database.getFirstSync<any>('SELECT * FROM accounts WHERE id = ?', [result.lastInsertRowId]);
    return { success: true, data: newAccount, message: 'Cuenta creada exitosamente' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function updateAccount(id: number, updates: any): DBResponse {
  try {
    const database = getDb();
    const existing = database.getFirstSync<any>('SELECT * FROM accounts WHERE id = ?', [id]);
    if (!existing) return { success: false, error: 'Cuenta no encontrada' };

    const allowedFields = [
      'name', 'balance', 'currency', 'icon', 'color', 'clabe', 'bank_name',
      'card_last_four', 'generates_interest', 'interest_rate', 'credit_limit',
      'current_balance', 'cut_off_day', 'payment_due_day', 'is_primary', 'include_in_balance'
    ];

    const fields: string[] = [];
    const values: any[] = [];

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });

    if (updates.card_number && updates.card_number.length >= 4) {
      fields.push('card_last_four = ?');
      values.push(updates.card_number.replace(/\s/g, '').slice(-4));
    }

    if (fields.length === 0) return { success: false, error: 'No hay campos para actualizar' };

    fields.push('updated_at = ?');
    values.push(now());
    values.push(id);

    database.runSync(`UPDATE accounts SET ${fields.join(', ')} WHERE id = ?`, values);
    const updated = database.getFirstSync<any>('SELECT * FROM accounts WHERE id = ?', [id]);
    return { success: true, data: updated, message: 'Cuenta actualizada exitosamente' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function deleteAccount(id: number): DBResponse {
  try {
    const database = getDb();
    const existing = database.getFirstSync<any>('SELECT * FROM accounts WHERE id = ?', [id]);
    if (!existing) return { success: false, error: 'Cuenta no encontrada' };
    database.runSync('DELETE FROM accounts WHERE id = ?', [id]);
    return { success: true, message: 'Cuenta eliminada exitosamente' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function getAccountsStats(): DBResponse {
  try {
    const database = getDb();
    const result = database.getFirstSync<any>(`
      SELECT
        SUM(CASE WHEN type != 'credit' AND include_in_balance = 1 THEN balance ELSE 0 END) as total_balance,
        SUM(CASE WHEN type = 'credit' AND include_in_balance = 1 THEN (credit_limit - current_balance) ELSE 0 END) as total_credit_available
      FROM accounts
    `);
    const total = (result?.total_balance || 0) + (result?.total_credit_available || 0);
    return {
      success: true,
      data: {
        total_balance: total,
        assets: result?.total_balance || 0,
        credit_available: result?.total_credit_available || 0,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function setAccountPrimary(id: number): DBResponse {
  try {
    const database = getDb();
    const existing = database.getFirstSync<any>('SELECT * FROM accounts WHERE id = ?', [id]);
    if (!existing) return { success: false, error: 'Cuenta no encontrada' };

    const ts = now();
    database.runSync('UPDATE accounts SET is_primary = 0, updated_at = ?', [ts]);
    database.runSync('UPDATE accounts SET is_primary = 1, updated_at = ? WHERE id = ?', [ts, id]);

    const updated = database.getFirstSync<any>('SELECT * FROM accounts WHERE id = ?', [id]);
    return { success: true, data: updated, message: 'Cuenta principal actualizada exitosamente' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// =============================================
// MOVEMENTS
// =============================================
export function getMovements(): DBResponse {
  try {
    const database = getDb();
    const movements = database.getAllSync<any>('SELECT * FROM movements ORDER BY date DESC, created_at DESC');
    const enriched = movements.map((m: any) => {
      const account = database.getFirstSync<any>('SELECT id, name, type FROM accounts WHERE id = ?', [m.account_id]);
      return { ...m, account_name: account?.name, account_type: account?.type };
    });
    return { success: true, data: enriched };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function getMovementById(id: number): DBResponse {
  try {
    const database = getDb();
    const movement = database.getFirstSync<any>('SELECT * FROM movements WHERE id = ?', [id]);
    if (!movement) return { success: false, error: 'Movimiento no encontrado' };
    return { success: true, data: movement };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function createMovement(data: any): DBResponse {
  try {
    const database = getDb();
    const { type, amount, title, category_id, category_name, category_icon, category_color, account_id, to_account_id, date, notes } = data;

    if (!type || !amount) return { success: false, error: 'El tipo y monto son requeridos' };
    if (!['expense', 'income', 'transfer'].includes(type)) return { success: false, error: 'Tipo de movimiento inválido' };
    if (type !== 'transfer' && !category_id) return { success: false, error: 'La categoría es requerida para gastos e ingresos' };
    if (!account_id) return { success: false, error: 'La cuenta es requerida' };
    if (type === 'transfer' && !to_account_id) return { success: false, error: 'La cuenta destino es requerida para transferencias' };

    const account = database.getFirstSync<any>('SELECT * FROM accounts WHERE id = ?', [account_id]);
    if (!account) return { success: false, error: 'Cuenta no encontrada' };

    if (type === 'transfer') {
      const toAccount = database.getFirstSync<any>('SELECT * FROM accounts WHERE id = ?', [to_account_id]);
      if (!toAccount) return { success: false, error: 'Cuenta destino no encontrada' };
    }

    const ts = now();
    const result = database.runSync(
      `INSERT INTO movements (type, amount, title, category_id, category_name, category_icon, category_color, account_id, to_account_id, date, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [type, amount, title ?? null, category_id ?? null, category_name ?? null, category_icon ?? null, category_color ?? null, account_id, to_account_id ?? null, date || ts, notes ?? null, ts, ts]
    );

    // Update balances
    if (type === 'expense') {
      if (account.type === 'credit') {
        database.runSync('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?', [amount, account_id]);
      } else {
        database.runSync('UPDATE accounts SET balance = balance - ? WHERE id = ?', [amount, account_id]);
      }
    } else if (type === 'income') {
      if (account.type === 'credit') {
        database.runSync('UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?', [amount, account_id]);
      } else {
        database.runSync('UPDATE accounts SET balance = balance + ? WHERE id = ?', [amount, account_id]);
      }
    } else if (type === 'transfer') {
      if (account.type === 'credit') {
        database.runSync('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?', [amount, account_id]);
      } else {
        database.runSync('UPDATE accounts SET balance = balance - ? WHERE id = ?', [amount, account_id]);
      }
      const toAcc = database.getFirstSync<any>('SELECT * FROM accounts WHERE id = ?', [to_account_id]);
      if (toAcc?.type === 'credit') {
        database.runSync('UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?', [amount, to_account_id]);
      } else {
        database.runSync('UPDATE accounts SET balance = balance + ? WHERE id = ?', [amount, to_account_id]);
      }
    }

    // Update budgets
    if (type === 'expense' && category_id) {
      updateBudgetsForMovement(category_id, amount, 'add');
    }

    const newMovement = database.getFirstSync<any>('SELECT * FROM movements WHERE id = ?', [result.lastInsertRowId]);
    return { success: true, data: newMovement, message: 'Movimiento creado exitosamente' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function updateMovement(id: number, updates: any): DBResponse {
  try {
    const database = getDb();
    const existing = database.getFirstSync<any>('SELECT * FROM movements WHERE id = ?', [id]);
    if (!existing) return { success: false, error: 'Movimiento no encontrado' };

    // Revert old balance
    const oldAccount = database.getFirstSync<any>('SELECT * FROM accounts WHERE id = ?', [existing.account_id]);
    if (existing.type === 'expense') {
      if (oldAccount?.type === 'credit') {
        database.runSync('UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?', [existing.amount, existing.account_id]);
      } else {
        database.runSync('UPDATE accounts SET balance = balance + ? WHERE id = ?', [existing.amount, existing.account_id]);
      }
    } else if (existing.type === 'income') {
      if (oldAccount?.type === 'credit') {
        database.runSync('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?', [existing.amount, existing.account_id]);
      } else {
        database.runSync('UPDATE accounts SET balance = balance - ? WHERE id = ?', [existing.amount, existing.account_id]);
      }
    } else if (existing.type === 'transfer') {
      if (oldAccount?.type === 'credit') {
        database.runSync('UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?', [existing.amount, existing.account_id]);
      } else {
        database.runSync('UPDATE accounts SET balance = balance + ? WHERE id = ?', [existing.amount, existing.account_id]);
      }
      const oldToAcc = database.getFirstSync<any>('SELECT * FROM accounts WHERE id = ?', [existing.to_account_id]);
      if (oldToAcc?.type === 'credit') {
        database.runSync('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?', [existing.amount, existing.to_account_id]);
      } else {
        database.runSync('UPDATE accounts SET balance = balance - ? WHERE id = ?', [existing.amount, existing.to_account_id]);
      }
    }

    // Apply updates
    const allowedFields = ['type', 'amount', 'title', 'category_id', 'category_name', 'category_icon', 'category_color', 'account_id', 'to_account_id', 'date', 'notes'];
    const fields: string[] = [];
    const values: any[] = [];

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });
    if (fields.length === 0) return { success: false, error: 'No hay campos para actualizar' };

    fields.push('updated_at = ?');
    values.push(now());
    values.push(id);
    database.runSync(`UPDATE movements SET ${fields.join(', ')} WHERE id = ?`, values);

    const updated = database.getFirstSync<any>('SELECT * FROM movements WHERE id = ?', [id]);

    // Apply new balance
    const newAccount = database.getFirstSync<any>('SELECT * FROM accounts WHERE id = ?', [updated.account_id]);
    if (updated.type === 'expense') {
      if (newAccount?.type === 'credit') {
        database.runSync('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?', [updated.amount, updated.account_id]);
      } else {
        database.runSync('UPDATE accounts SET balance = balance - ? WHERE id = ?', [updated.amount, updated.account_id]);
      }
    } else if (updated.type === 'income') {
      if (newAccount?.type === 'credit') {
        database.runSync('UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?', [updated.amount, updated.account_id]);
      } else {
        database.runSync('UPDATE accounts SET balance = balance + ? WHERE id = ?', [updated.amount, updated.account_id]);
      }
    } else if (updated.type === 'transfer') {
      if (newAccount?.type === 'credit') {
        database.runSync('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?', [updated.amount, updated.account_id]);
      } else {
        database.runSync('UPDATE accounts SET balance = balance - ? WHERE id = ?', [updated.amount, updated.account_id]);
      }
      const newToAcc = database.getFirstSync<any>('SELECT * FROM accounts WHERE id = ?', [updated.to_account_id]);
      if (newToAcc?.type === 'credit') {
        database.runSync('UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?', [updated.amount, updated.to_account_id]);
      } else {
        database.runSync('UPDATE accounts SET balance = balance + ? WHERE id = ?', [updated.amount, updated.to_account_id]);
      }
    }

    // Update budgets
    if (existing.type === 'expense' && existing.category_id) {
      updateBudgetsForMovement(existing.category_id, existing.amount, 'subtract');
    }
    if (updated.type === 'expense' && updated.category_id) {
      updateBudgetsForMovement(updated.category_id, updated.amount, 'add');
    }

    return { success: true, data: updated, message: 'Movimiento actualizado exitosamente' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function deleteMovement(id: number): DBResponse {
  try {
    const database = getDb();
    const existing = database.getFirstSync<any>('SELECT * FROM movements WHERE id = ?', [id]);
    if (!existing) return { success: false, error: 'Movimiento no encontrado' };

    // Revert balance
    const account = database.getFirstSync<any>('SELECT * FROM accounts WHERE id = ?', [existing.account_id]);
    if (existing.type === 'expense') {
      if (account?.type === 'credit') {
        database.runSync('UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?', [existing.amount, existing.account_id]);
      } else {
        database.runSync('UPDATE accounts SET balance = balance + ? WHERE id = ?', [existing.amount, existing.account_id]);
      }
    } else if (existing.type === 'income') {
      if (account?.type === 'credit') {
        database.runSync('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?', [existing.amount, existing.account_id]);
      } else {
        database.runSync('UPDATE accounts SET balance = balance - ? WHERE id = ?', [existing.amount, existing.account_id]);
      }
    } else if (existing.type === 'transfer') {
      if (account?.type === 'credit') {
        database.runSync('UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?', [existing.amount, existing.account_id]);
      } else {
        database.runSync('UPDATE accounts SET balance = balance + ? WHERE id = ?', [existing.amount, existing.account_id]);
      }
      const toAcc = database.getFirstSync<any>('SELECT * FROM accounts WHERE id = ?', [existing.to_account_id]);
      if (toAcc?.type === 'credit') {
        database.runSync('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?', [existing.amount, existing.to_account_id]);
      } else {
        database.runSync('UPDATE accounts SET balance = balance - ? WHERE id = ?', [existing.amount, existing.to_account_id]);
      }
    }

    database.runSync('DELETE FROM movements WHERE id = ?', [id]);

    if (existing.type === 'expense' && existing.category_id) {
      updateBudgetsForMovement(existing.category_id, existing.amount, 'subtract');
    }

    return { success: true, message: 'Movimiento eliminado exitosamente' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function getMovementsStats(): DBResponse {
  try {
    const database = getDb();
    const result = database.getFirstSync<any>(`
      SELECT
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
        COUNT(*) as total_movements
      FROM movements
    `);
    return {
      success: true,
      data: {
        total_income: result?.total_income || 0,
        total_expense: result?.total_expense || 0,
        total_movements: result?.total_movements || 0,
        net: (result?.total_income || 0) - (result?.total_expense || 0),
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// =============================================
// BUDGETS
// =============================================
export function getBudgets(): DBResponse {
  try {
    const database = getDb();
    const budgets = database.getAllSync<any>('SELECT * FROM budgets ORDER BY created_at DESC');
    return { success: true, data: budgets };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function getBudgetById(id: number): DBResponse {
  try {
    const database = getDb();
    const budget = database.getFirstSync<any>('SELECT * FROM budgets WHERE id = ?', [id]);
    if (!budget) return { success: false, error: 'Presupuesto no encontrado' };
    return { success: true, data: budget };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function createBudget(data: any): DBResponse {
  try {
    const database = getDb();
    const { name, type, amount, period, start_date, icon, color, category_ids } = data;

    if (!name || !type || !amount || !period) return { success: false, error: 'El nombre, tipo, monto y periodo son requeridos' };
    if (!['saving', 'expense'].includes(type)) return { success: false, error: 'Tipo de presupuesto inválido' };
    if (!['weekly', 'monthly'].includes(period)) return { success: false, error: 'Periodo inválido' };

    const categoryIdsStr = Array.isArray(category_ids) ? JSON.stringify(category_ids) : null;
    const ts = now();

    const result = database.runSync(
      `INSERT INTO budgets (name, type, amount, period, start_date, icon, color, current_amount, category_ids, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
      [name, type, amount, period, start_date || ts, icon || (type === 'saving' ? 'arrow.up.circle.fill' : 'arrow.down.circle.fill'), color || (type === 'saving' ? '#20df60' : '#ef4444'), categoryIdsStr, ts, ts]
    );

    const newBudget = database.getFirstSync<any>('SELECT * FROM budgets WHERE id = ?', [result.lastInsertRowId]);
    return { success: true, data: newBudget, message: 'Presupuesto creado exitosamente' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function updateBudget(id: number, updates: any): DBResponse {
  try {
    const database = getDb();
    const existing = database.getFirstSync<any>('SELECT * FROM budgets WHERE id = ?', [id]);
    if (!existing) return { success: false, error: 'Presupuesto no encontrado' };

    const allowedFields = ['name', 'type', 'amount', 'period', 'start_date', 'icon', 'color', 'current_amount', 'category_ids'];
    const fields: string[] = [];
    const values: any[] = [];

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        if (key === 'category_ids' && Array.isArray(updates[key])) {
          values.push(JSON.stringify(updates[key]));
        } else {
          values.push(updates[key]);
        }
      }
    });

    if (fields.length === 0) return { success: false, error: 'No hay campos para actualizar' };

    fields.push('updated_at = ?');
    values.push(now());
    values.push(id);

    database.runSync(`UPDATE budgets SET ${fields.join(', ')} WHERE id = ?`, values);
    const updated = database.getFirstSync<any>('SELECT * FROM budgets WHERE id = ?', [id]);
    return { success: true, data: updated, message: 'Presupuesto actualizado exitosamente' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function deleteBudget(id: number): DBResponse {
  try {
    const database = getDb();
    const existing = database.getFirstSync<any>('SELECT * FROM budgets WHERE id = ?', [id]);
    if (!existing) return { success: false, error: 'Presupuesto no encontrado' };
    database.runSync('DELETE FROM budgets WHERE id = ?', [id]);
    return { success: true, message: 'Presupuesto eliminado exitosamente' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function getBudgetsStats(): DBResponse {
  try {
    const database = getDb();
    const result = database.getFirstSync<any>(`
      SELECT
        SUM(CASE WHEN type = 'saving' THEN amount ELSE 0 END) as total_savings_goal,
        SUM(CASE WHEN type = 'saving' THEN current_amount ELSE 0 END) as total_savings_current,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense_limit,
        SUM(CASE WHEN type = 'expense' THEN current_amount ELSE 0 END) as total_expense_current,
        COUNT(*) as total_budgets
      FROM budgets
    `);
    return {
      success: true,
      data: {
        total_savings_goal: result?.total_savings_goal || 0,
        total_savings_current: result?.total_savings_current || 0,
        total_expense_limit: result?.total_expense_limit || 0,
        total_expense_current: result?.total_expense_current || 0,
        total_budgets: result?.total_budgets || 0,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// =============================================
// PROFILE
// =============================================
export function getProfile(): DBResponse {
  try {
    const database = getDb();
    let profile = database.getFirstSync<any>('SELECT * FROM user_profile WHERE id = 1');
    if (!profile) {
      database.runSync(`INSERT INTO user_profile (id, name, email, currency) VALUES (1, 'Usuario', '', 'MXN')`);
      profile = database.getFirstSync<any>('SELECT * FROM user_profile WHERE id = 1');
    }
    return { success: true, data: profile };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function updateProfile(data: { name: string; email?: string; currency?: string }): DBResponse {
  try {
    const database = getDb();
    const { name, email, currency } = data;
    if (!name || !name.trim()) return { success: false, error: 'El nombre es requerido' };

    let existing = database.getFirstSync<any>('SELECT * FROM user_profile WHERE id = 1');
    if (!existing) {
      database.runSync(
        `INSERT INTO user_profile (id, name, email, currency) VALUES (1, ?, ?, ?)`,
        [name.trim(), email?.trim() || '', currency || 'MXN']
      );
    } else {
      database.runSync(
        `UPDATE user_profile SET name = ?, email = ?, currency = ?, updated_at = ? WHERE id = 1`,
        [name.trim(), email?.trim() || '', currency || 'MXN', now()]
      );
    }

    const updated = database.getFirstSync<any>('SELECT * FROM user_profile WHERE id = 1');
    return { success: true, data: updated, message: 'Perfil actualizado exitosamente' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// =============================================
// SAVINGS GOALS
// =============================================
export function getSavingsGoals(): DBResponse {
  try {
    const database = getDb();
    const goals = database.getAllSync<any>('SELECT * FROM savings_goals ORDER BY created_at DESC');
    return { success: true, data: goals };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function getSavingsGoalById(id: number): DBResponse {
  try {
    const database = getDb();
    const goal = database.getFirstSync<any>('SELECT * FROM savings_goals WHERE id = ?', [id]);
    if (!goal) return { success: false, error: 'Objetivo no encontrado' };
    return { success: true, data: goal };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function createSavingsGoal(data: any): DBResponse {
  try {
    const database = getDb();
    const { name, target_amount, current_amount = 0, deadline, icon, color, account_id, auto_deduct, auto_deduct_amount, auto_deduct_period, status } = data;

    if (!name || !target_amount) return { success: false, error: 'El nombre y monto objetivo son requeridos' };
    if (target_amount <= 0) return { success: false, error: 'El monto objetivo debe ser mayor a 0' };

    const ts = now();
    const result = database.runSync(
      `INSERT INTO savings_goals (name, target_amount, current_amount, deadline, icon, color, account_id, auto_deduct, auto_deduct_amount, auto_deduct_period, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, target_amount, current_amount, deadline ?? null, icon || 'target', color || '#20df60', account_id ?? null, auto_deduct ? 1 : 0, auto_deduct_amount || 0, auto_deduct_period ?? null, status || 'active', ts, ts]
    );

    const created = database.getFirstSync<any>('SELECT * FROM savings_goals WHERE id = ?', [result.lastInsertRowId]);
    return { success: true, data: created, message: 'Objetivo creado exitosamente' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function updateSavingsGoal(id: number, data: any): DBResponse {
  try {
    const database = getDb();
    const goal = database.getFirstSync<any>('SELECT * FROM savings_goals WHERE id = ?', [id]);
    if (!goal) return { success: false, error: 'Objetivo no encontrado' };

    const { name, target_amount, current_amount, deadline, icon, color, account_id, auto_deduct, auto_deduct_amount, auto_deduct_period, status } = data;
    const ts = now();

    database.runSync(
      `UPDATE savings_goals SET name = ?, target_amount = ?, current_amount = ?, deadline = ?, icon = ?, color = ?, account_id = ?, auto_deduct = ?, auto_deduct_amount = ?, auto_deduct_period = ?, status = ?, updated_at = ? WHERE id = ?`,
      [
        name !== undefined ? name : goal.name,
        target_amount !== undefined ? target_amount : goal.target_amount,
        current_amount !== undefined ? current_amount : goal.current_amount,
        deadline !== undefined ? deadline : goal.deadline,
        icon !== undefined ? icon : goal.icon,
        color !== undefined ? color : goal.color,
        account_id !== undefined ? account_id : goal.account_id,
        auto_deduct !== undefined ? (auto_deduct ? 1 : 0) : goal.auto_deduct,
        auto_deduct_amount !== undefined ? auto_deduct_amount : goal.auto_deduct_amount,
        auto_deduct_period !== undefined ? auto_deduct_period : goal.auto_deduct_period,
        status !== undefined ? status : goal.status,
        ts, id,
      ]
    );

    const updated = database.getFirstSync<any>('SELECT * FROM savings_goals WHERE id = ?', [id]);
    if (updated.current_amount >= updated.target_amount && updated.status !== 'completed') {
      database.runSync('UPDATE savings_goals SET status = ? WHERE id = ?', ['completed', id]);
      updated.status = 'completed';
    }

    return { success: true, data: updated, message: 'Objetivo actualizado exitosamente' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function deleteSavingsGoal(id: number): DBResponse {
  try {
    const database = getDb();
    const goal = database.getFirstSync<any>('SELECT * FROM savings_goals WHERE id = ?', [id]);
    if (!goal) return { success: false, error: 'Objetivo no encontrado' };
    database.runSync('DELETE FROM goal_contributions WHERE goal_id = ?', [id]);
    database.runSync('DELETE FROM savings_goals WHERE id = ?', [id]);
    return { success: true, message: 'Objetivo eliminado exitosamente' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function addGoalContribution(goalId: number, data: { amount: number; account_id: number; notes?: string }): DBResponse {
  try {
    const database = getDb();
    const { amount, account_id, notes } = data;

    if (!amount || amount <= 0) return { success: false, error: 'El monto debe ser mayor a 0' };
    if (!account_id) return { success: false, error: 'La cuenta es requerida' };

    const goal = database.getFirstSync<any>('SELECT * FROM savings_goals WHERE id = ?', [goalId]);
    if (!goal) return { success: false, error: 'Objetivo no encontrado' };

    const account = database.getFirstSync<any>('SELECT * FROM accounts WHERE id = ?', [account_id]);
    if (!account) return { success: false, error: 'Cuenta no encontrada' };

    if (account.type !== 'credit' && account.balance < amount) {
      return { success: false, error: 'Saldo insuficiente en la cuenta' };
    }

    const ts = now();

    // Create contribution
    database.runSync(
      `INSERT INTO goal_contributions (goal_id, amount, date, notes, created_at) VALUES (?, ?, ?, ?, ?)`,
      [goalId, amount, ts, notes ?? null, ts]
    );

    // Update goal
    const newCurrentAmount = goal.current_amount + amount;
    let newStatus = goal.status;
    if (newCurrentAmount >= goal.target_amount && goal.status !== 'completed') {
      newStatus = 'completed';
    }
    database.runSync('UPDATE savings_goals SET current_amount = ?, status = ?, updated_at = ? WHERE id = ?', [newCurrentAmount, newStatus, ts, goalId]);

    // Create expense movement
    database.runSync(
      `INSERT INTO movements (type, amount, title, category_id, category_name, category_icon, category_color, account_id, to_account_id, date, notes, created_at, updated_at)
       VALUES ('expense', ?, ?, NULL, 'Ahorro', 'target', '#10b981', ?, NULL, ?, ?, ?, ?)`,
      [amount, `Contribución a ${goal.name}`, account_id, ts, notes || `Contribución al objetivo: ${goal.name}`, ts, ts]
    );

    // Update account balance
    updateAccountBalance(account_id, amount, 'subtract');

    const updatedGoal = database.getFirstSync<any>('SELECT * FROM savings_goals WHERE id = ?', [goalId]);
    return { success: true, data: { goal: updatedGoal }, message: 'Contribución agregada exitosamente' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function getGoalContributions(goalId: number): DBResponse {
  try {
    const database = getDb();
    const contributions = database.getAllSync<any>('SELECT * FROM goal_contributions WHERE goal_id = ? ORDER BY date DESC, created_at DESC', [goalId]);
    return { success: true, data: contributions };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function getSavingsGoalsStats(): DBResponse {
  try {
    const database = getDb();
    const goals = database.getAllSync<any>('SELECT * FROM savings_goals');
    const active = goals.filter((g: any) => g.status === 'active');
    const completed = goals.filter((g: any) => g.status === 'completed');
    const totalTarget = active.reduce((sum: number, g: any) => sum + g.target_amount, 0);
    const totalSaved = active.reduce((sum: number, g: any) => sum + g.current_amount, 0);

    return {
      success: true,
      data: {
        total_goals: goals.length,
        active_goals: active.length,
        completed_goals: completed.length,
        total_target: totalTarget,
        total_saved: totalSaved,
        total_remaining: Math.max(0, totalTarget - totalSaved),
        completion_percentage: totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// =============================================
// LOANS
// =============================================
export function getLoans(): DBResponse {
  try {
    const database = getDb();
    const loans = database.getAllSync<any>('SELECT * FROM loans ORDER BY created_at DESC');
    return { success: true, data: loans };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function getLoanById(id: number): DBResponse {
  try {
    const database = getDb();
    const loan = database.getFirstSync<any>('SELECT * FROM loans WHERE id = ?', [id]);
    if (!loan) return { success: false, error: 'Préstamo no encontrado' };
    return { success: true, data: loan };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function createLoan(data: any): DBResponse {
  try {
    const database = getDb();
    const { person_name, amount, date, due_date, notes, account_id, create_movement } = data;
    if (!person_name || !amount || !date || !account_id) return { success: false, error: 'Faltan campos requeridos' };
    if (amount <= 0) return { success: false, error: 'El monto debe ser mayor a 0' };

    const ts = now();
    const result = database.runSync(
      `INSERT INTO loans (person_name, amount, remaining_amount, date, due_date, notes, account_id, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
      [person_name, amount, amount, date, due_date ?? null, notes ?? null, account_id, ts, ts]
    );

    if (create_movement) {
      database.runSync(
        `INSERT INTO movements (type, amount, title, category_id, category_name, category_icon, category_color, account_id, to_account_id, date, notes, created_at, updated_at)
         VALUES ('expense', ?, ?, NULL, 'Préstamo', 'banknote', '#f59e0b', ?, NULL, ?, ?, ?, ?)`,
        [amount, `Préstamo a ${person_name}`, account_id, date, notes || `Préstamo registrado a ${person_name}`, ts, ts]
      );
      updateAccountBalance(account_id, amount, 'subtract');
    }

    const newLoan = database.getFirstSync<any>('SELECT * FROM loans WHERE id = ?', [result.lastInsertRowId]);
    return { success: true, data: newLoan };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function updateLoan(id: number, data: any): DBResponse {
  try {
    const database = getDb();
    const loan = database.getFirstSync<any>('SELECT * FROM loans WHERE id = ?', [id]);
    if (!loan) return { success: false, error: 'Préstamo no encontrado' };

    const { person_name, amount, date, due_date, notes, status, remaining_amount } = data;
    const ts = now();

    database.runSync(
      `UPDATE loans SET person_name = ?, amount = ?, date = ?, due_date = ?, notes = ?, status = ?, remaining_amount = ?, updated_at = ? WHERE id = ?`,
      [
        person_name !== undefined ? person_name : loan.person_name,
        amount !== undefined ? amount : loan.amount,
        date || loan.date,
        due_date !== undefined ? due_date : loan.due_date,
        notes !== undefined ? notes : loan.notes,
        status || loan.status,
        remaining_amount !== undefined ? remaining_amount : loan.remaining_amount,
        ts, id,
      ]
    );

    const updated = database.getFirstSync<any>('SELECT * FROM loans WHERE id = ?', [id]);
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function deleteLoan(id: number): DBResponse {
  try {
    const database = getDb();
    const loan = database.getFirstSync<any>('SELECT * FROM loans WHERE id = ?', [id]);
    if (!loan) return { success: false, error: 'Préstamo no encontrado' };
    database.runSync('DELETE FROM loan_payments WHERE loan_id = ?', [id]);
    database.runSync('DELETE FROM loans WHERE id = ?', [id]);
    return { success: true, message: 'Préstamo eliminado correctamente' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function addLoanPayment(loanId: number, data: { amount: number; date: string; notes?: string; account_id?: number }): DBResponse {
  try {
    const database = getDb();
    const loan = database.getFirstSync<any>('SELECT * FROM loans WHERE id = ?', [loanId]);
    if (!loan) return { success: false, error: 'Préstamo no encontrado' };

    const { amount, date, notes, account_id } = data;
    if (!amount || !date) return { success: false, error: 'Faltan campos requeridos: amount, date' };
    if (amount <= 0) return { success: false, error: 'El monto debe ser mayor a 0' };
    if (amount > loan.remaining_amount) return { success: false, error: 'El monto del pago no puede ser mayor al monto pendiente' };

    const ts = now();
    const targetAccountId = account_id || loan.account_id;

    // Register payment
    database.runSync(
      `INSERT INTO loan_payments (loan_id, amount, date, notes, created_at) VALUES (?, ?, ?, ?, ?)`,
      [loanId, amount, date, notes ?? null, ts]
    );

    // Update loan
    const newRemaining = loan.remaining_amount - amount;
    let newStatus = loan.status;
    if (newRemaining === 0) newStatus = 'paid';
    else if (newRemaining < loan.amount) newStatus = 'partial';

    database.runSync('UPDATE loans SET remaining_amount = ?, status = ?, updated_at = ? WHERE id = ?', [newRemaining, newStatus, ts, loanId]);

    // Create income movement
    database.runSync(
      `INSERT INTO movements (type, amount, title, category_id, category_name, category_icon, category_color, account_id, to_account_id, date, notes, created_at, updated_at)
       VALUES ('income', ?, ?, NULL, 'Préstamo', 'banknote', '#10b981', ?, NULL, ?, ?, ?, ?)`,
      [amount, `Pago de préstamo - ${loan.person_name}`, targetAccountId, date, notes || `Pago recibido de ${loan.person_name}`, ts, ts]
    );

    // Update account balance
    updateAccountBalance(targetAccountId, amount, 'add');

    const updatedLoan = database.getFirstSync<any>('SELECT * FROM loans WHERE id = ?', [loanId]);
    return { success: true, data: { loan: updatedLoan } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function getLoanPayments(loanId: number): DBResponse {
  try {
    const database = getDb();
    const payments = database.getAllSync<any>('SELECT * FROM loan_payments WHERE loan_id = ? ORDER BY date DESC, created_at DESC', [loanId]);
    return { success: true, data: payments };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function getLoansStats(): DBResponse {
  try {
    const database = getDb();
    const loans = database.getAllSync<any>('SELECT * FROM loans');
    const active = loans.filter((l: any) => l.status === 'active' || l.status === 'partial');
    const paid = loans.filter((l: any) => l.status === 'paid');
    const forgiven = loans.filter((l: any) => l.status === 'forgiven');
    const totalLent = loans.reduce((s: number, l: any) => s + l.amount, 0);
    const totalPending = active.reduce((s: number, l: any) => s + l.remaining_amount, 0);
    const totalRecovered = loans.reduce((s: number, l: any) => s + (l.amount - l.remaining_amount), 0);

    return {
      success: true,
      data: {
        total_loans: loans.length,
        active_loans: active.length,
        paid_loans: paid.length,
        forgiven_loans: forgiven.length,
        total_lent: totalLent,
        total_pending: totalPending,
        total_recovered: totalRecovered,
        recovery_percentage: totalLent > 0 ? (totalRecovered / totalLent) * 100 : 0,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// =============================================
// RECURRING PAYMENTS
// =============================================
function getMonthlyAmount(payment: any): number {
  switch (payment.frequency) {
    case 'weekly': return payment.amount * 4.33;
    case 'biweekly': return payment.amount * 2;
    case 'monthly': return payment.amount;
    case 'yearly': return payment.amount / 12;
    default: return payment.amount;
  }
}

function getCategoryName(type: string): string {
  switch (type) {
    case 'subscription': return 'Suscripción';
    case 'salary': return 'Salario';
    case 'recurring_expense': return 'Gasto Recurrente';
    case 'recurring_income': return 'Ingreso Recurrente';
    default: return 'Recurrente';
  }
}

function calculateNextDate(frequency: string, dayOfMonth?: number | null, dayOfWeek?: number | null, specificDates?: string | null): string {
  const today = new Date();

  if (frequency === 'monthly' && dayOfMonth) {
    const next = new Date(today.getFullYear(), today.getMonth(), dayOfMonth);
    if (next <= today) next.setMonth(next.getMonth() + 1);
    return next.toISOString().split('T')[0];
  }

  if (frequency === 'weekly' && dayOfWeek) {
    const next = new Date(today);
    const currentDay = next.getDay();
    const daysUntil = (dayOfWeek - currentDay + 7) % 7 || 7;
    next.setDate(next.getDate() + daysUntil);
    return next.toISOString().split('T')[0];
  }

  if (frequency === 'biweekly' && specificDates) {
    const days = specificDates.split(',').map(d => parseInt(d.trim()));
    const candidates = days.map(day => {
      const next = new Date(today.getFullYear(), today.getMonth(), day);
      if (next <= today) next.setMonth(next.getMonth() + 1);
      return next;
    });
    candidates.sort((a, b) => a.getTime() - b.getTime());
    return candidates[0].toISOString().split('T')[0];
  }

  if (frequency === 'yearly') {
    const next = new Date(today.getFullYear(), today.getMonth(), dayOfMonth || today.getDate());
    if (next <= today) next.setFullYear(next.getFullYear() + 1);
    return next.toISOString().split('T')[0];
  }

  const next = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
  return next.toISOString().split('T')[0];
}

export function getRecurringPayments(): DBResponse {
  try {
    const database = getDb();
    const payments = database.getAllSync<any>('SELECT * FROM recurring_payments ORDER BY created_at DESC');
    return { success: true, data: payments };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function getRecurringPaymentById(id: number): DBResponse {
  try {
    const database = getDb();
    const payment = database.getFirstSync<any>('SELECT * FROM recurring_payments WHERE id = ?', [id]);
    if (!payment) return { success: false, error: 'Pago recurrente no encontrado' };
    return { success: true, data: payment };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function createRecurringPayment(data: any): DBResponse {
  try {
    const database = getDb();
    const { name, type, amount, frequency, day_of_month, day_of_week, specific_dates, category_id, account_id, icon, color, is_active, next_date, auto_register, notify_before_days } = data;

    if (!name || !type || !amount || !frequency || !account_id) return { success: false, error: 'Faltan campos requeridos' };
    if (amount <= 0) return { success: false, error: 'El monto debe ser mayor a 0' };

    const ts = now();
    const calculatedNextDate = next_date || calculateNextDate(frequency, day_of_month, day_of_week, specific_dates);

    const result = database.runSync(
      `INSERT INTO recurring_payments (name, type, amount, frequency, day_of_month, day_of_week, specific_dates, category_id, account_id, icon, color, is_active, next_date, auto_register, notify_before_days, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, type, amount, frequency, day_of_month ?? null, day_of_week ?? null, specific_dates ?? null, category_id ?? null, account_id, icon || 'creditcard', color || '#6b7280', is_active !== undefined ? (is_active ? 1 : 0) : 1, calculatedNextDate, auto_register ? 1 : 0, notify_before_days || 1, ts, ts]
    );

    const created = database.getFirstSync<any>('SELECT * FROM recurring_payments WHERE id = ?', [result.lastInsertRowId]);
    return { success: true, data: created };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function updateRecurringPayment(id: number, data: any): DBResponse {
  try {
    const database = getDb();
    const payment = database.getFirstSync<any>('SELECT * FROM recurring_payments WHERE id = ?', [id]);
    if (!payment) return { success: false, error: 'Pago recurrente no encontrado' };

    const { name, type, amount, frequency, day_of_month, day_of_week, specific_dates, category_id, account_id, icon, color, is_active, next_date, auto_register, notify_before_days } = data;
    const ts = now();

    database.runSync(
      `UPDATE recurring_payments SET name = ?, type = ?, amount = ?, frequency = ?, day_of_month = ?, day_of_week = ?, specific_dates = ?, category_id = ?, account_id = ?, icon = ?, color = ?, is_active = ?, next_date = ?, auto_register = ?, notify_before_days = ?, updated_at = ? WHERE id = ?`,
      [
        name !== undefined ? name : payment.name,
        type !== undefined ? type : payment.type,
        amount !== undefined ? amount : payment.amount,
        frequency !== undefined ? frequency : payment.frequency,
        day_of_month !== undefined ? day_of_month : payment.day_of_month,
        day_of_week !== undefined ? day_of_week : payment.day_of_week,
        specific_dates !== undefined ? specific_dates : payment.specific_dates,
        category_id !== undefined ? category_id : payment.category_id,
        account_id !== undefined ? account_id : payment.account_id,
        icon !== undefined ? icon : payment.icon,
        color !== undefined ? color : payment.color,
        is_active !== undefined ? (is_active ? 1 : 0) : payment.is_active,
        next_date !== undefined ? next_date : payment.next_date,
        auto_register !== undefined ? (auto_register ? 1 : 0) : payment.auto_register,
        notify_before_days !== undefined ? notify_before_days : payment.notify_before_days,
        ts, id,
      ]
    );

    const updated = database.getFirstSync<any>('SELECT * FROM recurring_payments WHERE id = ?', [id]);
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function deleteRecurringPayment(id: number): DBResponse {
  try {
    const database = getDb();
    const payment = database.getFirstSync<any>('SELECT * FROM recurring_payments WHERE id = ?', [id]);
    if (!payment) return { success: false, error: 'Pago recurrente no encontrado' };
    database.runSync('DELETE FROM recurring_payments WHERE id = ?', [id]);
    return { success: true, message: 'Pago recurrente eliminado correctamente' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function registerRecurringPayment(id: number, paymentDate?: string): DBResponse {
  try {
    const database = getDb();
    const payment = database.getFirstSync<any>('SELECT * FROM recurring_payments WHERE id = ?', [id]);
    if (!payment) return { success: false, error: 'Pago recurrente no encontrado' };

    const ts = now();
    const isIncome = payment.type === 'salary' || payment.type === 'recurring_income';
    const movementType = isIncome ? 'income' : 'expense';

    // Create movement
    database.runSync(
      `INSERT INTO movements (type, amount, title, category_id, category_name, category_icon, category_color, account_id, to_account_id, date, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?)`,
      [movementType, payment.amount, payment.name, payment.category_id, getCategoryName(payment.type), payment.icon, payment.color, payment.account_id, paymentDate || ts, `Pago recurrente: ${payment.name}`, ts, ts]
    );

    // Update account balance
    if (isIncome) {
      updateAccountBalance(payment.account_id, payment.amount, 'add');
    } else {
      updateAccountBalance(payment.account_id, payment.amount, 'subtract');
    }

    // Calculate next date
    const newNextDate = calculateNextDate(payment.frequency, payment.day_of_month, payment.day_of_week, payment.specific_dates);
    database.runSync('UPDATE recurring_payments SET next_date = ?, updated_at = ? WHERE id = ?', [newNextDate, ts, id]);

    const updated = database.getFirstSync<any>('SELECT * FROM recurring_payments WHERE id = ?', [id]);
    return { success: true, data: { payment: updated } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function getRecurringPaymentsStats(): DBResponse {
  try {
    const database = getDb();
    const payments = database.getAllSync<any>('SELECT * FROM recurring_payments');
    const active = payments.filter((p: any) => p.is_active);
    const subscriptions = active.filter((p: any) => p.type === 'subscription');
    const salaries = active.filter((p: any) => p.type === 'salary' || p.type === 'recurring_income');
    const expenses = active.filter((p: any) => p.type === 'recurring_expense' || p.type === 'subscription');

    const totalSubs = subscriptions.reduce((s: number, p: any) => s + getMonthlyAmount(p), 0);
    const totalExpenses = expenses.reduce((s: number, p: any) => s + getMonthlyAmount(p), 0);
    const totalIncome = salaries.reduce((s: number, p: any) => s + getMonthlyAmount(p), 0);

    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcoming = active
      .filter((p: any) => {
        const nd = new Date(p.next_date);
        return nd >= today && nd <= weekFromNow;
      })
      .sort((a: any, b: any) => new Date(a.next_date).getTime() - new Date(b.next_date).getTime());

    return {
      success: true,
      data: {
        total_active: active.length,
        total_subscriptions: subscriptions.length,
        total_salaries: salaries.length,
        total_recurring_expenses: expenses.length,
        monthly_subscriptions: totalSubs,
        monthly_recurring_expenses: totalExpenses,
        monthly_recurring_income: totalIncome,
        subscription_percentage: totalIncome > 0 ? (totalSubs / totalIncome) * 100 : 0,
        upcoming_payments: upcoming,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// =============================================
// VEHICLES
// =============================================
export function getVehicles(): DBResponse {
  try {
    const database = getDb();
    const vehicles = database.getAllSync<any>('SELECT * FROM vehicles');
    return { success: true, data: vehicles };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function getVehicleById(id: number): DBResponse {
  try {
    const database = getDb();
    const vehicle = database.getFirstSync<any>('SELECT * FROM vehicles WHERE id = ?', [id]);
    if (!vehicle) return { success: false, error: 'Vehículo no encontrado' };
    return { success: true, data: vehicle };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function createVehicle(data: any): DBResponse {
  try {
    const database = getDb();
    const { name, brand, model, year, license_plate, odometer, fuel_type, tank_capacity } = data;
    if (!name || !brand || !model || !year || !odometer || !fuel_type) return { success: false, error: 'Faltan campos requeridos' };

    const result = database.runSync(
      `INSERT INTO vehicles (name, brand, model, year, license_plate, odometer, fuel_type, tank_capacity, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, brand, model, parseInt(year), license_plate ?? null, parseFloat(odometer), fuel_type, tank_capacity ? parseFloat(tank_capacity) : null, now()]
    );

    const created = database.getFirstSync<any>('SELECT * FROM vehicles WHERE id = ?', [result.lastInsertRowId]);
    return { success: true, data: created };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function updateVehicle(id: number, data: any): DBResponse {
  try {
    const database = getDb();
    const vehicle = database.getFirstSync<any>('SELECT * FROM vehicles WHERE id = ?', [id]);
    if (!vehicle) return { success: false, error: 'Vehículo no encontrado' };

    const { name, brand, model, year, license_plate, odometer, fuel_type, tank_capacity } = data;

    database.runSync(
      `UPDATE vehicles SET name = ?, brand = ?, model = ?, year = ?, license_plate = ?, odometer = ?, fuel_type = ?, tank_capacity = ? WHERE id = ?`,
      [
        name || vehicle.name, brand || vehicle.brand, model || vehicle.model,
        year ? parseInt(year) : vehicle.year,
        license_plate !== undefined ? license_plate : vehicle.license_plate,
        odometer ? parseFloat(odometer) : vehicle.odometer,
        fuel_type || vehicle.fuel_type,
        tank_capacity !== undefined ? (tank_capacity ? parseFloat(tank_capacity) : null) : vehicle.tank_capacity,
        id,
      ]
    );

    const updated = database.getFirstSync<any>('SELECT * FROM vehicles WHERE id = ?', [id]);
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function deleteVehicle(id: number): DBResponse {
  try {
    const database = getDb();
    const vehicle = database.getFirstSync<any>('SELECT * FROM vehicles WHERE id = ?', [id]);
    if (!vehicle) return { success: false, error: 'Vehículo no encontrado' };
    database.runSync('DELETE FROM fuel_loads WHERE vehicle_id = ?', [id]);
    database.runSync('DELETE FROM maintenance WHERE vehicle_id = ?', [id]);
    database.runSync('DELETE FROM vehicles WHERE id = ?', [id]);
    return { success: true, message: 'Vehículo eliminado' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function getVehicleFuelLoads(vehicleId: number): DBResponse {
  try {
    const database = getDb();
    const loads = database.getAllSync<any>('SELECT * FROM fuel_loads WHERE vehicle_id = ? ORDER BY date DESC', [vehicleId]);
    return { success: true, data: loads };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function createFuelLoad(vehicleId: number, data: any): DBResponse {
  try {
    const database = getDb();
    const { liters, price_per_liter, total_cost, odometer, station_name, is_full_tank, date, account_id, notes } = data;
    if (!liters || !price_per_liter || !total_cost || !odometer || !account_id) return { success: false, error: 'Faltan campos requeridos' };

    const vehicle = database.getFirstSync<any>('SELECT * FROM vehicles WHERE id = ?', [vehicleId]);
    if (!vehicle) return { success: false, error: 'Vehículo no encontrado' };
    const account = database.getFirstSync<any>('SELECT * FROM accounts WHERE id = ?', [account_id]);
    if (!account) return { success: false, error: 'Cuenta no encontrada' };

    const ts = now();
    const result = database.runSync(
      `INSERT INTO fuel_loads (vehicle_id, liters, price_per_liter, total_cost, odometer, station_name, is_full_tank, date, account_id, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [vehicleId, parseFloat(liters), parseFloat(price_per_liter), parseFloat(total_cost), parseFloat(odometer), station_name ?? null, is_full_tank ? 1 : 0, date || ts, parseInt(account_id), notes ?? null, ts]
    );

    // Update odometer
    database.runSync('UPDATE vehicles SET odometer = ? WHERE id = ?', [parseFloat(odometer), vehicleId]);

    // Create expense movement
    database.runSync(
      `INSERT INTO movements (type, amount, title, category_id, category_name, category_icon, category_color, account_id, to_account_id, date, notes, created_at, updated_at)
       VALUES ('expense', ?, ?, NULL, 'Transporte', 'car', '#3b82f6', ?, NULL, ?, ?, ?, ?)`,
      [parseFloat(total_cost), `Gasolina - ${vehicle.name}`, parseInt(account_id), date || ts, `${liters}L @ $${price_per_liter}/L${station_name ? ` - ${station_name}` : ''}${notes ? ` - ${notes}` : ''}`, ts, ts]
    );

    // Update account balance
    updateAccountBalance(parseInt(account_id), parseFloat(total_cost), 'subtract');

    const created = database.getFirstSync<any>('SELECT * FROM fuel_loads WHERE id = ?', [result.lastInsertRowId]);
    return { success: true, data: created };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function updateFuelLoad(id: number, data: any): DBResponse {
  try {
    const database = getDb();
    const { liters, price_per_liter, total_cost, odometer, station_name, is_full_tank, account_id, date, notes } = data;
    if (!liters || !price_per_liter || !total_cost || !odometer || !account_id) return { success: false, error: 'Faltan campos requeridos' };

    const fuelLoad = database.getFirstSync<any>('SELECT * FROM fuel_loads WHERE id = ?', [id]);
    if (!fuelLoad) return { success: false, error: 'Carga de gasolina no encontrada' };

    const vehicle = database.getFirstSync<any>('SELECT * FROM vehicles WHERE id = ?', [fuelLoad.vehicle_id]);
    if (!vehicle) return { success: false, error: 'Vehículo no encontrado' };

    const oldAccountId = fuelLoad.account_id;
    const oldTotalCost = fuelLoad.total_cost;
    const newDate = date || fuelLoad.date;

    // Update fuel load
    database.runSync(
      `UPDATE fuel_loads SET liters = ?, price_per_liter = ?, total_cost = ?, odometer = ?, station_name = ?, is_full_tank = ?, account_id = ?, date = ?, notes = ? WHERE id = ?`,
      [parseFloat(liters), parseFloat(price_per_liter), parseFloat(total_cost), parseFloat(odometer), station_name ?? null, is_full_tank ? 1 : 0, parseInt(account_id), newDate, notes ?? null, id]
    );

    // Update odometer
    database.runSync('UPDATE vehicles SET odometer = ? WHERE id = ?', [parseFloat(odometer), fuelLoad.vehicle_id]);

    // Update movement
    const movement = database.getFirstSync<any>(
      `SELECT * FROM movements WHERE category_name = 'Transporte' AND category_icon = 'car' AND date = ? AND ABS(amount - ?) < 0.01 ORDER BY created_at DESC LIMIT 1`,
      [fuelLoad.date, oldTotalCost]
    );

    if (movement) {
      database.runSync(
        `UPDATE movements SET amount = ?, title = ?, account_id = ?, date = ?, notes = ?, updated_at = ? WHERE id = ?`,
        [parseFloat(total_cost), `Gasolina - ${vehicle.name}`, parseInt(account_id), newDate, `${liters}L @ ${price_per_liter}/L${station_name ? ` - ${station_name}` : ''}${notes ? ` - ${notes}` : ''}`, now(), movement.id]
      );

      // Adjust account balances
      if (oldAccountId === parseInt(account_id)) {
        const diff = parseFloat(total_cost) - oldTotalCost;
        if (diff > 0) {
          updateAccountBalance(parseInt(account_id), Math.abs(diff), 'subtract');
        } else if (diff < 0) {
          updateAccountBalance(parseInt(account_id), Math.abs(diff), 'add');
        }
      } else {
        updateAccountBalance(oldAccountId, oldTotalCost, 'add');
        updateAccountBalance(parseInt(account_id), parseFloat(total_cost), 'subtract');
      }
    }

    const updated = database.getFirstSync<any>('SELECT * FROM fuel_loads WHERE id = ?', [id]);
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function deleteFuelLoad(id: number): DBResponse {
  try {
    const database = getDb();
    const fuelLoad = database.getFirstSync<any>('SELECT * FROM fuel_loads WHERE id = ?', [id]);
    if (!fuelLoad) return { success: false, error: 'Carga de gasolina no encontrada' };

    // Find and delete associated movement
    const movement = database.getFirstSync<any>(
      `SELECT * FROM movements WHERE category_name = 'Transporte' AND category_icon = 'car' AND date = ? AND ABS(amount - ?) < 0.01 ORDER BY created_at DESC LIMIT 1`,
      [fuelLoad.date, fuelLoad.total_cost]
    );

    if (movement) {
      updateAccountBalance(fuelLoad.account_id, fuelLoad.total_cost, 'add');
      database.runSync('DELETE FROM movements WHERE id = ?', [movement.id]);
    }

    database.runSync('DELETE FROM fuel_loads WHERE id = ?', [id]);
    return { success: true, data: null };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


export function getVehicleMaintenance(vehicleId: number): DBResponse {
  try {
    const database = getDb();
    const records = database.getAllSync<any>('SELECT * FROM maintenance WHERE vehicle_id = ? ORDER BY date DESC', [vehicleId]);
    return { success: true, data: records };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function createMaintenance(vehicleId: number, data: any): DBResponse {
  try {
    const database = getDb();
    const { type, description, cost, odometer, workshop_name, date, next_date, next_odometer, account_id, notes } = data;
    if (!type || !description || !cost || !odometer || !account_id) return { success: false, error: 'Faltan campos requeridos' };

    const vehicle = database.getFirstSync<any>('SELECT * FROM vehicles WHERE id = ?', [vehicleId]);
    if (!vehicle) return { success: false, error: 'Vehículo no encontrado' };
    const account = database.getFirstSync<any>('SELECT * FROM accounts WHERE id = ?', [account_id]);
    if (!account) return { success: false, error: 'Cuenta no encontrada' };

    const ts = now();
    const result = database.runSync(
      `INSERT INTO maintenance (vehicle_id, type, description, cost, odometer, workshop_name, date, next_date, next_odometer, account_id, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [vehicleId, type, description, parseFloat(cost), parseFloat(odometer), workshop_name ?? null, date || ts, next_date ?? null, next_odometer ? parseFloat(next_odometer) : null, parseInt(account_id), notes ?? null, ts]
    );

    // Update odometer
    database.runSync('UPDATE vehicles SET odometer = ? WHERE id = ?', [parseFloat(odometer), vehicleId]);

    // Create expense movement
    const typeLabels: Record<string, string> = { oil_change: 'Cambio de Aceite', tires: 'Llantas', brakes: 'Frenos', service: 'Servicio', repair: 'Reparación', other: 'Mantenimiento' };
    database.runSync(
      `INSERT INTO movements (type, amount, title, category_id, category_name, category_icon, category_color, account_id, to_account_id, date, notes, created_at, updated_at)
       VALUES ('expense', ?, ?, NULL, 'Transporte', 'wrench', '#f59e0b', ?, NULL, ?, ?, ?, ?)`,
      [parseFloat(cost), `${typeLabels[type] || 'Mantenimiento'} - ${vehicle.name}`, parseInt(account_id), date || ts, `${description}${workshop_name ? ` - ${workshop_name}` : ''}${notes ? ` - ${notes}` : ''}`, ts, ts]
    );

    // Update account balance
    updateAccountBalance(parseInt(account_id), parseFloat(cost), 'subtract');

    const created = database.getFirstSync<any>('SELECT * FROM maintenance WHERE id = ?', [result.lastInsertRowId]);
    return { success: true, data: created };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function getVehicleStats(id: number): DBResponse {
  try {
    const database = getDb();
    const vehicle = database.getFirstSync<any>('SELECT * FROM vehicles WHERE id = ?', [id]);
    if (!vehicle) return { success: false, error: 'Vehículo no encontrado' };

    const fuelLoads = database.getAllSync<any>('SELECT * FROM fuel_loads WHERE vehicle_id = ? ORDER BY date ASC', [id]);
    const maintenanceRecords = database.getAllSync<any>('SELECT * FROM maintenance WHERE vehicle_id = ?', [id]);

    // Calculate efficiency
    let avgEfficiency = 0;
    if (fuelLoads.length >= 2) {
      const efficiencies: number[] = [];
      for (let i = 1; i < fuelLoads.length; i++) {
        const prev = fuelLoads[i - 1];
        const curr = fuelLoads[i];
        const km = curr.odometer - prev.odometer;
        if (km > 0 && prev.liters > 0) efficiencies.push(km / prev.liters);
      }
      if (efficiencies.length > 0) avgEfficiency = efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length;
    }

    const totalFuelCost = fuelLoads.reduce((s: number, l: any) => s + l.total_cost, 0);
    const totalMaintenanceCost = maintenanceRecords.reduce((s: number, m: any) => s + m.cost, 0);

    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const monthFuel = fuelLoads.filter((l: any) => new Date(l.date) >= firstDayOfMonth).reduce((s: number, l: any) => s + l.total_cost, 0);
    const monthMaint = maintenanceRecords.filter((m: any) => new Date(m.date) >= firstDayOfMonth).reduce((s: number, m: any) => s + m.cost, 0);

    const sortedMaint = [...maintenanceRecords].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastMaint = sortedMaint.length > 0 ? sortedMaint[0] : null;

    const upcoming = maintenanceRecords
      .filter((m: any) => m.next_date || m.next_odometer)
      .sort((a: any, b: any) => {
        if (a.next_date && b.next_date) return new Date(a.next_date).getTime() - new Date(b.next_date).getTime();
        if (a.next_odometer && b.next_odometer) return a.next_odometer - b.next_odometer;
        return 0;
      });

    return {
      success: true,
      data: {
        avg_efficiency: avgEfficiency,
        total_fuel_cost: totalFuelCost,
        total_maintenance_cost: totalMaintenanceCost,
        total_cost: totalFuelCost + totalMaintenanceCost,
        month_fuel_cost: monthFuel,
        month_maintenance_cost: monthMaint,
        month_total_cost: monthFuel + monthMaint,
        fuel_loads_count: fuelLoads.length,
        maintenance_count: maintenanceRecords.length,
        last_maintenance: lastMaint,
        upcoming_maintenance: upcoming[0] || null,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// =============================================
// NOTIFICATION SETTINGS
// =============================================
export function getNotificationSettings(): DBResponse {
  try {
    const database = getDb();
    let settings = database.getFirstSync<any>('SELECT * FROM notification_settings WHERE id = 1');
    if (!settings) {
      database.runSync('INSERT INTO notification_settings (id) VALUES (1)');
      settings = database.getFirstSync<any>('SELECT * FROM notification_settings WHERE id = 1');
    }
    return { success: true, data: settings };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function updateNotificationSettings(data: any): DBResponse {
  try {
    const database = getDb();
    const { daily_reminder, daily_reminder_time, credit_card_alerts, budget_alerts, loan_alerts, subscription_alerts, salary_alerts, savings_goal_alerts, vacation_mode, vacation_mode_until } = data;

    database.runSync(
      `UPDATE notification_settings SET daily_reminder = ?, daily_reminder_time = ?, credit_card_alerts = ?, budget_alerts = ?, loan_alerts = ?, subscription_alerts = ?, salary_alerts = ?, savings_goal_alerts = ?, vacation_mode = ?, vacation_mode_until = ?, updated_at = ? WHERE id = 1`,
      [daily_reminder ? 1 : 0, daily_reminder_time, credit_card_alerts ? 1 : 0, budget_alerts ? 1 : 0, loan_alerts ? 1 : 0, subscription_alerts ? 1 : 0, salary_alerts ? 1 : 0, savings_goal_alerts ? 1 : 0, vacation_mode ? 1 : 0, vacation_mode_until ?? null, now()]
    );

    const updated = database.getFirstSync<any>('SELECT * FROM notification_settings WHERE id = 1');
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function savePushToken(token: string): DBResponse {
  try {
    const database = getDb();
    database.runSync('UPDATE notification_settings SET push_token = ?, updated_at = ? WHERE id = 1', [token, now()]);
    return { success: true, message: 'Token guardado correctamente' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function getDaysUntilDay(targetDay: number): number {
  const today = new Date();
  const currentDay = today.getDate();
  let targetDate = new Date(today.getFullYear(), today.getMonth(), targetDay);
  if (targetDay < currentDay) {
    targetDate = new Date(today.getFullYear(), today.getMonth() + 1, targetDay);
  }
  return Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getPendingNotifications(): DBResponse {
  try {
    const database = getDb();
    const settings = database.getFirstSync<any>('SELECT * FROM notification_settings WHERE id = 1');
    if (!settings || settings.vacation_mode === 1) return { success: true, data: [] };

    const notifications: any[] = [];
    const today = new Date();

    if (settings.credit_card_alerts === 1) {
      const accounts = database.getAllSync<any>("SELECT * FROM accounts WHERE type = 'credit' AND include_in_balance = 1");
      accounts.forEach((account: any) => {
        if (account.cut_off_day) {
          const d = getDaysUntilDay(account.cut_off_day);
          if (d === 3 || d === 0) notifications.push({ type: 'credit_cutoff', title: d === 3 ? 'Fecha de corte próxima' : 'Fecha de corte hoy', message: `Tu tarjeta ${account.name} ${d === 3 ? 'tiene fecha de corte en 3 días' : 'tiene fecha de corte hoy'}. Deuda actual: $${(account.current_balance || 0).toFixed(2)}`, data: { account_id: account.id } });
        }
        if (account.payment_due_day) {
          const d = getDaysUntilDay(account.payment_due_day);
          if (d === 5 || d === 3 || d === 0) notifications.push({ type: 'credit_payment', title: d === 0 ? 'Pago vence hoy' : `Pago vence en ${d} días`, message: `${d === 0 ? 'Hoy vence' : `Tu pago de ${account.name} vence en ${d} días`}. Monto: $${(account.current_balance || 0).toFixed(2)}`, data: { account_id: account.id } });
        }
      });
    }

    if (settings.budget_alerts === 1) {
      const budgets = database.getAllSync<any>('SELECT * FROM budgets');
      budgets.forEach((budget: any) => {
        const pct = (budget.current_amount / budget.amount) * 100;
        if (pct >= 100) notifications.push({ type: 'budget_exceeded', title: 'Presupuesto excedido', message: `Excediste tu presupuesto de ${budget.name} por $${(budget.current_amount - budget.amount).toFixed(2)}`, data: { budget_id: budget.id } });
        else if (pct >= 80) notifications.push({ type: 'budget_warning', title: 'Presupuesto al 80%', message: `Tu presupuesto de ${budget.name} va al ${pct.toFixed(0)}%. Quedan $${(budget.amount - budget.current_amount).toFixed(2)} del límite`, data: { budget_id: budget.id } });
      });
    }

    if (settings.loan_alerts === 1) {
      const loans = database.getAllSync<any>("SELECT * FROM loans WHERE status IN ('active', 'partial') AND due_date IS NOT NULL");
      loans.forEach((loan: any) => {
        const dueDate = new Date(loan.due_date);
        const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntil <= 7 && daysUntil >= 0) notifications.push({ type: 'loan_due', title: 'Préstamo por vencer', message: `El préstamo a ${loan.person_name} vence en ${daysUntil} días. Monto pendiente: $${loan.remaining_amount.toFixed(2)}`, data: { loan_id: loan.id } });
      });
    }

    if (settings.subscription_alerts === 1) {
      const subs = database.getAllSync<any>('SELECT * FROM recurring_payments WHERE is_active = 1');
      subs.forEach((sub: any) => {
        const nd = new Date(sub.next_date);
        const daysUntil = Math.ceil((nd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntil === 1 || daysUntil === 0) notifications.push({ type: 'subscription_due', title: daysUntil === 1 ? 'Suscripción mañana' : 'Suscripción hoy', message: `Tu suscripción de ${sub.name} se cobra ${daysUntil === 1 ? 'mañana' : 'hoy'}: $${sub.amount.toFixed(2)}`, data: { subscription_id: sub.id } });
      });
    }

    if (settings.savings_goal_alerts === 1) {
      const goals = database.getAllSync<any>("SELECT * FROM savings_goals WHERE status = 'active' AND deadline IS NOT NULL");
      goals.forEach((goal: any) => {
        const deadline = new Date(goal.deadline);
        const daysRemaining = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const remaining = goal.target_amount - goal.current_amount;
        if (daysRemaining > 0 && remaining > 0) {
          const monthly = (remaining / daysRemaining) * 30;
          if (monthly > remaining * 0.5) notifications.push({ type: 'savings_goal_behind', title: 'Objetivo de ahorro atrasado', message: `Para cumplir tu meta ${goal.name} a tiempo, necesitas ahorrar $${monthly.toFixed(2)} este mes`, data: { goal_id: goal.id } });
        }
      });
    }

    return { success: true, data: notifications };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// =============================================
// MSI PURCHASES
// =============================================
export function getMsiPurchases(accountId: number): DBResponse {
  try {
    const database = getDb();
    const purchases = database.getAllSync<any>(
      'SELECT * FROM msi_purchases WHERE account_id = ? ORDER BY created_at DESC',
      [accountId]
    );
    return { success: true, data: purchases };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function createMsiPurchase(data: any): DBResponse {
  try {
    const database = getDb();
    const { account_id, description, total_amount, installments, start_date } = data;

    if (!account_id || !description || !total_amount || !installments) {
      return { success: false, error: 'Faltan campos requeridos' };
    }

    const account = database.getFirstSync<any>('SELECT * FROM accounts WHERE id = ? AND type = ?', [account_id, 'credit']);
    if (!account) return { success: false, error: 'Cuenta de crédito no encontrada' };

    const monthlyPayment = Math.round((total_amount / installments) * 100) / 100;
    const ts = now();

    const result = database.runSync(
      `INSERT INTO msi_purchases (account_id, description, total_amount, installments, monthly_payment, paid_installments, remaining_amount, start_date, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 0, ?, ?, 'active', ?, ?)`,
      [account_id, description, total_amount, installments, monthlyPayment, total_amount, start_date || ts, ts, ts]
    );

    // Aumentar current_balance (reduce credito disponible)
    database.runSync(
      'UPDATE accounts SET current_balance = current_balance + ?, updated_at = ? WHERE id = ?',
      [total_amount, ts, account_id]
    );

    const created = database.getFirstSync<any>('SELECT * FROM msi_purchases WHERE id = ?', [result.lastInsertRowId]);
    return { success: true, data: created };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function deleteMsiPurchase(id: number): DBResponse {
  try {
    const database = getDb();
    const purchase = database.getFirstSync<any>('SELECT * FROM msi_purchases WHERE id = ?', [id]);
    if (!purchase) return { success: false, error: 'Compra MSI no encontrada' };

    // Revertir el monto restante al credito disponible
    const ts = now();
    database.runSync(
      'UPDATE accounts SET current_balance = current_balance - ?, updated_at = ? WHERE id = ?',
      [purchase.remaining_amount, ts, purchase.account_id]
    );

    database.runSync('DELETE FROM msi_purchases WHERE id = ?', [id]);
    return { success: true, message: 'Compra MSI eliminada' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function payMsiInstallment(msiId: number): DBResponse {
  try {
    const database = getDb();
    const msi = database.getFirstSync<any>('SELECT * FROM msi_purchases WHERE id = ?', [msiId]);
    if (!msi) return { success: false, error: 'Compra MSI no encontrada' };
    if (msi.status === 'completed') return { success: false, error: 'Esta compra MSI ya está liquidada' };
    if (msi.paid_installments >= msi.installments) return { success: false, error: 'Todos los pagos ya fueron registrados' };

    const account = database.getFirstSync<any>('SELECT * FROM accounts WHERE id = ?', [msi.account_id]);
    if (!account) return { success: false, error: 'Cuenta no encontrada' };

    const ts = now();
    const newPaid = msi.paid_installments + 1;
    const newRemaining = Math.max(0, msi.remaining_amount - msi.monthly_payment);
    const isComplete = newPaid >= msi.installments;

    // Actualizar MSI tracking
    database.runSync(
      `UPDATE msi_purchases SET paid_installments = ?, remaining_amount = ?, status = ?, updated_at = ? WHERE id = ?`,
      [newPaid, newRemaining, isComplete ? 'completed' : 'active', ts, msiId]
    );

    // Liberar crédito: reducir current_balance por la mensualidad pagada
    database.runSync(
      'UPDATE accounts SET current_balance = current_balance - ?, updated_at = ? WHERE id = ?',
      [msi.monthly_payment, ts, msi.account_id]
    );

    // Crear movimiento informativo para historial
    // Se inserta directo (no createMovement) porque el balance ya se ajustó arriba
    database.runSync(
      `INSERT INTO movements (type, amount, title, category_id, category_name, category_icon, category_color, account_id, to_account_id, date, notes, created_at, updated_at)
       VALUES ('expense', ?, ?, NULL, 'MSI', 'creditcard', '#7c3aed', ?, NULL, ?, ?, ?, ?)`,
      [msi.monthly_payment, `Pago MSI - ${msi.description}`, msi.account_id, ts, `Pago ${newPaid}/${msi.installments} - ${msi.description}`, ts, ts]
    );

    const updated = database.getFirstSync<any>('SELECT * FROM msi_purchases WHERE id = ?', [msiId]);
    return { success: true, data: updated, message: isComplete ? 'MSI liquidado' : `Pago ${newPaid}/${msi.installments} registrado` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// =============================================
// DATA MANAGEMENT (Export/Import/Reset)
// =============================================
export function resetAllData(): DBResponse {
  try {
    const database = getDb();
    const tables = ['movements', 'fuel_loads', 'maintenance', 'goal_contributions', 'loan_payments', 'msi_purchases', 'accounts', 'budgets', 'savings_goals', 'loans', 'recurring_payments', 'vehicles', 'notification_settings', 'user_profile'];
    tables.forEach(t => database.runSync(`DELETE FROM ${t}`));

    // Re-seed defaults
    database.runSync(`INSERT INTO user_profile (id, name, email, currency) VALUES (1, 'Usuario', '', 'MXN')`);
    database.runSync('INSERT INTO notification_settings (id) VALUES (1)');

    return { success: true, message: 'Todos los datos han sido eliminados correctamente' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function exportAllDataAsJSON(): DBResponse {
  try {
    const database = getDb();
    const data = {
      version: '2.0.0',
      exportDate: now(),
      data: {
        accounts: database.getAllSync<any>('SELECT * FROM accounts'),
        movements: database.getAllSync<any>('SELECT * FROM movements'),
        budgets: database.getAllSync<any>('SELECT * FROM budgets'),
        user_profile: database.getAllSync<any>('SELECT * FROM user_profile'),
        savings_goals: database.getAllSync<any>('SELECT * FROM savings_goals'),
        goal_contributions: database.getAllSync<any>('SELECT * FROM goal_contributions'),
        loans: database.getAllSync<any>('SELECT * FROM loans'),
        loan_payments: database.getAllSync<any>('SELECT * FROM loan_payments'),
        recurring_payments: database.getAllSync<any>('SELECT * FROM recurring_payments'),
        vehicles: database.getAllSync<any>('SELECT * FROM vehicles'),
        fuel_loads: database.getAllSync<any>('SELECT * FROM fuel_loads'),
        maintenance: database.getAllSync<any>('SELECT * FROM maintenance'),
        msi_purchases: database.getAllSync<any>('SELECT * FROM msi_purchases'),
        notification_settings: database.getAllSync<any>('SELECT * FROM notification_settings'),
      },
    };
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function importDataFromJSON(jsonData: any): DBResponse {
  try {
    const database = getDb();
    const importData = jsonData.data || jsonData;

    // Clear all data first
    resetAllData();

    // Remove default seeds to avoid conflicts
    database.runSync('DELETE FROM user_profile');
    database.runSync('DELETE FROM notification_settings');

    const tableMap: Record<string, string[]> = {
      accounts: ['id', 'name', 'type', 'balance', 'currency', 'icon', 'color', 'clabe', 'bank_name', 'card_last_four', 'generates_interest', 'interest_rate', 'credit_limit', 'current_balance', 'cut_off_day', 'payment_due_day', 'is_primary', 'include_in_balance', 'created_at', 'updated_at'],
      movements: ['id', 'type', 'amount', 'title', 'category_id', 'category_name', 'category_icon', 'category_color', 'account_id', 'to_account_id', 'date', 'notes', 'created_at', 'updated_at'],
      budgets: ['id', 'name', 'type', 'amount', 'period', 'start_date', 'icon', 'color', 'current_amount', 'category_ids', 'created_at', 'updated_at'],
      user_profile: ['id', 'name', 'email', 'currency', 'created_at', 'updated_at'],
      savings_goals: ['id', 'name', 'target_amount', 'current_amount', 'deadline', 'icon', 'color', 'account_id', 'auto_deduct', 'auto_deduct_amount', 'auto_deduct_period', 'status', 'created_at', 'updated_at'],
      goal_contributions: ['id', 'goal_id', 'amount', 'date', 'notes', 'created_at'],
      loans: ['id', 'person_name', 'amount', 'remaining_amount', 'date', 'due_date', 'notes', 'account_id', 'status', 'created_at', 'updated_at'],
      loan_payments: ['id', 'loan_id', 'amount', 'date', 'notes', 'created_at'],
      recurring_payments: ['id', 'name', 'type', 'amount', 'frequency', 'day_of_month', 'day_of_week', 'specific_dates', 'category_id', 'account_id', 'icon', 'color', 'is_active', 'next_date', 'auto_register', 'notify_before_days', 'created_at', 'updated_at'],
      vehicles: ['id', 'name', 'brand', 'model', 'year', 'license_plate', 'odometer', 'fuel_type', 'tank_capacity', 'created_at'],
      fuel_loads: ['id', 'vehicle_id', 'liters', 'price_per_liter', 'total_cost', 'odometer', 'station_name', 'is_full_tank', 'date', 'account_id', 'notes', 'created_at'],
      maintenance: ['id', 'vehicle_id', 'type', 'description', 'cost', 'odometer', 'workshop_name', 'date', 'next_date', 'next_odometer', 'account_id', 'notes', 'created_at'],
      msi_purchases: ['id', 'account_id', 'description', 'total_amount', 'installments', 'monthly_payment', 'paid_installments', 'remaining_amount', 'start_date', 'status', 'created_at', 'updated_at'],
      notification_settings: ['id', 'daily_reminder', 'daily_reminder_time', 'credit_card_alerts', 'budget_alerts', 'loan_alerts', 'subscription_alerts', 'salary_alerts', 'savings_goal_alerts', 'vacation_mode', 'vacation_mode_until', 'push_token', 'created_at', 'updated_at'],
    };

    Object.entries(tableMap).forEach(([table, columns]) => {
      const rows = importData[table];
      if (!Array.isArray(rows)) return;

      rows.forEach((row: any) => {
        const vals = columns.map(col => row[col] ?? null);
        const placeholders = columns.map(() => '?').join(', ');
        database.runSync(`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`, vals);
      });
    });

    // Ensure defaults exist
    const profile = database.getFirstSync<any>('SELECT id FROM user_profile WHERE id = 1');
    if (!profile) database.runSync(`INSERT INTO user_profile (id, name, email, currency) VALUES (1, 'Usuario', '', 'MXN')`);
    const ns = database.getFirstSync<any>('SELECT id FROM notification_settings WHERE id = 1');
    if (!ns) database.runSync('INSERT INTO notification_settings (id) VALUES (1)');

    return { success: true, message: 'Datos importados correctamente' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function exportMovementsAsCSV(): DBResponse {
  try {
    const database = getDb();
    const movements = database.getAllSync<any>('SELECT * FROM movements ORDER BY date DESC');

    if (movements.length === 0) return { success: false, error: 'No hay movimientos para exportar' };

    const headers = 'Fecha,Tipo,Título,Categoría,Monto,Cuenta,Notas\n';
    const rows = movements.map((m: any) => {
      const dateStr = new Date(m.date).toLocaleDateString('es-MX');
      const type = m.type === 'expense' ? 'Gasto' : m.type === 'income' ? 'Ingreso' : 'Transferencia';
      const account = database.getFirstSync<any>('SELECT name FROM accounts WHERE id = ?', [m.account_id]);
      const notes = (m.notes || '').replace(/,/g, ';');
      return `${dateStr},${type},${m.title || ''},${m.category_name || ''},${m.amount || 0},${account?.name || ''},${notes}`;
    }).join('\n');

    return { success: true, data: headers + rows };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export function getDatabasePath(): string {
  const FileSystem = require('expo-file-system');
  return FileSystem.documentDirectory + 'SQLite/cashpro.db';
}
