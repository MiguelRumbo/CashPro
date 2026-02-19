const express = require('express');
const router = express.Router();
const { db } = require('../database/db-json');

// Obtener todos los objetivos de ahorro
router.get('/', (req, res) => {
  try {
    const goals = db.prepare('SELECT * FROM savings_goals ORDER BY created_at DESC').all();
    res.json({ success: true, data: goals });
  } catch (error) {
    console.error('Error al obtener objetivos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener un objetivo por ID
router.get('/:id', (req, res) => {
  try {
    const goal = db.prepare('SELECT * FROM savings_goals WHERE id = ?').get(req.params.id);
    
    if (!goal) {
      return res.status(404).json({ success: false, error: 'Objetivo no encontrado' });
    }
    
    res.json({ success: true, data: goal });
  } catch (error) {
    console.error('Error al obtener objetivo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Crear un nuevo objetivo
router.post('/', (req, res) => {
  try {
    const {
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
      status
    } = req.body;

    // Validaciones
    if (!name || !target_amount) {
      return res.status(400).json({ 
        success: false, 
        error: 'El nombre y monto objetivo son requeridos' 
      });
    }

    if (target_amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'El monto objetivo debe ser mayor a 0' 
      });
    }

    // Si tiene auto_deduct, validar campos relacionados
    if (auto_deduct) {
      if (!auto_deduct_amount || auto_deduct_amount <= 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'El monto de descuento automático debe ser mayor a 0' 
        });
      }
      if (!['weekly', 'biweekly', 'monthly'].includes(auto_deduct_period)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Periodo de descuento inválido' 
        });
      }
    }

    const data = require('../database/db-json').db.prepare('SELECT * FROM savings_goals').all();
    const newId = data.length > 0 ? Math.max(...data.map(g => g.id)) + 1 : 1;

    const newGoal = {
      id: newId,
      name,
      target_amount,
      current_amount: current_amount || 0,
      deadline: deadline || null,
      icon: icon || 'target',
      color: color || '#20df60',
      account_id: account_id || null,
      auto_deduct: auto_deduct || false,
      auto_deduct_amount: auto_deduct_amount || 0,
      auto_deduct_period: auto_deduct_period || null,
      status: status || 'active',
    };

    const now = new Date().toISOString();

    const result = db.prepare(`
      INSERT INTO savings_goals (
        name, target_amount, current_amount, deadline, icon, color,
        account_id, auto_deduct, auto_deduct_amount, auto_deduct_period,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newGoal.name,
      newGoal.target_amount,
      newGoal.current_amount,
      newGoal.deadline,
      newGoal.icon,
      newGoal.color,
      newGoal.account_id,
      newGoal.auto_deduct ? 1 : 0,
      newGoal.auto_deduct_amount,
      newGoal.auto_deduct_period,
      newGoal.status,
      now,
      now
    );

    const createdGoal = db.prepare('SELECT * FROM savings_goals WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ 
      success: true, 
      data: createdGoal,
      message: 'Objetivo creado exitosamente' 
    });
  } catch (error) {
    console.error('Error al crear objetivo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Actualizar un objetivo
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const goal = db.prepare('SELECT * FROM savings_goals WHERE id = ?').get(id);
    
    if (!goal) {
      return res.status(404).json({ success: false, error: 'Objetivo no encontrado' });
    }

    const {
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
      status
    } = req.body;

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE savings_goals 
      SET name = ?, target_amount = ?, current_amount = ?, deadline = ?, 
          icon = ?, color = ?, account_id = ?, auto_deduct = ?, 
          auto_deduct_amount = ?, auto_deduct_period = ?, status = ?, updated_at = ?
      WHERE id = ?
    `).run(
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
      now,
      id
    );

    const updatedGoal = db.prepare('SELECT * FROM savings_goals WHERE id = ?').get(id);

    // Verificar si se completó el objetivo
    if (updatedGoal.current_amount >= updatedGoal.target_amount && updatedGoal.status !== 'completed') {
      db.prepare('UPDATE savings_goals SET status = ? WHERE id = ?').run('completed', id);
      updatedGoal.status = 'completed';
    }

    res.json({ 
      success: true, 
      data: updatedGoal,
      message: 'Objetivo actualizado exitosamente' 
    });
  } catch (error) {
    console.error('Error al actualizar objetivo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Eliminar un objetivo
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const goal = db.prepare('SELECT * FROM savings_goals WHERE id = ?').get(id);
    
    if (!goal) {
      return res.status(404).json({ success: false, error: 'Objetivo no encontrado' });
    }

    // Eliminar contribuciones asociadas
    db.prepare('DELETE FROM goal_contributions WHERE goal_id = ?').run(id);
    
    // Eliminar el objetivo
    db.prepare('DELETE FROM savings_goals WHERE id = ?').run(id);

    res.json({ 
      success: true, 
      message: 'Objetivo eliminado exitosamente' 
    });
  } catch (error) {
    console.error('Error al eliminar objetivo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Agregar contribución a un objetivo
router.post('/:id/contribute', (req, res) => {
  try {
    const { id } = req.params;
    const { amount, account_id, notes } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'El monto debe ser mayor a 0' 
      });
    }

    if (!account_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'La cuenta es requerida' 
      });
    }

    const goal = db.prepare('SELECT * FROM savings_goals WHERE id = ?').get(id);
    
    if (!goal) {
      return res.status(404).json({ success: false, error: 'Objetivo no encontrado' });
    }

    // Verificar que la cuenta existe
    const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(account_id);
    if (!account) {
      return res.status(404).json({ success: false, error: 'Cuenta no encontrada' });
    }

    // Verificar que la cuenta tenga saldo suficiente
    if (account.type !== 'credit' && account.balance < amount) {
      return res.status(400).json({ 
        success: false, 
        error: 'Saldo insuficiente en la cuenta' 
      });
    }

    const now = new Date().toISOString();

    // Crear contribución
    const result = db.prepare(`
      INSERT INTO goal_contributions (goal_id, amount, date, notes, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, amount, now, notes || null, now);

    // Actualizar current_amount del objetivo
    const newCurrentAmount = goal.current_amount + amount;
    let newStatus = goal.status;

    // Verificar si se completó el objetivo
    if (newCurrentAmount >= goal.target_amount && goal.status !== 'completed') {
      newStatus = 'completed';
    }

    db.prepare(`
      UPDATE savings_goals 
      SET current_amount = ?, status = ?, updated_at = ?
      WHERE id = ?
    `).run(newCurrentAmount, newStatus, now, id);

    // Crear movimiento de gasto para registrar la contribución
    db.prepare(`
      INSERT INTO movements (
        type, amount, title, category_id, category_name, category_icon, category_color,
        account_id, to_account_id, date, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'expense',
      amount,
      `Contribución a ${goal.name}`,
      null,
      'Ahorro',
      'target',
      '#10b981',
      account_id,
      null,
      now,
      notes || `Contribución al objetivo: ${goal.name}`
    );

    // Actualizar balance de la cuenta
    if (account.type === 'credit') {
      // Para crédito, incrementar current_balance (deuda)
      db.prepare('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?')
        .run(amount, account_id);
    } else {
      // Para otras cuentas, decrementar balance
      db.prepare('UPDATE accounts SET balance = balance - ? WHERE id = ?')
        .run(amount, account_id);
    }

    const contribution = db.prepare('SELECT * FROM goal_contributions WHERE id = ?').get(result.lastInsertRowid);
    const updatedGoal = db.prepare('SELECT * FROM savings_goals WHERE id = ?').get(id);

    res.status(201).json({ 
      success: true, 
      data: {
        contribution,
        goal: updatedGoal
      },
      message: 'Contribución agregada exitosamente' 
    });
  } catch (error) {
    console.error('Error al agregar contribución:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener contribuciones de un objetivo
router.get('/:id/contributions', (req, res) => {
  try {
    const { id } = req.params;
    const goal = db.prepare('SELECT * FROM savings_goals WHERE id = ?').get(id);
    
    if (!goal) {
      return res.status(404).json({ success: false, error: 'Objetivo no encontrado' });
    }

    const contributions = db.prepare(
      'SELECT * FROM goal_contributions WHERE goal_id = ? ORDER BY date DESC, created_at DESC'
    ).all(id);

    res.json({ 
      success: true, 
      data: contributions 
    });
  } catch (error) {
    console.error('Error al obtener contribuciones:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener estadísticas de objetivos
router.get('/stats/summary', (req, res) => {
  try {
    const goals = db.prepare('SELECT * FROM savings_goals').all();

    const activeGoals = goals.filter(g => g.status === 'active');
    const completedGoals = goals.filter(g => g.status === 'completed');

    const totalTarget = activeGoals.reduce((sum, g) => sum + g.target_amount, 0);
    const totalSaved = activeGoals.reduce((sum, g) => sum + g.current_amount, 0);
    const totalRemaining = totalTarget - totalSaved;

    res.json({ 
      success: true, 
      data: {
        total_goals: goals.length,
        active_goals: activeGoals.length,
        completed_goals: completedGoals.length,
        total_target: totalTarget,
        total_saved: totalSaved,
        total_remaining: Math.max(0, totalRemaining),
        completion_percentage: totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0
      }
    });
  } catch (error) {
    console.error('Error al calcular estadísticas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
