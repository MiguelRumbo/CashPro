# CashPro - Hoja de Requerimientos, Cambios y Mejoras

> Documento generado a partir de una revision completa del proyecto
> Fecha: 2026-02-18 | Version actual: v1.0.2 Build 2405
> Branch: `prod`

---

## Tabla de Contenido

1. [Estado Actual del Proyecto](#1-estado-actual-del-proyecto)
2. [Bugs Criticos a Corregir](#2-bugs-criticos-a-corregir)
3. [Mejoras a Funcionalidades Existentes](#3-mejoras-a-funcionalidades-existentes)
4. [Nuevos Modulos y Funcionalidades](#4-nuevos-modulos-y-funcionalidades)
5. [Mejoras Tecnicas y de Infraestructura](#5-mejoras-tecnicas-y-de-infraestructura)
6. [Prioridad y Fases de Implementacion](#6-prioridad-y-fases-de-implementacion)

---

## 1. Estado Actual del Proyecto

### Stack Tecnologico
| Componente | Tecnologia |
|---|---|
| Mobile | React Native 0.81.5 + Expo ~54.0.33 |
| Navegacion | Expo Router ~6.0.23 (file-based) |
| Backend | Express.js 5.2.1 (Node.js) |
| Base de Datos | JSON file temporal (`data.json`) |
| BD Prevista | better-sqlite3 (no funcional actualmente) |
| Estado | React local (`useState`) + Context API (CurrencyContext) |
| Monorepo | pnpm workspaces |

### Funcionalidades Actuales (funcionando)
- CRUD completo de cuentas (efectivo, banco, debito, credito)
- CRUD de movimientos (gasto, ingreso, transferencia)
- Actualizacion automatica de balance al crear/editar/eliminar movimientos (incluye cuentas de credito)
- CRUD de presupuestos con actualizacion automatica vinculada a categorias
- Dashboard con datos reales de la API filtrados por mes actual
- Tema claro/oscuro en toda la app
- Formateo de moneda global (MXN, USD, EUR) con Context API
- Pull-to-refresh en todas las pantallas con listas
- Eliminacion total de datos (reset)
- Busqueda y filtros funcionales en movimientos y estadisticas
- Exportacion de datos (CSV y JSON)

### Pantallas Actuales
| Tab | Pantalla | Estado |
|---|---|---|
| 1 | Dashboard (Inicio) | Funcional con datos hardcodeados parciales |
| 2 | Movimientos | Funcional, filtros/busqueda no implementados |
| 3 | Estadisticas | Parcialmente funcional, datos mock |
| 4 | Cuentas | Funcional |
| 5 | Ajustes | Mayormente UI sin funcionalidad |
| Stack | Detalle de cuenta | Funcional |
| Stack | Agregar/Editar cuenta | Funcional (con bugs) |
| Stack | Presupuestos | Parcialmente funcional |
| Stack | Agregar presupuesto | Funcional |
| Stack | Editar presupuesto | **NO EXISTE** (crash al navegar) |
| Stack | Agregar movimiento | Funcional |

---

## 2. Bugs Criticos a Corregir

### BUG-001: Pantalla edit-budget no existe ✅ RESUELTO
- **Archivo afectado:** `budgets/index.tsx` hace `router.push('/budgets/edit-budget?id=...')`
- **Problema:** No existe el archivo `edit-budget.tsx`. Al tocar un presupuesto, la app crashea.
- **Solucion:** Crear `apps/mobile/app/budgets/edit-budget.tsx` con el formulario de edicion.
- **Estado:** ✅ Resuelto - Pantalla creada con carga de datos, formulario pre-poblado y actualización via PUT.

### BUG-002: Campo nombre duplicado en cuenta tipo Debito ✅ RESUELTO
- **Archivo afectado:** `accounts/add-account.tsx`
- **Problema:** En cuentas tipo debito, el campo "Nombre de la Tarjeta" usa el mismo state (`name`) que "Nombre de la Cuenta". Ambos campos estan enlazados y se sobreescriben.
- **Solucion:** Usar un state separado o remover el campo duplicado.
- **Estado:** ✅ Resuelto - Campo duplicado eliminado, agregado campo "Banco" en su lugar.

### BUG-003: Movimientos en cuentas de credito no actualizan `current_balance` ✅ RESUELTO
- **Archivo afectado:** `apps/api/src/routes/movements.js`
- **Problema:** Al registrar un gasto en una cuenta de credito, se modifica `balance` (que siempre es 0 para credito) en lugar de `current_balance`. La deuda de la tarjeta de credito nunca se actualiza automaticamente.
- **Solucion:** Detectar tipo de cuenta en la ruta de movimientos y actualizar `current_balance` para cuentas de credito.
- **Estado:** ✅ Resuelto - Lógica implementada para crear, actualizar y eliminar movimientos. Gasto incrementa deuda, ingreso decrementa deuda.

### BUG-004: Numero de tarjeta almacenado en texto plano ✅ RESUELTO
- **Archivo afectado:** `apps/api/data.json`, rutas de cuentas
- **Problema:** Se almacena el numero completo de tarjeta y se retorna via API GET. Solo deberia guardarse `card_last_four`.
- **Solucion:** Almacenar solo ultimos 4 digitos. No guardar numero completo en BD.
- **Estado:** ✅ Resuelto - Solo se guarda `card_last_four`. Número completo nunca se almacena ni retorna.

### BUG-005: Filtros y busqueda no funcionales ✅ RESUELTO
- **Archivos afectados:** `movements.tsx`, `explore.tsx`
- **Problema:** Los chips de filtro (Hoy, Semana, Mes, Anio) actualizan state pero no filtran datos. La barra de busqueda no tiene handler.
- **Solucion:** Implementar logica de filtrado por fecha y busqueda por texto en movimientos.
- **Estado:** ✅ Resuelto - Búsqueda en tiempo real por título/categoría/notas. Filtros por fecha funcionando correctamente.

### BUG-006: Botones sin funcionalidad en headers ✅ RESUELTO
- **Archivos afectados:** `movements.tsx`, `explore.tsx`
- **Problema:** Boton de retroceso y boton "+" en headers no tienen `onPress`.
- **Solucion:** Conectar navegacion o eliminar botones innecesarios.
- **Estado:** ✅ Resuelto - Botones innecesarios eliminados. Botón de reportes conectado a presupuestos.

### BUG-007: Dashboard muestra "este mes" pero calcula con todos los datos historicos ✅ RESUELTO
- **Archivo afectado:** `(tabs)/index.tsx`
- **Problema:** El badge dice "este mes" pero `totalIncome`, `totalExpense` y categorias se calculan con TODOS los movimientos sin filtrar por mes actual.
- **Solucion:** Agregar parametros de fecha a la API o filtrar client-side por mes actual.
- **Estado:** ✅ Resuelto - Movimientos filtrados por mes actual. Porcentaje de cambio calculado comparando mes actual vs mes anterior.

### BUG-008: Porcentaje de cambio hardcodeado en Estadisticas ✅ RESUELTO
- **Archivo afectado:** `(tabs)/explore.tsx`
- **Problema:** `expenseChange` siempre es `-12` (hardcodeado). El insight dice "12% menos en comida" como texto estatico.
- **Solucion:** Calcular porcentaje real comparando mes actual vs mes anterior.
- **Estado:** ✅ Resuelto - Porcentaje calculado comparando gastos del mes actual vs mes anterior.

### BUG-009: Iconos rotos en Android ✅ RESUELTO
- **Archivo afectado:** `components/ui/icon-symbol.tsx`
- **Problema:** Muchos nombres de SF Symbols usados en las pantallas (`tray`, `xmark`, `arrow.left.arrow.right`, `sparkles`, `briefcase.fill`, `gift.fill`, `doc.text.fill`, `note.text`, `clock`, `trash`, `trash.fill`, `building.columns.fill`, `exclamationmark.triangle.fill`) no estan en el `MAPPING` de MaterialIcons. En Android se muestran iconos rotos/vacios.
- **Solucion:** Agregar todos los mapeos faltantes de SF Symbols a MaterialIcons.
- **Estado:** ✅ Resuelto - Todos los iconos faltantes agregados al mapeo de MaterialIcons.

### BUG-010: IP local hardcodeada en configuracion ✅ RESUELTO
- **Archivo afectado:** `apps/mobile/config/api.ts`
- **Problema:** `const LOCAL_IP = '192.168.1.6'` es la IP especifica de la maquina del desarrollador. Falla si cambia la red.
- **Solucion:** Usar variable de entorno o deteccion automatica de red.
- **Estado:** ✅ Resuelto - IP ahora se obtiene desde `app.json` (extra.apiHost). Creado archivo `.env.example` con instrucciones.

---

## 3. Mejoras a Funcionalidades Existentes

### 3.1 Cuentas de Credito - Mejora Completa

**Estado actual:** Las cuentas de credito almacenan `credit_limit`, `current_balance`, `cut_off_day` y `payment_due_day`, pero la informacion de credito no se integra con el resto de la app.

**Requerimientos:**

#### REQ-CRED-01: Balance de credito correcto en movimientos ✅ RESUELTO
- Cuando se registre un gasto en cuenta de credito, incrementar `current_balance` (deuda).
- Cuando se registre un ingreso/pago en cuenta de credito, decrementar `current_balance`.
- El credito disponible = `credit_limit - current_balance`.
- **Estado:** ✅ Resuelto - Implementado en BUG-003. Los movimientos actualizan correctamente el `current_balance` de cuentas de crédito.

#### REQ-CRED-02: Opcion "Incluir en balance general" ✅ RESUELTO
- Agregar un campo `include_in_balance` (boolean, default: `false`) en cuentas de credito.
- En el detalle de la cuenta, mostrar un toggle/check para activar o desactivar.
- Si esta desactivado, la deuda de credito NO se resta del balance total del dashboard.
- Si esta activado, funciona como actualmente (resta del balance general).
- **Estado:** ✅ Resuelto - Campo agregado a BD. Toggle implementado en pantalla de detalle. Cálculo de balance total actualizado para respetar esta configuración.

#### REQ-CRED-03: Movimientos de credito diferenciados visualmente ✅ RESUELTO
- En la lista de movimientos, los gastos realizados con tarjeta de credito deben tener un indicador visual distinto (icono, badge o color) para distinguirlos de gastos con debito/efectivo.
- Mostrar el nombre de la tarjeta junto al movimiento.
- **Estado:** ✅ Resuelto - Badge de tarjeta de crédito agregado en lista de movimientos. Nombre de cuenta mostrado en metadata del movimiento.

#### REQ-CRED-04: Notificaciones de fechas de credito
- Notificacion push cuando se acerca la fecha de corte (`cut_off_day`): 3 dias antes y el mismo dia.
- Notificacion push cuando se acerca la fecha de pago (`payment_due_day`): 5 dias antes, 3 dias antes, y el mismo dia.
- Indicar en la notificacion el monto de deuda actual (`current_balance`).
- **Estado:** ⏳ Pendiente - Requiere implementación del módulo de notificaciones push (Fase 3).

---

### 3.2 Cuenta Principal

**Estado actual:** El campo `is_primary` existe en la BD pero no se usa. El dashboard marca como "Principal" la primera cuenta del array.

**Requerimientos:**

#### REQ-PRIM-01: Toggle de cuenta principal en detalle ✅ RESUELTO
- En la pantalla de detalle de cuenta, agregar un check/toggle "Cuenta principal".
- Solo una cuenta puede ser principal a la vez.
- Al marcar una cuenta, desmarcar automaticamente la anterior.
- Endpoint API: `PUT /api/accounts/:id/set-primary`.
- **Estado:** ✅ Resuelto - Toggle implementado en pantalla de detalle. Endpoint creado. Al marcar una cuenta como principal, automáticamente desmarca las demás.

#### REQ-PRIM-02: Cuenta principal en Dashboard ✅ RESUELTO
- El dashboard debe mostrar la cuenta marcada como principal con el badge "Principal" (no la primera del array).
- Si no hay ninguna marcada, mostrar la mas antigua como default.
- **Estado:** ✅ Resuelto - Dashboard actualizado para mostrar la cuenta con `is_primary = 1`. Las cuentas vienen ordenadas por `is_primary DESC` desde la API.

#### REQ-PRIM-03: Cuenta principal preseleccionada en movimientos ✅ RESUELTO
- Al agregar un nuevo movimiento (gasto/ingreso), la cuenta principal debe venir preseleccionada por defecto en el selector de cuenta.
- El usuario puede cambiarla, pero por defecto aparece la principal.
- **Estado:** ✅ Resuelto - Al cargar cuentas en agregar movimiento, se preselecciona automáticamente la cuenta marcada como principal.

---

### 3.3 Presupuestos - Rediseno Completo

**Estado actual:** Los presupuestos son metas manuales sin conexion con movimientos. `current_amount` siempre es 0 a menos que se actualice via PUT manual. No hay pantalla de edicion (crash).

**Requerimientos:**

#### REQ-PRES-01: Presupuestos vinculados a categorias ✅ RESUELTO
- Cada presupuesto debe estar asociado a una o mas categorias de gasto.
- Nuevo campo: `category_ids: string[]` (array de IDs de categorias vinculadas).
- Al crear presupuesto, selector de categorias (en lugar de o ademas del icono actual).
- **Estado:** ✅ Resuelto - Campo `category_ids` agregado. Selector de categorías implementado en agregar y editar presupuesto. Solo para presupuestos de tipo "gasto". Opcional: si no se seleccionan categorías, rastrea todos los gastos.

#### REQ-PRES-02: Actualizacion automatica del presupuesto ✅ RESUELTO
- Cuando se registre un movimiento tipo "gasto" cuya categoria coincida con las categorias del presupuesto, sumar automaticamente el monto al `current_amount` del presupuesto.
- Cuando se elimine o edite un movimiento, ajustar el `current_amount` correspondientemente.
- La logica debe ejecutarse en el backend al crear/editar/eliminar movimientos.
- **Estado:** ✅ Resuelto - Función `updateBudgetsForMovement` creada. Se llama automáticamente al crear/editar/eliminar movimientos de tipo gasto. Actualiza `current_amount` según las categorías vinculadas.

#### REQ-PRES-03: Reset periodico automatico ⏳ PENDIENTE
- Los presupuestos con periodo "mensual" deben resetear `current_amount` a 0 al inicio de cada mes.
- Los presupuestos con periodo "semanal" deben resetear cada lunes.
- Implementar via un check de fecha al consultar presupuestos (o cron job).
- **Estado:** ⏳ Pendiente - Requiere implementación de cron job o verificación en cada consulta. Se implementará en actualización futura.

#### REQ-PRES-04: Pantalla de edicion de presupuestos ✅ RESUELTO
- Crear `budgets/edit-budget.tsx` con el formulario pre-poblado.
- Mismos campos que crear, incluyendo el nuevo selector de categorias.
- **Estado:** ✅ Resuelto - Pantalla creada en BUG-001. Actualizada con selector de categorías.

#### REQ-PRES-05: Alertas de presupuesto 🔄 PARCIAL
- Notificacion cuando un presupuesto de gasto alcance el 80% del limite.
- Notificacion cuando un presupuesto de gasto se exceda (100%+).
- Indicador visual en la lista de presupuestos (color rojo/amarillo).
- **Estado:** 🔄 Parcial - Indicador visual implementado (banner de advertencia al exceder 100%). Notificaciones push pendientes (requiere módulo de notificaciones - Fase 3).

#### REQ-PRES-06: Vista mejorada de presupuestos 🔄 PARCIAL
- Barra de progreso con colores: verde (<60%), amarillo (60-80%), rojo (>80%).
- Mostrar monto gastado / monto total y porcentaje.
- Mostrar dias restantes del periodo actual.
- Grafica de tendencia de gasto dentro del periodo.
- **Estado:** 🔄 Parcial - Barra de progreso con colores implementada ✅. Muestra monto gastado/total y porcentaje ✅. Badge con porcentaje ✅. Banner de advertencia cuando se excede ✅. **Días restantes ⏳ y gráfica de tendencia ⏳ pendientes para futuras mejoras.**
- **Archivos**: `apps/mobile/app/budgets/index.tsx`

---

### 3.4 Estadisticas - Datos Reales

**Estado actual:** La pantalla de estadisticas tiene datos mock, filtros no funcionales, y un grafico de dona basado en CSS.

**Requerimientos:**

#### REQ-STAT-01: Filtros de fecha funcionales ✅ RESUELTO
- Implementar filtrado real por: Este mes, Mes pasado, 3 meses, Personalizado (range picker).
- Los datos del grafico de barras, dona y totales deben reflejar el rango seleccionado.
- **Estado:** ✅ Resuelto - Filtros funcionales implementados. Los datos se actualizan según el filtro seleccionado. Personalizado pendiente de date picker UI.

#### REQ-STAT-02: Porcentaje de cambio calculado ✅ RESUELTO
- Calcular `expenseChange` real: `((gastoMesActual - gastoMesPasado) / gastoMesPasado) * 100`.
- Mostrar si gasto mas (+%) o menos (-%) respecto al periodo anterior.
- **Estado:** ✅ Resuelto - Porcentaje calculado dinámicamente comparando periodo actual vs periodo anterior del mismo tamaño.

#### REQ-STAT-03: Insight dinamico ✅ RESUELTO
- Generar texto de insight basado en datos reales:
  - Categoria donde mas se gasta.
  - Comparacion vs periodo anterior.
  - Tendencia (subiendo/bajando).
- **Estado:** ✅ Resuelto - Insight generado dinámicamente basado en datos reales. Muestra categoría top, porcentaje de cambio y recomendaciones contextuales.

#### REQ-STAT-04: Graficos mejorados 🔄 PARCIAL
- Considerar usar una libreria de graficos como `react-native-chart-kit` o `victory-native` para graficos mas robustos.
- Grafico de dona real (no basado en CSS border).
- Grafico de barras con etiquetas y valores.
- **Estado:** 🔄 Parcial - Gráficos actuales funcionan con datos reales. Mejora con librería especializada pendiente para futuras versiones.

---

### 3.5 Movimientos - Mejoras

#### REQ-MOV-01: Busqueda funcional ✅ RESUELTO
- Implementar filtrado en tiempo real por titulo, categoria y notas.
- Debounce de 300ms en el input de busqueda.
- **Estado:** ✅ Resuelto - Búsqueda en tiempo real implementada. Filtra por título, categoría y notas.

#### REQ-MOV-02: Filtros de fecha funcionales ✅ RESUELTO
- Los chips de filtro (Hoy, Semana, Mes, Anio, Personalizado) deben filtrar la lista.
- Personalizado abre un date range picker.
- **Estado:** ✅ Resuelto - Filtros de fecha funcionando correctamente. Personalizado pendiente de date picker UI.

#### REQ-MOV-03: Categorias personalizadas ⏳ PENDIENTE
- Permitir al usuario crear categorias propias (nombre, icono, color).
- El boton "Agregar" en el modal de categorias debe funcionar.
- CRUD de categorias en la API.
- Categorias por defecto + categorias del usuario.
- **Estado:** ⏳ Pendiente - Requiere implementación de CRUD de categorías en backend y frontend. Se implementará en futuras versiones.

---

### 3.6 Perfil de Usuario

**Estado actual:** Datos hardcodeados. No hay sistema de usuario.

**Requerimientos:**

#### REQ-PERF-01: Edicion de perfil basico ✅ RESUELTO
- Campos editables: nombre y correo electronico.
- Los datos se guardan en la BD (nueva tabla/coleccion `user_profile`).
- Endpoint: `GET /api/profile`, `PUT /api/profile`.
- **Estado:** ✅ Resuelto - Endpoints creados. Pantalla de edición de perfil implementada. Datos se guardan en BD JSON.

#### REQ-PERF-02: Nombre en Dashboard ✅ RESUELTO
- El saludo del dashboard ("Hola, [nombre]") usa el nombre guardado del perfil.
- Iniciales generadas del nombre guardado para el avatar.
- **Estado:** ✅ Resuelto - Dashboard carga y muestra el nombre del perfil. Iniciales generadas automáticamente.

#### REQ-PERF-03: Avatar con iniciales ✅ RESUELTO
- En todo lugar donde se muestre el avatar (dashboard, ajustes), usar las iniciales del nombre guardado.
- Ejemplo: "Miguel Rumbo" => "MR" en un circulo con el color primario.
- **Estado:** ✅ Resuelto - Avatar con iniciales implementado en dashboard y ajustes. Se genera automáticamente desde el nombre del perfil.

---

### 3.7 Ajustes - Funcionalidades Pendientes

#### REQ-AJUS-01: Moneda persistida ✅ RESUELTO
- La seleccion de moneda en ajustes debe guardarse en la BD (perfil de usuario).
- Aplicarse globalmente al formateo de montos en toda la app.
- **Estado:** ✅ Resuelto - Campo `currency` agregado al perfil de usuario. La moneda se guarda al seleccionarla en ajustes. **Aplicación global implementada mediante CurrencyContext** (Context API). Todas las pantallas usan el hook `useCurrency()` para formatear montos. Soporta MXN, USD y EUR con sus respectivos formatos y símbolos.
- **Archivos modificados**: 
  - Creado: `apps/mobile/contexts/CurrencyContext.tsx`
  - Modificados: `apps/mobile/app/_layout.tsx`, `apps/mobile/app/(tabs)/settings.tsx`, `apps/mobile/app/(tabs)/index.tsx`, `apps/mobile/app/(tabs)/explore.tsx`, `apps/mobile/app/(tabs)/movements.tsx`, `apps/mobile/app/budgets/index.tsx`

#### REQ-AJUS-02: Exportar CSV ✅ RESUELTO
- Generar archivo CSV con todos los movimientos.
- Compartir via `expo-sharing` o guardar en almacenamiento local.
- Incluir: fecha, tipo, titulo, categoria, monto, cuenta, notas.
- **Estado:** ✅ Resuelto - Función de exportación implementada. Genera CSV con todos los movimientos y permite compartir el archivo.

#### REQ-AJUS-03: Importar respaldo 🔄 PARCIAL
- Permitir importar un archivo JSON con datos previamente exportados.
- Validar estructura antes de importar.
- **Estado:** 🔄 Parcial - Exportación de respaldo JSON implementada. Importación pendiente (requiere selector de archivos y validación).

---

## 4. Nuevos Modulos y Funcionalidades

### 4.1 Modulo de Objetivos de Ahorro ✅ COMPLETADO

**Descripcion:** Metas de ahorro con seguimiento por fecha y monto.

#### REQ-OBJ-01: Modelo de datos ✅ RESUELTO
```
Objetivo {
  id: number
  name: string
  target_amount: number        // Meta de ahorro
  current_amount: number       // Monto ahorrado hasta ahora
  deadline: date               // Fecha objetivo
  icon: string
  color: string
  account_id: number | null    // Cuenta vinculada (opcional)
  auto_deduct: boolean         // Descuento automatico periodico
  auto_deduct_amount: number   // Monto a descontar automaticamente
  auto_deduct_period: string   // "weekly" | "biweekly" | "monthly"
  status: string               // "active" | "completed" | "cancelled"
  created_at: datetime
  updated_at: datetime
}

GoalContribution {
  id: number
  goal_id: number
  amount: number
  date: datetime
  notes: string | null
  created_at: datetime
}
```
- **Estado:** ✅ Resuelto - Estructura de BD implementada en `apps/api/src/database/db-json.js`
- **Archivos:** `apps/api/src/database/db-json.js` (agregados `savings_goals` y `goal_contributions`)

#### REQ-OBJ-02: Funcionalidades ✅ RESUELTO
- ✅ CRUD completo de objetivos implementado en API REST
- ✅ Pantalla con lista de objetivos activos y completados (`apps/mobile/app/savings-goals/index.tsx`)
- ✅ Barra de progreso lineal con porcentaje y monto faltante
- ✅ Cálculo de ahorro diario requerido para llegar a la meta
- ✅ Cálculo de días restantes hasta la fecha límite
- ✅ Agregar contribución manualmente al objetivo (modal en detalle)
- ✅ Historial de contribuciones por objetivo
- ✅ Indicador visual de descuento automático (badge)
- ✅ Selector de 8 iconos con colores personalizados
- ⏳ Notificación al completar objetivo (requiere módulo de notificaciones - Fase 3)
- ⏳ Notificación de ritmo insuficiente (requiere módulo de notificaciones - Fase 3)

**API Endpoints implementados:**
- `GET /api/savings-goals` - Listar objetivos
- `GET /api/savings-goals/:id` - Obtener objetivo específico
- `POST /api/savings-goals` - Crear objetivo
- `PUT /api/savings-goals/:id` - Actualizar objetivo
- `DELETE /api/savings-goals/:id` - Eliminar objetivo
- `POST /api/savings-goals/:id/contribute` - Agregar contribución
- `GET /api/savings-goals/:id/contributions` - Listar contribuciones
- `GET /api/savings-goals/stats/summary` - Estadísticas generales

**Pantallas implementadas:**
- `apps/mobile/app/savings-goals/index.tsx` - Lista de objetivos con progreso
- `apps/mobile/app/savings-goals/add-goal.tsx` - Formulario para crear objetivo
- `apps/mobile/app/savings-goals/goal-detail.tsx` - Detalle con historial y contribuciones

**Archivos:** `apps/api/src/routes/savings-goals.js`, `apps/api/src/index.js`, pantallas en `apps/mobile/app/savings-goals/`

#### REQ-OBJ-04: Correcciones Técnicas (19 Feb 2026) ✅ RESUELTO
**Problemas identificados y corregidos:**

1. **Error al crear objetivo:**
   - ❌ Problema: `TypeError: require(...).readDB is not a function`
   - ❌ Causa: Uso incorrecto de `readDB()` en lugar de `db.prepare()`
   - ✅ Solución: Todas las funciones ahora usan `db.prepare()` correctamente
   - ✅ Eliminados todos los usos de `readDB()`/`writeDB()` directos

2. **Código duplicado causando SyntaxError:**
   - ❌ Problema: Líneas 275-280 tenían código duplicado
   - ❌ Error: `SyntaxError: Unexpected token '.'` y `Unexpected identifier 'data'`
   - ✅ Solución: Eliminado código duplicado en función de contribuciones

3. **Estructura de BD faltante:**
   - ❌ Problema: `savings_goals` y `goal_contributions` no existían en data.json
   - ✅ Solución: Agregadas estructuras con sus respectivos nextId counters
   - ✅ Agregados handlers INSERT, UPDATE, DELETE en `db-json.js`

**Archivos modificados:**
- `apps/api/src/routes/savings-goals.js` - Corregidos todos los métodos para usar db.prepare()
- `apps/api/src/database/db-json.js` - Agregados handlers completos
- `apps/api/data.json` - Estructuras agregadas

#### REQ-OBJ-05: Corrección Frontend - Renderizado de Texto (19 Feb 2026) ✅ RESUELTO
**Problema identificado y corregido:**

- ❌ Problema: Error "Text strings must be rendered within a <Text> component"
- ❌ Causa: Valores `null` o `undefined` en `auto_deduct_amount` y `auto_deduct_period`
- ✅ Solución: Agregada validación adicional antes de renderizar el texto de descuento automático
- ✅ Ahora verifica que `auto_deduct`, `auto_deduct_amount` y `auto_deduct_period` existan

**Archivos modificados:**
- `apps/mobile/app/savings-goals/index.tsx` - Agregada validación de campos

#### REQ-OBJ-03: Navegacion ✅ RESUELTO
- ✅ Card resumen en dashboard mostrando progreso general de objetivos activos
- ✅ Navegación desde dashboard a pantalla de objetivos
- ✅ Muestra total ahorrado vs meta total con barra de progreso
- ✅ Porcentaje de completitud general
- ✅ Solo se muestra si hay objetivos activos

**Archivos:** `apps/mobile/app/(tabs)/index.tsx` (agregado card de objetivos con estilos completos)

---

### 4.2 Modulo de Prestamos ✅ COMPLETADO

**Descripcion:** Registro y seguimiento de dinero prestado a otras personas.

#### REQ-PREST-01: Modelo de datos ✅ RESUELTO
```
Prestamo {
  id: number
  person_name: string          // A quien se le presto
  amount: number               // Monto original prestado
  remaining_amount: number     // Monto pendiente por cobrar
  date: date                   // Fecha del prestamo
  due_date: date | null        // Fecha limite de devolucion (opcional)
  notes: string | null
  account_id: number           // Desde que cuenta se presto
  status: string               // "active" | "partial" | "paid" | "forgiven"
  created_at: datetime
  updated_at: datetime
}

PagosPrestamo {
  id: number
  loan_id: number
  amount: number               // Monto devuelto
  date: date
  notes: string | null
  created_at: datetime
}
```
- **Estado:** ✅ Resuelto - Estructura de BD implementada en `apps/api/src/database/db-json.js`
- **Archivos:** `apps/api/src/database/db-json.js` (agregados `loans` y `loan_payments`)

#### REQ-PREST-02: Funcionalidades ✅ RESUELTO
- ✅ CRUD completo de préstamos implementado en API REST
- ✅ Registrar pagos parciales o totales con actualización automática de estado
- ✅ Historial de pagos recibidos por préstamo
- ✅ Vista de préstamos activos con monto pendiente y barra de progreso
- ✅ Resumen: total prestado, total pendiente, total recuperado, porcentaje de recuperación
- ✅ Cálculo de días restantes hasta fecha límite con indicadores visuales
- ✅ Opción de condonar préstamo
- ✅ Al crear préstamo, opción de descontar automáticamente de la cuenta origen (registra movimiento)
- ⏳ Notificación cuando se acerque fecha límite (requiere módulo de notificaciones - Fase 3)
- ⏳ Notificación periódica recordando préstamos activos (requiere módulo de notificaciones - Fase 3)

**API Endpoints implementados:**
- `GET /api/loans` - Listar préstamos
- `GET /api/loans/:id` - Obtener préstamo específico
- `POST /api/loans` - Crear préstamo (con opción de crear movimiento)
- `PUT /api/loans/:id` - Actualizar préstamo
- `DELETE /api/loans/:id` - Eliminar préstamo
- `POST /api/loans/:id/payment` - Registrar pago (actualiza remaining_amount y status)
- `GET /api/loans/:id/payments` - Listar pagos de un préstamo
- `GET /api/loans/stats/summary` - Estadísticas generales

**Pantallas implementadas:**
- `apps/mobile/app/loans/index.tsx` - Lista de préstamos con resumen y filtros (activos/completados)
- `apps/mobile/app/loans/add-loan.tsx` - Formulario para crear préstamo con opción de descontar
- `apps/mobile/app/loans/loan-detail.tsx` - Detalle con historial de pagos y modal para registrar pagos

**Archivos:** `apps/api/src/routes/loans.js`, `apps/api/src/index.js`, pantallas en `apps/mobile/app/loans/`

#### REQ-PREST-03: Navegacion ✅ RESUELTO
- ✅ Card resumen en dashboard mostrando préstamos activos y monto pendiente
- ✅ Navegación desde dashboard a pantalla de préstamos
- ✅ Opción en settings para acceder a préstamos (debajo de objetivos de ahorro)
- ✅ Badge con total pendiente por cobrar en card del dashboard
- ✅ Indicadores visuales de estado (activo, parcial, pagado, condonado)

**Archivos:** `apps/mobile/app/(tabs)/index.tsx` (agregado card de préstamos), `apps/mobile/app/(tabs)/settings.tsx` (agregada opción)

#### REQ-PREST-04: Correcciones Técnicas (19 Feb 2026) ✅ RESUELTO
**Problemas identificados y corregidos:**

1. **Movimientos de préstamos malformados:**
   - ❌ Problema: Los parámetros del INSERT estaban en orden incorrecto
   - ❌ Resultado: Movimientos con datos en campos equivocados (amount en title, etc.)
   - ✅ Solución: Corregido orden de parámetros en `loans.js` para coincidir con estructura de movements
   - ✅ Agregados campos faltantes: `category_icon: 'banknote'`, `category_color: '#f59e0b'`
   - ✅ Corregido parsing de `amount` a float y `account_id` a int en `db-json.js`

2. **Préstamos no aparecían en la lista:**
   - ❌ Problema: Estructura `loans` no existía en data.json
   - ✅ Solución: Agregadas estructuras faltantes: `loans`, `loan_payments`, `nextLoanId`, `nextLoanPaymentId`
   - ✅ Agregados handlers GET para loans y loan_payments en `db-json.js`

3. **Balance de cuentas no se actualizaba:**
   - ❌ Problema: UPDATE de accounts no manejaba operaciones aritméticas correctamente
   - ✅ Solución: Ya estaba implementado correctamente en versión anterior

4. **Datos corruptos limpiados:**
   - ✅ Eliminados movimientos malformados del data.json
   - ✅ Restaurados balances correctos de cuentas
   - ✅ Reiniciado nextMovementId a valor correcto

**Archivos modificados:**
- `apps/api/src/routes/loans.js` - Corregido INSERT de movimientos
- `apps/api/src/database/db-json.js` - Agregados handlers y corregido parsing
- `apps/api/data.json` - Limpieza de datos y estructuras agregadas

#### REQ-PREST-05: Correcciones Adicionales - Pagos y Condonación (19 Feb 2026) ✅ RESUELTO
**Problemas identificados y corregidos:**

1. **Pagos no creaban movimientos:**
   - ❌ Problema: Al registrar un pago, no se creaba movimiento de ingreso
   - ❌ Resultado: Los pagos no aparecían en la lista de movimientos
   - ✅ Solución: Agregado INSERT de movimiento tipo "income" al registrar pago
   - ✅ Actualización automática del balance de la cuenta

2. **Condonar préstamo no funcionaba:**
   - ❌ Problema: El endpoint PUT no aceptaba `remaining_amount` como parámetro
   - ✅ Solución: Agregado campo `remaining_amount` al UPDATE de préstamos
   - ✅ Ahora se puede condonar correctamente estableciendo status='forgiven' y remaining_amount=0

3. **Card de préstamos no se actualizaba:**
   - ✅ Los totales ahora se calculan correctamente desde la BD
   - ✅ El porcentaje de recuperación se actualiza en tiempo real
   - ✅ El monto pendiente refleja los pagos registrados

**Archivos modificados:**
- `apps/api/src/routes/loans.js` - Agregado movimiento en pagos y campo remaining_amount en PUT

---

### 4.3 Módulo de Contribuciones a Objetivos con Cuentas ✅ COMPLETADO (19 Feb 2026)

**Descripción:** Al agregar una contribución a un objetivo de ahorro, ahora se selecciona la cuenta desde la cual se realiza la contribución, creando un movimiento y actualizando el balance.

#### REQ-OBJ-06: Selector de Cuenta en Contribuciones ✅ RESUELTO
**Funcionalidades implementadas:**

1. **Selector de cuenta en modal de contribución:**
   - ✅ Modal con lista de cuentas disponibles (excluye cuentas de crédito)
   - ✅ Muestra nombre y balance de cada cuenta
   - ✅ Indicador visual de cuenta seleccionada
   - ✅ Validación de saldo suficiente antes de contribuir

2. **Creación automática de movimiento:**
   - ✅ Al agregar contribución, se crea movimiento tipo "expense"
   - ✅ Categoría: "Ahorro" con icono "target" y color verde (#10b981)
   - ✅ Título: "Contribución a [nombre del objetivo]"
   - ✅ El movimiento aparece en la lista de movimientos

3. **Actualización de balance:**
   - ✅ El balance de la cuenta seleccionada se descuenta automáticamente
   - ✅ Manejo correcto de cuentas de crédito (incrementa current_balance)
   - ✅ Manejo correcto de otras cuentas (decrementa balance)

4. **Validaciones:**
   - ✅ Verifica que la cuenta exista
   - ✅ Verifica saldo suficiente (excepto crédito)
   - ✅ Valida que el monto sea mayor a 0
   - ✅ Requiere selección de cuenta

**API Endpoint actualizado:**
- `POST /api/savings-goals/:id/contribute` - Ahora acepta `account_id` y crea movimiento

**Archivos modificados:**
- `apps/mobile/app/savings-goals/goal-detail.tsx` - Agregado selector de cuenta con modal
- `apps/api/src/routes/savings-goals.js` - Agregada lógica de movimiento y actualización de balance

---

### 4.4 Módulo de Inteligencia Artificial

**Descripcion:** Analisis financiero personalizado usando IA como asesor financiero.

#### REQ-IA-01: Pantalla de IA
- Nueva pantalla/tab o seccion accesible desde el dashboard.
- Interfaz tipo chat o panel de recomendaciones.

#### REQ-IA-02: Analisis automatico
El system prompt debe incluir:
- Rol: "Eres un asesor financiero personal experto analizando los datos del usuario."
- Datos del usuario: resumen de cuentas, movimientos del mes, presupuestos, objetivos, prestamos.
- El analisis debe generar:
  - En que categoria gasta mas y comparacion con mes anterior.
  - Porcentaje de cambio: "Ganaste X% mas/menos que el mes pasado".
  - Porcentaje de cambio: "Gastaste X% mas/menos que el mes pasado".
  - Recomendaciones personalizadas (ej: "Reduces gasto en comida", "Estas ahorrando bien").
  - Alertas de tendencias negativas.
  - Puntuacion de salud financiera (score del 1 al 100).

#### REQ-IA-03: Integracion tecnica
- Usar Claude API (Anthropic) o OpenAI API.
- Enviar resumen de datos como contexto (no datos crudos, sino agregados).
- Endpoint backend: `POST /api/ai/analyze` que agregue los datos y llame a la API de IA.
- Cachear la respuesta por periodo (no llamar a la API en cada visita).
- Boton "Actualizar analisis" para forzar nuevo analisis.

#### REQ-IA-04: Insights en Dashboard
- Card en el dashboard con 1-2 insights generados por la IA.
- Ejemplo: "Este mes gastaste 15% mas en transporte. Considera alternativas."
- Tap en el card lleva a la pantalla completa de IA.

---

### 4.4 Modulo de Notificaciones Push

**Descripcion:** Sistema completo de notificaciones push.

#### REQ-NOTIF-01: Infraestructura
- Instalar e integrar `expo-notifications`.
- Registro de permisos al iniciar la app.
- Almacenar token de push en la BD.

#### REQ-NOTIF-02: Tipos de notificaciones
| Trigger | Notificacion |
|---|---|
| Sin movimientos registrados en el dia | "No has registrado gastos hoy. Mantener registro diario mejora tu control financiero." |
| Fecha de corte de credito (3 dias antes) | "Tu tarjeta [nombre] tiene fecha de corte en 3 dias. Deuda actual: $X" |
| Fecha de corte de credito (dia mismo) | "Hoy es la fecha de corte de [nombre]. Deuda: $X" |
| Fecha de pago de credito (5 dias antes) | "Tu pago de [nombre] vence en 5 dias. Monto: $X" |
| Fecha de pago de credito (dia mismo) | "Hoy vence el pago de [nombre]. No olvides pagar $X" |
| Presupuesto al 80% | "Tu presupuesto de [nombre] va al 80%. Quedan $X del limite." |
| Presupuesto excedido | "Excediste tu presupuesto de [nombre] por $X." |
| Prestamo por vencer | "El prestamo a [persona] vence en X dias. Monto: $X" |
| Suscripcion proxima | "Tu suscripcion de [nombre] se cobra manana: $X" |
| Salario programado | "Manana recibes tu salario en [cuenta]: $X" |
| Objetivo de ahorro atrasado | "Para cumplir tu meta [nombre] a tiempo, necesitas ahorrar $X este mes." |

#### REQ-NOTIF-03: Configuracion
- En ajustes, toggle por tipo de notificacion (no un solo toggle general).
- Horario preferido para recordatorio diario.
- Opcion de silenciar temporalmente (modo vacaciones).

---

### 4.5 Modulo de Suscripciones y Pagos Recurrentes ✅ COMPLETADO

**Descripcion:** Gestion de pagos automaticos, suscripciones y ingresos recurrentes.

#### REQ-SUB-01: Modelo de datos ✅ RESUELTO
```
Recurrente {
  id: number
  name: string                 // Ej: "Netflix", "Spotify", "Salario"
  type: string                 // "subscription" | "salary" | "recurring_expense" | "recurring_income"
  amount: number
  frequency: string            // "weekly" | "biweekly" | "monthly" | "yearly"
  day_of_month: number | null  // Dia del mes (1-31) para mensual
  day_of_week: number | null   // Dia de la semana (1-7) para semanal
  specific_dates: string | null // "1,15" para quincenal, "14,28" para catorcena
  category_id: string | null
  account_id: number           // Cuenta de donde se cobra/deposita
  icon: string
  color: string
  is_active: boolean
  next_date: date              // Proxima fecha de cobro/deposito
  auto_register: boolean       // Registrar movimiento automaticamente
  notify_before_days: number   // Dias antes para notificar (default: 1)
  created_at: datetime
  updated_at: datetime
}
```
- **Estado:** ✅ Resuelto - Estructura de BD implementada en `apps/api/src/database/db-json.js`
- **Archivos:** `apps/api/src/database/db-json.js` (agregado `recurring_payments`)

#### REQ-SUB-02: Funcionalidades ✅ RESUELTO
- ✅ CRUD completo de pagos recurrentes implementado en API REST
- ✅ Vista con lista de pagos activos e inactivos
- ✅ Resumen mensual: total de suscripciones, gastos recurrentes e ingresos recurrentes
- ✅ Registro manual de cobros/depósitos con botón
- ✅ Indicador visual de registro automático (badge)
- ✅ Alerta de porcentaje de gastos recurrentes vs ingresos
- ✅ Cálculo de días hasta próximo cobro con indicadores visuales
- ✅ Cálculo de costo mensual y anual por pago
- ✅ Filtrado por tipo: suscripciones, salarios, gastos recurrentes
- ⏳ Registro automático al llegar la fecha (requiere cron job - futuras versiones)
- ⏳ Historial de cobros pasados (requiere tabla de historial - futuras versiones)

**API Endpoints implementados:**
- `GET /api/recurring-payments` - Listar pagos recurrentes
- `GET /api/recurring-payments/:id` - Obtener pago específico
- `POST /api/recurring-payments` - Crear pago recurrente
- `PUT /api/recurring-payments/:id` - Actualizar pago recurrente
- `DELETE /api/recurring-payments/:id` - Eliminar pago recurrente
- `POST /api/recurring-payments/:id/register` - Registrar cobro manualmente (crea movimiento)
- `GET /api/recurring-payments/stats/summary` - Estadísticas generales

**Pantallas implementadas:**
- `apps/mobile/app/subscriptions/index.tsx` - Lista de pagos con resumen y filtros
- `apps/mobile/app/subscriptions/add-subscription.tsx` - Formulario para crear pago recurrente
- `apps/mobile/app/subscriptions/sub-detail.tsx` - Detalle con información completa y opciones

**Archivos:** `apps/api/src/routes/recurring-payments.js`, `apps/api/src/index.js`, pantallas en `apps/mobile/app/subscriptions/`

#### REQ-SUB-03: Programacion ✅ RESUELTO
- ✅ Usuario define frecuencia: semanal, quincenal, mensual, anual
- ✅ Día del mes para pagos mensuales
- ✅ Fechas específicas para quincenales (ej: 1,15 o 14,28)
- ✅ Cálculo automático de próxima fecha de cobro
- ✅ Ejemplos implementados: Netflix (mensual día 15), Salario (quincenal 1,15), Renta (mensual día 1)

#### REQ-SUB-04: Navegacion ✅ RESUELTO
- ✅ Sección accesible desde settings (Más)
- ✅ Navegación fluida entre pantallas
- ⏳ Card resumen en dashboard pendiente (se agregará en próxima actualización)

**Archivos:** `apps/mobile/app/(tabs)/settings.tsx` (agregada opción de suscripciones)

---

### 4.6 Módulo de Vehículo ✅ COMPLETADO (19 Feb 2026)

**Descripción:** Seguimiento de gastos y datos del vehículo personal.

#### REQ-AUTO-01: Modelo de datos ✅ RESUELTO
```
Vehiculo {
  id: number
  name: string                 // "Mi Carro", "Civic 2020"
  brand: string
  model: string
  year: number
  license_plate: string | null
  odometer: number             // Kilometraje actual
  fuel_type: string            // "gasoline" | "diesel" | "electric" | "hybrid"
  tank_capacity: number | null // Litros del tanque
  created_at: datetime
}

CargaGasolina {
  id: number
  vehicle_id: number
  liters: number               // Litros cargados
  price_per_liter: number      // Precio por litro
  total_cost: number           // Costo total
  odometer: number             // Kilometraje al momento de cargar
  station_name: string | null  // Gasolinera (opcional)
  is_full_tank: boolean        // Si lleno el tanque
  date: datetime
  account_id: number           // Cuenta de pago
  notes: string | null
  created_at: datetime
}

Mantenimiento {
  id: number
  vehicle_id: number
  type: string                 // "oil_change" | "tires" | "brakes" | "service" | "repair" | "other"
  description: string
  cost: number
  odometer: number
  workshop_name: string | null // Taller/mecanico
  date: datetime
  next_date: date | null       // Proximo mantenimiento programado
  next_odometer: number | null // Proximo mantenimiento por km
  account_id: number
  notes: string | null
  created_at: datetime
}
```
- **Estado:** ✅ Resuelto - Estructura de BD implementada en `apps/api/src/database/db-json.js`
- **Archivos:** `apps/api/src/database/db-json.js` (agregados `vehicles`, `fuel_loads`, `maintenance`)

#### REQ-AUTO-02: Submodulo de Gasolina ✅ RESUELTO
- ✅ Registro de cada carga de gasolina: litros, precio, total, kilometraje
- ✅ Cálculo de rendimiento (km/litro promedio) basado en cargas consecutivas
- ✅ Historial completo de cargas ordenado por fecha
- ✅ Actualización automática del kilometraje del vehículo
- ✅ Creación automática de movimiento de gasto en la cuenta seleccionada
- ✅ Selector de cuenta con balance visible y radio buttons
- ✅ Cálculo de total en tiempo real (litros × precio)
- ✅ Estadísticas: total gastado en gasolina, gasto del mes actual
- ✅ Modal mejorado con campos: litros, precio, kilometraje, gasolinera, cuenta, notas
- ⏳ Frecuencia de carga, gasto diario/semanal promedio (futuras versiones)
- ⏳ Predicción de gasto mensual (futuras versiones)
- ⏳ Gráficas de gasto y rendimiento (futuras versiones)

**API Endpoints implementados:**
- `GET /api/vehicles/:id/fuel-loads` - Listar cargas de gasolina
- `POST /api/vehicles/:id/fuel-loads` - Registrar carga (crea movimiento y actualiza balance)

**Pantallas implementadas:**
- `apps/mobile/app/vehicles/vehicle-detail.tsx` - Tab de gasolina con historial y modal mejorado

**Archivos:** `apps/api/src/routes/vehicles.js`, pantallas en `apps/mobile/app/vehicles/`

#### REQ-AUTO-03: Submodulo de Mantenimiento ✅ RESUELTO
- ✅ Registro de cada mantenimiento/reparación con costo
- ✅ Tipos predefinidos con iconos: cambio aceite, llantas, frenos, servicio general, reparación, otro
- ✅ Total histórico gastado en mantenimiento
- ✅ Historial completo ordenado por fecha
- ✅ Actualización automática del kilometraje del vehículo
- ✅ Creación automática de movimiento de gasto en la cuenta seleccionada
- ✅ Selector de cuenta con balance visible y radio buttons
- ✅ Selector visual de tipo de mantenimiento con chips e iconos
- ✅ Modal mejorado con campos: tipo, descripción, costo, kilometraje, taller, cuenta, notas
- ⏳ Total por tipo de mantenimiento (futuras versiones)
- ⏳ Recordatorio programado de próximo mantenimiento (requiere notificaciones - Fase 3)

**API Endpoints implementados:**
- `GET /api/vehicles/:id/maintenance` - Listar mantenimientos
- `POST /api/vehicles/:id/maintenance` - Registrar mantenimiento (crea movimiento y actualiza balance)

**Pantallas implementadas:**
- `apps/mobile/app/vehicles/vehicle-detail.tsx` - Tab de mantenimiento con historial y modal mejorado

**Archivos:** `apps/api/src/routes/vehicles.js`, pantallas en `apps/mobile/app/vehicles/`

#### REQ-AUTO-04: Dashboard del Vehiculo ✅ RESUELTO
- ✅ Vista general con información del vehículo (marca, modelo, año)
- ✅ Kilometraje actual
- ✅ Rendimiento promedio (km/L)
- ✅ Gasto total del mes en el vehículo (gasolina + mantenimiento)
- ✅ Gasto total histórico
- ✅ Desglose de gastos: gasolina vs mantenimiento con colores diferenciados
- ✅ Tabs para navegar entre gasolina y mantenimiento
- ✅ FAB (botón flotante) para agregar carga o mantenimiento según tab activo
- ⏳ Último mantenimiento y próximo (futuras versiones)

**Pantallas implementadas:**
- `apps/mobile/app/vehicles/vehicle-detail.tsx` - Dashboard completo con estadísticas y tabs

**Archivos:** `apps/mobile/app/vehicles/vehicle-detail.tsx`

#### REQ-AUTO-05: Integracion con movimientos ✅ RESUELTO
- ✅ Las cargas de gasolina crean automáticamente un movimiento de tipo "gasto"
- ✅ Los mantenimientos crean automáticamente un movimiento de tipo "gasto"
- ✅ Categoría "Transporte" con iconos diferenciados (car para gasolina, wrench para mantenimiento)
- ✅ Actualización automática del balance de la cuenta seleccionada
- ✅ Soporte para cuentas de crédito (incrementa current_balance)
- ✅ Soporte para otras cuentas (decrementa balance)
- ✅ Los movimientos aparecen en la lista general de movimientos
- ✅ Formato correcto de precio con símbolo $ en las notas

**Archivos:** `apps/api/src/routes/vehicles.js` (lógica de creación de movimientos)

#### REQ-AUTO-06: Navegación ✅ RESUELTO
- ✅ Card resumen en dashboard mostrando primer vehículo con estadísticas
- ✅ Navegación desde dashboard a pantalla de vehículos
- ✅ Opción en menú "Más" para acceder a vehículos (dentro de sección FINANZAS)
- ✅ Lista de vehículos con información resumida
- ✅ Pantalla de agregar vehículo con todos los campos
- ✅ Pantalla de detalle con tabs de gasolina y mantenimiento
- ✅ Solo se muestra card en dashboard si hay vehículos registrados
- ✅ Eliminada sección duplicada de "CONFIGURACIÓN" en menú Más

**Pantallas implementadas:**
- `apps/mobile/app/vehicles/index.tsx` - Lista de vehículos con estadísticas
- `apps/mobile/app/vehicles/add-vehicle.tsx` - Formulario para agregar vehículo
- `apps/mobile/app/vehicles/vehicle-detail.tsx` - Detalle completo con tabs y modales mejorados

**Archivos:** 
- Dashboard: `apps/mobile/app/(tabs)/index.tsx` (agregado card de vehículos)
- Menú Más: `apps/mobile/app/(tabs)/more.tsx` (agregada opción de vehículos, eliminada sección duplicada)

**API Endpoints completos:**
- `GET /api/vehicles` - Listar vehículos
- `GET /api/vehicles/:id` - Obtener vehículo específico
- `POST /api/vehicles` - Crear vehículo
- `PUT /api/vehicles/:id` - Actualizar vehículo
- `DELETE /api/vehicles/:id` - Eliminar vehículo
- `GET /api/vehicles/:id/fuel-loads` - Listar cargas de gasolina
- `POST /api/vehicles/:id/fuel-loads` - Registrar carga
- `GET /api/vehicles/:id/maintenance` - Listar mantenimientos
- `POST /api/vehicles/:id/maintenance` - Registrar mantenimiento
- `GET /api/vehicles/:id/stats` - Estadísticas del vehículo

**Correcciones Técnicas (19 Feb 2026):**
1. ✅ Corregida importación de db en vehicles.js: `const { db } = require('../database/db-json')`
2. ✅ Corregido data.json: vehículo con id=1, nextVehicleId=2, agregadas estructuras fuel_loads y maintenance
3. ✅ Agregadas validaciones de inicialización de IDs en db-json.js
4. ✅ Corregido orden de parámetros en INSERT de movements (type, amount, title, category_id, category_name, category_icon, category_color, account_id, to_account_id, date, notes)
5. ✅ Formato de precio corregido con símbolo $ en las notas
6. ✅ Modales mejorados con selector de cuentas, radio buttons, balance visible, cálculo de total en tiempo real
7. ✅ Agregados todos los estilos necesarios para los nuevos componentes de modales

**Archivos Backend:**
- `apps/api/src/routes/vehicles.js` - Rutas completas con 10 endpoints
- `apps/api/src/database/db-json.js` - Handlers para vehicles, fuel_loads, maintenance
- `apps/api/src/index.js` - Registro de rutas
- `apps/api/data.json` - Estructuras de BD

**Archivos Frontend:**
- `apps/mobile/app/vehicles/index.tsx` - Lista de vehículos
- `apps/mobile/app/vehicles/add-vehicle.tsx` - Agregar vehículo
- `apps/mobile/app/vehicles/vehicle-detail.tsx` - Detalle con modales mejorados
- `apps/mobile/app/(tabs)/index.tsx` - Card en dashboard
- `apps/mobile/app/(tabs)/more.tsx` - Opción en menú

**Documentación:**
- `docs/FUTURE_UPDATES.md` - Módulo marcado como completado

---

- `GET /api/vehicles/:id` - Obtener vehículo específico
- `POST /api/vehicles` - Crear vehículo
- `PUT /api/vehicles/:id` - Actualizar vehículo
- `DELETE /api/vehicles/:id` - Eliminar vehículo (elimina también cargas y mantenimientos)
- `GET /api/vehicles/:id/fuel-loads` - Listar cargas de gasolina
- `POST /api/vehicles/:id/fuel-loads` - Registrar carga de gasolina
- `GET /api/vehicles/:id/maintenance` - Listar mantenimientos
- `POST /api/vehicles/:id/maintenance` - Registrar mantenimiento
- `GET /api/vehicles/:id/stats` - Estadísticas del vehículo

**Archivos backend:**
- `apps/api/src/routes/vehicles.js` - Rutas completas del módulo
- `apps/api/src/database/db-json.js` - Handlers de BD para vehículos
- `apps/api/src/index.js` - Registro de rutas

**Pendiente para futuras versiones:**
- Gráficas de gasto en gasolina por mes
- Gráfica de rendimiento km/L a lo largo del tiempo
- Cálculo de frecuencia de carga y gastos promedio
- Predicción de gasto mensual
- Recordatorios de mantenimiento programado (requiere notificaciones - Fase 3)
- Soporte para múltiples vehículos en dashboard (actualmente solo muestra el primero)

---

## 5. Mejoras Tecnicas y de Infraestructura

### 5.1 Base de Datos

#### REQ-TEC-01: Migrar a SQLite real
- Resolver la compilacion de `better-sqlite3` o evaluar alternativa como `expo-sqlite` (local en el dispositivo).
- Considerar si la app deberia funcionar offline-first con BD local y sincronizacion.
- Eliminar la BD JSON temporal (`data.json`).

#### REQ-TEC-02: Esquema relacional completo
- Definir migraciones para todas las tablas nuevas: `user_profile`, `objectives`, `loans`, `loan_payments`, `recurring_payments`, `vehicles`, `fuel_loads`, `maintenance`, `categories`, `notifications_config`.
- Indices en campos de busqueda frecuente (`date`, `account_id`, `category_id`).

### 5.2 Estado Global

#### REQ-TEC-03: Implementar estado global
- Usar Zustand o React Context para datos compartidos entre pantallas:
  - Perfil de usuario.
  - Cuenta principal.
  - Configuracion de moneda.
  - Cache de cuentas y categorias.
- Evitar re-fetch innecesario en cada cambio de tab.

### 5.3 Paquete Compartido

#### REQ-TEC-04: Poblar `packages/shared`
- Mover tipos/interfaces TypeScript compartidos entre mobile y API.
- Constantes compartidas (categorias por defecto, tipos de cuenta, etc.).
- Funciones de utilidad compartidas (formateo de moneda, validaciones).

### 5.4 Seguridad

#### REQ-TEC-05: Seguridad de datos
- No almacenar numeros completos de tarjeta.
- Sanitizar inputs en la API.
- Validar tipos de datos en la API (actualmente acepta cualquier campo en PUT).
- Implementar rate limiting.

### 5.5 UX General

#### REQ-TEC-06: Skeleton loaders
- Reemplazar pantallas vacias durante la carga con skeletons.

#### REQ-TEC-07: Error boundaries
- Implementar React error boundaries para evitar crashes completos.

#### REQ-TEC-08: Haptic feedback consistente
- Aplicar haptic feedback en acciones importantes (crear, eliminar, guardar).

#### REQ-TEC-09: Confirmacion de acciones destructivas
- Modal de confirmacion al eliminar cuentas, movimientos, presupuestos.
- Actualmente la eliminacion por long-press no tiene confirmacion.

#### REQ-TEC-10: Reorganizacion de navegacion
- Evaluar si los tabs actuales (5) son suficientes o necesitan reorganizacion dado los nuevos modulos.
- Posible estructura:
  - Tab 1: Dashboard (inicio)
  - Tab 2: Movimientos
  - Tab 3: Boton central FAB (agregar)
  - Tab 4: Estadisticas / IA
  - Tab 5: Menu/Mas (cuentas, presupuestos, objetivos, prestamos, suscripciones, vehiculo, ajustes)

---

## 6. Prioridad y Fases de Implementacion

### Fase 1: Estabilizacion y Bugs (Fundacion)
> Corregir todo lo roto antes de agregar cosas nuevas.

| # | Tarea | Prioridad |
|---|---|---|
| 1 | BUG-001: Crear pantalla edit-budget | Critica |
| 2 | BUG-003: Fix balance de cuentas de credito en movimientos | Critica |
| 3 | BUG-002: Fix campo nombre duplicado en add-account debito | Alta |
| 4 | BUG-007: Filtrar datos del dashboard por mes actual | Alta |
| 5 | BUG-005: Implementar filtros funcionales en movimientos | Alta |
| 6 | BUG-006: Conectar botones sin funcionalidad | Media |
| 7 | BUG-008: Calcular porcentaje de cambio real en estadisticas | Media |
| 8 | BUG-009: Agregar mapeos de iconos faltantes para Android | Media |
| 9 | BUG-004: No almacenar numero completo de tarjeta | Media |
| 10 | BUG-010: Usar variable de entorno para IP | Baja |

### Fase 2: Mejoras Core (Experiencia Base)
> Mejorar lo que ya existe para que funcione correctamente.

| # | Tarea | Prioridad | Estado |
|---|---|---|---|
| 1 | REQ-CRED-01 a 03: Credito completo (balance, toggle, visual) | Alta | ✅ Completado |
| 2 | REQ-PRIM-01 a 03: Cuenta principal funcional | Alta | ✅ Completado |
| 3 | REQ-PRES-01 a 06: Presupuestos vinculados a categorias | Alta | ✅ Completado (excepto reset periódico y notificaciones) |
| 4 | REQ-PERF-01 a 03: Perfil de usuario editable | Alta | ⏳ Pendiente |
| 5 | REQ-MOV-01 a 03: Busqueda, filtros, categorias custom | Media | 🔄 Parcial (búsqueda y filtros ✅, categorías custom ⏳) |
| 6 | REQ-STAT-01 a 04: Estadisticas con datos reales | Media | 🔄 Parcial (datos reales ✅, filtros y gráficos mejorados ⏳) |
| 7 | REQ-AJUS-01 a 03: Moneda, export CSV, import respaldo | Media | ⏳ Pendiente |
| 8 | REQ-TEC-03: Estado global (Zustand/Context) | Media | ⏳ Pendiente |

### Fase 3: Nuevos Modulos (Funcionalidad Expandida)
> Agregar las nuevas secciones de la app.

| # | Tarea | Prioridad | Estado |
|---|---|---|---|
| 1 | REQ-SUB-01 a 04: Suscripciones y pagos recurrentes | Alta | ✅ Completado |
| 2 | REQ-OBJ-01 a 03: Objetivos de ahorro | Alta | ✅ Completado |
| 3 | REQ-PREST-01 a 03: Modulo de prestamos | Media | ✅ Completado |
| 4 | REQ-NOTIF-01 a 03: Notificaciones push completas | Media | ⏳ Pendiente |
| 5 | REQ-AUTO-01 a 06: Modulo de vehiculo (gasolina + mantenimiento) | Media | ✅ Completado |
| 6 | REQ-TEC-10: Reorganizar navegacion para nuevos modulos | Media | ⏳ Pendiente |

### Fase 4: Inteligencia Artificial (Diferenciador)
> El modulo que hace unica a la app.

| # | Tarea | Prioridad |
|---|---|---|
| 1 | REQ-IA-01 a 02: Pantalla de IA y analisis automatico | Alta |
| 2 | REQ-IA-03: Integracion con API de IA (Claude/OpenAI) | Alta |
| 3 | REQ-IA-04: Insights en dashboard | Media |

### Fase 5: Infraestructura y Polish (Produccion)
> Preparar la app para un uso robusto.

| # | Tarea | Prioridad |
|---|---|---|
| 1 | REQ-TEC-01: Migrar a SQLite real o evaluar offline-first | Alta |
| 2 | REQ-TEC-02: Esquema relacional completo con migraciones | Alta |
| 3 | REQ-TEC-04: Paquete shared con tipos e interfaces | Media |
| 4 | REQ-TEC-05: Seguridad de datos | Media |
| 5 | REQ-TEC-06 a 09: UX polish (skeletons, error boundaries, haptics, confirmaciones) | Media |

---

> **Nota:** Este documento es una hoja de ruta viva. Cada fase puede ajustarse segun se avance en el desarrollo. Se recomienda completar cada fase antes de avanzar a la siguiente para mantener la estabilidad del proyecto.


---

## Historial de Actualizaciones

### Actualización 2026-02-19 (Parte 2) - Mejoras en Préstamos y Rediseño de Presupuestos

**Mejoras implementadas:**

1. ✅ **Date Pickers en Préstamos**:
   - Reemplazados campos de texto por date pickers nativos en agregar préstamo
   - Date picker para fecha del préstamo con límite máximo (hoy)
   - Date picker para fecha límite opcional con límite mínimo (fecha del préstamo)
   - Date picker en modal de registro de pagos
   - Mejor UX con formato de fecha legible

2. ✅ **Rediseño Completo de Presupuestos**:
   - Eliminado tipo "saving" (objetivos) - ahora solo para control de gastos
   - Agregado periodo "diario" además de semanal y mensual
   - Date picker para fecha de inicio
   - Date picker para fecha de fin opcional
   - Interfaz simplificada y más clara
   - Indicadores visuales mejorados (colores según progreso)
   - Alertas cuando se excede el presupuesto
   - Cálculo de días restantes
   - Información más clara sobre disponible vs gastado

3. ✅ **Mejoras en Pantallas de Presupuestos**:
   - Lista rediseñada con mejor visualización de progreso
   - Card informativo explicando el propósito
   - Barras de progreso con colores dinámicos (verde < 80%, amarillo 80-100%, rojo > 100%)
   - Banner de alerta cuando se excede el límite
   - Formularios de agregar/editar completamente rediseñados

**Archivos modificados:**
- `apps/mobile/app/loans/add-loan.tsx` (agregados date pickers)
- `apps/mobile/app/loans/loan-detail.tsx` (agregado date picker en modal)
- `apps/mobile/app/budgets/index.tsx` (rediseño completo)
- `apps/mobile/app/budgets/add-budget.tsx` (rediseño completo con date pickers)
- `apps/mobile/app/budgets/edit-budget.tsx` (rediseño completo con date pickers)

**Nota:** Los presupuestos ahora están enfocados exclusivamente en control de gastos, mientras que los objetivos de ahorro tienen su propio módulo dedicado, eliminando la duplicidad de funcionalidad.

---

### Actualización 2026-02-19 (Parte 1) - Módulo de Préstamos

**Módulo 4.2 completado:**

1. ✅ **REQ-PREST-01**: Modelo de datos implementado
   - Agregadas tablas `loans` y `loan_payments` a la BD
   - Estructura completa con soporte para estados (active, partial, paid, forgiven)
   - Campos: id, person_name, amount, remaining_amount, date, due_date, notes, account_id, status

2. ✅ **REQ-PREST-02**: Funcionalidades implementadas
   - API REST completa con 8 endpoints
   - Pantalla de lista con préstamos activos y completados
   - Resumen con total prestado, pendiente y recuperado
   - Pantalla de agregar préstamo con opción de descontar de cuenta
   - Pantalla de detalle con historial de pagos
   - Modal para registrar pagos parciales o totales
   - Actualización automática de estado según pagos
   - Cálculo de días restantes con indicadores visuales
   - Opción de condonar préstamo

3. ✅ **REQ-PREST-03**: Navegación implementada
   - Card resumen en dashboard con préstamos activos
   - Navegación fluida entre pantallas
   - Opción en settings debajo de objetivos de ahorro
   - Solo se muestra card si hay préstamos activos

**Archivos creados/modificados:**
- Backend: `apps/api/src/routes/loans.js`, `apps/api/src/database/db-json.js`, `apps/api/src/index.js`
- Frontend: `apps/mobile/app/loans/index.tsx`, `add-loan.tsx`, `loan-detail.tsx`
- Dashboard: `apps/mobile/app/(tabs)/index.tsx` (agregado card de préstamos)
- Settings: `apps/mobile/app/(tabs)/settings.tsx` (agregada opción de préstamos)

**Pendiente para futuras versiones:**
- Notificaciones cuando se acerque fecha límite (requiere módulo de notificaciones)
- Notificaciones periódicas recordando préstamos activos (requiere módulo de notificaciones)

---

### Actualización 2026-02-18 (Parte 2) - Módulo de Objetivos de Ahorro

**Módulo 4.1 completado:**

1. ✅ **REQ-OBJ-01**: Modelo de datos implementado
   - Agregadas tablas `savings_goals` y `goal_contributions` a la BD
   - Estructura completa con soporte para descuento automático
   - Campos: id, name, target_amount, current_amount, deadline, icon, color, auto_deduct, status

2. ✅ **REQ-OBJ-02**: Funcionalidades implementadas
   - API REST completa con 8 endpoints
   - Pantalla de lista con objetivos activos y completados
   - Pantalla de agregar objetivo con selector de 8 iconos
   - Pantalla de detalle con historial de contribuciones
   - Cálculo automático de días restantes y ahorro diario requerido
   - Modal para agregar contribuciones
   - Indicador visual de descuento automático

3. ✅ **REQ-OBJ-03**: Navegación implementada
   - Card resumen en dashboard con progreso general
   - Navegación fluida entre pantallas
   - Solo se muestra si hay objetivos activos

**Archivos creados/modificados:**
- Backend: `apps/api/src/routes/savings-goals.js`, `apps/api/src/database/db-json.js`, `apps/api/src/index.js`
- Frontend: `apps/mobile/app/savings-goals/index.tsx`, `add-goal.tsx`, `goal-detail.tsx`
- Dashboard: `apps/mobile/app/(tabs)/index.tsx` (agregado card de objetivos)

**Pendiente para futuras versiones:**
- Notificaciones al completar objetivo (requiere módulo de notificaciones)
- Notificaciones de ritmo insuficiente (requiere módulo de notificaciones)
- Descuento automático periódico (requiere cron job o sistema de tareas programadas)

---

### Actualización 2026-02-18 (Parte 1) - Revisión y Correcciones

**Cambios implementados:**

1. ✅ **REQ-AJUS-01 completado**: Implementada aplicación global de moneda mediante Context API
   - Creado `CurrencyContext.tsx` para gestión centralizada
   - Todas las pantallas principales actualizadas para usar `useCurrency()` hook
   - Soporta MXN, USD y EUR con formateo correcto
   - Cambio de moneda es instantáneo y global

2. 🔄 **REQ-PRES-06 estado corregido**: Cambiado de ✅ a 🔄 PARCIAL
   - Implementado: Barra de progreso, porcentajes, badge, banner de advertencia
   - Pendiente: Días restantes del periodo y gráfica de tendencia

3. 📊 **Stack tecnológico actualizado**: Agregado Context API al stack de estado

4. 📝 **Funcionalidades actuales actualizadas**: Reflejado el estado real de implementación

**Validaciones realizadas:**
- Todos los requerimientos marcados como ✅ fueron verificados contra el código
- Inconsistencias documentadas en `VERIFICACION_REQUERIMIENTOS.md`
- Cambios detallados en `CAMBIOS_REALIZADOS.md`

**Próximos pasos recomendados:**
1. Completar días restantes y gráfica en presupuestos (REQ-PRES-06)
2. Implementar date picker UI para filtros personalizados
3. Reset periódico de presupuestos (REQ-PRES-03)
4. Categorías personalizadas (REQ-MOV-03)


---

### Actualización 2026-02-19 (Parte 3) - Módulos de Suscripciones y Vehículos

**Módulo 4.5 - Suscripciones y Pagos Recurrentes completado:**

1. ✅ **REQ-SUB-01 a 04**: Módulo completo implementado
   - Modelo de datos con soporte para suscripciones, salarios, gastos e ingresos recurrentes
   - Frecuencias: semanal, quincenal, mensual, anual
   - Configuración de días específicos para pagos
   - Registro automático o manual de cobros
   - Cálculo de próxima fecha de cobro
   - Resumen mensual de gastos e ingresos recurrentes
   - Alerta de porcentaje de gastos vs ingresos
   - Próximos cobros con indicadores visuales
   - API REST completa con 7 endpoints
   - 3 pantallas: lista, agregar y detalle
   - Opción en menú "Más"

**Módulo 4.6 - Vehículos completado:**

1. ✅ **REQ-AUTO-01 a 06**: Módulo completo implementado
   - Modelo de datos para vehículos, cargas de gasolina y mantenimientos
   - Submodulo de gasolina con registro de cargas y cálculo de rendimiento
   - Submodulo de mantenimiento con tipos predefinidos
   - Dashboard del vehículo con estadísticas completas
   - Integración automática con movimientos y cuentas
   - Selector de cuenta con balance visible
   - Actualización automática de kilometraje
   - Card en dashboard mostrando primer vehículo
   - Opción en menú "Más"
   - API REST completa con 10 endpoints
   - 3 pantallas: lista, agregar y detalle con tabs

**Archivos creados/modificados:**

Backend:
- `apps/api/src/routes/vehicles.js` - Rutas completas del módulo de vehículos
- `apps/api/src/database/db-json.js` - Handlers para vehicles, fuel_loads y maintenance
- `apps/api/src/index.js` - Registro de rutas de vehículos

Frontend:
- `apps/mobile/app/vehicles/index.tsx` - Lista de vehículos con estadísticas
- `apps/mobile/app/vehicles/add-vehicle.tsx` - Formulario para agregar vehículo
- `apps/mobile/app/vehicles/vehicle-detail.tsx` - Detalle con tabs de gasolina y mantenimiento
- `apps/mobile/app/(tabs)/index.tsx` - Card de vehículos en dashboard
- `apps/mobile/app/(tabs)/more.tsx` - Opción de vehículos en menú Más

Documentación:
- `docs/FUTURE_UPDATES.md` - Actualizado con módulos 4.5 y 4.6 completados

**Características implementadas:**
- Registro de cargas de gasolina con cálculo automático de rendimiento
- Registro de mantenimientos con tipos predefinidos
- Creación automática de movimientos en la cuenta seleccionada
- Actualización automática de balance de cuentas
- Soporte para cuentas de crédito y otras cuentas
- Estadísticas: rendimiento, gastos totales, gastos del mes
- Historial completo de cargas y mantenimientos
- Selector de cuenta con balance visible
- Modales simplificados para agregar cargas y mantenimientos
- Tabs para navegar entre gasolina y mantenimiento
- Card en dashboard con resumen del primer vehículo

**Pendiente para futuras versiones:**
- Gráficas de gasto y rendimiento a lo largo del tiempo
- Cálculo de frecuencia de carga y gastos promedio
- Predicción de gasto mensual
- Recordatorios de mantenimiento programado (requiere notificaciones)
- Registro automático de suscripciones al llegar la fecha (requiere cron job)
- Historial de cobros pasados de suscripciones
- Soporte para múltiples vehículos en dashboard
