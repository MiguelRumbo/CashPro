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
| Estado | React local (`useState`) sin estado global |
| Monorepo | pnpm workspaces |

### Funcionalidades Actuales (funcionando)
- CRUD completo de cuentas (efectivo, banco, debito, credito)
- CRUD de movimientos (gasto, ingreso, transferencia)
- Actualizacion automatica de balance al crear/editar/eliminar movimientos (solo cuentas no-credito)
- CRUD de presupuestos (seguimiento manual unicamente)
- Dashboard con datos reales de la API
- Tema claro/oscuro en toda la app
- Formateo de moneda MXN
- Pull-to-refresh en todas las pantallas con listas
- Eliminacion total de datos (reset)

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

#### REQ-PRIM-01: Toggle de cuenta principal en detalle
- En la pantalla de detalle de cuenta, agregar un check/toggle "Cuenta principal".
- Solo una cuenta puede ser principal a la vez.
- Al marcar una cuenta, desmarcar automaticamente la anterior.
- Endpoint API: `PUT /api/accounts/:id/set-primary`.

#### REQ-PRIM-02: Cuenta principal en Dashboard
- El dashboard debe mostrar la cuenta marcada como principal con el badge "Principal" (no la primera del array).
- Si no hay ninguna marcada, mostrar la mas antigua como default.

#### REQ-PRIM-03: Cuenta principal preseleccionada en movimientos
- Al agregar un nuevo movimiento (gasto/ingreso), la cuenta principal debe venir preseleccionada por defecto en el selector de cuenta.
- El usuario puede cambiarla, pero por defecto aparece la principal.

---

### 3.3 Presupuestos - Rediseno Completo

**Estado actual:** Los presupuestos son metas manuales sin conexion con movimientos. `current_amount` siempre es 0 a menos que se actualice via PUT manual. No hay pantalla de edicion (crash).

**Requerimientos:**

#### REQ-PRES-01: Presupuestos vinculados a categorias
- Cada presupuesto debe estar asociado a una o mas categorias de gasto.
- Nuevo campo: `category_ids: string[]` (array de IDs de categorias vinculadas).
- Al crear presupuesto, selector de categorias (en lugar de o ademas del icono actual).

#### REQ-PRES-02: Actualizacion automatica del presupuesto
- Cuando se registre un movimiento tipo "gasto" cuya categoria coincida con las categorias del presupuesto, sumar automaticamente el monto al `current_amount` del presupuesto.
- Cuando se elimine o edite un movimiento, ajustar el `current_amount` correspondientemente.
- La logica debe ejecutarse en el backend al crear/editar/eliminar movimientos.

#### REQ-PRES-03: Reset periodico automatico
- Los presupuestos con periodo "mensual" deben resetear `current_amount` a 0 al inicio de cada mes.
- Los presupuestos con periodo "semanal" deben resetear cada lunes.
- Implementar via un check de fecha al consultar presupuestos (o cron job).

#### REQ-PRES-04: Pantalla de edicion de presupuestos
- Crear `budgets/edit-budget.tsx` con el formulario pre-poblado.
- Mismos campos que crear, incluyendo el nuevo selector de categorias.

#### REQ-PRES-05: Alertas de presupuesto
- Notificacion cuando un presupuesto de gasto alcance el 80% del limite.
- Notificacion cuando un presupuesto de gasto se exceda (100%+).
- Indicador visual en la lista de presupuestos (color rojo/amarillo).

#### REQ-PRES-06: Vista mejorada de presupuestos
- Barra de progreso con colores: verde (<60%), amarillo (60-80%), rojo (>80%).
- Mostrar monto gastado / monto total y porcentaje.
- Mostrar dias restantes del periodo actual.
- Grafica de tendencia de gasto dentro del periodo.

---

### 3.4 Estadisticas - Datos Reales

**Estado actual:** La pantalla de estadisticas tiene datos mock, filtros no funcionales, y un grafico de dona basado en CSS.

**Requerimientos:**

#### REQ-STAT-01: Filtros de fecha funcionales
- Implementar filtrado real por: Este mes, Mes pasado, 3 meses, Personalizado (range picker).
- Los datos del grafico de barras, dona y totales deben reflejar el rango seleccionado.

#### REQ-STAT-02: Porcentaje de cambio calculado
- Calcular `expenseChange` real: `((gastoMesActual - gastoMesPasado) / gastoMesPasado) * 100`.
- Mostrar si gasto mas (+%) o menos (-%) respecto al periodo anterior.

#### REQ-STAT-03: Insight dinamico
- Generar texto de insight basado en datos reales:
  - Categoria donde mas se gasta.
  - Comparacion vs periodo anterior.
  - Tendencia (subiendo/bajando).

