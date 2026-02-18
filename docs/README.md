# CashPro - Documentación del Proyecto

## Descripción General

CashPro es una aplicación móvil para el control de gastos personales diseñada para funcionar completamente offline. La aplicación permite a los usuarios gestionar sus finanzas de manera local en el dispositivo, sin necesidad de conexión a internet o APIs externas.

## Características Principales

- **Funcionamiento 100% Local**: Toda la información se almacena y procesa en el dispositivo del usuario
- **Sin Conexión Requerida**: No depende de internet ni servicios externos
- **Base de Datos Local**: Utiliza SQLite para almacenamiento persistente en el dispositivo
- **Gestión de Cuentas**: Administra múltiples cuentas bancarias y efectivo
- **Control de Movimientos**: Registro de ingresos y gastos con categorización
- **Estadísticas**: Visualización de gastos por categoría y tendencias
- **Interfaz Moderna**: Diseño limpio con soporte para tema claro y oscuro

## Arquitectura del Proyecto

### Estructura del Monorepo

El proyecto está organizado como un monorepo utilizando **pnpm workspaces**:

```
cash_pro/
├── apps/
│   ├── api/              # Backend API (Express + SQLite)
│   └── mobile/           # Aplicación móvil (React Native + Expo)
├── packages/
│   └── shared/           # Código compartido entre apps
├── docs/                 # Documentación del proyecto
└── stitch/              # Recursos de diseño y templates
```

### Gestión de Dependencias

- **Package Manager**: pnpm v10.30.0
- **Workspace Configuration**: Configurado con `nodeLinker: hoisted` para optimizar el espacio en disco
- **Scripts Principales**:
  - `pnpm dev`: Inicia API y Mobile simultáneamente
  - `pnpm dev:api`: Inicia solo el backend
  - `pnpm dev:mobile`: Inicia solo la app móvil

## Tecnologías Utilizadas

### Aplicación Móvil (`apps/mobile`)

#### Framework Principal
- **React Native**: v0.81.5
- **React**: v19.1.0
- **Expo SDK**: v54.0.33
- **TypeScript**: v5.9.2

#### Navegación y Routing
- **expo-router**: v6.0.23 - Sistema de routing basado en archivos
- **@react-navigation/native**: v7.1.8
- **@react-navigation/bottom-tabs**: v7.4.0
- **react-native-screens**: v4.16.0

#### UI y Experiencia de Usuario
- **@expo/vector-icons**: v15.0.3 - Iconos
- **expo-symbols**: v1.0.8 - Símbolos SF para iOS
- **react-native-reanimated**: v4.1.1 - Animaciones fluidas
- **react-native-gesture-handler**: v2.28.0 - Gestos táctiles
- **expo-haptics**: v15.0.8 - Feedback háptico
- **expo-splash-screen**: v31.0.13 - Pantalla de inicio

#### Características Expo
- **expo-image**: v3.0.11 - Optimización de imágenes
- **expo-font**: v14.0.11 - Fuentes personalizadas
- **expo-constants**: v18.0.13 - Constantes del sistema
- **expo-status-bar**: v3.0.9 - Control de barra de estado
- **expo-system-ui**: v6.0.9 - Configuración de UI del sistema

#### Configuración
- **Nueva Arquitectura de React Native**: Habilitada (`newArchEnabled: true`)
- **React Compiler**: Experimental habilitado
- **Typed Routes**: Rutas tipadas automáticamente
- **Soporte Multi-plataforma**: iOS, Android y Web

### Backend API (`apps/api`)

#### Framework y Base de Datos
- **Express**: v5.2.1 - Framework web
- **better-sqlite3**: v12.6.2 - Base de datos SQLite local
- **cors**: v2.8.6 - Manejo de CORS

#### Herramientas de Desarrollo
- **nodemon**: v3.1.11 - Hot reload en desarrollo

## Estructura de la Aplicación Móvil

### Sistema de Navegación

La app utiliza **Expo Router** con navegación por tabs:

```
app/
├── _layout.tsx           # Layout raíz con ThemeProvider
├── modal.tsx            # Pantalla modal
└── (tabs)/              # Grupo de tabs
    ├── _layout.tsx      # Configuración de tabs
    ├── index.tsx        # Dashboard (Inicio)
    ├── movements.tsx    # Movimientos
    ├── explore.tsx      # Estadísticas
    ├── accounts.tsx     # Cuentas
    └── settings.tsx     # Ajustes
```

### Componentes Principales

#### Componentes Base
- **themed-text.tsx**: Texto con soporte de temas
- **themed-view.tsx**: Contenedor con soporte de temas
- **haptic-tab.tsx**: Tab con feedback háptico
- **parallax-scroll-view.tsx**: ScrollView con efecto parallax
- **external-link.tsx**: Enlaces externos
- **hello-wave.tsx**: Animación de saludo

