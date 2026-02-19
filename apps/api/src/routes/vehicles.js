const express = require('express');
const router = express.Router();
const { db } = require('../database/db-json');

// GET /api/vehicles - Listar vehículos
router.get('/', (req, res) => {
  try {
    const vehicles = db.prepare('SELECT * FROM vehicles').all();
    res.json({ success: true, data: vehicles });
  } catch (error) {
    console.error('Error al obtener vehículos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/vehicles/:id - Obtener vehículo específico
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);
    
    if (!vehicle) {
      return res.status(404).json({ success: false, error: 'Vehículo no encontrado' });
    }
    
    res.json({ success: true, data: vehicle });
  } catch (error) {
    console.error('Error al obtener vehículo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/vehicles - Crear vehículo
router.post('/', (req, res) => {
  try {
    const { name, brand, model, year, license_plate, odometer, fuel_type, tank_capacity } = req.body;
    
    if (!name || !brand || !model || !year || !odometer || !fuel_type) {
      return res.status(400).json({ 
        success: false, 
        error: 'Faltan campos requeridos' 
      });
    }
    
    const result = db.prepare(`
      INSERT INTO vehicles (name, brand, model, year, license_plate, odometer, fuel_type, tank_capacity, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name,
      brand,
      model,
      parseInt(year),
      license_plate || null,
      parseFloat(odometer),
      fuel_type,
      tank_capacity ? parseFloat(tank_capacity) : null,
      new Date().toISOString()
    );
    
    const newVehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(result.lastInsertRowid);
    res.json({ success: true, data: newVehicle });
  } catch (error) {
    console.error('Error al crear vehículo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/vehicles/:id - Actualizar vehículo
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, brand, model, year, license_plate, odometer, fuel_type, tank_capacity } = req.body;
    
    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);
    if (!vehicle) {
      return res.status(404).json({ success: false, error: 'Vehículo no encontrado' });
    }
    
    db.prepare(`
      UPDATE vehicles 
      SET name = ?, brand = ?, model = ?, year = ?, license_plate = ?, 
          odometer = ?, fuel_type = ?, tank_capacity = ?
      WHERE id = ?
    `).run(
      name || vehicle.name,
      brand || vehicle.brand,
      model || vehicle.model,
      year ? parseInt(year) : vehicle.year,
      license_plate !== undefined ? license_plate : vehicle.license_plate,
      odometer ? parseFloat(odometer) : vehicle.odometer,
      fuel_type || vehicle.fuel_type,
      tank_capacity !== undefined ? (tank_capacity ? parseFloat(tank_capacity) : null) : vehicle.tank_capacity,
      id
    );
    
    const updated = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error al actualizar vehículo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/vehicles/:id - Eliminar vehículo
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);
    if (!vehicle) {
      return res.status(404).json({ success: false, error: 'Vehículo no encontrado' });
    }
    
    // Eliminar cargas de gasolina asociadas
    db.prepare('DELETE FROM fuel_loads WHERE vehicle_id = ?').run(id);
    
    // Eliminar mantenimientos asociados
    db.prepare('DELETE FROM maintenance WHERE vehicle_id = ?').run(id);
    
    // Eliminar vehículo
    db.prepare('DELETE FROM vehicles WHERE id = ?').run(id);
    
    res.json({ success: true, message: 'Vehículo eliminado' });
  } catch (error) {
    console.error('Error al eliminar vehículo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/vehicles/:id/fuel-loads - Listar cargas de gasolina
router.get('/:id/fuel-loads', (req, res) => {
  try {
    const { id } = req.params;
    const loads = db.prepare('SELECT * FROM fuel_loads WHERE vehicle_id = ? ORDER BY date DESC').all(id);
    res.json({ success: true, data: loads });
  } catch (error) {
    console.error('Error al obtener cargas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/vehicles/:id/fuel-loads - Registrar carga de gasolina
router.post('/:id/fuel-loads', (req, res) => {
  try {
    const { id } = req.params;
    const { liters, price_per_liter, total_cost, odometer, station_name, is_full_tank, date, account_id, notes } = req.body;
    
    if (!liters || !price_per_liter || !total_cost || !odometer || !account_id) {
      return res.status(400).json({ success: false, error: 'Faltan campos requeridos' });
    }
    
    // Verificar que el vehículo existe
    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);
    if (!vehicle) {
      return res.status(404).json({ success: false, error: 'Vehículo no encontrado' });
    }
    
    // Verificar que la cuenta existe
    const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(account_id);
    if (!account) {
      return res.status(404).json({ success: false, error: 'Cuenta no encontrada' });
    }
    
    // Crear carga de gasolina
    const result = db.prepare(`
      INSERT INTO fuel_loads (vehicle_id, liters, price_per_liter, total_cost, odometer, station_name, is_full_tank, date, account_id, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      parseFloat(liters),
      parseFloat(price_per_liter),
      parseFloat(total_cost),
      parseFloat(odometer),
      station_name || null,
      is_full_tank ? 1 : 0,
      date || new Date().toISOString(),
      parseInt(account_id),
      notes || null,
      new Date().toISOString()
    );
    
    // Actualizar kilometraje del vehículo
    db.prepare('UPDATE vehicles SET odometer = ? WHERE id = ?').run(parseFloat(odometer), id);
    
    // Crear movimiento de gasto
    db.prepare(`
      INSERT INTO movements (type, title, amount, date, category, category_icon, category_color, account_id, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'expense',
      `Gasolina - ${vehicle.name}`,
      parseFloat(total_cost),
      date || new Date().toISOString(),
      'Transporte',
      'car',
      '#3b82f6',
      parseInt(account_id),
      `${liters}L @ $${price_per_liter}/L${station_name ? ` - ${station_name}` : ''}${notes ? ` - ${notes}` : ''}`,
      new Date().toISOString()
    );
    
    // Actualizar balance de la cuenta
    if (account.type === 'credit') {
      db.prepare('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?')
        .run(parseFloat(total_cost), parseInt(account_id));
    } else {
      db.prepare('UPDATE accounts SET balance = balance - ? WHERE id = ?')
        .run(parseFloat(total_cost), parseInt(account_id));
    }
    
    const newLoad = db.prepare('SELECT * FROM fuel_loads WHERE id = ?').get(result.lastInsertRowid);
    res.json({ success: true, data: newLoad });
  } catch (error) {
    console.error('Error al registrar carga:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/vehicles/:id/maintenance - Listar mantenimientos
router.get('/:id/maintenance', (req, res) => {
  try {
    const { id } = req.params;
    const maintenance = db.prepare('SELECT * FROM maintenance WHERE vehicle_id = ? ORDER BY date DESC').all(id);
    res.json({ success: true, data: maintenance });
  } catch (error) {
    console.error('Error al obtener mantenimientos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/vehicles/:id/maintenance - Registrar mantenimiento
router.post('/:id/maintenance', (req, res) => {
  try {
    const { id } = req.params;
    const { type, description, cost, odometer, workshop_name, date, next_date, next_odometer, account_id, notes } = req.body;
    
    if (!type || !description || !cost || !odometer || !account_id) {
      return res.status(400).json({ success: false, error: 'Faltan campos requeridos' });
    }
    
    // Verificar que el vehículo existe
    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);
    if (!vehicle) {
      return res.status(404).json({ success: false, error: 'Vehículo no encontrado' });
    }
    
    // Verificar que la cuenta existe
    const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(account_id);
    if (!account) {
      return res.status(404).json({ success: false, error: 'Cuenta no encontrada' });
    }
    
    // Crear mantenimiento
    const result = db.prepare(`
      INSERT INTO maintenance (vehicle_id, type, description, cost, odometer, workshop_name, date, next_date, next_odometer, account_id, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      type,
      description,
      parseFloat(cost),
      parseFloat(odometer),
      workshop_name || null,
      date || new Date().toISOString(),
      next_date || null,
      next_odometer ? parseFloat(next_odometer) : null,
      parseInt(account_id),
      notes || null,
      new Date().toISOString()
    );
    
    // Actualizar kilometraje del vehículo
    db.prepare('UPDATE vehicles SET odometer = ? WHERE id = ?').run(parseFloat(odometer), id);
    
    // Crear movimiento de gasto
    const typeLabels = {
      oil_change: 'Cambio de Aceite',
      tires: 'Llantas',
      brakes: 'Frenos',
      service: 'Servicio',
      repair: 'Reparación',
      other: 'Mantenimiento'
    };
    
    db.prepare(`
      INSERT INTO movements (type, title, amount, date, category, category_icon, category_color, account_id, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'expense',
      `${typeLabels[type] || 'Mantenimiento'} - ${vehicle.name}`,
      parseFloat(cost),
      date || new Date().toISOString(),
      'Transporte',
      'wrench',
      '#f59e0b',
      parseInt(account_id),
      `${description}${workshop_name ? ` - ${workshop_name}` : ''}${notes ? ` - ${notes}` : ''}`,
      new Date().toISOString()
    );
    
    // Actualizar balance de la cuenta
    if (account.type === 'credit') {
      db.prepare('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?')
        .run(parseFloat(cost), parseInt(account_id));
    } else {
      db.prepare('UPDATE accounts SET balance = balance - ? WHERE id = ?')
        .run(parseFloat(cost), parseInt(account_id));
    }
    
    const newMaintenance = db.prepare('SELECT * FROM maintenance WHERE id = ?').get(result.lastInsertRowid);
    res.json({ success: true, data: newMaintenance });
  } catch (error) {
    console.error('Error al registrar mantenimiento:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/vehicles/:id/stats - Estadísticas del vehículo
router.get('/:id/stats', (req, res) => {
  try {
    const { id } = req.params;
    
    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);
    if (!vehicle) {
      return res.status(404).json({ success: false, error: 'Vehículo no encontrado' });
    }
    
    const fuelLoads = db.prepare('SELECT * FROM fuel_loads WHERE vehicle_id = ? ORDER BY date ASC').all(id);
    const maintenance = db.prepare('SELECT * FROM maintenance WHERE vehicle_id = ?').all(id);
    
    // Calcular rendimiento (km/L)
    let avgEfficiency = 0;
    if (fuelLoads.length >= 2) {
      const efficiencies = [];
      for (let i = 1; i < fuelLoads.length; i++) {
        const prevLoad = fuelLoads[i - 1];
        const currLoad = fuelLoads[i];
        const kmTraveled = currLoad.odometer - prevLoad.odometer;
        const litersUsed = prevLoad.liters;
        if (kmTraveled > 0 && litersUsed > 0) {
          efficiencies.push(kmTraveled / litersUsed);
        }
      }
      if (efficiencies.length > 0) {
        avgEfficiency = efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length;
      }
    }
    
    // Gastos totales
    const totalFuelCost = fuelLoads.reduce((sum, load) => sum + load.total_cost, 0);
    const totalMaintenanceCost = maintenance.reduce((sum, m) => sum + m.cost, 0);
    const totalCost = totalFuelCost + totalMaintenanceCost;
    
    // Gastos del mes actual
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthFuelCost = fuelLoads
      .filter(load => new Date(load.date) >= firstDayOfMonth)
      .reduce((sum, load) => sum + load.total_cost, 0);
    const monthMaintenanceCost = maintenance
      .filter(m => new Date(m.date) >= firstDayOfMonth)
      .reduce((sum, m) => sum + m.cost, 0);
    const monthTotalCost = monthFuelCost + monthMaintenanceCost;
    
    // Último mantenimiento
    const lastMaintenance = maintenance.length > 0 
      ? maintenance.sort((a, b) => new Date(b.date) - new Date(a.date))[0]
      : null;
    
    // Próximo mantenimiento
    const upcomingMaintenance = maintenance
      .filter(m => m.next_date || m.next_odometer)
      .sort((a, b) => {
        if (a.next_date && b.next_date) {
          return new Date(a.next_date) - new Date(b.next_date);
        }
        if (a.next_odometer && b.next_odometer) {
          return a.next_odometer - b.next_odometer;
        }
        return 0;
      })[0] || null;
    
    res.json({
      success: true,
      data: {
        avg_efficiency: avgEfficiency,
        total_fuel_cost: totalFuelCost,
        total_maintenance_cost: totalMaintenanceCost,
        total_cost: totalCost,
        month_fuel_cost: monthFuelCost,
        month_maintenance_cost: monthMaintenanceCost,
        month_total_cost: monthTotalCost,
        fuel_loads_count: fuelLoads.length,
        maintenance_count: maintenance.length,
        last_maintenance: lastMaintenance,
        upcoming_maintenance: upcomingMaintenance,
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
