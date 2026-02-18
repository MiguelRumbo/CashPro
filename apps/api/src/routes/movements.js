const express = require('express');
const router = express.Router();
const { db } = require('../database/db-json');

// Obtener todos los movimientos
router.get('/', (req, res) => {
  try {
    const movements = db.prepare('SELECT * FROM movements ORDER BY date DESC, created_at DESC').all();
    
    // Enriquecer movimientos con información de la cuenta
    const enrichedMovements = movements.map(movement => {
      const account = db.prepare('SELECT id, name, type FROM accounts WHERE id = ?').get(movement.account_id);
      return {
        ...movement,
        account_name: account?.name,
        account_type: account?.type,
      };
    });
    
    res.json({ success: true, data: enrichedMovements });
  } catch (error) {
    console.error('Error al obtener movimientos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener un movimiento por ID
router.get('/:id', (req, res) => {
  try {
    const movement = db.prepare('SELECT * FROM movements WHERE id = ?').get(req.params.id);
    
    if (!movement) {
      return res.status(404).json({ success: false, error: 'Movimiento no encontrado' });
    }
    
    res.json({ success: true, data: movement });
  } catch (error) {
    console.error('Error al obtener movimiento:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Crear un nuevo movimiento
router.post('/', (req, res) => {
  try {
    const {
      type,
      amount,
      title,
      category_id,
      category_name,
      category_icon,
      category_color,
      account_id,
      to_account_id,
      date,
      notes
    } = req.body;

    // Validaciones básicas
    if (!type || !amount) {
      return res.status(400).json({ 
        success: false, 
        error: 'El tipo y monto son requeridos' 
      });
    }

    if (!['expense', 'income', 'transfer'].includes(type)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Tipo de movimiento inválido' 
      });
    }

    if (type !== 'transfer' && !category_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'La categoría es requerida para gastos e ingresos' 
      });
    }

    if (!account_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'La cuenta es requerida' 
      });
    }

    if (type === 'transfer' && !to_account_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'La cuenta destino es requerida para transferencias' 
      });
    }

    // Verificar que la cuenta existe
    const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(account_id);
    if (!account) {
      return res.status(404).json({ success: false, error: 'Cuenta no encontrada' });
    }

    // Para transferencias, verificar cuenta destino
    if (type === 'transfer') {
      const toAccount = db.prepare('SELECT * FROM accounts WHERE id = ?').get(to_account_id);
      if (!toAccount) {
        return res.status(404).json({ success: false, error: 'Cuenta destino no encontrada' });
      }
    }

    const stmt = db.prepare(`
      INSERT INTO movements (
        type, amount, title, category_id, category_name, category_icon, category_color,
        account_id, to_account_id, date, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      type, amount, title, category_id, category_name, category_icon, category_color,
      account_id, to_account_id, date || new Date().toISOString(), notes
    );

    // Actualizar balance de la cuenta según el tipo de cuenta
    if (type === 'expense') {
      if (account.type === 'credit') {
        // Para cuentas de crédito, incrementar current_balance (deuda)
        db.prepare('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?').run(amount, account_id);
      } else {
        // Para otras cuentas, decrementar balance
        db.prepare('UPDATE accounts SET balance = balance - ? WHERE id = ?').run(amount, account_id);
      }
    } else if (type === 'income') {
      if (account.type === 'credit') {
        // Para cuentas de crédito, decrementar current_balance (pago de deuda)
        db.prepare('UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?').run(amount, account_id);
      } else {
        // Para otras cuentas, incrementar balance
        db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ?').run(amount, account_id);
      }
    } else if (type === 'transfer') {
      // Transferencias: restar de origen, sumar a destino
      if (account.type === 'credit') {
        db.prepare('UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?').run(amount, account_id);
      } else {
        db.prepare('UPDATE accounts SET balance = balance - ? WHERE id = ?').run(amount, account_id);
      }
      
      const toAccount = db.prepare('SELECT * FROM accounts WHERE id = ?').get(to_account_id);
      if (toAccount.type === 'credit') {
        db.prepare('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?').run(amount, to_account_id);
      } else {
        db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ?').run(amount, to_account_id);
      }
    }

    const newMovement = db.prepare('SELECT * FROM movements WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ 
      success: true, 
      data: newMovement,
      message: 'Movimiento creado exitosamente' 
    });
  } catch (error) {
    console.error('Error al crear movimiento:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Actualizar un movimiento
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const existingMovement = db.prepare('SELECT * FROM movements WHERE id = ?').get(id);
    if (!existingMovement) {
      return res.status(404).json({ success: false, error: 'Movimiento no encontrado' });
    }

    // Revertir el movimiento anterior
    const oldAccount = db.prepare('SELECT * FROM accounts WHERE id = ?').get(existingMovement.account_id);
    
    if (existingMovement.type === 'expense') {
      if (oldAccount && oldAccount.type === 'credit') {
        db.prepare('UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?').run(existingMovement.amount, existingMovement.account_id);
      } else {
        db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ?').run(existingMovement.amount, existingMovement.account_id);
      }
    } else if (existingMovement.type === 'income') {
      if (oldAccount && oldAccount.type === 'credit') {
        db.prepare('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?').run(existingMovement.amount, existingMovement.account_id);
      } else {
        db.prepare('UPDATE accounts SET balance = balance - ? WHERE id = ?').run(existingMovement.amount, existingMovement.account_id);
      }
    } else if (existingMovement.type === 'transfer') {
      const oldToAccount = db.prepare('SELECT * FROM accounts WHERE id = ?').get(existingMovement.to_account_id);
      
      if (oldAccount && oldAccount.type === 'credit') {
        db.prepare('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?').run(existingMovement.amount, existingMovement.account_id);
      } else {
        db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ?').run(existingMovement.amount, existingMovement.account_id);
      }
      
      if (oldToAccount && oldToAccount.type === 'credit') {
        db.prepare('UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?').run(existingMovement.amount, existingMovement.to_account_id);
      } else {
        db.prepare('UPDATE accounts SET balance = balance - ? WHERE id = ?').run(existingMovement.amount, existingMovement.to_account_id);
      }
    }

    const allowedFields = [
      'type', 'amount', 'title', 'category_id', 'category_name', 'category_icon', 'category_color',
      'account_id', 'to_account_id', 'date', 'notes'
    ];

    const updateFields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ success: false, error: 'No hay campos para actualizar' });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const sql = `UPDATE movements SET ${updateFields.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...values);

    const updatedMovement = db.prepare('SELECT * FROM movements WHERE id = ?').get(id);

    // Aplicar el nuevo movimiento
    const newAccount = db.prepare('SELECT * FROM accounts WHERE id = ?').get(updatedMovement.account_id);
    
    if (updatedMovement.type === 'expense') {
      if (newAccount && newAccount.type === 'credit') {
        db.prepare('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?').run(updatedMovement.amount, updatedMovement.account_id);
      } else {
        db.prepare('UPDATE accounts SET balance = balance - ? WHERE id = ?').run(updatedMovement.amount, updatedMovement.account_id);
      }
    } else if (updatedMovement.type === 'income') {
      if (newAccount && newAccount.type === 'credit') {
        db.prepare('UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?').run(updatedMovement.amount, updatedMovement.account_id);
      } else {
        db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ?').run(updatedMovement.amount, updatedMovement.account_id);
      }
    } else if (updatedMovement.type === 'transfer') {
      const newToAccount = db.prepare('SELECT * FROM accounts WHERE id = ?').get(updatedMovement.to_account_id);
      
      if (newAccount && newAccount.type === 'credit') {
        db.prepare('UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?').run(updatedMovement.amount, updatedMovement.account_id);
      } else {
        db.prepare('UPDATE accounts SET balance = balance - ? WHERE id = ?').run(updatedMovement.amount, updatedMovement.account_id);
      }
      
      if (newToAccount && newToAccount.type === 'credit') {
        db.prepare('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?').run(updatedMovement.amount, updatedMovement.to_account_id);
      } else {
        db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ?').run(updatedMovement.amount, updatedMovement.to_account_id);
      }
    }

    res.json({ 
      success: true, 
      data: updatedMovement,
      message: 'Movimiento actualizado exitosamente' 
    });
  } catch (error) {
    console.error('Error al actualizar movimiento:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Eliminar un movimiento
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const existingMovement = db.prepare('SELECT * FROM movements WHERE id = ?').get(id);
    if (!existingMovement) {
      return res.status(404).json({ success: false, error: 'Movimiento no encontrado' });
    }

    // Revertir el movimiento
    const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(existingMovement.account_id);
    
    if (existingMovement.type === 'expense') {
      if (account && account.type === 'credit') {
        db.prepare('UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?').run(existingMovement.amount, existingMovement.account_id);
      } else {
        db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ?').run(existingMovement.amount, existingMovement.account_id);
      }
    } else if (existingMovement.type === 'income') {
      if (account && account.type === 'credit') {
        db.prepare('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?').run(existingMovement.amount, existingMovement.account_id);
      } else {
        db.prepare('UPDATE accounts SET balance = balance - ? WHERE id = ?').run(existingMovement.amount, existingMovement.account_id);
      }
    } else if (existingMovement.type === 'transfer') {
      const toAccount = db.prepare('SELECT * FROM accounts WHERE id = ?').get(existingMovement.to_account_id);
      
      if (account && account.type === 'credit') {
        db.prepare('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?').run(existingMovement.amount, existingMovement.account_id);
      } else {
        db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ?').run(existingMovement.amount, existingMovement.account_id);
      }
      
      if (toAccount && toAccount.type === 'credit') {
        db.prepare('UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?').run(existingMovement.amount, existingMovement.to_account_id);
      } else {
        db.prepare('UPDATE accounts SET balance = balance - ? WHERE id = ?').run(existingMovement.amount, existingMovement.to_account_id);
      }
    }

    db.prepare('DELETE FROM movements WHERE id = ?').run(id);

    res.json({ 
      success: true, 
      message: 'Movimiento eliminado exitosamente' 
    });
  } catch (error) {
    console.error('Error al eliminar movimiento:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener estadísticas de movimientos
router.get('/stats/summary', (req, res) => {
  try {
    const result = db.prepare(`
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
        COUNT(*) as total_movements
      FROM movements
    `).get();

    res.json({ 
      success: true, 
      data: {
        total_income: result.total_income || 0,
        total_expense: result.total_expense || 0,
        total_movements: result.total_movements || 0,
        net: (result.total_income || 0) - (result.total_expense || 0)
      }
    });
  } catch (error) {
    console.error('Error al calcular estadísticas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
