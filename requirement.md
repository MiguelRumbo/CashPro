# CashPro v2 — Requisitos

> **Qué** se construye. El **cómo** está en `specs.md`; las reglas de trabajo, en `CLAUDE.md`.
> Fuente: la app v1 actual y la propuesta "App de finanzas personales (Android + Expo)" del 2026-10-30.
> Estado: **borrador para aprobación del usuario**. Lo marcado como _(pendiente)_ depende de `docs/open-questions.md`.

---

## 1. Visión

Tener en un solo lugar todos los movimientos de mis cuentas y tarjetas (Platacard, Mercado Pago, Nu, Banamex, BBVA, BanBajío y las que se agreguen), categorizados y conciliados, **sin entregar credenciales bancarias a nadie** y **sin backend propio**. Los datos viven en el teléfono, cifrados.

v2 conserva todo lo que hace v1 (captura manual, presupuestos, metas, préstamos, suscripciones, vehículos, MSI) y agrega captura automática de movimientos desde notificaciones, correos y estados de cuenta.

## 2. Principios

1. **Local primero.** Sin servidor propio; nada sale del dispositivo sin autorización explícita.
2. **Cero credenciales bancarias.** La app nunca pide ni guarda usuario o contraseña de un banco.
3. **Dos fuentes que se complementan.** Los avisos (notificaciones y correos) dan inmediatez; los estados de cuenta dan la verdad contable. La app concilia ambas.
4. **Un parser por banco y por fuente.** Si un banco cambia el formato, se corrige un solo archivo.
5. **Nada se pierde en silencio.** Todo evento que no se pueda interpretar va a la bandeja "Sin procesar".
6. **Lo de v1 no se rompe.** Los datos y funciones existentes se conservan al actualizar (ver `docs/migration-v1-v2.md`).

## 3. Alcance

**Plataforma:** solo Android, development build de Expo (no Expo Go). **Distribución:** APK personal en GitHub Releases.

### 3.1 Dentro del alcance

- Todo lo de v1 (RF-01 a RF-12).
- Captura por notificaciones de apps bancarias (RF-20 a RF-23).
- Captura por correos de Gmail, solo lectura (RF-30 a RF-32) _(pendiente: OQ-101, Gmail OAuth o IMAP)_.
- Importación de estados de cuenta CSV, XML y PDF con texto (RF-40 a RF-45).
- Conciliación y deduplicación (RF-50 a RF-53).
- Categorización por reglas y aprendizaje por corrección (RF-60 a RF-62).
- Seguridad: BD cifrada, bloqueo biométrico, respaldo cifrado (RNF-10, RNF-11, RNF-13 a RNF-16).

### 3.2 Fuera de alcance (por ahora)

- iOS (no permite leer notificaciones de otras apps).
- Agregadores (Belvo, Finerio Connect), scraping o automatización de apps bancarias.
- Sincronización en la nube, multi-dispositivo o cuentas de usuario _(pendiente: OQ-100)_.
- OCR de estados de cuenta escaneados.
- Inversiones, criptomonedas y cuentas en moneda extranjera (solo existe el campo `currency`).
- Categorización con modelos de lenguaje _(pendiente: OQ-103; si se aprueba, desactivada por defecto)_.
- Publicación en Google Play.

## 4. Requisitos funcionales

Formato: **RF-xx — título.** Descripción. _Criterios de aceptación (CA)._

### 4.1 Funciones heredadas de v1 (se conservan)

- **RF-01 — Cuentas.** Alta, edición y baja de cuentas de efectivo, banco, débito y crédito; marcar una como principal; elegir si suma al patrimonio. Las tarjetas de crédito guardan límite, deuda, día de corte y día de pago. Solo se guardan los últimos 4 dígitos de la tarjeta.
  _CA: crear una cuenta de crédito la deja fuera del patrimonio por defecto; el patrimonio = saldos incluidos + crédito disponible de las tarjetas incluidas._
