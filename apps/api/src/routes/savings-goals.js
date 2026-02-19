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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Guardar en la base de datos
    const dbData = require('../database/db-json').readDB();
    if (!dbData.savings_goals) {
      dbData.savings_goals = [];
    }
    dbData.savings_goals.push(newGoal);
    require('../database/db-json').writeDB(dbData);

    res.status(201).json({ 
      success: true, 
      data: newGoal,
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
    const updates = req.body;

    const dbData = require('../database/db-json').readDB();
    const goalIndex = dbData.savings_goals.findIndex(g => g.id === parseInt(id));
    
    if (goalIndex === -1) {
      return res.status(404).json({ success: false, error: 'Objetivo no encontrado' });
    }

    const allowedFields = [
      'name', 'target_amount', 'current_amount', 'deadline', 'icon', 'color',
      'account_id', 'auto_deduct', 'auto_deduct_amount', 'auto_deduct_period', 'status'
    ];

    // Aplicar actualizaciones
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        dbData.savings_goals[goalIndex][key] = updates[key];
      }
    });

    dbData.savings_goals[goalIndex].updated_at = new Date().toISOString();

    // Verificar si se completó el objetivo
    if (dbData.savings_goals[goalIndex].current_amount >= dbData.savings_goals[goalIndex].target_amount) {
      dbData.savings_goals[goalIndex].status = 'completed';
    }

    require('../database/db-json').writeDB(dbData);

    res.json({ 
      success: true, 
      data: dbData.savings_goals[goalIndex],
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

    const dbData = require('../database/db-json').readDB();
    const goalIndex = dbData.savings_goals.findIndex(g => g.id === parseInt(id));
    
    if (goalIndex === -1) {
      return res.status(404).json({ success: false, error: 'Objetivo no encontrado' });
    }

    // Eliminar también las contribuciones asociadas
    dbData.goal_contributions = dbData.goal_contributions.filter(c => c.goal_id !== parseInt(id));
    
    // Eliminar el objetivo
    dbData.savings_goals.splice(goalIndex, 1);
    
    require('../database/db-json').writeDB(dbData);

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
    const { amount, notes } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'El monto debe ser mayor a 0' 
      });
    }

    const dbData = require('../database/db-json').readDB();
    const goalIndex = dbData.savings_goals.findIndex(g => g.id === parseInt(id));
    
    if (goalIndex === -1) {
      return res.status(404).json({ success: false, error: 'Objetivo no encontrado' });
    }

    // Crear contribución
    const contributions = dbData.goal_contributions || [];
    const newContributionId = contributions.length > 0 ? Math.max(...contributions.map(c => c.id)) + 1 : 1;

    const newContribution = {
      id: newContributionId,
      goal_id: parseInt(id),
      amount,
      date: new Date().toISOString(),
      notes: notes || null,
      created_at: new Date().toISOString(),
    };

    if (!dbData.goal_contributions) {
      dbData.goal_contributions = [];
    }
    dbData.goal_contributions.push(newContribution);

    // Actualizar current_amount del objetivo
    dbData.savings_goals[goalIndex].current_amount += amount;
    dbData.savings_goals[goalIndex].updated_at = new Date().toISOString();

    // Verificar si se completó el objetivo
    if (dbData.savings_goals[goalIndex].current_amount >= dbData.savings_goals[goalIndex].target_amount) {
      dbData.savings_goals[goalIndex].status = 'completed';
    }

    require('../database/db-json').writeDB(dbData);

    res.status(201).json({ 
      success: true, 
      data: {
        contribution: newContribution,
        goal: dbData.savings_goals[goalIndex]
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

    const dbData = require('../database/db-json').readDB();
    const goal = dbData.savings_goals.find(g => g.id === parseInt(id));
    
    if (!goal) {
      return res.status(404).json({ success: false, error: 'Objetivo no encontrado' });
    }

    const contributions = (dbData.goal_contributions || [])
      .filter(c => c.goal_id === parseInt(id))
      .sort((a, b) => new Date(b.date) - new Date(a.date));

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
