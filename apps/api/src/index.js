const express = require('express');
const cors = require('cors');
// Usar base de datos JSON temporal (cambiar a db.js cuando better-sqlite3 esté compilado)
const { initDatabase } = require('./database/db-json');
const accountsRouter = require('./routes/accounts');
const movementsRouter = require('./routes/movements');
const budgetsRouter = require('./routes/budgets');
const profileRouter = require('./routes/profile');
const savingsGoalsRouter = require('./routes/savings-goals');
const loansRouter = require('./routes/loans');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Inicializar base de datos
initDatabase();

// Rutas
app.get('/', (req, res) => {
  res.json({ 
    message: 'CashPro API',
    version: '1.0.0',
    status: 'running'
  });
});

app.use('/api/accounts', accountsRouter);
app.use('/api/movements', movementsRouter);
app.use('/api/budgets', budgetsRouter);
app.use('/api/profile', profileRouter);
app.use('/api/savings-goals', savingsGoalsRouter);
app.use('/api/loans', loansRouter);

// Endpoint para resetear todos los datos
app.post('/api/reset', (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const DB_FILE = path.join(__dirname, '../data.json');
    
    // Estructura inicial limpia
    const initialData = {
      accounts: [],
      nextAccountId: 1,
      movements: [],
      nextMovementId: 1,
      categories: [],
      nextCategoryId: 1,
      budgets: [],
      nextBudgetId: 1,
      user_profile: [{
        id: 1,
        name: 'Usuario',
        email: '',
        currency: 'MXN',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }],
      nextProfileId: 2,
      savings_goals: [],
      nextSavingsGoalId: 1,
      goal_contributions: [],
      nextGoalContributionId: 1,
      loans: [],
      nextLoanId: 1,
      loan_payments: [],
      nextLoanPaymentId: 1,
    };
    
    // Escribir datos limpios
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    
    console.log('✅ Base de datos reseteada correctamente');
    
    res.json({ 
      success: true, 
      message: 'Todos los datos han sido eliminados correctamente' 
    });
  } catch (error) {
    console.error('❌ Error al resetear la base de datos:', error);
    res.status(500).json({ 
      success: false, 
      error: 'No se pudieron eliminar los datos' 
    });
  }
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    error: 'Algo salió mal en el servidor' 
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 API disponible en http://localhost:${PORT}/api`);
});
