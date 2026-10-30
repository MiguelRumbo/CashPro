# 💰 CashPro

<div align="center">
  <img src="docs/cashpro-logo.svg" alt="CashPro Logo" width="200"/>
  
  <p><strong>Aplicación móvil profesional de gestión financiera personal</strong></p>
  
  [![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/yourusername/cashpro)
  [![License](https://img.shields.io/badge/license-ISC-green.svg)](LICENSE)
  [![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61dafb.svg)](https://reactnative.dev/)
  [![Expo](https://img.shields.io/badge/Expo-54.0-000020.svg)](https://expo.dev/)
  [![Node.js](https://img.shields.io/badge/Node.js-16+-339933.svg)](https://nodejs.org/)
</div>

---

## 📋 Descripción

CashPro es una aplicación móvil completa para la gestión de finanzas personales que te permite:

- 💳 Gestionar múltiples cuentas (efectivo, banco, débito, crédito)
- 📊 Registrar y categorizar ingresos y gastos
- 🎯 Crear y seguir presupuestos
- 💰 Establecer metas de ahorro
- 🏦 Controlar préstamos y deudas
- 🔄 Gestionar suscripciones y pagos recurrentes
- 🚗 Llevar control de gastos de vehículos
- 📈 Visualizar análisis y reportes financieros

## ✨ Características Principales

### Gestión de Cuentas
- Soporte para múltiples tipos de cuentas
- Establecer cuenta principal
- Configuración de límites de crédito
- Cálculo automático de balances

### Movimientos Financieros
- Registro de gastos, ingresos y transferencias
- Categorización flexible
- Historial completo de transacciones
- Actualización automática de saldos

### Presupuestos Inteligentes
- Presupuestos semanales y mensuales
- Seguimiento automático de gastos
- Alertas de límites
- Visualización de progreso

### Metas de Ahorro
- Define objetivos financieros
- Seguimiento de contribuciones
- Visualización de progreso
- Fechas objetivo

### Control de Préstamos
- Préstamos otorgados y recibidos
- Seguimiento de pagos
- Cálculo de intereses
- Historial de amortización

### Análisis y Reportes
- Balance total en tiempo real
- Estadísticas de ingresos/gastos
- Análisis por categorías
- Tendencias temporales

## 🏗️ Arquitectura

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
│    (Migración a SQLite planeada)    │
└─────────────────────────────────────┘
```

## 🛠️ Tecnologías

### Backend
- **Node.js** - Runtime de JavaScript
- **Express.js** 5.2.1 - Framework web
- **better-sqlite3** - Base de datos (planeado)
- **CORS** - Manejo de políticas CORS

### Frontend
- **React** 19.1.0 - Librería UI
- **React Native** 0.81.5 - Framework móvil
- **Expo** ~54.0.33 - Plataforma de desarrollo
- **Expo Router** ~6.0.23 - Sistema de navegación
- **TypeScript** ~5.9.2 - Tipado estático

### Herramientas
- **pnpm** 10.30.0 - Gestor de paquetes
- **Nodemon** - Hot reload en desarrollo

## 📦 Instalación

### Requisitos Previos

- Node.js v16 o superior
- pnpm 10.30.0
- Expo CLI
- Dispositivo móvil o emulador (iOS/Android)

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/yourusername/cashpro.git
cd cashpro
```

2. **Instalar dependencias**
```bash
pnpm install
```

3. **Configurar la red local**

Editar `apps/mobile/app.json` y actualizar la IP:
```json
{
  "expo": {
    "extra": {
      "apiHost": "TU_IP_LOCAL"
    }
  }
}
```

Para obtener tu IP local:
- **Windows:** `ipconfig`
- **Mac/Linux:** `ifconfig` o `ip addr`

4. **Iniciar el proyecto**

Opción 1 - Todo junto:
```bash
pnpm dev
```

Opción 2 - Por separado:
```bash
# Terminal 1 - API
pnpm dev:api

# Terminal 2 - Móvil
pnpm dev:mobile
```

5. **Abrir en dispositivo**
- Escanear el código QR con Expo Go (iOS/Android)
- O presionar `a` para Android, `i` para iOS

## 🚀 Scripts Disponibles

### Raíz del Proyecto
```bash
pnpm dev          # Iniciar API y móvil simultáneamente
pnpm dev:api      # Iniciar solo API
pnpm dev:mobile   # Iniciar solo móvil con túnel
```

### API (`apps/api`)
```bash
pnpm dev          # Desarrollo con hot reload
pnpm start        # Producción
pnpm seed         # Poblar datos de demostración
```

### Móvil (`apps/mobile`)
```bash
pnpm start        # Iniciar Expo
pnpm android      # Abrir en Android
pnpm ios          # Abrir en iOS
pnpm web          # Abrir en navegador
pnpm lint         # Ejecutar linter
```

## 📁 Estructura del Proyecto

```
cashpro/
├── apps/
│   ├── api/                    # Backend REST API
│   │   ├── src/
│   │   │   ├── database/       # Capa de acceso a datos
│   │   │   ├── routes/         # Endpoints de la API
│   │   │   └── index.js        # Punto de entrada
│   │   ├── data.json           # Base de datos JSON
│   │   └── package.json
│   │
│   └── mobile/                 # Aplicación móvil
│       ├── app/                # Rutas (Expo Router)
│       │   ├── (tabs)/         # Navegación principal
│       │   ├── accounts/       # Pantallas de cuentas
│       │   ├── budgets/        # Pantallas de presupuestos
│       │   └── ...
│       ├── components/         # Componentes reutilizables
│       ├── config/             # Configuración
│       ├── contexts/           # Context API
│       ├── hooks/              # Custom hooks
│       └── utils/              # Utilidades
│
├── docs/                       # Documentación
│   ├── DOCUMENTACION_TECNICA.md
│   ├── LOGO_ICONO_INSTRUCCIONES.md
│   └── cashpro-logo.svg
│
└── package.json                # Configuración raíz
```

## 📚 Documentación

- [📖 Documentación Técnica Completa](docs/DOCUMENTACION_TECNICA.md)
- [🎨 Guía de Logo e Iconos](docs/LOGO_ICONO_INSTRUCCIONES.md)
- [🚀 Inicio Rápido](docs/INICIO_RAPIDO.md)
- [🔧 Configuración de Red](docs/CONFIGURACION_RED.md)

## 🔌 API Endpoints

### Cuentas
- `GET /api/accounts` - Listar todas las cuentas
- `POST /api/accounts` - Crear cuenta
- `PUT /api/accounts/:id` - Actualizar cuenta
- `DELETE /api/accounts/:id` - Eliminar cuenta
- `GET /api/accounts/stats/total-balance` - Balance total

### Movimientos
- `GET /api/movements` - Listar movimientos
- `POST /api/movements` - Crear movimiento
- `PUT /api/movements/:id` - Actualizar movimiento
- `DELETE /api/movements/:id` - Eliminar movimiento

### Presupuestos
- `GET /api/budgets` - Listar presupuestos
- `POST /api/budgets` - Crear presupuesto
- `PUT /api/budgets/:id` - Actualizar presupuesto
- `DELETE /api/budgets/:id` - Eliminar presupuesto

### Otros Módulos
- `/api/profile` - Perfil de usuario
- `/api/savings-goals` - Metas de ahorro
- `/api/loans` - Préstamos
- `/api/recurring-payments` - Pagos recurrentes
- `/api/vehicles` - Vehículos
- `/api/notifications` - Notificaciones

Ver [documentación completa de la API](docs/DOCUMENTACION_TECNICA.md#backend-api) para más detalles.

## 🎨 Personalización

### Temas
La aplicación soporta temas claro y oscuro automáticamente según las preferencias del sistema.

### Monedas
Soporta múltiples monedas configurables desde el perfil de usuario.

### Categorías
Sistema flexible de categorías para organizar tus transacciones.

## 🐛 Solución de Problemas

### La app no se conecta al API

1. Verificar que el API esté corriendo
2. Confirmar que la IP en `app.json` sea correcta
3. Asegurar que ambos dispositivos estén en la misma red
4. Verificar firewall y permisos de red

### Resetear datos

```bash
# Opción 1: Endpoint de reset
curl -X POST http://localhost:3000/api/reset

# Opción 2: Eliminar archivo
rm apps/api/data.json
```

### Datos de prueba

```bash
cd apps/api
pnpm seed
```

## 🗺️ Roadmap

### v1.1 (Próximamente)
- [ ] Migración a SQLite
- [ ] Gráficos y visualizaciones mejoradas
- [ ] Exportación de datos (CSV, PDF)
- [ ] Modo offline

### v1.2
- [ ] Autenticación de usuarios
- [ ] Sincronización en la nube
- [ ] Notificaciones push
- [ ] Widgets

### v2.0
- [ ] Múltiples usuarios
- [ ] Compartir cuentas
- [ ] Categorías personalizadas
- [ ] Importación bancaria

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'feat: agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

### Convención de Commits

```
tipo(alcance): descripción

[cuerpo opcional]
```

Tipos: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## 📄 Licencia

Este proyecto está bajo la Licencia ISC.

## 👥 Autores

- Tu Nombre - Desarrollo inicial

## 🙏 Agradecimientos

- Expo team por la excelente plataforma
- React Native community
- Todos los contribuidores

## 📞 Contacto

- **Issues:** [GitHub Issues](https://github.com/yourusername/cashpro/issues)
- **Email:** tu-email@ejemplo.com
- **Website:** https://cashpro.app

---

<div align="center">
  <p>Hecho con ❤️ para ayudarte a gestionar mejor tus finanzas</p>
  <p><strong>CashPro v1.0.0</strong></p>
</div>