- **RF-02 — Movimientos manuales.** Gasto, ingreso o transferencia con categoría (salvo transferencias), cuenta, fecha, título y notas. Editar o borrar un movimiento recalcula los saldos.
  _CA: un gasto de 200 en débito baja el saldo 200; editarlo a 50 deja el saldo con −50; borrarlo lo restaura. En crédito, un gasto aumenta la deuda._
- **RF-03 — Presupuestos.** Límites semanales o mensuales por categorías (o todas). Los gastos manuales de esas categorías suman al acumulado.
- **RF-04 — Metas de ahorro.** Meta con objetivo, fecha límite y aportaciones desde una cuenta; al alcanzar el objetivo se marca como completada. Cada aportación registra un gasto "Ahorro".
- **RF-05 — Préstamos a terceros.** Registrar un préstamo (opcionalmente como gasto), recibir abonos (registrados como ingresos) y ver el estado (activo, parcial, pagado).
- **RF-06 — Suscripciones y pagos recurrentes.** Frecuencia semanal, quincenal, mensual o anual; registrar el cobro como movimiento; próxima fecha; totales mensuales.
- **RF-07 — Vehículos.** Cargas de gasolina y mantenimientos que actualizan el odómetro y registran un gasto de Transporte; rendimiento km/L y costos del mes.
- **RF-08 — Compras a meses sin intereses (MSI).** Ocupan crédito por su total; pagar una mensualidad libera crédito y deja un movimiento informativo.
- **RF-09 — Avisos internos.** Corte y pago de tarjetas, presupuesto al 80 % y excedido, préstamos por vencer, suscripciones por cobrar y metas atrasadas; con interruptores por tipo y modo vacaciones.
- **RF-10 — Inicio y estadísticas.** Patrimonio, ingresos y gastos del mes, variación contra el mes anterior, gastos por categoría, tendencias y resúmenes de cada módulo.
- **RF-11 — Perfil y moneda.** Nombre, correo y moneda de visualización (MXN, USD, EUR).
- **RF-12 — Datos.** Exportar respaldo JSON (compatible con los respaldos de v1), exportar movimientos a CSV, exportar e importar la BD, importar JSON y borrar todos los datos.
  _CA: exportar → borrar todo → importar deja los mismos datos. Un JSON inválido no borra nada._

### 4.2 Captura por notificaciones (Opción 1a)

- **RF-20 — Listener de notificaciones.** Un servicio nativo recibe las notificaciones del sistema **solo** de los paquetes bancarios en lista blanca; las demás se descartan sin guardarse ni registrarse.
  _CA: con la app cerrada, una notificación de un banco permitido queda guardada; una de otra app no deja rastro._
- **RF-21 — Cola nativa persistente.** Las notificaciones permitidas se guardan del lado nativo y se pasan a `raw_events` cuando corre la app.
  _CA: sin red y con la app cerrada no se pierde ningún aviso._
- **RF-22 — Salud del listener.** Pantalla de permisos (acceso a notificaciones, exclusión de optimización de batería) e indicador "activo / inactivo".
- **RF-23 — Parsers de notificación por banco.** Primeros bancos: Nu, Mercado Pago y BBVA _(pendiente: OQ-104)_. Los nombres de paquete se obtienen del dispositivo, no de memoria.
  _CA: un cargo con tarjeta aparece como `pending` en menos de un minuto, con la app cerrada._

### 4.3 Captura por correo (Opción 1b)

- **RF-30 — Conexión de correo de solo lectura** _(pendiente: OQ-101)_.
- **RF-31 — Sincronización incremental** filtrada por remitentes bancarios; nunca se lee el buzón completo.
- **RF-32 — Parsers de correo por banco**, fusionados con los avisos de notificación.

### 4.4 Estados de cuenta (Opción 2)

- **RF-40 — Importar archivo.** Elegir banco y cuenta, seleccionar CSV, XML o PDF.
- **RF-41 — PDF con contraseña.** Se pide una vez; guardarla cifrada es opcional y requiere confirmación.
- **RF-42 — Vista previa.** Antes de confirmar se muestran los movimientos nuevos, los que ya existen y los que están en conflicto.
- **RF-43 — Lote reversible.** Cada importación crea un `import_batch` que se puede revertir completo.
- **RF-44 — Validación de saldo.** `saldo_inicial + Σ movimientos = saldo_final`; si no cuadra se avisa y no se confirma automáticamente.
- **RF-45 — Datos de crédito.** Del periodo se guardan la fecha de corte, la fecha límite y el pago mínimo.

