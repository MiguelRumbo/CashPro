const express = require('express');
const router = express.Router();
const { db } = require('../database/db-json');

// Obtener todos los pagos recurrentes
router.get('/', (req, res) => {
  try {
    const payments = db.prepare('SELECT * FROM recurring_payments ORDER BY created_at DESC').all();
    res.json({ success: true, data: payments });
  } catch (error) {
    console.error('Error al obtener pagos recurrentes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener estadísticas / resumen
router.get('/stats/summary', (req, res) => {
  try {
    const payments = db.prepare('SELECT * FROM recurring_payments').all();
    const activePayments = payments.filter(p => p.is_active);

    const subscriptions = activePayments.filter(p => p.type === 'subscription');
    const salaries = activePayments.filter(p => p.type === 'salary' || p.type === 'recurring_income');
    const expenses = activePayments.filter(p => p.type === 'recurring_expense' || p.type === 'subscription');

    // Calcular total mensual de suscripciones
    const totalSubscriptions = subscriptions.reduce((sum, p) => {
      return sum + getMonthlyAmount(p);
    }, 0);

    // Calcular total mensual de gastos recurrentes (incluyendo suscripciones)
    const totalRecurringExpenses = expenses.reduce((sum, p) => {
      return sum + getMonthlyAmount(p);
    }, 0);

    // Calcular total mensual de ingresos recurrentes
    const totalRecurringIncome = salaries.reduce((sum, p) => {
      return sum + getMonthlyAmount(p);
    }, 0);

    // Próximos cobros (dentro de los próximos 7 días)
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingPayments = activePayments
      .filter(p => {
        const nextDate = new Date(p.next_date);
        return nextDate >= now && nextDate <= weekFromNow;
      })
      .sort((a, b) => new Date(a.next_date) - new Date(b.next_date));

    // Porcentaje de suscripciones vs ingresos
    const subscriptionPercentage = totalRecurringIncome > 0
      ? (totalSubscriptions / totalRecurringIncome) * 100
      : 0;

    res.json({
      success: true,
      data: {
        total_active: activePayments.length,
        total_subscriptions: subscriptions.length,
        total_salaries: salaries.length,
        total_recurring_expenses: expenses.length,
        monthly_subscriptions: totalSubscriptions,
        monthly_recurring_expenses: totalRecurringExpenses,
        monthly_recurring_income: totalRecurringIncome,
        subscription_percentage: subscriptionPercentage,
        upcoming_payments: upcomingPayments,
      }
    });
  } catch (error) {
    console.error('Error al calcular estadísticas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener un pago recurrente por ID
router.get('/:id', (req, res) => {
  try {
    const payment = db.prepare('SELECT * FROM recurring_payments WHERE id = ?').get(req.params.id);

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Pago recurrente no encontrado' });
    }

    res.json({ success: true, data: payment });
  } catch (error) {
    console.error('Error al obtener pago recurrente:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Crear un nuevo pago recurrente
router.post('/', (req, res) => {
  try {
    const {
      name, type, amount, frequency, day_of_month, day_of_week,
      specific_dates, category_id, account_id, icon, color,
      is_active, next_date, auto_register, notify_before_days
    } = req.body;

    // Validaciones
    if (!name || !type || !amount || !frequency || !account_id) {
      return res.status(400).json({
        success: false,
        error: 'Faltan campos requeridos: name, type, amount, frequency, account_id'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'El monto debe ser mayor a 0'
      });
    }

    const validTypes = ['subscription', 'salary', 'recurring_expense', 'recurring_income'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Tipo inválido. Debe ser: subscription, salary, recurring_expense o recurring_income'
      });
    }

    const validFrequencies = ['weekly', 'biweekly', 'monthly', 'yearly'];
    if (!validFrequencies.includes(frequency)) {
      return res.status(400).json({
        success: false,
        error: 'Frecuencia inválida. Debe ser: weekly, biweekly, monthly o yearly'
      });
    }

    const now = new Date().toISOString();

    // Calcular next_date si no se proporciona
    const calculatedNextDate = next_date || calculateNextDate(frequency, day_of_month, day_of_week, specific_dates);

    const result = db.prepare(`
      INSERT INTO recurring_payments (
        name, type, amount, frequency, day_of_month, day_of_week,
        specific_dates, category_id, account_id, icon, color,
        is_active, next_date, auto_register, notify_before_days,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name, type, amount, frequency,
      day_of_month || null, day_of_week || null,
      specific_dates || null, category_id || null, account_id,
      icon || 'creditcard', color || '#6b7280',
      is_active !== undefined ? is_active : true,
      calculatedNextDate,
      auto_register !== undefined ? auto_register : false,
      notify_before_days || 1,
      now, now
    );

    const newPayment = db.prepare('SELECT * FROM recurring_payments WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: newPayment });
  } catch (error) {
    console.error('Error al crear pago recurrente:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Actualizar un pago recurrente
router.put('/:id', (req, res) => {
  try {
    const payment = db.prepare('SELECT * FROM recurring_payments WHERE id = ?').get(req.params.id);

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Pago recurrente no encontrado' });
    }

    const {
      name, type, amount, frequency, day_of_month, day_of_week,
      specific_dates, category_id, account_id, icon, color,
      is_active, next_date, auto_register, notify_before_days
    } = req.body;

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE recurring_payments
      SET name = ?, type = ?, amount = ?, frequency = ?, day_of_month = ?,
          day_of_week = ?, specific_dates = ?, category_id = ?, account_id = ?,
          icon = ?, color = ?, is_active = ?, next_date = ?, auto_register = ?,
          notify_before_days = ?, updated_at = ?
      WHERE id = ?
    `).run(
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
      now,
      req.params.id
    );

    const updatedPayment = db.prepare('SELECT * FROM recurring_payments WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: updatedPayment });
  } catch (error) {
    console.error('Error al actualizar pago recurrente:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Eliminar un pago recurrente
router.delete('/:id', (req, res) => {
  try {
    const payment = db.prepare('SELECT * FROM recurring_payments WHERE id = ?').get(req.params.id);

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Pago recurrente no encontrado' });
    }

    db.prepare('DELETE FROM recurring_payments WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Pago recurrente eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar pago recurrente:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Registrar manualmente un cobro/depósito de un pago recurrente
router.post('/:id/register', (req, res) => {
  try {
    const payment = db.prepare('SELECT * FROM recurring_payments WHERE id = ?').get(req.params.id);

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Pago recurrente no encontrado' });
    }

    const now = new Date().toISOString();
    const isIncome = payment.type === 'salary' || payment.type === 'recurring_income';
    const movementType = isIncome ? 'income' : 'expense';

    // Crear movimiento
    const movResult = db.prepare(`
      INSERT INTO movements (
        type, amount, title, category_id, category_name, category_icon, category_color,
        account_id, to_account_id, date, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      movementType,
      payment.amount,
      payment.name,
      payment.category_id,
      getCategoryName(payment.type),
      payment.icon,
      payment.color,
      payment.account_id,
      null,
      req.body.date || now,
      `Pago recurrente: ${payment.name}`
    );

    // Actualizar balance de la cuenta
    const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(payment.account_id);
    if (account) {
      if (isIncome) {
        if (account.type === 'credit') {
          db.prepare('UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?')
            .run(payment.amount, payment.account_id);
        } else {
          db.prepare('UPDATE accounts SET balance = balance + ? WHERE id = ?')
            .run(payment.amount, payment.account_id);
        }
      } else {
        if (account.type === 'credit') {
          db.prepare('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?')
            .run(payment.amount, payment.account_id);
        } else {
          db.prepare('UPDATE accounts SET balance = balance - ? WHERE id = ?')
            .run(payment.amount, payment.account_id);
        }
      }
    }

    // Calcular y actualizar next_date
    const newNextDate = calculateNextDate(
      payment.frequency, payment.day_of_month, payment.day_of_week, payment.specific_dates
    );

    db.prepare(`
      UPDATE recurring_payments SET next_date = ?, updated_at = ? WHERE id = ?
    `).run(newNextDate, now, payment.id);

    const updatedPayment = db.prepare('SELECT * FROM recurring_payments WHERE id = ?').get(payment.id);

    res.status(201).json({
      success: true,
      data: {
        movement_id: movResult.lastInsertRowid,
        payment: updatedPayment
      }
    });
  } catch (error) {
    console.error('Error al registrar cobro:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helpers
function getMonthlyAmount(payment) {
  switch (payment.frequency) {
    case 'weekly': return payment.amount * 4.33;
    case 'biweekly': return payment.amount * 2;
    case 'monthly': return payment.amount;
    case 'yearly': return payment.amount / 12;
    default: return payment.amount;
  }
}

function getCategoryName(type) {
  switch (type) {
    case 'subscription': return 'Suscripción';
    case 'salary': return 'Salario';
    case 'recurring_expense': return 'Gasto Recurrente';
    case 'recurring_income': return 'Ingreso Recurrente';
    default: return 'Recurrente';
  }
}

function calculateNextDate(frequency, dayOfMonth, dayOfWeek, specificDates) {
  const now = new Date();

  if (frequency === 'monthly' && dayOfMonth) {
    const next = new Date(now.getFullYear(), now.getMonth(), dayOfMonth);
    if (next <= now) {
      next.setMonth(next.getMonth() + 1);
    }
    return next.toISOString().split('T')[0];
  }

  if (frequency === 'weekly' && dayOfWeek) {
    const next = new Date(now);
    const currentDay = next.getDay();
    const daysUntil = (dayOfWeek - currentDay + 7) % 7 || 7;
    next.setDate(next.getDate() + daysUntil);
    return next.toISOString().split('T')[0];
  }

  if (frequency === 'biweekly' && specificDates) {
    const days = specificDates.split(',').map(d => parseInt(d.trim()));
    const candidates = days.map(day => {
      const next = new Date(now.getFullYear(), now.getMonth(), day);
      if (next <= now) {
        next.setMonth(next.getMonth() + 1);
      }
      return next;
    });
    candidates.sort((a, b) => a - b);
    return candidates[0].toISOString().split('T')[0];
  }

  if (frequency === 'yearly') {
    const next = new Date(now.getFullYear(), now.getMonth(), dayOfMonth || now.getDate());
    if (next <= now) {
      next.setFullYear(next.getFullYear() + 1);
    }
    return next.toISOString().split('T')[0];
  }

  // Default: siguiente mes, mismo día
  const next = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
  return next.toISOString().split('T')[0];
}

module.exports = router;