#### REQ-STAT-04: Graficos mejorados
- Considerar usar una libreria de graficos como `react-native-chart-kit` o `victory-native` para graficos mas robustos.
- Grafico de dona real (no basado en CSS border).
- Grafico de barras con etiquetas y valores.

---

### 3.5 Movimientos - Mejoras

#### REQ-MOV-01: Busqueda funcional
- Implementar filtrado en tiempo real por titulo, categoria y notas.
- Debounce de 300ms en el input de busqueda.

#### REQ-MOV-02: Filtros de fecha funcionales
- Los chips de filtro (Hoy, Semana, Mes, Anio, Personalizado) deben filtrar la lista.
- Personalizado abre un date range picker.

#### REQ-MOV-03: Categorias personalizadas
- Permitir al usuario crear categorias propias (nombre, icono, color).
- El boton "Agregar" en el modal de categorias debe funcionar.
- CRUD de categorias en la API.
- Categorias por defecto + categorias del usuario.

---

### 3.6 Perfil de Usuario

**Estado actual:** Datos hardcodeados. No hay sistema de usuario.

**Requerimientos:**

#### REQ-PERF-01: Edicion de perfil basico
- Campos editables: nombre y correo electronico.
- Los datos se guardan en la BD (nueva tabla/coleccion `user_profile`).
- Endpoint: `GET /api/profile`, `PUT /api/profile`.

#### REQ-PERF-02: Nombre en Dashboard
- El saludo del dashboard ("Hola, [nombre]") usa el nombre guardado del perfil.
- Iniciales generadas del nombre guardado para el avatar.

#### REQ-PERF-03: Avatar con iniciales
- En todo lugar donde se muestre el avatar (dashboard, ajustes), usar las iniciales del nombre guardado.
- Ejemplo: "Miguel Rumbo" => "MR" en un circulo con el color primario.

---

### 3.7 Ajustes - Funcionalidades Pendientes

#### REQ-AJUS-01: Moneda persistida
- La seleccion de moneda en ajustes debe guardarse en la BD (perfil de usuario).
- Aplicarse globalmente al formateo de montos en toda la app.

#### REQ-AJUS-02: Exportar CSV
- Generar archivo CSV con todos los movimientos.
- Compartir via `expo-sharing` o guardar en almacenamiento local.
- Incluir: fecha, tipo, titulo, categoria, monto, cuenta, notas.

#### REQ-AJUS-03: Importar respaldo
- Permitir importar un archivo JSON con datos previamente exportados.
- Validar estructura antes de importar.

---

## 4. Nuevos Modulos y Funcionalidades

### 4.1 Modulo de Objetivos de Ahorro

**Descripcion:** Metas de ahorro con seguimiento por fecha y monto.

