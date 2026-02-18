const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '../../data.json');

// Estructura inicial de la base de datos
const initialData = {
  accounts: [],
  nextAccountId: 1,
  movements: [],
  nextMovementId: 1,
  categories: [],
  nextCategoryId: 1,
  budgets: [],
  nextBudgetId: 1,
};

// Leer la base de datos
const readDB = () => {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
      return initialData;
    }
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error al leer la base de datos:', error);
    return initialData;
  }
};

// Escribir en la base de datos
const writeDB = (data) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error al escribir en la base de datos:', error);
    throw error;
  }
};

// Simulación de métodos de SQLite
const db = {
  prepare: (sql) => {
    return {
      all: () => {
        const data = readDB();
        
        // Asegurar que existen las estructuras
        if (!data.accounts) {
          data.accounts = [];
        }
        if (!data.movements) {
          data.movements = [];
        }
        if (!data.budgets) {
          data.budgets = [];
        }
        
        // Para movimientos
        if (sql.includes('FROM movements')) {
          return [...data.movements].sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB - dateA;
          });
        }
        
        // Para presupuestos
        if (sql.includes('FROM budgets')) {
          return [...data.budgets].sort((a, b) => {
            return new Date(b.created_at) - new Date(a.created_at);
          });
        }
        
        // Para cuentas - Ordenar por is_primary DESC, created_at DESC
        return [...data.accounts].sort((a, b) => {
          if (a.is_primary !== b.is_primary) {
            return b.is_primary - a.is_primary;
          }
          return new Date(b.created_at) - new Date(a.created_at);
        });
      },
      get: (id) => {
        const data = readDB();
        
        // Asegurar que existen las estructuras
        if (!data.accounts) data.accounts = [];
        if (!data.movements) data.movements = [];
        if (!data.budgets) data.budgets = [];
        
        if (sql.includes('stats') || sql.includes('SUM')) {
          // Calcular estadísticas de cuentas
          if (sql.includes('FROM accounts')) {
            let total_balance = 0;
            let total_credit_debt = 0;
            
            data.accounts.forEach(account => {
              // Solo incluir cuentas que tengan include_in_balance = 1 (o undefined para retrocompatibilidad)
              const shouldInclude = account.include_in_balance === undefined || account.include_in_balance === 1;
              
              if (account.type !== 'credit') {
                if (shouldInclude) {
                  total_balance += account.balance || 0;
                }
              } else {
                if (shouldInclude) {
                  total_credit_debt += account.current_balance || 0;
                }
              }
            });
            
            return { total_balance, total_credit_debt };
          }
          
          // Calcular estadísticas de movimientos
          if (sql.includes('FROM movements')) {
            let total_income = 0;
            let total_expense = 0;
            
            data.movements.forEach(movement => {
              if (movement.type === 'income') {
                total_income += movement.amount || 0;
              } else if (movement.type === 'expense') {
                total_expense += movement.amount || 0;
              }
            });
            
            return { 
              total_income, 
              total_expense,
              total_movements: data.movements.length 
            };
          }
        }
        
        // Buscar movimiento por ID
        if (sql.includes('FROM movements')) {
          return data.movements.find(m => m.id === parseInt(id));
        }
        
        // Buscar presupuesto por ID
        if (sql.includes('FROM budgets')) {
          return data.budgets.find(b => b.id === parseInt(id));
        }
        
        // Buscar cuenta por ID
        return data.accounts.find(a => a.id === parseInt(id));
      },
      run: (...params) => {
        const data = readDB();
        
        if (sql.includes('INSERT INTO movements')) {
          // Crear nuevo movimiento
          const [
            type, amount, title, category_id, category_name, category_icon, category_color,
            account_id, to_account_id, date, notes
          ] = params;
          
          // Asegurar que movements existe
          if (!data.movements) {
            data.movements = [];
          }
          
          const newMovement = {
            id: data.nextMovementId++,
            type,
            amount: amount || 0,
            title,
            category_id,
            category_name,
            category_icon,
            category_color,
            account_id,
            to_account_id,
            date: date || new Date().toISOString(),
            notes,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          
          data.movements.push(newMovement);
          writeDB(data);
          
          return { lastInsertRowid: newMovement.id };
        }
        
        if (sql.includes('INSERT INTO budgets')) {
          // Crear nuevo presupuesto
          const [
            name, type, amount, period, start_date, icon, color, current_amount, category_ids
          ] = params;
          
          // Asegurar que budgets existe
          if (!data.budgets) {
            data.budgets = [];
          }
          
          const newBudget = {
            id: data.nextBudgetId++,
            name,
            type,
            amount: amount || 0,
            period,
            start_date: start_date || new Date().toISOString(),
            icon,
            color,
            current_amount: current_amount || 0,
            category_ids: category_ids || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          
          data.budgets.push(newBudget);
          writeDB(data);
          
          return { lastInsertRowid: newBudget.id };
        }
        
        if (sql.includes('INSERT INTO accounts')) {
          // Crear nueva cuenta
          const [
            name, type, balance, currency, icon, color,
            clabe, bank_name, card_last_four,
            generates_interest, interest_rate,
            credit_limit, current_balance, cut_off_day, payment_due_day,
            is_primary, include_in_balance
          ] = params;
          
          const newAccount = {
            id: data.nextAccountId++,
            name,
            type,
            balance: balance || 0,
            currency: currency || 'MXN',
            icon,
            color,
            clabe,
            bank_name,
            card_last_four,
            generates_interest: generates_interest || 0,
            interest_rate: interest_rate || 0,
            credit_limit: credit_limit || 0,
            current_balance: current_balance || 0,
            cut_off_day,
            payment_due_day,
            is_primary: is_primary || 0,
            include_in_balance: include_in_balance !== undefined ? include_in_balance : (type === 'credit' ? 0 : 1),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          
          data.accounts.push(newAccount);
          writeDB(data);
          
          return { lastInsertRowid: newAccount.id };
        } else if (sql.includes('UPDATE accounts')) {
          // Actualizar cuenta
          const id = params[params.length - 1];
          const accountIndex = data.accounts.findIndex(a => a.id === parseInt(id));
          
          if (accountIndex !== -1) {
            // Parsear los campos del UPDATE
            const updateMatch = sql.match(/SET (.+) WHERE/);
            if (updateMatch) {
              const fields = updateMatch[1].split(',').map(f => f.trim().split('=')[0].trim());
              fields.forEach((field, index) => {
                if (field !== 'updated_at') {
                  // Para balance, sumar o restar
                  if (field === 'balance' && sql.includes('balance -')) {
                    data.accounts[accountIndex].balance -= params[0];
                  } else if (field === 'balance' && sql.includes('balance +')) {
                    data.accounts[accountIndex].balance += params[0];
                  } else {
                    data.accounts[accountIndex][field] = params[index];
                  }
                }
              });
              data.accounts[accountIndex].updated_at = new Date().toISOString();
            }
            writeDB(data);
          }
          
          return { changes: accountIndex !== -1 ? 1 : 0 };
        } else if (sql.includes('UPDATE movements')) {
          // Actualizar movimiento
          const id = params[params.length - 1];
          const movementIndex = data.movements.findIndex(m => m.id === parseInt(id));
          
          if (movementIndex !== -1) {
            const updateMatch = sql.match(/SET (.+) WHERE/);
            if (updateMatch) {
              const fields = updateMatch[1].split(',').map(f => f.trim().split('=')[0].trim());
              fields.forEach((field, index) => {
                if (field !== 'updated_at') {
                  data.movements[movementIndex][field] = params[index];
                }
              });
              data.movements[movementIndex].updated_at = new Date().toISOString();
            }
            writeDB(data);
          }
          
          return { changes: movementIndex !== -1 ? 1 : 0 };
        } else if (sql.includes('UPDATE budgets')) {
          // Actualizar presupuesto
          const id = params[params.length - 1];
          const budgetIndex = data.budgets.findIndex(b => b.id === parseInt(id));
          
          if (budgetIndex !== -1) {
            const updateMatch = sql.match(/SET (.+) WHERE/);
            if (updateMatch) {
              const fields = updateMatch[1].split(',').map(f => f.trim().split('=')[0].trim());
              fields.forEach((field, index) => {
                if (field !== 'updated_at') {
                  data.budgets[budgetIndex][field] = params[index];
                }
              });
              data.budgets[budgetIndex].updated_at = new Date().toISOString();
            }
            writeDB(data);
          }
          
          return { changes: budgetIndex !== -1 ? 1 : 0 };
        } else if (sql.includes('DELETE FROM movements')) {
          // Eliminar movimiento
          const id = params[0];
          const initialLength = data.movements.length;
          data.movements = data.movements.filter(m => m.id !== parseInt(id));
          writeDB(data);
          
          return { changes: initialLength - data.movements.length };
        } else if (sql.includes('DELETE FROM budgets')) {
          // Eliminar presupuesto
          const id = params[0];
          const initialLength = data.budgets.length;
          data.budgets = data.budgets.filter(b => b.id !== parseInt(id));
          writeDB(data);
          
          return { changes: initialLength - data.budgets.length };
        } else if (sql.includes('DELETE FROM accounts')) {
          // Eliminar cuenta
          const id = params[0];
          const initialLength = data.accounts.length;
          data.accounts = data.accounts.filter(a => a.id !== parseInt(id));
          writeDB(data);
          
          return { changes: initialLength - data.accounts.length };
        }
        
        return {};
      },
    };
  },
  pragma: () => {}, // No-op para compatibilidad
  exec: () => {}, // No-op para compatibilidad
};

const initDatabase = () => {
  try {
    readDB(); // Esto creará el archivo si no existe
    console.log('✅ Base de datos JSON inicializada correctamente');
    console.log('📁 Archivo de datos:', DB_FILE);
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
    throw error;
  }
};

module.exports = { db, initDatabase };
