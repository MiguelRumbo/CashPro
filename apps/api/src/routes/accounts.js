const express = require('express');
const router = express.Router();
// Usar base de datos JSON temporal (cambiar a db.js cuando better-sqlite3 esté compilado)
const { db } = require('../database/db-json');

// Obtener todas las cuentas
router.get('/', (req, res) => {
  try {
    const accounts = db.prepare('SELECT * FROM accounts ORDER BY is_primary DESC, created_at DESC').all();
    res.json({ success: true, data: accounts });
  } catch (error) {
    console.error('Error al obtener cuentas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener una cuenta por ID
router.get('/:id', (req, res) => {
  try {
    const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(req.params.id);
    
    if (!account) {
      return res.status(404).json({ success: false, error: 'Cuenta no encontrada' });
    }
    
    res.json({ success: true, data: account });
  } catch (error) {
    console.error('Error al obtener cuenta:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Crear una nueva cuenta
router.post('/', (req, res) => {
  try {
    const {
      name,
      type,
      balance,
      currency = 'MXN',
      icon,
      color,
      clabe,
      bank_name,
      card_number,
      generates_interest = 0,
      interest_rate = 0,
      credit_limit = 0,
      current_balance = 0,
      cut_off_day,
      payment_due_day,
      is_primary = 0,
      include_in_balance
    } = req.body;

    // Validaciones básicas
    if (!name || !type) {
      return res.status(400).json({ 
        success: false, 
        error: 'El nombre y tipo de cuenta son requeridos' 
      });
    }

    if (!['cash', 'bank', 'debit', 'credit'].includes(type)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Tipo de cuenta inválido' 
      });
    }

    // Extraer solo los últimos 4 dígitos si se proporciona número de tarjeta
    let card_last_four = null;
    if (card_number && card_number.length >= 4) {
      const cleanNumber = card_number.replace(/\s/g, '');
      card_last_four = cleanNumber.slice(-4);
    }

    // Por defecto, cuentas de crédito no se incluyen en balance general
    const shouldIncludeInBalance = include_in_balance !== undefined 
      ? include_in_balance 
      : (type === 'credit' ? 0 : 1);

    const stmt = db.prepare(`
      INSERT INTO accounts (
        name, type, balance, currency, icon, color,
        clabe, bank_name, card_last_four,
        generates_interest, interest_rate,
        credit_limit, current_balance, cut_off_day, payment_due_day,
        is_primary, include_in_balance
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      name, type, balance || 0, currency, icon, color,
      clabe, bank_name, card_last_four,
      generates_interest, interest_rate,
      credit_limit, current_balance, cut_off_day, payment_due_day,
      is_primary, shouldIncludeInBalance
    );

    const newAccount = db.prepare('SELECT * FROM accounts WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ 
      success: true, 
      data: newAccount,
      message: 'Cuenta creada exitosamente' 
    });
  } catch (error) {
    console.error('Error al crear cuenta:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Actualizar una cuenta
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Verificar que la cuenta existe
    const existingAccount = db.prepare('SELECT * FROM accounts WHERE id = ?').get(id);
    if (!existingAccount) {
      return res.status(404).json({ success: false, error: 'Cuenta no encontrada' });
    }

    // Construir la query de actualización dinámicamente
    const allowedFields = [
      'name', 'balance', 'currency', 'icon', 'color',
      'clabe', 'bank_name', 'card_number', 'card_last_four',
      'generates_interest', 'interest_rate',
      'credit_limit', 'current_balance', 'cut_off_day', 'payment_due_day',
      'is_primary', 'include_in_balance'
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

    // Actualizar número de tarjeta si se proporciona
    if (updates.card_number && updates.card_number.length >= 4) {
      const card_last_four = updates.card_number.slice(-4);
      updateFields.push('card_last_four = ?');
      values.push(card_last_four);
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const sql = `UPDATE accounts SET ${updateFields.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...values);

    const updatedAccount = db.prepare('SELECT * FROM accounts WHERE id = ?').get(id);

    res.json({ 
      success: true, 
      data: updatedAccount,
      message: 'Cuenta actualizada exitosamente' 
    });
  } catch (error) {
    console.error('Error al actualizar cuenta:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Eliminar una cuenta
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const existingAccount = db.prepare('SELECT * FROM accounts WHERE id = ?').get(id);
    if (!existingAccount) {
      return res.status(404).json({ success: false, error: 'Cuenta no encontrada' });
    }

    db.prepare('DELETE FROM accounts WHERE id = ?').run(id);

    res.json({ 
      success: true, 
      message: 'Cuenta eliminada exitosamente' 
    });
  } catch (error) {
    console.error('Error al eliminar cuenta:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener balance total
router.get('/stats/total-balance', (req, res) => {
  try {
    const result = db.prepare(`
      SELECT 
        SUM(CASE WHEN type != 'credit' THEN balance ELSE 0 END) as total_balance,
        SUM(CASE WHEN type = 'credit' THEN current_balance ELSE 0 END) as total_credit_debt
      FROM accounts
    `).get();

    const totalBalance = (result.total_balance || 0) - (result.total_credit_debt || 0);

    res.json({ 
      success: true, 
      data: {
        total_balance: totalBalance,
        assets: result.total_balance || 0,
        debts: result.total_credit_debt || 0
      }
    });
  } catch (error) {
    console.error('Error al calcular balance total:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Establecer cuenta principal
router.put('/:id/set-primary', (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que la cuenta existe
    const existingAccount = db.prepare('SELECT * FROM accounts WHERE id = ?').get(id);
    if (!existingAccount) {
      return res.status(404).json({ success: false, error: 'Cuenta no encontrada' });
    }

    // Desmarcar todas las cuentas como principal
    const allAccounts = db.prepare('SELECT * FROM accounts').all();
    allAccounts.forEach(account => {
      db.prepare('UPDATE accounts SET is_primary = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(account.id);
    });

    // Marcar la cuenta seleccionada como principal
    db.prepare('UPDATE accounts SET is_primary = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);

    const updatedAccount = db.prepare('SELECT * FROM accounts WHERE id = ?').get(id);

    res.json({ 
      success: true, 
      data: updatedAccount,
      message: 'Cuenta principal actualizada exitosamente' 
    });
  } catch (error) {
    console.error('Error al establecer cuenta principal:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
