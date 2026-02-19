const express = require('express');
const router = express.Router();
const { db } = require('../database/db-json');

// Obtener configuración de notificaciones del usuario
router.get('/settings', (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM notification_settings WHERE id = 1').get();
    
    if (!settings) {
      // Crear configuración por defecto si no existe
      const defaultSettings = {
        id: 1,
        daily_reminder: 1,
        daily_reminder_time: '20:00',
        credit_card_alerts: 1,
        budget_alerts: 1,
        loan_alerts: 1,
        subscription_alerts: 1,
        salary_alerts: 1,
        savings_goal_alerts: 1,
        vacation_mode: 0,
        vacation_mode_until: null,
        push_token: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      db.prepare(`
        INSERT INTO notification_settings (
          id, daily_reminder, daily_reminder_time, credit_card_alerts,
          budget_alerts, loan_alerts, subscription_alerts, salary_alerts,
          savings_goal_alerts, vacation_mode, vacation_mode_until, push_token,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        defaultSettings.id,
        defaultSettings.daily_reminder,
        defaultSettings.daily_reminder_time,
        defaultSettings.credit_card_alerts,
        defaultSettings.budget_alerts,
        defaultSettings.loan_alerts,
        defaultSettings.subscription_alerts,
        defaultSettings.salary_alerts,
        defaultSettings.savings_goal_alerts,
        defaultSettings.vacation_mode,
        defaultSettings.vacation_mode_until,
        defaultSettings.push_token,
        defaultSettings.created_at,
        defaultSettings.updated_at
      );
      
      return res.json({ success: true, data: defaultSettings });
    }
    
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error al obtener configuración de notificaciones:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Actualizar configuración de notificaciones
router.put('/settings', (req, res) => {
  try {
    const {
      daily_reminder,
      daily_reminder_time,
      credit_card_alerts,
      budget_alerts,
      loan_alerts,
      subscription_alerts,
      salary_alerts,
      savings_goal_alerts,
      vacation_mode,
      vacation_mode_until,
    } = req.body;
    
    db.prepare(`
      UPDATE notification_settings SET
        daily_reminder = ?,
        daily_reminder_time = ?,
        credit_card_alerts = ?,
        budget_alerts = ?,
        loan_alerts = ?,
        subscription_alerts = ?,
        salary_alerts = ?,
        savings_goal_alerts = ?,
        vacation_mode = ?,
        vacation_mode_until = ?,
        updated_at = ?
      WHERE id = 1
    `).run(
      daily_reminder ? 1 : 0,
      daily_reminder_time,
      credit_card_alerts ? 1 : 0,
      budget_alerts ? 1 : 0,
      loan_alerts ? 1 : 0,
      subscription_alerts ? 1 : 0,
      salary_alerts ? 1 : 0,
      savings_goal_alerts ? 1 : 0,
      vacation_mode ? 1 : 0,
      vacation_mode_until,
      new Date().toISOString()
    );
    
    const updated = db.prepare('SELECT * FROM notification_settings WHERE id = 1').get();
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error al actualizar configuración de notificaciones:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Guardar token de push
router.post('/token', (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ success: false, error: 'Token requerido' });
    }
    
    db.prepare(`
      UPDATE notification_settings SET
        push_token = ?,
        updated_at = ?
      WHERE id = 1
    `).run(token, new Date().toISOString());
    
    res.json({ success: true, message: 'Token guardado correctamente' });
  } catch (error) {
    console.error('Error al guardar token:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener notificaciones pendientes (para mostrar en la app)
router.get('/pending', (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM notification_settings WHERE id = 1').get();
    
    if (!settings || settings.vacation_mode === 1) {
      return res.json({ success: true, data: [] });
    }
    
    const notifications = [];
    const today = new Date();
    
    // Verificar tarjetas de crédito
    if (settings.credit_card_alerts === 1) {
      const accounts = db.prepare(`
        SELECT * FROM accounts 
        WHERE type = 'credit' AND include_in_balance = 1
      `).all();
      
      accounts.forEach(account => {
        if (account.cut_off_day) {
          const daysUntilCutoff = getDaysUntilDay(account.cut_off_day);
          if (daysUntilCutoff === 3 || daysUntilCutoff === 0) {
            notifications.push({
              type: 'credit_cutoff',
              title: daysUntilCutoff === 3 ? 'Fecha de corte próxima' : 'Fecha de corte hoy',
              message: `Tu tarjeta ${account.name} ${daysUntilCutoff === 3 ? 'tiene fecha de corte en 3 días' : 'tiene fecha de corte hoy'}. Deuda actual: $${account.current_balance.toFixed(2)}`,
              data: { account_id: account.id },
            });
          }
        }
        
        if (account.payment_due_day) {
          const daysUntilPayment = getDaysUntilDay(account.payment_due_day);
          if (daysUntilPayment === 5 || daysUntilPayment === 3 || daysUntilPayment === 0) {
            notifications.push({
              type: 'credit_payment',
              title: daysUntilPayment === 0 ? 'Pago vence hoy' : `Pago vence en ${daysUntilPayment} días`,
              message: `${daysUntilPayment === 0 ? 'Hoy vence' : `Tu pago de ${account.name} vence en ${daysUntilPayment} días`}. Monto: $${account.current_balance.toFixed(2)}`,
              data: { account_id: account.id },
            });
          }
        }
      });
    }
    
    // Verificar presupuestos
    if (settings.budget_alerts === 1) {
      const budgets = db.prepare('SELECT * FROM budgets').all();
      
      budgets.forEach(budget => {
        const percentage = (budget.current_amount / budget.amount) * 100;
        
        if (percentage >= 100) {
          notifications.push({
            type: 'budget_exceeded',
            title: 'Presupuesto excedido',
            message: `Excediste tu presupuesto de ${budget.name} por $${(budget.current_amount - budget.amount).toFixed(2)}`,
            data: { budget_id: budget.id },
          });
        } else if (percentage >= 80) {
          notifications.push({
            type: 'budget_warning',
            title: 'Presupuesto al 80%',
            message: `Tu presupuesto de ${budget.name} va al ${percentage.toFixed(0)}%. Quedan $${(budget.amount - budget.current_amount).toFixed(2)} del límite`,
            data: { budget_id: budget.id },
          });
        }
      });
    }
    
    // Verificar préstamos
    if (settings.loan_alerts === 1) {
      const loans = db.prepare(`
        SELECT * FROM loans 
        WHERE status IN ('active', 'partial') AND due_date IS NOT NULL
      `).all();
      
      loans.forEach(loan => {
        const dueDate = new Date(loan.due_date);
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDue <= 7 && daysUntilDue >= 0) {
          notifications.push({
            type: 'loan_due',
            title: 'Préstamo por vencer',
            message: `El préstamo a ${loan.person_name} vence en ${daysUntilDue} días. Monto pendiente: $${loan.remaining_amount.toFixed(2)}`,
            data: { loan_id: loan.id },
          });
        }
      });
    }
    
    // Verificar suscripciones
    if (settings.subscription_alerts === 1) {
      const subscriptions = db.prepare(`
        SELECT * FROM recurring_payments 
        WHERE is_active = 1
      `).all();
      
      subscriptions.forEach(sub => {
        const nextDate = new Date(sub.next_date);
        const daysUntilNext = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntilNext === 1 || daysUntilNext === 0) {
          notifications.push({
            type: 'subscription_due',
            title: daysUntilNext === 1 ? 'Suscripción mañana' : 'Suscripción hoy',
            message: `Tu suscripción de ${sub.name} se cobra ${daysUntilNext === 1 ? 'mañana' : 'hoy'}: $${sub.amount.toFixed(2)}`,
            data: { subscription_id: sub.id },
          });
        }
      });
    }
    
    // Verificar objetivos de ahorro
    if (settings.savings_goal_alerts === 1) {
      const goals = db.prepare(`
        SELECT * FROM savings_goals 
        WHERE status = 'active' AND deadline IS NOT NULL
      `).all();
      
      goals.forEach(goal => {
        const deadline = new Date(goal.deadline);
        const daysRemaining = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
        const remaining = goal.target_amount - goal.current_amount;
        
        if (daysRemaining > 0 && remaining > 0) {
          const dailyRequired = remaining / daysRemaining;
          const monthlyRequired = dailyRequired * 30;
          
          // Si necesita ahorrar más del 50% de lo que falta en el próximo mes
          if (monthlyRequired > remaining * 0.5) {
            notifications.push({
              type: 'savings_goal_behind',
              title: 'Objetivo de ahorro atrasado',
              message: `Para cumplir tu meta ${goal.name} a tiempo, necesitas ahorrar $${monthlyRequired.toFixed(2)} este mes`,
              data: { goal_id: goal.id },
            });
          }
        }
      });
    }
    
    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Error al obtener notificaciones pendientes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Función auxiliar para calcular días hasta un día del mes
function getDaysUntilDay(targetDay) {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  let targetDate = new Date(currentYear, currentMonth, targetDay);
  
  // Si el día ya pasó este mes, usar el próximo mes
  if (targetDay < currentDay) {
    targetDate = new Date(currentYear, currentMonth + 1, targetDay);
  }
  
  const diffTime = targetDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

module.exports = router;
