const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '../../data.json');

// Estructura inicial de la base de datos
const initialData = {
  accounts: [],
  nextAccountId: 1,
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
        // Ordenar por is_primary DESC, created_at DESC
        return data.accounts.sort((a, b) => {
          if (a.is_primary !== b.is_primary) {
            return b.is_primary - a.is_primary;
          }
          return new Date(b.created_at) - new Date(a.created_at);
        });
      },
      get: (id) => {
        const data = readDB();
        if (sql.includes('stats') || sql.includes('SUM')) {
          // Calcular estadísticas
          let total_balance = 0;
          let total_credit_debt = 0;
          
          data.accounts.forEach(account => {
            if (account.type !== 'credit') {
              total_balance += account.balance || 0;
            } else {
              total_credit_debt += account.current_balance || 0;
            }
          });
          
          return { total_balance, total_credit_debt };
        }
        return data.accounts.find(a => a.id === parseInt(id));
      },
      run: (...params) => {
        const data = readDB();
        
        if (sql.includes('INSERT')) {
          // Crear nueva cuenta
          const [
            name, type, balance, currency, icon, color,
            clabe, bank_name, card_number, card_last_four,
            generates_interest, interest_rate,
            credit_limit, current_balance, cut_off_day, payment_due_day,
            is_primary
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
            card_number,
            card_last_four,
            generates_interest: generates_interest || 0,
            interest_rate: interest_rate || 0,
            credit_limit: credit_limit || 0,
            current_balance: current_balance || 0,
            cut_off_day,
            payment_due_day,
            is_primary: is_primary || 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          
          data.accounts.push(newAccount);
          writeDB(data);
          
          return { lastInsertRowid: newAccount.id };
        } else if (sql.includes('UPDATE')) {
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
                  data.accounts[accountIndex][field] = params[index];
                }
              });
              data.accounts[accountIndex].updated_at = new Date().toISOString();
            }
            writeDB(data);
          }
          
          return { changes: accountIndex !== -1 ? 1 : 0 };
        } else if (sql.includes('DELETE')) {
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
