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
  user_profile: [],
  nextProfileId: 1,
  savings_goals: [],
  nextSavingsGoalId: 1,
  goal_contributions: [],
  nextGoalContributionId: 1,
  loans: [],
  nextLoanId: 1,
  loan_payments: [],
  nextLoanPaymentId: 1,
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
      all: (...params) => {
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
        if (!data.user_profile) {
          data.user_profile = [];
        }
        if (!data.savings_goals) {
          data.savings_goals = [];
        }
        if (!data.goal_contributions) {
          data.goal_contributions = [];
        }
        if (!data.loans) {
          data.loans = [];
        }
        if (!data.loan_payments) {
          data.loan_payments = [];
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
        
        // Para objetivos de ahorro
        if (sql.includes('FROM savings_goals')) {
          return [...data.savings_goals].sort((a, b) => {
            return new Date(b.created_at) - new Date(a.created_at);
          });
        }
        
        // Para préstamos
        if (sql.includes('FROM loans')) {
          return [...data.loans].sort((a, b) => {
            return new Date(b.created_at) - new Date(a.created_at);
          });
        }
        
        // Para pagos de préstamos
        if (sql.includes('FROM loan_payments')) {
          return [...data.loan_payments].sort((a, b) => {
            return new Date(b.created_at) - new Date(a.created_at);
          });
        }
        
        // Para contribuciones de objetivos
        if (sql.includes('FROM goal_contributions')) {
          let contributions = [...data.goal_contributions];
          
          // Filtrar por goal_id si se proporciona en WHERE
          if (sql.includes('WHERE goal_id = ?') && params.length > 0) {
            const goalId = parseInt(params[0]);
            contributions = contributions.filter(c => parseInt(c.goal_id) === goalId);
          }
          
          return contributions.sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
          });
        }
        
        // Para pagos de préstamos
        if (sql.includes('FROM loan_payments')) {
          let payments = [...data.loan_payments];
          
          // Filtrar por loan_id si se proporciona en WHERE
          if (sql.includes('WHERE loan_id = ?') && params.length > 0) {
            const loanId = parseInt(params[0]);
            payments = payments.filter(p => parseInt(p.loan_id) === loanId);
          }
          
          return payments.sort((a, b) => {
            return new Date(b.created_at) - new Date(a.created_at);
          });
        }
        
        // Para perfil de usuario
        if (sql.includes('FROM user_profile')) {
          return data.user_profile;
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
        if (!data.user_profile) data.user_profile = [];
        if (!data.savings_goals) data.savings_goals = [];
        if (!data.goal_contributions) data.goal_contributions = [];
        if (!data.loans) data.loans = [];
        if (!data.loan_payments) data.loan_payments = [];
        
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
        
        // Buscar objetivo de ahorro por ID
        if (sql.includes('FROM savings_goals')) {
          return data.savings_goals.find(g => g.id === parseInt(id));
        }
        
        // Buscar contribución por ID
        if (sql.includes('FROM goal_contributions')) {
          return data.goal_contributions.find(c => c.id === parseInt(id));
        }
        
        // Buscar préstamo por ID
        if (sql.includes('FROM loans')) {
          return data.loans.find(l => l.id === parseInt(id));
        }
        
        // Buscar pago de préstamo por ID
        if (sql.includes('FROM loan_payments')) {
          return data.loan_payments.find(p => p.id === parseInt(id));
        }
        
        // Buscar perfil por ID
        if (sql.includes('FROM user_profile')) {
          return data.user_profile.find(p => p.id === parseInt(id));
        }
        
        // Buscar cuenta por ID
        return data.accounts.find(a => a.id === parseInt(id));
      },
      run: (...params) => {
        const data = readDB();
        
        if (sql.includes('INSERT INTO movements')) {
          // Crear nuevo movimiento
          // El orden de los parámetros debe coincidir con el INSERT
          // INSERT INTO movements (type, amount, title, category_id, category_name, category_icon, category_color, account_id, to_account_id, date, notes)
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
            amount: parseFloat(amount) || 0,
            title,
            category_id,
            category_name,
            category_icon,
            category_color,
            account_id: parseInt(account_id),
            to_account_id: to_account_id ? parseInt(to_account_id) : null,
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
        
        if (sql.includes('INSERT INTO user_profile')) {
          // Crear perfil de usuario
          const [name, email, currency] = params;
          
          // Asegurar que user_profile existe
          if (!data.user_profile) {
            data.user_profile = [];
          }
          
          const newProfile = {
            id: data.nextProfileId++,
            name,
            email: email || '',
            currency: currency || 'MXN',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          
          data.user_profile.push(newProfile);
          writeDB(data);
          
          return { lastInsertRowid: newProfile.id };
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
        } else if (sql.includes('INSERT INTO savings_goals')) {
          // Crear nuevo objetivo de ahorro
          const [
            name, target_amount, current_amount, deadline, icon, color,
            account_id, auto_deduct, auto_deduct_amount, auto_deduct_period,
            status, created_at, updated_at
          ] = params;
          
          if (!data.savings_goals) {
            data.savings_goals = [];
          }
          
          const newGoal = {
            id: data.nextSavingsGoalId++,
            name,
            target_amount,
            current_amount,
            deadline,
            icon,
            color,
            account_id,
            auto_deduct,
            auto_deduct_amount,
            auto_deduct_period,
            status,
            created_at,
            updated_at,
          };
          
          data.savings_goals.push(newGoal);
          writeDB(data);
          
          return { lastInsertRowid: newGoal.id };
        } else if (sql.includes('INSERT INTO goal_contributions')) {
          // Crear nueva contribución
          const [goal_id, amount, date, notes, created_at] = params;
          
          if (!data.goal_contributions) {
            data.goal_contributions = [];
          }
          
          const newContribution = {
            id: data.nextGoalContributionId++,
            goal_id: parseInt(goal_id), // Asegurar que sea número
            amount: parseFloat(amount),
            date,
            notes,
            created_at,
          };
          
          data.goal_contributions.push(newContribution);
          writeDB(data);
          
          return { lastInsertRowid: newContribution.id };
        } else if (sql.includes('INSERT INTO loans')) {
          // Crear nuevo préstamo
          const [
            person_name, amount, remaining_amount, date, due_date,
            notes, account_id, status, created_at, updated_at
          ] = params;
          
          if (!data.loans) {
            data.loans = [];
          }
          
          const newLoan = {
            id: data.nextLoanId++,
            person_name,
            amount,
            remaining_amount,
            date,
            due_date,
            notes,
            account_id,
            status,
            created_at,
            updated_at,
          };
          
          data.loans.push(newLoan);
          writeDB(data);
          
          return { lastInsertRowid: newLoan.id };
        } else if (sql.includes('INSERT INTO loan_payments')) {
          // Crear nuevo pago de préstamo
          const [loan_id, amount, date, notes, created_at] = params;
          
          if (!data.loan_payments) {
            data.loan_payments = [];
          }
          
          const newPayment = {
            id: data.nextLoanPaymentId++,
            loan_id: parseInt(loan_id), // Asegurar que sea número
            amount: parseFloat(amount),
            date,
            notes,
            created_at,
          };
          
          data.loan_payments.push(newPayment);
          writeDB(data);
          
          return { lastInsertRowid: newPayment.id };
        } else if (sql.includes('UPDATE accounts')) {
          // Actualizar cuenta
          const id = params[params.length - 1];
          const accountIndex = data.accounts.findIndex(a => a.id === parseInt(id));
          
          if (accountIndex !== -1) {
            // Parsear los campos del UPDATE
            const updateMatch = sql.match(/SET (.+) WHERE/);
            if (updateMatch) {
              const setPart = updateMatch[1];
              const assignments = setPart.split(',').map(s => s.trim());
              
              let paramIndex = 0;
              assignments.forEach(assignment => {
                const parts = assignment.split('=').map(s => s.trim());
                const field = parts[0];
                const operation = parts[1];
                
                if (field === 'updated_at' && operation === 'CURRENT_TIMESTAMP') {
                  data.accounts[accountIndex].updated_at = new Date().toISOString();
                } else if (field === 'updated_at' && operation === '?') {
                  data.accounts[accountIndex].updated_at = params[paramIndex];
                  paramIndex++;
                } else if (operation && operation.includes('balance -')) {
                  // Restar del balance
                  data.accounts[accountIndex].balance -= params[paramIndex];
                  paramIndex++;
                } else if (operation && operation.includes('balance +')) {
                  // Sumar al balance
                  data.accounts[accountIndex].balance += params[paramIndex];
                  paramIndex++;
                } else if (operation && operation.includes('current_balance -')) {
                  // Restar del current_balance
                  data.accounts[accountIndex].current_balance -= params[paramIndex];
                  paramIndex++;
                } else if (operation && operation.includes('current_balance +')) {
                  // Sumar al current_balance
                  data.accounts[accountIndex].current_balance += params[paramIndex];
                  paramIndex++;
                } else if (operation === '?') {
                  // Asignación directa con placeholder
                  data.accounts[accountIndex][field] = params[paramIndex];
                  paramIndex++;
                }
              });
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
        } else if (sql.includes('UPDATE user_profile')) {
          // Actualizar perfil de usuario
          const id = params[params.length - 1];
          const profileIndex = data.user_profile.findIndex(p => p.id === parseInt(id));
          
          if (profileIndex !== -1) {
            const updateMatch = sql.match(/SET (.+) WHERE/);
            if (updateMatch) {
              const setPart = updateMatch[1];
              const assignments = setPart.split(',').map(s => s.trim());
              
              let paramIndex = 0;
              assignments.forEach(assignment => {
                const parts = assignment.split('=').map(s => s.trim());
                const field = parts[0];
                const operation = parts[1];
                
                if (field === 'updated_at' && operation === 'CURRENT_TIMESTAMP') {
                  data.user_profile[profileIndex].updated_at = new Date().toISOString();
                } else if (field === 'updated_at' && operation === '?') {
                  data.user_profile[profileIndex].updated_at = params[paramIndex];
                  paramIndex++;
                } else if (operation === '?') {
                  data.user_profile[profileIndex][field] = params[paramIndex];
                  paramIndex++;
                }
              });
            }
            writeDB(data);
          }
          
          return { changes: profileIndex !== -1 ? 1 : 0 };
        } else if (sql.includes('UPDATE savings_goals')) {
          // Actualizar objetivo de ahorro
          const id = params[params.length - 1];
          const goalIndex = data.savings_goals.findIndex(g => g.id === parseInt(id));
          
          if (goalIndex !== -1) {
            const updateMatch = sql.match(/SET (.+) WHERE/);
            if (updateMatch) {
              const setPart = updateMatch[1];
              const assignments = setPart.split(',').map(s => s.trim());
              
              let paramIndex = 0;
              assignments.forEach(assignment => {
                const parts = assignment.split('=').map(s => s.trim());
                const field = parts[0];
                const operation = parts[1];
                
                if (operation === '?') {
                  data.savings_goals[goalIndex][field] = params[paramIndex];
                  paramIndex++;
                }
              });
            }
            writeDB(data);
          }
          
          return { changes: goalIndex !== -1 ? 1 : 0 };
        } else if (sql.includes('UPDATE loans')) {
          // Actualizar préstamo
          const id = params[params.length - 1];
          const loanIndex = data.loans.findIndex(l => l.id === parseInt(id));
          
          if (loanIndex !== -1) {
            const updateMatch = sql.match(/SET (.+) WHERE/);
            if (updateMatch) {
              const setPart = updateMatch[1];
              const assignments = setPart.split(',').map(s => s.trim());
              
              let paramIndex = 0;
              assignments.forEach(assignment => {
                const parts = assignment.split('=').map(s => s.trim());
                const field = parts[0];
                const operation = parts[1];
                
                if (operation === '?') {
                  data.loans[loanIndex][field] = params[paramIndex];
                  paramIndex++;
                }
              });
            }
            writeDB(data);
          }
          
          return { changes: loanIndex !== -1 ? 1 : 0 };
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
        } else if (sql.includes('DELETE FROM savings_goals')) {
          // Eliminar objetivo de ahorro
          const id = params[0];
          const initialLength = data.savings_goals.length;
          data.savings_goals = data.savings_goals.filter(g => g.id !== parseInt(id));
          writeDB(data);
          
          return { changes: initialLength - data.savings_goals.length };
        } else if (sql.includes('DELETE FROM goal_contributions')) {
          // Eliminar contribución
          const id = params[0];
          const initialLength = data.goal_contributions.length;
          data.goal_contributions = data.goal_contributions.filter(c => c.id !== parseInt(id) && c.goal_id !== parseInt(id));
          writeDB(data);
          
          return { changes: initialLength - data.goal_contributions.length };
        } else if (sql.includes('DELETE FROM loans')) {
          // Eliminar préstamo
          const id = params[0];
          const initialLength = data.loans.length;
          data.loans = data.loans.filter(l => l.id !== parseInt(id));
          writeDB(data);
          
          return { changes: initialLength - data.loans.length };
        } else if (sql.includes('DELETE FROM loan_payments')) {
          // Eliminar pago de préstamo
          const id = params[0];
          const initialLength = data.loan_payments.length;
          data.loan_payments = data.loan_payments.filter(p => p.id !== parseInt(id) && p.loan_id !== parseInt(id));
          writeDB(data);
          
          return { changes: initialLength - data.loan_payments.length };
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
