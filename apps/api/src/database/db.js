const Database = require('better-sqlite3');
const path = require('path');

// Crear o abrir la base de datos
const db = new Database(path.join(__dirname, '../../cashpro.db'), { verbose: console.log });

// Habilitar foreign keys
db.pragma('foreign_keys = ON');

// Crear tabla de cuentas
const createAccountsTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('cash', 'bank', 'debit', 'credit')),
      balance REAL DEFAULT 0,
      currency TEXT DEFAULT 'MXN',
      icon TEXT,
      color TEXT,
      
      -- Campos para banco y débito
      clabe TEXT,
      bank_name TEXT,
      card_number TEXT,
      card_last_four TEXT,
      generates_interest BOOLEAN DEFAULT 0,
      interest_rate REAL DEFAULT 0,
      
      -- Campos específicos para crédito
      credit_limit REAL DEFAULT 0,
      current_balance REAL DEFAULT 0,
      cut_off_day INTEGER,
      payment_due_day INTEGER,
      
      is_primary BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  db.exec(sql);
  console.log('✅ Tabla accounts creada o ya existe');
};

// Inicializar la base de datos
const initDatabase = () => {
  try {
    createAccountsTable();
    console.log('✅ Base de datos inicializada correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
    throw error;
  }
};

module.exports = { db, initDatabase };
