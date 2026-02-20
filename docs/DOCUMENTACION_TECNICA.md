# CashPro - Documentación Técnica

## Información General

- **Nombre:** CashPro
- **Versión:** 1.1.0
- **Descripción:** Aplicación móvil standalone de gestión financiera personal
- **Arquitectura:** Aplicación móvil autónoma con base de datos SQLite local

---

## Tabla de Contenidos

1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Tecnologías Utilizadas](#tecnologías-utilizadas)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Base de Datos Local](#base-de-datos-local)
5. [Aplicación Móvil](#aplicación-móvil)
6. [Servicio de Base de Datos](#servicio-de-base-de-datos)
7. [Configuración y Despliegue](#configuración-y-despliegue)
8. [Funcionalidades Principales](#funcionalidades-principales)

---

## Arquitectura del Sistema

CashPro es una aplicación **standalone** que funciona completamente offline. Todos los datos se almacenan localmente en el dispositivo usando SQLite.

```
┌─────────────────────────────────────┐
│     Aplicación Móvil (Standalone)   │
│   React Native + Expo Router        │
│   iOS / Android                     │
└──────────────┬──────────────────────┘
               │ Lectura/Escritura directa
┌──────────────▼──────────────────────┐
│      Base de Datos SQLite Local     │
│      cashpro.db (en dispositivo)    │
│      expo-sqlite (síncrono)         │
└─────────────────────────────────────┘
```

### Características Arquitectónicas

- **Standalone:** No requiere servidor externo ni conexión a internet
- **SQLite Local:** Base de datos integrada en el dispositivo mediante `expo-sqlite`
- **Operaciones Síncronas:** Usa `openDatabaseSync` para acceso inmediato a datos
- **Gestión de Estado:** Context API de React para estado global (moneda)
- **Navegación:** Expo Router con navegación basada en archivos
- **Exportación/Importación:** Soporte para JSON, CSV y archivos SQLite (.db)

---

## Tecnologías Utilizadas

### Aplicación Móvil

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | 19.1.0 | Librería UI |
| React Native | 0.81.5 | Framework móvil |
| Expo | ~54.0.33 | Plataforma de desarrollo |
| Expo Router | ~6.0.23 | Sistema de navegación |
| expo-sqlite | ~16.0.10 | Base de datos SQLite local |
| expo-file-system | ~19.0.21 | Acceso al sistema de archivos |
| expo-sharing | ~14.0.8 | Compartir archivos exportados |
| expo-document-picker | ~14.0.8 | Seleccionar archivos para importar |
| TypeScript | ~5.9.2 | Tipado estático |
| React Navigation | 7.x | Navegación nativa |
| React Native Reanimated | ~4.1.1 | Animaciones |

### Build y Distribución

| Tecnología | Propósito |
|------------|-----------|
| EAS Build | Compilación en la nube para generar APK/AAB |
| EAS CLI | ≥ 15.0.0 |

### Gestión de Paquetes

- **pnpm** 10.30.0: Gestor de paquetes eficiente para monorepo

---

## Estructura del Proyecto

```
cash_pro/
├── apps/
│   └── mobile/                 # Aplicación móvil (standalone)
│       ├── app/                # Rutas de la aplicación (Expo Router)
│       │   ├── (tabs)/         # Navegación principal con tabs
│       │   │   ├── index.tsx   # Dashboard
│       │   │   ├── accounts.tsx # Lista de cuentas
│       │   │   ├── movements.tsx # Historial de movimientos
│       │   │   ├── explore.tsx  # Estadísticas y análisis
│       │   │   ├── more.tsx     # Más opciones
│       │   │   ├── settings.tsx # Configuración
│       │   │   └── _layout.tsx  # Layout de tabs
│       │   ├── accounts/       # Gestión de cuentas
│       │   ├── budgets/        # Presupuestos
│       │   ├── loans/          # Préstamos
│       │   ├── movements/      # Transacciones
│       │   ├── savings-goals/  # Metas de ahorro
│       │   ├── settings/       # Pantallas de configuración
│       │   ├── subscriptions/  # Suscripciones
│       │   ├── vehicles/       # Vehículos
│       │   └── _layout.tsx     # Layout raíz
│       ├── components/         # Componentes reutilizables
│       ├── constants/          # Constantes y temas
│       ├── contexts/           # Context API
│       │   └── CurrencyContext.tsx
│       ├── hooks/              # Custom hooks
│       ├── services/           # Servicios
│       │   └── database.ts     # Servicio de base de datos SQLite
│       ├── utils/              # Utilidades
│       ├── assets/             # Recursos estáticos
│       ├── app.json            # Configuración de Expo
│       ├── eas.json            # Configuración de EAS Build
│       └── package.json
│
├── docs/                       # Documentación
│   ├── DOCUMENTACION_TECNICA.md
│   └── IMPLEMENTACION_APK.md
├── package.json                # Configuración raíz
└── .npmrc                      # Configuración de npm
```

---

## Base de Datos Local

### SQLite con expo-sqlite

CashPro utiliza `expo-sqlite` con la API síncrona (`openDatabaseSync`) para almacenar todos los datos directamente en el dispositivo.

**Archivo de base de datos:** `cashpro.db` (se crea automáticamente en el directorio de datos de la app)

### Esquema de Tablas (13 tablas)

#### 1. accounts
```sql
CREATE TABLE accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'cash',
  balance REAL DEFAULT 0,
  currency TEXT DEFAULT 'MXN',
  icon TEXT DEFAULT 'wallet',
  color TEXT DEFAULT '#4CAF50',
  clabe TEXT DEFAULT '',
  bank_name TEXT DEFAULT '',
  card_last_four TEXT DEFAULT '',
  generates_interest INTEGER DEFAULT 0,
  interest_rate REAL DEFAULT 0,
  credit_limit REAL DEFAULT 0,
  current_balance REAL DEFAULT 0,
  cut_off_day INTEGER DEFAULT 1,
  payment_due_day INTEGER DEFAULT 15,
  is_primary INTEGER DEFAULT 0,
  include_in_balance INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now','localtime')),
  updated_at TEXT DEFAULT (datetime('now','localtime'))
)
```

#### 2. movements
```sql
CREATE TABLE movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL DEFAULT 'expense',
  amount REAL NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  category_id INTEGER DEFAULT 0,
  category_name TEXT DEFAULT '',
  category_icon TEXT DEFAULT '',
  category_color TEXT DEFAULT '',
  account_id INTEGER NOT NULL,
  to_account_id INTEGER,
  date TEXT DEFAULT (datetime('now','localtime')),
  notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now','localtime'))
)
```

#### 3. budgets
```sql
CREATE TABLE budgets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'expense',
  amount REAL NOT NULL DEFAULT 0,
  current_amount REAL DEFAULT 0,
  period TEXT DEFAULT 'monthly',
  categories TEXT DEFAULT '[]',
  start_date TEXT,
  end_date TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime')),
  updated_at TEXT DEFAULT (datetime('now','localtime'))
)
```

#### 4. user_profile
```sql
CREATE TABLE user_profile (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT DEFAULT 'Usuario',
  email TEXT DEFAULT '',
  currency TEXT DEFAULT 'MXN',
  avatar TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now','localtime')),
  updated_at TEXT DEFAULT (datetime('now','localtime'))
)
```

#### 5. savings_goals
```sql
CREATE TABLE savings_goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  target_amount REAL NOT NULL DEFAULT 0,
  current_amount REAL DEFAULT 0,
  deadline TEXT,
  icon TEXT DEFAULT 'star',
  color TEXT DEFAULT '#FF9800',
  account_id INTEGER,
  notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now','localtime')),
  updated_at TEXT DEFAULT (datetime('now','localtime'))
)
```

#### 6. goal_contributions
```sql
CREATE TABLE goal_contributions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  goal_id INTEGER NOT NULL,
  amount REAL NOT NULL DEFAULT 0,
  date TEXT DEFAULT (datetime('now','localtime')),
  notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now','localtime'))
)
```

#### 7. loans
```sql
CREATE TABLE loans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL DEFAULT 'given',
  person_name TEXT NOT NULL,
  amount REAL NOT NULL DEFAULT 0,
  remaining_amount REAL NOT NULL DEFAULT 0,
  interest_rate REAL DEFAULT 0,
  due_date TEXT,
  account_id INTEGER,
  notes TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now','localtime')),
  updated_at TEXT DEFAULT (datetime('now','localtime'))
)
```

#### 8. loan_payments
```sql
CREATE TABLE loan_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  loan_id INTEGER NOT NULL,
  amount REAL NOT NULL DEFAULT 0,
  date TEXT DEFAULT (datetime('now','localtime')),
  notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now','localtime'))
)
```

#### 9. recurring_payments
```sql
CREATE TABLE recurring_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  amount REAL NOT NULL DEFAULT 0,
  category_id INTEGER DEFAULT 0,
  category_name TEXT DEFAULT '',
  category_icon TEXT DEFAULT '',
  category_color TEXT DEFAULT '',
  frequency TEXT DEFAULT 'monthly',
  next_payment_date TEXT,
  account_id INTEGER,
  notes TEXT DEFAULT '',
  is_active INTEGER DEFAULT 1,
  last_paid_date TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime')),
  updated_at TEXT DEFAULT (datetime('now','localtime'))
)
```

#### 10. vehicles
```sql
CREATE TABLE vehicles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  brand TEXT DEFAULT '',
  model TEXT DEFAULT '',
  year INTEGER DEFAULT 0,
  plate TEXT DEFAULT '',
  color TEXT DEFAULT '',
  type TEXT DEFAULT 'car',
  fuel_type TEXT DEFAULT 'gasoline',
  notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now','localtime')),
  updated_at TEXT DEFAULT (datetime('now','localtime'))
)
```

#### 11. fuel_loads
```sql
CREATE TABLE fuel_loads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL,
  liters REAL NOT NULL DEFAULT 0,
  price_per_liter REAL NOT NULL DEFAULT 0,
  total_cost REAL NOT NULL DEFAULT 0,
  odometer REAL DEFAULT 0,
  date TEXT DEFAULT (datetime('now','localtime')),
  station TEXT DEFAULT '',
  full_tank INTEGER DEFAULT 1,
  account_id INTEGER,
  notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now','localtime'))
)
```

#### 12. maintenance
```sql
CREATE TABLE maintenance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  description TEXT DEFAULT '',
  cost REAL NOT NULL DEFAULT 0,
  odometer REAL DEFAULT 0,
  date TEXT DEFAULT (datetime('now','localtime')),
  workshop TEXT DEFAULT '',
  account_id INTEGER,
  notes TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now','localtime'))
)
```

#### 13. notification_settings
```sql
CREATE TABLE notification_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  budget_alerts INTEGER DEFAULT 1,
  payment_reminders INTEGER DEFAULT 1,
  goal_updates INTEGER DEFAULT 1,
  weekly_summary INTEGER DEFAULT 0,
  budget_threshold REAL DEFAULT 80,
  reminder_days_before INTEGER DEFAULT 3,
  updated_at TEXT DEFAULT (datetime('now','localtime'))
)
```

### Inicialización

La base de datos se inicializa automáticamente al arrancar la app:

```typescript
// apps/mobile/app/_layout.tsx
import { initDatabase } from '@/services/database';
initDatabase(); // Crea tablas y seed de datos iniciales
```

La función `initDatabase()`:
1. Abre/crea `cashpro.db` con `openDatabaseSync`
2. Ejecuta `CREATE TABLE IF NOT EXISTS` para las 13 tablas
3. Crea un perfil de usuario por defecto (id=1) si no existe
4. Crea configuración de notificaciones por defecto (id=1) si no existe

---

## Aplicación Móvil

### Navegación (Expo Router)

CashPro utiliza Expo Router con navegación basada en archivos:

```
app/
├── (tabs)/              # Navegación principal con tabs
│   ├── index.tsx        # Dashboard
│   ├── accounts.tsx     # Lista de cuentas
│   ├── movements.tsx    # Historial de movimientos
│   ├── explore.tsx      # Estadísticas y análisis
│   ├── more.tsx         # Más opciones
│   ├── settings.tsx     # Configuración
│   └── _layout.tsx      # Layout de tabs
├── accounts/            # Pantallas de cuentas
│   ├── add-account.tsx  # Crear cuenta
│   ├── edit-account.tsx # Editar cuenta
│   └── account-detail.tsx # Detalle de cuenta
├── budgets/             # Pantallas de presupuestos
│   ├── index.tsx        # Lista de presupuestos
│   ├── add-budget.tsx   # Crear presupuesto
│   └── edit-budget.tsx  # Editar presupuesto
├── loans/               # Pantallas de préstamos
│   ├── index.tsx        # Lista de préstamos
│   ├── add-loan.tsx     # Crear préstamo
│   └── loan-detail.tsx  # Detalle de préstamo
├── movements/           # Pantallas de movimientos
│   ├── add-movement.tsx # Registrar movimiento
│   └── movement-detail.tsx # Detalle de movimiento
├── savings-goals/       # Pantallas de metas de ahorro
│   ├── index.tsx        # Lista de metas
│   ├── add-goal.tsx     # Crear meta
│   └── goal-detail.tsx  # Detalle de meta
├── settings/            # Pantallas de configuración
│   ├── edit-profile.tsx # Editar perfil
│   └── notifications.tsx # Configuración de notificaciones
├── subscriptions/       # Pantallas de suscripciones
│   ├── index.tsx        # Lista de suscripciones
│   ├── add-subscription.tsx # Crear suscripción
│   └── sub-detail.tsx   # Detalle de suscripción
├── vehicles/            # Pantallas de vehículos
│   ├── index.tsx        # Lista de vehículos
│   ├── add-vehicle.tsx  # Crear vehículo
│   └── vehicle-detail.tsx # Detalle de vehículo
└── _layout.tsx          # Layout raíz
```

### Gestión de Estado

#### Context API

**CurrencyContext** (`contexts/CurrencyContext.tsx`):
- Gestiona la moneda seleccionada por el usuario
- Lee/escribe directamente desde/a la base de datos SQLite
- Proporciona funciones de formateo de moneda

```typescript
interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  formatCurrency: (amount: number) => string;
}
```

### Componentes Principales

#### UI Components

- **themed-text.tsx**: Texto con soporte de temas
- **themed-view.tsx**: Contenedor con soporte de temas
- **currency-input.tsx**: Input especializado para montos
- **haptic-tab.tsx**: Tab con feedback háptico
- **parallax-scroll-view.tsx**: Vista con efecto parallax

#### Utilidades

**format.ts**: Funciones de formateo
- Formateo de moneda
- Formateo de fechas
- Formateo de números

### Temas y Estilos

**Archivo:** `constants/theme.ts`

Define colores, tipografía y estilos consistentes en toda la aplicación. Soporta modo claro y oscuro automáticamente.

### Hooks Personalizados

- **use-color-scheme.ts**: Detecta el esquema de color del sistema
- **use-theme-color.ts**: Proporciona colores según el tema activo

---

## Servicio de Base de Datos

### Archivo: `apps/mobile/services/database.ts`

Archivo central (~1500 líneas) que contiene toda la lógica de acceso a datos y negocio. Reemplaza completamente la API REST anterior.

### Formato de Respuesta

Todas las funciones devuelven un formato consistente:

```typescript
// Éxito
{ success: true, data: { /* datos */ }, message?: "Operación exitosa" }

// Error
{ success: false, error: "Mensaje de error" }
```

### Funciones Principales

#### Inicialización
- `initDatabase()` — Crea tablas y datos iniciales

#### Cuentas
- `getAccounts()` — Obtener todas las cuentas
- `getAccountById(id)` — Obtener cuenta por ID
- `createAccount(data)` — Crear nueva cuenta
- `updateAccount(id, data)` — Actualizar cuenta
- `deleteAccount(id)` — Eliminar cuenta (cascada: elimina movimientos asociados)
- `getTotalBalance()` — Balance total (incluye lógica de crédito)
- `setAccountAsPrimary(id)` — Establecer cuenta principal

#### Movimientos
- `getMovements()` — Obtener todos los movimientos
- `getMovementById(id)` — Obtener movimiento por ID
- `createMovement(data)` — Crear movimiento (actualiza balances y presupuestos)
- `updateMovement(id, data)` — Actualizar movimiento
- `deleteMovement(id)` — Eliminar movimiento (revierte balance)
- `getMovementsSummary()` — Estadísticas de ingresos/gastos del mes

#### Presupuestos
- `getBudgets()` — Obtener todos los presupuestos
- `getBudgetById(id)` — Obtener presupuesto por ID
- `createBudget(data)` — Crear presupuesto
- `updateBudget(id, data)` — Actualizar presupuesto
- `deleteBudget(id)` — Eliminar presupuesto
- `getBudgetStats()` — Estadísticas de presupuestos

#### Perfil
- `getProfile()` — Obtener perfil de usuario
- `updateProfile(data)` — Actualizar perfil

#### Metas de Ahorro
- `getSavingsGoals()` — Obtener todas las metas
- `getSavingsGoalById(id)` — Obtener meta por ID
- `createSavingsGoal(data)` — Crear meta
- `updateSavingsGoal(id, data)` — Actualizar meta
- `deleteSavingsGoal(id)` — Eliminar meta (cascada: contribuciones)
- `addContribution(goalId, data)` — Agregar contribución (crea movimiento)
- `getSavingsGoalStats()` — Estadísticas de metas

#### Préstamos
- `getLoans()` — Obtener todos los préstamos
- `getLoanById(id)` — Obtener préstamo por ID
- `createLoan(data)` — Crear préstamo
- `updateLoan(id, data)` — Actualizar préstamo
- `deleteLoan(id)` — Eliminar préstamo (cascada: pagos)
- `addLoanPayment(loanId, data)` — Registrar pago (crea movimiento de ingreso)
- `getLoanStats()` — Estadísticas de préstamos

#### Pagos Recurrentes
- `getRecurringPayments()` — Obtener todas las suscripciones
- `getRecurringPaymentById(id)` — Obtener suscripción por ID
- `createRecurringPayment(data)` — Crear suscripción
- `updateRecurringPayment(id, data)` — Actualizar suscripción
- `deleteRecurringPayment(id)` — Eliminar suscripción
- `registerRecurringPayment(id)` — Registrar pago (crea movimiento)
- `getRecurringPaymentStats()` — Estadísticas

#### Vehículos
- `getVehicles()` — Obtener todos los vehículos
- `getVehicleById(id)` — Obtener vehículo por ID
- `createVehicle(data)` — Crear vehículo
- `updateVehicle(id, data)` — Actualizar vehículo
- `deleteVehicle(id)` — Eliminar vehículo (cascada: cargas, mantenimiento)
- `getFuelLoads(vehicleId)` — Obtener cargas de combustible
- `addFuelLoad(vehicleId, data)` — Agregar carga (crea movimiento de gasto)
- `getMaintenanceRecords(vehicleId)` — Obtener registros de mantenimiento
- `addMaintenance(vehicleId, data)` — Agregar mantenimiento (crea movimiento de gasto)
- `getVehicleStats(vehicleId)` — Estadísticas del vehículo

#### Notificaciones
- `getNotificationSettings()` — Obtener configuración
- `updateNotificationSettings(data)` — Actualizar configuración
- `getPendingNotifications()` — Obtener alertas pendientes

#### Exportación/Importación
- `exportAllDataAsJSON()` — Exportar todas las tablas como JSON
- `importDataFromJSON(jsonString)` — Importar datos desde JSON (reemplaza todo)
- `exportMovementsAsCSV()` — Exportar movimientos como CSV
- `getDatabasePath()` — Obtener ruta del archivo .db
- `resetAllData()` — Eliminar todos los datos (DROP + recrear tablas)

---

## Configuración y Despliegue

### Requisitos Previos

- Node.js (v18 o superior)
- pnpm 10.30.0
- Expo CLI
- EAS CLI (≥ 15.0.0)
- Cuenta en Expo (expo.dev)

### Instalación

```bash
# Clonar repositorio
git clone <repo-url>
cd cash_pro

# Instalar dependencias
pnpm install
```

### Scripts Disponibles

#### Raíz del Proyecto

```bash
# Iniciar app en modo desarrollo
pnpm dev

# Generar APK (preview)
pnpm build:apk

# Generar AAB para Play Store
pnpm build:production
```

#### Aplicación Móvil (`apps/mobile/`)

```bash
# Iniciar Expo
pnpm start

# Android
pnpm android

# iOS
pnpm ios

# Web
pnpm web

# Generar APK
pnpm build:apk

# Generar AAB para producción
pnpm build:production

# Linting
pnpm lint
```

### Configuración de Expo (`app.json`)

```json
{
  "expo": {
    "name": "CashPro",
    "slug": "cashpro",
    "version": "1.1.0",
    "android": {
      "package": "com.cashpro.app",
      "adaptiveIcon": { ... },
      "edgeToEdgeEnabled": true
    },
    "ios": {
      "bundleIdentifier": "com.cashpro.app",
      "supportsTablet": true
    },
    "plugins": ["expo-router", "expo-splash-screen", "expo-sqlite"],
    "experiments": {
      "typedRoutes": true,
      "reactCompiler": true
    }
  }
}
```

### Configuración EAS Build (`eas.json`)

```json
{
  "cli": {
    "version": ">= 15.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleDebug"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true,
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

---

## Funcionalidades Principales

### 1. Gestión de Cuentas

- Crear múltiples cuentas (efectivo, banco, débito, crédito)
- Establecer cuenta principal
- Configurar límites de crédito
- Gestionar tasas de interés
- Incluir/excluir cuentas del balance general

### 2. Registro de Movimientos

- Registrar gastos, ingresos y transferencias
- Categorización de transacciones
- Notas y detalles adicionales
- Actualización automática de balances
- Historial completo de transacciones

### 3. Presupuestos

- Presupuestos de gasto y ahorro
- Periodos semanales y mensuales
- Seguimiento automático de gastos
- Alertas de límites
- Categorización opcional

### 4. Metas de Ahorro

- Definir objetivos financieros
- Seguimiento de progreso
- Contribuciones manuales (crean movimiento asociado)
- Fechas objetivo
- Visualización de avance

### 5. Gestión de Préstamos

- Registro de préstamos otorgados/recibidos
- Seguimiento de pagos (crean movimiento de ingreso)
- Cálculo de intereses
- Historial de amortización

### 6. Pagos Recurrentes / Suscripciones

- Suscripciones y servicios
- Registro de pagos (crean movimiento de gasto)
- Seguimiento de gastos recurrentes
- Categorización

### 7. Control de Vehículos

- Registro de vehículos
- Cargas de combustible (crean movimiento de gasto)
- Historial de mantenimiento (crean movimiento de gasto)
- Cálculo de consumo (km/l)
- Gastos asociados

### 8. Análisis y Reportes (Explore)

- Balance total
- Estadísticas de ingresos/gastos
- Progreso de presupuestos
- Análisis por categorías
- Tendencias temporales

### 9. Configuración

- Perfil de usuario (nombre, email, avatar)
- Preferencias de moneda (MXN, USD, EUR, etc.)
- Notificaciones
- Temas (claro/oscuro automático)

### 10. Gestión de Datos

- **Exportar JSON:** Respaldo completo de todas las tablas
- **Exportar CSV:** Movimientos en formato CSV
- **Exportar Base de Datos:** Archivo SQLite (.db) directo
- **Importar Datos:** Desde JSON o SQLite (.db)
- **Eliminar Todos los Datos:** Reset completo con recreación de tablas

---

## Lógica de Negocio

### Actualización de Balances

#### Cuentas Normales (cash, bank, debit)

- **Gasto:** `balance = balance - amount`
- **Ingreso:** `balance = balance + amount`
- **Transferencia:**
  - Origen: `balance = balance - amount`
  - Destino: `balance = balance + amount`

#### Cuentas de Crédito

- **Gasto:** `current_balance = current_balance + amount` (aumenta deuda)
- **Ingreso:** `current_balance = current_balance - amount` (pago de deuda)
- **Transferencia:**
  - Origen: `current_balance = current_balance - amount`
  - Destino: `current_balance = current_balance + amount`

### Actualización de Presupuestos

Cuando se registra un gasto:

1. Se identifican presupuestos de tipo "expense"
2. Si el presupuesto no tiene categorías, rastrea todos los gastos
3. Si tiene categorías específicas, solo rastrea gastos de esas categorías
4. Se actualiza `current_amount` del presupuesto

### Balance Total

```
total_balance = SUM(balance de cuentas no-crédito) - SUM(current_balance de cuentas crédito)
```

Solo se incluyen cuentas con `include_in_balance = 1`

### Efectos Secundarios de Operaciones

| Operación | Efecto Secundario |
|-----------|-------------------|
| Crear movimiento gasto | Resta balance + actualiza presupuestos |
| Crear movimiento ingreso | Suma balance |
| Crear movimiento transferencia | Resta origen + suma destino |
| Eliminar movimiento | Revierte el cambio de balance |
| Agregar contribución a meta | Crea movimiento de gasto + actualiza meta |
| Registrar pago de préstamo | Crea movimiento de ingreso + actualiza remaining_amount |
| Registrar pago recurrente | Crea movimiento de gasto + actualiza next_payment_date |
| Agregar carga combustible | Crea movimiento de gasto |
| Agregar mantenimiento | Crea movimiento de gasto |
| Eliminar cuenta | Elimina movimientos asociados en cascada |
| Eliminar meta de ahorro | Elimina contribuciones en cascada |
| Eliminar préstamo | Elimina pagos en cascada |
| Eliminar vehículo | Elimina cargas y mantenimiento en cascada |

---

## Solución de Problemas

### La base de datos no se inicializa

1. Verificar que `expo-sqlite` esté en `app.json` plugins
2. Asegurar que `initDatabase()` se llama en `_layout.tsx`
3. Verificar logs de la consola para errores de SQL

### Error al exportar/importar

1. Verificar permisos de almacenamiento en el dispositivo
2. Para importar JSON, asegurar que el formato coincide con el export
3. Para importar .db, asegurar que es un archivo SQLite válido

### Error al generar APK

1. Verificar que `eas.json` existe y es válido
2. Asegurar que `android.package` está configurado en `app.json`
3. Verificar cuenta y login de EAS: `eas login`
4. Ver guía detallada en `docs/IMPLEMENTACION_APK.md`

### Resetear base de datos

Desde la app: Configuración → Eliminar Todos los Datos

---

## Roadmap y Mejoras Futuras

### Completado

- [x] Migración a SQLite local (standalone)
- [x] Exportación multi-formato (JSON, CSV, SQLite)
- [x] Importación de datos (JSON, SQLite)
- [x] Configuración EAS Build para APK
- [x] App funcional 100% offline

### Corto Plazo

- [ ] Gráficos y visualizaciones mejoradas
- [ ] Categorías personalizadas
- [ ] Búsqueda avanzada de movimientos
- [ ] Notificaciones push locales

### Mediano Plazo

- [ ] Sincronización en la nube (opcional)
- [ ] Recordatorios inteligentes
- [ ] Importación de transacciones bancarias (CSV)
- [ ] Widgets de Android

### Largo Plazo

- [ ] Machine Learning para predicciones de gastos
- [ ] Asesoría financiera automatizada
- [ ] Versión iOS en App Store
- [ ] Versión web completa

---

## Contribución

### Estructura de Commits

```
tipo(alcance): descripción

[cuerpo opcional]

[pie opcional]
```

Tipos: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Flujo de Trabajo

1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -m 'feat: agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

---

## Licencia

ISC

---

**Última actualización:** Febrero 2026
**Versión del documento:** 2.0.0
