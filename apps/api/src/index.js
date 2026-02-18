const express = require('express');
const cors = require('cors');
// Usar base de datos JSON temporal (cambiar a db.js cuando better-sqlite3 esté compilado)
const { initDatabase } = require('./database/db-json');
const accountsRouter = require('./routes/accounts');
const movementsRouter = require('./routes/movements');

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