### 4.5 Conciliación

- **RF-50 — Huella.** `fingerprint = hash(cuenta, monto, dirección, día, comercio normalizado)`.
- **RF-51 — Fusión de avisos.** Un mismo movimiento que llega por notificación y por correo (±1 día) queda una sola vez.
- **RF-52 — Confirmación.** Un movimiento `pending` pasa a `confirmed` cuando aparece en el estado de cuenta; lo que solo trae el estado de cuenta entra como `confirmed`.
- **RF-53 — Conflictos.** Los casos ambiguos (mismo monto y día, comercio distinto) van a revisión manual; nunca se fusionan solos.
  _CA: importar el estado de cuenta del mes confirma los cargos ya avisados sin duplicarlos._

### 4.6 Categorización

- **RF-60 — Categorías editables** (hoy son fijas en código) con jerarquía e ícono.
- **RF-61 — Reglas por comercio** con prioridad.
- **RF-62 — Aprendizaje por corrección.** Al cambiar la categoría de un movimiento se ofrece "aplicar a todos los de este comercio".

### 4.7 Bandeja "Sin procesar"

- **RF-70 — Bandeja.** Lista de eventos no reconocidos con opción de ignorar, capturar a mano o copiar como fixture anonimizado.
  _CA: ningún evento bancario se pierde: o se convierte en movimiento o queda en la bandeja._

## 5. Requisitos no funcionales

- **RNF-01 — Arquitectura modular** según `CLAUDE.md` §6; cada módulo se puede apagar sin romper la app.
- **RNF-02 — Configuración en un solo punto** (`src/config/app.config.ts`), validada con Zod.
- **RNF-03 — Migraciones** versionadas con Drizzle; las de datos de v1 son reversibles mediante respaldo previo.
- **RNF-04 — Atomicidad.** Toda operación que toca varias tablas o módulos es una sola transacción.
- **RNF-05 — Rendimiento.** Listas virtualizadas y paginadas; el procesamiento por lotes no congela la UI.
- **RNF-06 — Pruebas.** Dominio al 100 %; repositorios con sql.js; parsers con fixtures anonimizados; smoke test con módulos apagados.
- **RNF-10 — BD cifrada** (SQLCipher) con la llave en Android Keystore.
- **RNF-11 — Bloqueo biométrico** al abrir y al volver de segundo plano.
- ~~**RNF-12 — `FLAG_SECURE`.**~~ Retirado el 2026-10-31 a pedido del usuario: impedía tomar capturas de pantalla (OQ-022).
- **RNF-13 — Sin telemetría** ni crash reporting con contenido de eventos.
- **RNF-14 — Red mínima.** Solo para el correo (si se aprueba) y el respaldo; cada salida se documenta en `docs/security.md`.
- **RNF-15 — Respaldo cifrado** con contraseña del usuario; nunca en claro (incluye el JSON de RF-12 cuando haya datos de v2).
- **RNF-16 — Borrado real.** "Borrar todo" elimina datos, colas nativas, cachés y archivos exportados.

## 6. Criterios de aceptación del MVP v2

1. Un cargo con tarjeta aparece en menos de un minuto como `pending`, con la app cerrada.
2. Importar el estado de cuenta del mes marca esos cargos como `confirmed` sin duplicarlos.
3. Cada importación cuadra con el saldo final o avisa explícitamente que no.
4. Ningún evento bancario se pierde.
5. Sin red y sin la app abierta, el listener sigue guardando eventos.
6. Ninguna credencial bancaria se solicita ni se almacena.
7. Los datos de v1 siguen intactos tras actualizar (cuentas, movimientos, saldos y respaldos).

## 7. Preguntas abiertas

Ver `docs/open-questions.md` (OQ-100 en adelante para v2; OQ-001 a OQ-0xx para la reestructuración).
