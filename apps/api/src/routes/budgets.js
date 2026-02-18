const express = require('express');
const router = express.Router();
const { db } = require('../database/db-json');

// Obtener todos los presupuestos
router.get('/', (req, res) => {
  try {
    const budgets = db.prepare('SELECT * FROM budgets ORDER BY created_at DESC').all();
    res.json({ success: true, data: budgets });
  } catch (error) {
    console.error('Error al obtener presupuestos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener un presupuesto por ID
router.get('/:id', (req, res) => {
  try {
    const budget = db.prepare('SELECT * FROM budgets WHERE id = ?').get(req.params.id);
    
    if (!budget) {
      return res.status(404).json({ success: false, error: 'Presupuesto no encontrado' });
    }
    
    res.json({ success: true, data: budget });
  } catch (error) {
    console.error('Error al obtener presupuesto:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Crear un nuevo presupuesto
router.post('/', (req, res) => {
  try {
    const {
      name,
      type,
      amount,
      period,
      start_date,
      icon,
      color
    } = req.body;

    // Validaciones básicas
    if (!name || !type || !amount || !period) {
      return res.status(400).json({ 
        success: false, 
        error: 'El nombre, tipo, monto y periodo son requeridos' 
      });
    }

    if (!['saving', 'expense'].includes(type)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Tipo de presupuesto inválido' 
      });
    }

    if (!['weekly', 'monthly'].includes(period)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Periodo inválido' 
      });
    }

    const stmt = db.prepare(`
      INSERT INTO budgets (
        name, type, amount, period, start_date, icon, color, current_amount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      name,
      type,
      amount,
      period,
      start_date || new Date().toISOString(),
      icon || (type === 'saving' ? 'arrow.up.circle.fill' : 'arrow.down.circle.fill'),
      color || (type === 'saving' ? '#20df60' : '#ef4444'),
      0
    );

    const newBudget = db.prepare('SELECT * FROM budgets WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ 
      success: true, 
      data: newBudget,
      message: 'Presupuesto creado exitosamente' 
    });
  } catch (error) {
    console.error('Error al crear presupuesto:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Actualizar un presupuesto
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const existingBudget = db.prepare('SELECT * FROM budgets WHERE id = ?').get(id);
    if (!existingBudget) {
      return res.status(404).json({ success: false, error: 'Presupuesto no encontrado' });
    }

    const allowedFields = [
      'name', 'type', 'amount', 'period', 'start_date', 'icon', 'color', 'current_amount'
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

    const sql = `UPDATE budgets SET ${updateFields.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...values);

    const updatedBudget = db.prepare('SELECT * FROM budgets WHERE id = ?').get(id);

    res.json({ 
      success: true, 
      data: updatedBudget,
      message: 'Presupuesto actualizado exitosamente' 
    });
  } catch (error) {
    console.error('Error al actualizar presupuesto:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Eliminar un presupuesto
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const existingBudget = db.prepare('SELECT * FROM budgets WHERE id = ?').get(id);
    if (!existingBudget) {
      return res.status(404).json({ success: false, error: 'Presupuesto no encontrado' });
    }

    db.prepare('DELETE FROM budgets WHERE id = ?').run(id);

    res.json({ 
      success: true, 
      message: 'Presupuesto eliminado exitosamente' 
    });
  } catch (error) {
    console.error('Error al eliminar presupuesto:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtener estadísticas de presupuestos
router.get('/stats/summary', (req, res) => {
  try {
    const result = db.prepare(`
      SELECT 
        SUM(CASE WHEN type = 'saving' THEN amount ELSE 0 END) as total_savings_goal,
        SUM(CASE WHEN type = 'saving' THEN current_amount ELSE 0 END) as total_savings_current,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense_limit,
        SUM(CASE WHEN type = 'expense' THEN current_amount ELSE 0 END) as total_expense_current,
        COUNT(*) as total_budgets
      FROM budgets
    `).get();

    res.json({ 
      success: true, 
      data: {
        total_savings_goal: result.total_savings_goal || 0,
        total_savings_current: result.total_savings_current || 0,
        total_expense_limit: result.total_expense_limit || 0,
        total_expense_current: result.total_expense_current || 0,
        total_budgets: result.total_budgets || 0
      }
    });
  } catch (error) {
    console.error('Error al calcular estadísticas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