#### Componentes UI
- **collapsible.tsx**: Componente colapsable
- **icon-symbol.tsx**: Wrapper de iconos multiplataforma

### Hooks Personalizados

- **use-color-scheme.ts**: Detecta el esquema de color del sistema
- **use-color-scheme.web.ts**: Versión web del hook anterior
- **use-theme-color.ts**: Obtiene colores según el tema activo

### Sistema de Temas

Configurado en `constants/theme.ts` con soporte para:
- Modo claro y oscuro
- Colores personalizados por pantalla
- Transiciones suaves entre temas

## Pantallas Principales

### 1. Dashboard (Inicio)
- Balance total con indicador de tendencia
- Tarjetas de ingresos y gastos del mes
- Lista de cuentas con scroll horizontal
- Gasto por categoría con barras de progreso
- FABs para agregar ingresos/gastos rápidamente

### 2. Movimientos
- Lista de todas las transacciones
- Filtros por fecha, tipo y categoría
- Búsqueda de movimientos

### 3. Estadísticas
- Gráficos de gastos por categoría
- Tendencias mensuales
- Comparativas de períodos

### 4. Cuentas
- Gestión de cuentas bancarias
- Efectivo
- Tarjetas de crédito/débito

### 5. Ajustes
- Configuración de la aplicación
- Gestión de categorías
- Preferencias de usuario

## Base de Datos Local

### Tecnología
- **SQLite** mediante `better-sqlite3`
- Almacenamiento local en el dispositivo
- Sin sincronización en la nube

### Esquema Propuesto

```sql
-- Cuentas
CREATE TABLE accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'bank', 'cash', 'credit'
  balance REAL DEFAULT 0,
  currency TEXT DEFAULT 'MXN',
  icon TEXT,
  color TEXT,
  is_primary BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Categorías
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'income', 'expense'
  icon TEXT,
  color TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Transacciones
CREATE TABLE transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL,
  category_id INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'income', 'expense'
  amount REAL NOT NULL,
  description TEXT,
  date DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES accounts(id),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);
```

## Configuración del Entorno

### Requisitos Previos
- Node.js v18 o superior
- pnpm v10.30.0
- Expo CLI
- Android Studio (para Android) o Xcode (para iOS)

### Instalación

```bash
# Instalar dependencias
pnpm install

# Iniciar en modo desarrollo
pnpm dev

# O iniciar solo la app móvil
pnpm dev:mobile

# O iniciar solo el API
pnpm dev:api
```

### Scripts Disponibles

#### Móvil
```bash
pnpm --filter mobile start      # Iniciar Expo
pnpm --filter mobile android    # Abrir en Android
pnpm --filter mobile ios        # Abrir en iOS
pnpm --filter mobile web        # Abrir en navegador
pnpm --filter mobile lint       # Ejecutar linter
```

#### API
```bash
pnpm --filter api dev          # Modo desarrollo con nodemon
pnpm --filter api start        # Modo producción
```

## Recursos de Diseño

La carpeta `stitch/` contiene:
- **images/**: Capturas de pantalla del diseño
- **templates/**: Templates HTML de las pantallas

### Pantallas Diseñadas
- Splash Screen
- Login
- Dashboard
- Movimientos
- Reportes/Estadísticas
- Cuentas
- Ajustes
- Detalle de Transacción
- Nueva Transacción

## Roadmap de Desarrollo

### Fase 1: Fundamentos ✅
- [x] Configuración del monorepo
- [x] Estructura de navegación
- [x] Sistema de temas
- [x] Componentes base

### Fase 2: Base de Datos (En Progreso)
- [ ] Integración de SQLite en la app móvil
- [ ] Modelos de datos
- [ ] Migraciones
- [ ] Seeders con datos de ejemplo

### Fase 3: Funcionalidad Core
- [ ] CRUD de cuentas
- [ ] CRUD de transacciones
- [ ] CRUD de categorías
- [ ] Cálculo de balances

### Fase 4: Estadísticas y Reportes
- [ ] Gráficos de gastos
- [ ] Filtros y búsqueda
- [ ] Exportación de datos

### Fase 5: Mejoras UX
- [ ] Onboarding
- [ ] Tutoriales
- [ ] Notificaciones locales
- [ ] Backup local

## Consideraciones de Seguridad

- Los datos nunca salen del dispositivo
- No hay transmisión de información personal
- SQLite con cifrado opcional (futuro)
- Autenticación biométrica (futuro)

## Licencia

Proyecto privado - Todos los derechos reservados

## Contacto y Soporte

Para preguntas o soporte, contactar al equipo de desarrollo.

---

**Última actualización**: Febrero 2026
**Versión**: 1.0.0
