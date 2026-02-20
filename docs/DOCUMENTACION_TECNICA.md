# CashPro - Documentación Técnica

## Información General

- **Nombre:** CashPro
- **Versión:** 1.0.0
- **Descripción:** Aplicación móvil de gestión financiera personal con backend REST API
- **Arquitectura:** Monorepo con aplicación móvil (React Native/Expo) y API REST (Node.js/Express)

---

## Tabla de Contenidos

1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Tecnologías Utilizadas](#tecnologías-utilizadas)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Backend API](#backend-api)
5. [Aplicación Móvil](#aplicación-móvil)
6. [Base de Datos](#base-de-datos)
7. [Configuración y Despliegue](#configuración-y-despliegue)
8. [Funcionalidades Principales](#funcionalidades-principales)

---

## Arquitectura del Sistema

CashPro utiliza una arquitectura cliente-servidor con las siguientes características:

```
┌─────────────────────────────────────┐
│     Aplicación Móvil (Cliente)      │
│   React Native + Expo Router        │
│   iOS / Android / Web                │
└──────────────┬──────────────────────┘
               │ HTTP/REST
               │
┌──────────────▼──────────────────────┐
│         API REST (Servidor)         │
│      Node.js + Express.js           │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Base de Datos JSON             │
│    (Temporal - SQLite planeado)     │
└─────────────────────────────────────┘
```

### Características Arquitectónicas

- **Monorepo:** Gestión unificada de múltiples aplicaciones
- **API RESTful:** Comunicación mediante endpoints HTTP estándar
- **Separación de Responsabilidades:** Frontend y backend completamente desacoplados
- **Gestión de Estado:** Context API de React para estado global
- **Navegación:** Expo Router con navegación basada en archivos

---

## Tecnologías Utilizadas

### Backend (API)

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Node.js | - | Runtime de JavaScript |
| Express.js | 5.2.1 | Framework web |
| better-sqlite3 | 12.6.2 | Base de datos SQLite (planeado) |
| CORS | 2.8.6 | Manejo de políticas CORS |
| Nodemon | 3.1.11 | Hot reload en desarrollo |

### Frontend (Móvil)

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | 19.1.0 | Librería UI |
| React Native | 0.81.5 | Framework móvil |
| Expo | ~54.0.33 | Plataforma de desarrollo |
| Expo Router | ~6.0.23 | Sistema de navegación |
| TypeScript | ~5.9.2 | Tipado estático |
| React Navigation | 7.x | Navegación nativa |

### Gestión de Paquetes

- **pnpm** 10.30.0: Gestor de paquetes eficiente para monorepo

---

## Estructura del Proyecto

```
cash_pro/
├── apps/
│   ├── api/                    # Backend REST API
│   │   ├── src/
│   │   │   ├── database/       # Capa de acceso a datos
│   │   │   │   ├── db.js       # SQLite (planeado)
│   │   │   │   └── db-json.js  # Implementación JSON temporal
│   │   │   ├── routes/         # Endpoints de la API
│   │   │   │   ├── accounts.js
│   │   │   │   ├── movements.js
│   │   │   │   ├── budgets.js
│   │   │   │   ├── profile.js
│   │   │   │   ├── savings-goals.js
│   │   │   │   ├── loans.js
│   │   │   │   ├── recurring-payments.js
│   │   │   │   ├── vehicles.js
│   │   │   │   └── notifications.js
│   │   │   └── index.js        # Punto de entrada
│   │   ├── data.json           # Base de datos JSON
│   │   ├── seed-demo-data.js   # Script de datos de prueba
│   │   └── package.json
│   │
│   └── mobile/                 # Aplicación móvil
│       ├── app/                # Rutas de la aplicación (Expo Router)
│       │   ├── (tabs)/         # Navegación principal
│       │   ├── accounts/       # Gestión de cuentas
│       │   ├── budgets/        # Presupuestos
│       │   ├── loans/          # Préstamos
│       │   ├── movements/      # Transacciones
│       │   ├── savings-goals/  # Metas de ahorro
│       │   ├── settings/       # Configuración
│       │   ├── subscriptions/  # Suscripciones
│       │   ├── vehicles/       # Vehículos
│       │   └── _layout.tsx     # Layout raíz
│       ├── components/         # Componentes reutilizables
│       ├── config/             # Configuración
│       │   └── api.ts          # Configuración de API
│       ├── constants/          # Constantes y temas
│       ├── contexts/           # Context API
│       │   └── CurrencyContext.tsx
│       ├── hooks/              # Custom hooks
│       ├── utils/              # Utilidades
│       └── assets/             # Recursos estáticos
│
├── docs/                       # Documentación
├── package.json                # Configuración raíz
└── .npmrc                      # Configuración de npm
```

---

## Backend API

### Servidor Express

El servidor se ejecuta en el puerto 3000 (configurable) y proporciona una API RESTful completa.

**Archivo:** `apps/api/src/index.js`

```javascript
const PORT = process.env.PORT || 3000;
```

### Endpoints Principales

#### 1. Cuentas (`/api/accounts`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/accounts` | Obtener todas las cuentas |
| GET | `/api/accounts/:id` | Obtener cuenta por ID |
| POST | `/api/accounts` | Crear nueva cuenta |
| PUT | `/api/accounts/:id` | Actualizar cuenta |
| DELETE | `/api/accounts/:id` | Eliminar cuenta |
| GET | `/api/accounts/stats/total-balance` | Balance total |
| PUT | `/api/accounts/:id/set-primary` | Establecer cuenta principal |

**Tipos de Cuenta:**
- `cash`: Efectivo
- `bank`: Cuenta bancaria
- `debit`: Tarjeta de débito
- `credit`: Tarjeta de crédito

**Campos Principales:**
```javascript
{
  name: string,
  type: 'cash' | 'bank' | 'debit' | 'credit',
  balance: number,
  currency: string,
  icon: string,
  color: string,
  clabe: string,
  bank_name: string,
  card_last_four: string,
  generates_interest: boolean,
  interest_rate: number,
  credit_limit: number,
  current_balance: number,
  cut_off_day: number,
  payment_due_day: number,
  is_primary: boolean,
  include_in_balance: boolean
}
```

#### 2. Movimientos (`/api/movements`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/movements` | Obtener todos los movimientos |
| GET | `/api/movements/:id` | Obtener movimiento por ID |
| POST | `/api/movements` | Crear nuevo movimiento |
| PUT | `/api/movements/:id` | Actualizar movimiento |
| DELETE | `/api/movements/:id` | Eliminar movimiento |
| GET | `/api/movements/stats/summary` | Estadísticas de movimientos |

**Tipos de Movimiento:**
- `expense`: Gasto
- `income`: Ingreso
- `transfer`: Transferencia entre cuentas

**Campos Principales:**
```javascript
{
  type: 'expense' | 'income' | 'transfer',
  amount: number,
  title: string,
  category_id: number,
  category_name: string,
  category_icon: string,
  category_color: string,
  account_id: number,
  to_account_id: number,
  date: string,
  notes: string
}
```

#### 3. Presupuestos (`/api/budgets`)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/budgets` | Obtener todos los presupuestos |
| GET | `/api/budgets/:id` | Obtener presupuesto por ID |
| POST | `/api/budgets` | Crear nuevo presupuesto |
| PUT | `/api/budgets/:id` | Actualizar presupuesto |
| DELETE | `/api/budgets/:id` | Eliminar presupuesto |
| GET | `/api/budgets/stats/summary` | Estadísticas de presupuestos |

#### 4. Perfil de Usuario (`/api/profile`)

Gestión de información del usuario y preferencias.

#### 5. Metas de Ahorro (`/api/savings-goals`)

Gestión de objetivos de ahorro con seguimiento de contribuciones.

#### 6. Préstamos (`/api/loans`)

Gestión de préstamos y pagos asociados.

#### 7. Pagos Recurrentes (`/api/recurring-payments`)

Gestión de suscripciones y pagos periódicos.

#### 8. Vehículos (`/api/vehicles`)

Gestión de vehículos, cargas de combustible y mantenimiento.

#### 9. Notificaciones (`/api/notifications`)

Configuración de notificaciones y alertas.

### Middleware

```javascript
// CORS - Permite peticiones desde cualquier origen
app.use(cors());

// JSON Parser - Parsea el body de las peticiones
app.use(express.json());

// Error Handler - Manejo centralizado de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    error: 'Algo salió mal en el servidor' 
  });
});
```

### Formato de Respuesta

Todas las respuestas siguen un formato consistente:

**Éxito:**
```javascript
{
  success: true,
  data: { /* datos */ },
  message: "Operación exitosa" // opcional
}
```

**Error:**
```javascript
{
  success: false,
  error: "Mensaje de error"
}
```

---

## Aplicación Móvil

### Navegación (Expo Router)

CashPro utiliza Expo Router con navegación basada en archivos:

```
app/
├── (tabs)/              # Navegación principal con tabs
│   ├── index.tsx        # Inicio/Dashboard
│   ├── accounts.tsx     # Lista de cuentas
│   ├── movements.tsx    # Historial de movimientos
│   ├── explore.tsx      # Explorar/Análisis
│   ├── more.tsx         # Más opciones
│   └── _layout.tsx      # Layout de tabs
├── accounts/            # Pantallas de cuentas
├── budgets/             # Pantallas de presupuestos
├── loans/               # Pantallas de préstamos
├── movements/           # Pantallas de movimientos
├── savings-goals/       # Pantallas de metas
├── settings/            # Pantallas de configuración
├── subscriptions/       # Pantallas de suscripciones
├── vehicles/            # Pantallas de vehículos
└── _layout.tsx          # Layout raíz
```

### Gestión de Estado

#### Context API

**CurrencyContext** (`contexts/CurrencyContext.tsx`):
- Gestiona la moneda seleccionada por el usuario
- Proporciona funciones de formateo de moneda
- Persiste la preferencia del usuario

```typescript
interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  formatCurrency: (amount: number) => string;
}
```

### Configuración de API

**Archivo:** `apps/mobile/config/api.ts`

```typescript
export const API_CONFIG = {
  BASE_URL: __DEV__ 
    ? Platform.OS === 'android' 
      ? `http://${LOCAL_IP}:3000/api`
      : 'http://localhost:3000/api'
    : 'http://localhost:3000/api',
};
```

La IP local se configura en `app.json`:

```json
{
  "expo": {
    "extra": {
      "apiHost": "192.168.1.21"
    }
  }
}
```

### Componentes Principales

#### UI Components

- **themed-text.tsx**: Texto con soporte de temas
- **themed-view.tsx**: Contenedor con soporte de temas
- **currency-input.tsx**: Input especializado para montos
- **bottom-nav-bar.tsx**: Barra de navegación inferior
- **haptic-tab.tsx**: Tab con feedback háptico
- **parallax-scroll-view.tsx**: Vista con efecto parallax

#### Utilidades

**format.ts**: Funciones de formateo
- Formateo de moneda
- Formateo de fechas
- Formateo de números

### Temas y Estilos

**Archivo:** `constants/theme.ts`

Define colores, tipografía y estilos consistentes en toda la aplicación.

### Hooks Personalizados

- **use-color-scheme.ts**: Detecta el esquema de color del sistema
- **use-theme-color.ts**: Proporciona colores según el tema activo

---

## Base de Datos

### Implementación Actual (JSON)

**Archivo:** `apps/api/data.json`

Estructura temporal usando archivo JSON con las siguientes entidades:

```javascript
{
  accounts: [],
  nextAccountId: 1,
  movements: [],
  nextMovementId: 1,
  categories: [],
  nextCategoryId: 1,
  budgets: [],
  nextBudgetId: 1,
  user_profile: [],
  nextProfileId: 1,
  savings_goals: [],
  nextSavingsGoalId: 1,
  goal_contributions: [],
  nextGoalContributionId: 1,
  loans: [],
  nextLoanId: 1,
  loan_payments: [],
  nextLoanPaymentId: 1,
  recurring_payments: [],
  nextRecurringPaymentId: 1,
  vehicles: [],
  nextVehicleId: 1,
  fuel_loads: [],
  nextFuelLoadId: 1,
  maintenance: [],
  nextMaintenanceId: 1,
  notification_settings: []
}
```

### Implementación Planeada (SQLite)

**Archivo:** `apps/api/src/database/db.js`

Se planea migrar a SQLite usando `better-sqlite3` para:
- Mejor rendimiento
- Consultas más complejas
- Integridad referencial
- Transacciones ACID

### Capa de Abstracción

**Archivo:** `apps/api/src/database/db-json.js`

Proporciona una interfaz similar a SQLite para facilitar la migración:

```javascript
const db = {
  prepare: (sql) => ({
    all: () => { /* ... */ },
    get: (id) => { /* ... */ },
    run: (...params) => { /* ... */ }
  })
};
```

---

## Configuración y Despliegue

### Requisitos Previos

- Node.js (v16 o superior)
- pnpm 10.30.0
- Expo CLI
- Dispositivo móvil o emulador

### Instalación

```bash
# Instalar dependencias
pnpm install

# Instalar dependencias del API
cd apps/api
pnpm install

# Instalar dependencias del móvil
cd apps/mobile
pnpm install
```

### Scripts Disponibles

#### Raíz del Proyecto

```bash
# Iniciar API y móvil simultáneamente
pnpm dev

# Iniciar solo API
pnpm dev:api

# Iniciar solo móvil con túnel
pnpm dev:mobile
```

#### API

```bash
# Desarrollo con hot reload
pnpm dev

# Producción
pnpm start

# Poblar datos de demostración
pnpm seed
```

#### Móvil

```bash
# Iniciar Expo
pnpm start

# Android
pnpm android

# iOS
pnpm ios

# Web
pnpm web

# Linting
pnpm lint
```

### Configuración de Red

Para que la aplicación móvil se conecte al API:

1. Obtener la IP local de tu máquina
2. Actualizar `apps/mobile/app.json`:

```json
{
  "expo": {
    "extra": {
      "apiHost": "TU_IP_LOCAL"
    }
  }
}
```

3. Asegurarse de que el dispositivo móvil esté en la misma red

### Variables de Entorno

#### API

```bash
PORT=3000  # Puerto del servidor (opcional)
```

#### Móvil

Configurado en `app.json` bajo `expo.extra`

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
- Contribuciones manuales
- Fechas objetivo
- Visualización de avance

### 5. Gestión de Préstamos

- Registro de préstamos otorgados/recibidos
- Seguimiento de pagos
- Cálculo de intereses
- Historial de amortización

### 6. Pagos Recurrentes

- Suscripciones y servicios
- Recordatorios automáticos
- Seguimiento de gastos recurrentes
- Categorización

### 7. Control de Vehículos

- Registro de vehículos
- Cargas de combustible
- Historial de mantenimiento
- Cálculo de consumo
- Gastos asociados

### 8. Análisis y Reportes

- Balance total
- Estadísticas de ingresos/gastos
- Progreso de presupuestos
- Análisis por categorías
- Tendencias temporales

### 9. Configuración

- Perfil de usuario
- Preferencias de moneda
- Notificaciones
- Temas (claro/oscuro)

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

```javascript
total_balance = SUM(balance de cuentas no-crédito) - SUM(current_balance de cuentas crédito)
```

Solo se incluyen cuentas con `include_in_balance = 1`

---

## Seguridad y Mejores Prácticas

### API

- Validación de datos de entrada
- Manejo centralizado de errores
- Logs de operaciones
- Respuestas consistentes

### Móvil

- Validación en cliente
- Manejo de errores de red
- Feedback visual al usuario
- Optimización de peticiones

### Pendientes de Implementación

- Autenticación de usuarios
- Encriptación de datos sensibles
- Rate limiting en API
- Validación de tokens
- HTTPS en producción

---

## Roadmap y Mejoras Futuras

### Corto Plazo

- [ ] Migración a SQLite
- [ ] Autenticación de usuarios
- [ ] Sincronización en la nube
- [ ] Exportación de datos (CSV, PDF)
- [ ] Gráficos y visualizaciones

### Mediano Plazo

- [ ] Múltiples usuarios
- [ ] Compartir cuentas
- [ ] Recordatorios inteligentes
- [ ] Categorías personalizadas
- [ ] Importación de transacciones bancarias

### Largo Plazo

- [ ] Machine Learning para predicciones
- [ ] Asesoría financiera automatizada
- [ ] Integración con bancos
- [ ] Versión web completa
- [ ] API pública

---

## Solución de Problemas

### La app móvil no se conecta al API

1. Verificar que el API esté corriendo (`pnpm dev:api`)
2. Confirmar que la IP en `app.json` sea correcta
3. Asegurar que ambos dispositivos estén en la misma red
4. Verificar firewall y permisos de red

### Error de compilación en better-sqlite3

El proyecto usa `db-json.js` temporalmente. Para usar SQLite:

```bash
cd apps/api
pnpm rebuild better-sqlite3
```

### Datos de prueba

```bash
cd apps/api
pnpm seed
```

### Resetear base de datos

```bash
POST http://localhost:3000/api/reset
```

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

## Contacto y Soporte

Para reportar bugs o solicitar funcionalidades, crear un issue en el repositorio del proyecto.

---

**Última actualización:** Febrero 2026  
**Versión del documento:** 1.0.0