#### REQ-OBJ-01: Modelo de datos
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
```

#### REQ-OBJ-02: Funcionalidades
- CRUD completo de objetivos.
- Pantalla con lista de objetivos activos y progreso visual.
- Barra de progreso circular o lineal con porcentaje y monto faltante.
- Calculo de "cuanto debo ahorrar por dia/semana/mes" para llegar a la meta.
- Agregar monto manualmente al objetivo (abonar).
- Historial de abonos al objetivo.
- Notificacion al completar un objetivo.
- Notificacion si el ritmo de ahorro es insuficiente para llegar a la fecha.

#### REQ-OBJ-03: Navegacion
- Nueva seccion accesible desde el dashboard o un tab reorganizado.
- Card resumen de objetivos en el dashboard.

---

### 4.2 Modulo de Prestamos

**Descripcion:** Registro y seguimiento de dinero prestado a otras personas.

#### REQ-PREST-01: Modelo de datos
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

#### REQ-PREST-02: Funcionalidades
- CRUD completo de prestamos.
- Registrar pagos parciales o totales.
- Historial de pagos recibidos por prestamo.
- Vista de prestamos activos con monto pendiente.
- Resumen: total prestado, total pendiente, total recuperado.
- Notificacion cuando se acerque la fecha limite de devolucion.
- Notificacion periodica recordando prestamos activos.
- Al crear un prestamo, opcionalmente descontar de la cuenta origen (registrar como movimiento de tipo "prestamo").

#### REQ-PREST-03: Navegacion
- Seccion accesible desde el dashboard o menu.
- Badge con total pendiente por cobrar.

---

### 4.3 Modulo de Inteligencia Artificial

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

### 4.5 Modulo de Suscripciones y Pagos Recurrentes

**Descripcion:** Gestion de pagos automaticos, suscripciones y ingresos recurrentes.

#### REQ-SUB-01: Modelo de datos
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

#### REQ-SUB-02: Funcionalidades
- CRUD completo de pagos recurrentes.
- Vista tipo calendario mostrando proximos cobros del mes.
- Resumen mensual: total de suscripciones, total de ingresos recurrentes.
- Registro automatico: al llegar la fecha, crear el movimiento automaticamente en la cuenta correspondiente.
- Si `auto_register = false`, solo notificar y que el usuario confirme.
- Historial de cobros pasados por cada suscripcion.
- Alerta de total de suscripciones vs ingresos (ej: "Tus suscripciones representan el 15% de tu salario").

#### REQ-SUB-03: Programacion
- El usuario define la frecuencia y fecha exacta.
- Ejemplos:
  - Netflix: mensual, dia 15.
  - Salario: quincenal, dias 1 y 15.
  - Salario: catorcena, dias 14 y 28.
  - Spotify: mensual, dia 3.
  - Renta: mensual, dia 1.

#### REQ-SUB-04: Navegacion
- Seccion accesible desde ajustes o tab principal.
- Card resumen en el dashboard con "Proximos cobros esta semana".

---

### 4.6 Modulo de Vehiculo

**Descripcion:** Seguimiento de gastos y datos del vehiculo personal.

#### REQ-AUTO-01: Modelo de datos
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

#### REQ-AUTO-02: Submodulo de Gasolina
- Registro de cada carga de gasolina: litros, precio, total, kilometraje.
- Estadisticas calculadas por la IA o algoritmicamente:
  - **Rendimiento:** km/litro promedio (requiere al menos 2 cargas con kilometraje).
  - **Frecuencia:** cada cuantos dias carga gasolina en promedio.
  - **Gasto diario promedio:** total gastado en gasolina / dias del periodo.
  - **Gasto mensual promedio.**
  - **Gasto semanal promedio.**
  - **Prediccion:** "Al ritmo actual, gastaras $X este mes en gasolina."
  - **Comparacion:** "Este mes gastaste X% mas/menos en gasolina que el anterior."
- Grafica de gasto en gasolina por mes (barras).
- Grafica de rendimiento km/L a lo largo del tiempo.

#### REQ-AUTO-03: Submodulo de Mantenimiento
- Registro de cada mantenimiento/reparacion con costo.
- Tipos predefinidos: cambio aceite, llantas, frenos, servicio general, reparacion, otro.
- Total historico gastado en mantenimiento.
- Total por tipo de mantenimiento.
- Recordatorio programado: "Tu proximo cambio de aceite es en X km / X dias."
- Historial completo ordenado por fecha.

#### REQ-AUTO-04: Dashboard del Vehiculo
- Vista general:
  - Kilometraje actual.
  - Ultimo mantenimiento y proximo.
  - Ultima carga de gasolina.
  - Gasto total del mes en el vehiculo (gasolina + mantenimiento).
  - Rendimiento promedio.
- Resumen tipo card accesible desde el dashboard principal.

#### REQ-AUTO-05: Integracion con movimientos
- Las cargas de gasolina y mantenimientos deben crear automaticamente un movimiento de tipo "gasto" en la cuenta seleccionada, con categoria "Transporte" o "Vehiculo".

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

| # | Tarea | Prioridad |
|---|---|---|
| 1 | REQ-CRED-01 a 03: Credito completo (balance, toggle, visual) | Alta |
| 2 | REQ-PRIM-01 a 03: Cuenta principal funcional | Alta |
| 3 | REQ-PRES-01 a 06: Presupuestos vinculados a categorias | Alta |
| 4 | REQ-PERF-01 a 03: Perfil de usuario editable | Alta |
| 5 | REQ-MOV-01 a 03: Busqueda, filtros, categorias custom | Media |
| 6 | REQ-STAT-01 a 04: Estadisticas con datos reales | Media |
| 7 | REQ-AJUS-01 a 03: Moneda, export CSV, import respaldo | Media |
| 8 | REQ-TEC-03: Estado global (Zustand/Context) | Media |

### Fase 3: Nuevos Modulos (Funcionalidad Expandida)
> Agregar las nuevas secciones de la app.

| # | Tarea | Prioridad |
|---|---|---|
| 1 | REQ-SUB-01 a 04: Suscripciones y pagos recurrentes | Alta |
| 2 | REQ-OBJ-01 a 03: Objetivos de ahorro | Alta |
| 3 | REQ-PREST-01 a 03: Modulo de prestamos | Media |
| 4 | REQ-NOTIF-01 a 03: Notificaciones push completas | Media |
| 5 | REQ-AUTO-01 a 05: Modulo de vehiculo (gasolina + mantenimiento) | Media |
| 6 | REQ-TEC-10: Reorganizar navegacion para nuevos modulos | Media |

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
