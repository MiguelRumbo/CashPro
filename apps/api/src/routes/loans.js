const express = require('express');
const router = express.Router();
const { db } = require('../database/db-json');

// Obtener todos los préstamos
router.get('/', (req, res) => {
  try {
    const loans = db.prepare('SELECT * FROM loans ORDER BY created_at DESC').all();
    res.json({ success: true, data: loans });
  } catch (error) {
    console.error('Error al obtener préstamos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener un préstamo por ID
router.get('/:id', (req, res) => {
  try {
    const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(req.params.id);
    
    if (!loan) {
      return res.status(404).json({ success: false, error: 'Préstamo no encontrado' });
    }
    
    res.json({ success: true, data: loan });
  } catch (error) {
    console.error('Error al obtener préstamo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Crear un nuevo préstamo
router.post('/', (req, res) => {
  try {
    const {
      person_name,
      amount,
      date,
      due_date,
      notes,
      account_id,
      create_movement
    } = req.body;

    // Validaciones
    if (!person_name || !amount || !date || !account_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Faltan campos requeridos: person_name, amount, date, account_id' 
      });
    }

    if (amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'El monto debe ser mayor a 0' 
      });
    }

    const now = new Date().toISOString();
    
    const result = db.prepare(`
      INSERT INTO loans (
        person_name, amount, remaining_amount, date, due_date, 
        notes, account_id, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      person_name,
      amount,
      amount, // remaining_amount empieza igual al monto total
      date,
      due_date || null,
      notes || null,
      account_id,
      'active',
      now,
      now
    );

    // Si se solicita crear movimiento, descontar de la cuenta
    if (create_movement) {
      // Crear movimiento de tipo gasto con categoría "Préstamo"
      const movementResult = db.prepare(`
        INSERT INTO movements (
          type, amount, title, category_id, category_name, category_icon, category_color,
          account_id, to_account_id, date, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'expense',
        amount,
        `Préstamo a ${person_name}`,
        null, // category_id
        'Préstamo', // category_name
        'banknote', // category_icon
        '#f59e0b', // category_color
        account_id,
        null, // to_account_id
        date,
        notes || `Préstamo registrado a ${person_name}`
      );

      // Actualizar balance de la cuenta
      const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(account_id);
      if (account) {
        if (account.type === 'credit') {
          // Para crédito, incrementar current_balance (deuda)
          db.prepare('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?')
            .run(amount, account_id);
        } else {
          // Para otras cuentas, decrementar balance
          db.prepare('UPDATE accounts SET balance = balance - ? WHERE id = ?')
            .run(amount, account_id);
        }
      }
    }

    const newLoan = db.prepare('SELECT * FROM loans WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: newLoan });
  } catch (error) {
    console.error('Error al crear préstamo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Actualizar un préstamo
router.put('/:id', (req, res) => {
  try {
    const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(req.params.id);
    
    if (!loan) {
      return res.status(404).json({ success: false, error: 'Préstamo no encontrado' });
    }

    const {
      person_name,
      amount,
      date,
      due_date,
      notes,
      status,
      remaining_amount
    } = req.body;

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE loans 
      SET person_name = ?, amount = ?, date = ?, due_date = ?, 
          notes = ?, status = ?, remaining_amount = ?, updated_at = ?
      WHERE id = ?
    `).run(
      person_name !== undefined ? person_name : loan.person_name,
      amount !== undefined ? amount : loan.amount,
      date || loan.date,
      due_date !== undefined ? due_date : loan.due_date,
      notes !== undefined ? notes : loan.notes,
      status || loan.status,
      remaining_amount !== undefined ? remaining_amount : loan.remaining_amount,
      now,
      req.params.id
    );

    const updatedLoan = db.prepare('SELECT * FROM loans WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: updatedLoan });
  } catch (error) {
    console.error('Error al actualizar préstamo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Eliminar un préstamo
router.delete('/:id', (req, res) => {
  try {
    const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(req.params.id);
    
    if (!loan) {
      return res.status(404).json({ success: false, error: 'Préstamo no encontrado' });
    }

    // Eliminar pagos asociados
    db.prepare('DELETE FROM loan_payments WHERE loan_id = ?').run(req.params.id);
    
    // Eliminar préstamo
    db.prepare('DELETE FROM loans WHERE id = ?').run(req.params.id);
    
    res.json({ success: true, message: 'Préstamo eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar préstamo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Registrar un pago de préstamo
router.post('/:id/payment', (req, res) => {
  try {
    const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(req.params.id);
    
    if (!loan) {
      return res.status(404).json({ success: false, error: 'Préstamo no encontrado' });
    }

    const { amount, date, notes } = req.body;

    if (!amount || !date) {
      return res.status(400).json({ 
        success: false, 
        error: 'Faltan campos requeridos: amount, date' 
      });
    }

    if (amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'El monto debe ser mayor a 0' 
      });
    }

    if (amount > loan.remaining_amount) {
      return res.status(400).json({ 
        success: false, 
        error: 'El monto del pago no puede ser mayor al monto pendiente' 
      });
    }

    const now = new Date().toISOString();

    // Registrar el pago
    const result = db.prepare(`
      INSERT INTO loan_payments (loan_id, amount, date, notes, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(loan.id, amount, date, notes || null, now);

    // Actualizar el monto pendiente del préstamo
    const newRemainingAmount = loan.remaining_amount - amount;
    let newStatus = loan.status;

    if (newRemainingAmount === 0) {
      newStatus = 'paid';
    } else if (newRemainingAmount < loan.amount) {
      newStatus = 'partial';
    }

    db.prepare(`
      UPDATE loans 
      SET remaining_amount = ?, status = ?, updated_at = ?
      WHERE id = ?
    `).run(newRemainingAmount, newStatus, now, loan.id);

    // Crear movimiento de ingreso para registrar el pago recibido
    db.prepare(`
      INSERT INTO movements (
        type, amount, title, category_id, category_name, category_icon, category_color,
        account_id, to_account_id, date, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'income',
      amount,
      `Pago de préstamo - ${loan.person_name}`,
      null,
      'Préstamo',
      'banknote',
      '#10b981',
      loan.account_id,
      null,
      date,
      notes || `Pago recibido de ${loan.person_name}`
    );

    // Actualizar balance de la cuenta
    const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(loan.account_id);
    if (account) {
      if (account.type === 'credit') {
        // Para crédito, decrementar current_balance (pago de deuda)
        db.prepare('UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?')
          .run(amount, loan.account_id);
      } else {
        // Para otras cuentas, incrementar balance
        db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ?')
          .run(amount, loan.account_id);
      }
    }

    const payment = db.prepare('SELECT * FROM loan_payments WHERE id = ?').get(result.lastInsertRowid);
    const updatedLoan = db.prepare('SELECT * FROM loans WHERE id = ?').get(loan.id);

    res.status(201).json({ 
      success: true, 
      data: { payment, loan: updatedLoan } 
    });
  } catch (error) {
    console.error('Error al registrar pago:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener pagos de un préstamo
router.get('/:id/payments', (req, res) => {
  try {
    const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(req.params.id);
    
    if (!loan) {
      return res.status(404).json({ success: false, error: 'Préstamo no encontrado' });
    }

    const payments = db.prepare(
      'SELECT * FROM loan_payments WHERE loan_id = ? ORDER BY date DESC, created_at DESC'
    ).all(req.params.id);

    res.json({ success: true, data: payments });
  } catch (error) {
    console.error('Error al obtener pagos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener estadísticas de préstamos
router.get('/stats/summary', (req, res) => {
  try {
    const loans = db.prepare('SELECT * FROM loans').all();

    const activeLoans = loans.filter(l => l.status === 'active' || l.status === 'partial');
    const paidLoans = loans.filter(l => l.status === 'paid');
    const forgivenLoans = loans.filter(l => l.status === 'forgiven');

    const totalLent = loans.reduce((sum, l) => sum + l.amount, 0);
    const totalPending = activeLoans.reduce((sum, l) => sum + l.remaining_amount, 0);
    const totalRecovered = loans.reduce((sum, l) => sum + (l.amount - l.remaining_amount), 0);

    res.json({ 
      success: true, 
      data: {
        total_loans: loans.length,
        active_loans: activeLoans.length,
        paid_loans: paidLoans.length,
        forgiven_loans: forgivenLoans.length,
        total_lent: totalLent,
        total_pending: totalPending,
        total_recovered: totalRecovered,
        recovery_percentage: totalLent > 0 ? (totalRecovered / totalLent) * 100 : 0
      }
    });
  } catch (error) {
    console.error('Error al calcular estadísticas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
