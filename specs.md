# CashPro v2 — Especificación técnica

> **Cómo** se construye lo descrito en `requirement.md`. Las reglas de trabajo están en `CLAUDE.md`.
> Estado: **borrador para aprobación**. Las secciones marcadas _(pendiente)_ esperan respuesta en `docs/open-questions.md`.

---

## 1. Stack

| Capa          | Tecnología                                                                                           | Estado                                  |
| ------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------- |
| App           | Expo SDK 54, React Native 0.81, React 19.1, TypeScript 5.9 (`strict`, `noUncheckedIndexedAccess`)    | En uso                                  |
| Navegación    | expo-router 6 (rutas en `app/` como cascarones finos)                                                | En uso                                  |
| Build         | Development build (`expo-dev-client`), EAS o `expo run:android`; release por GitHub Actions          | dev-client instalado; release pendiente |
| BD            | `expo-sqlite` 16 + Drizzle ORM 0.45 + drizzle-kit 0.31                                               | En uso                                  |
| Cifrado BD    | SQLCipher vía config plugin de `expo-sqlite` (`android.useSQLCipher`) + llave en `expo-secure-store` | Fase 1                                  |
| Validación    | Zod 4 (config y toda entrada externa)                                                                | En uso                                  |
| Estado de UI  | `useState` + `useSyncExternalStore` (preferencias)                                                   | En uso                                  |
| Pruebas       | Jest 29 + jest-expo 54 + @testing-library/react-native 14 + sql.js                                   | En uso                                  |
| Calidad       | ESLint 9 (expo + prettier + regla local de límites), Prettier 3, husky, lint-staged 16, commitlint   | En uso                                  |
| Nativo propio | Expo Modules API (Kotlin) para el listener de notificaciones y la extracción de PDF                  | Fases 2 y 1b                            |

> La propuesta original mencionaba TanStack Query y Zustand. **No se adoptan por ahora**: los repositorios son síncronos y el registry ya resuelve el estado compartido. Si aparece una necesidad real (caché asíncrona de red), se propone con un ADR.

## 2. Dependencias aprobadas

Versiones fijadas por `package-lock.json`. Las de Expo se instalan con la versión de `node_modules/expo/bundledNativeModules.json`.

**Ya instaladas (aprobadas el 2026-10-30):** `drizzle-orm`, `drizzle-kit`, `zod`, `expo-dev-client`, `babel-plugin-inline-import`, `prettier`, `eslint-config-prettier`, `jest`, `jest-expo`, `@testing-library/react-native` (+ su peer `test-renderer`), `sql.js` (+ `@types/sql.js`), `husky`, `lint-staged`, `@commitlint/cli`, `@commitlint/config-conventional`, `@types/jest`. Más las heredadas de v1 (`package.json`).

**Propuestas para v2 (requieren OK antes de instalarse):**

| Paquete                                 | Versión SDK 54 | Para qué                                  | Fase |
| --------------------------------------- | -------------- | ----------------------------------------- | ---- |
| `expo-secure-store`                     | ~15.0.8        | Llave de SQLCipher, contraseña de PDF     | 1    |
| `expo-local-authentication`             | ~17.0.9        | Bloqueo biométrico                        | 1    |
| `expo-crypto`                           | ~15.0.9        | Hash de fingerprint y de eventos crudos   | 1    |
| `expo-auth-session`                     | ~7.0.11        | Gmail OAuth _(pendiente OQ-101)_          | 4    |
| `com.tom-roush:pdfbox-android` (Gradle) | 2.0.27.0       | Texto de PDF (incluye PDF con contraseña) | 1b   |

## 3. Arquitectura

Capas, reglas de dependencia, anatomía de módulo y comunicación: `CLAUDE.md` §6 y `docs/architecture.md`.

### 3.1 Módulos actuales

| Módulo (carpeta) | Id              | Tablas                                  | Provee                  | Escucha                         |
| ---------------- | --------------- | --------------------------------------- | ----------------------- | ------------------------------- |
| `accounts`       | `accounts`      | `accounts`, `msi_purchases`             | `accountsQueryKey`      | `movement.*` (saldos)           |
| `movements`      | `movements`     | `movements`                             | `movementsLedgerKey`    | —                               |
| `budgets`        | `budgets`       | `budgets`                               | `budgetsQueryKey`       | `movement.*` (acumulado)        |
| `savings-goals`  | `savingsGoals`  | `savings_goals`, `goal_contributions`   | `savingsGoalsQueryKey`  | —                               |
| `loans`          | `loans`         | `loans`, `loan_payments`                | `loansQueryKey`         | —                               |
| `subscriptions`  | `subscriptions` | `recurring_payments`                    | `subscriptionsQueryKey` | —                               |
| `vehicles`       | `vehicles`      | `vehicles`, `fuel_loads`, `maintenance` | `vehiclesQueryKey`      | —                               |
| `alerts`         | `alerts`        | `notification_settings`                 | —                       | `data.cleared`, `data.imported` |
| `settings`       | `settings`      | `user_profile`                          | `profileQueryKey`       | —                               |
| `dashboard`      | `dashboard`     | —                                       | —                       | —                               |
| `reports`        | `reports`       | —                                       | —                       | —                               |

### 3.2 Módulos nuevos de v2

| Módulo                 | Responsabilidad                                                              | Depende de (capacidades)                                     |
| ---------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `security`             | Llave SQLCipher, bloqueo biométrico, respaldo cifrado                        | — (lo usa `bootstrap` antes de abrir la BD)                  |
| `ingestion`            | Tabla `raw_events`, registro de parsers, bandeja "Sin procesar"              | `movementsLedgerKey`, `accountsQueryKey`                     |
| `notification-capture` | Puente con el módulo nativo del listener, lista blanca, salud                | provee eventos a `ingestion` vía capacidad `rawEventSinkKey` |
| `statements`           | Importación CSV/XML/PDF, vista previa, `import_batches`, validación de saldo | `rawEventSinkKey`, `movementsLedgerKey`                      |
| `email-sync`           | Gmail o IMAP, sincronización incremental _(pendiente OQ-101)_                | `rawEventSinkKey`                                            |
| `reconciliation`       | Fingerprint, fusión, `pending → confirmed`, cola de conflictos               | `movementsLedgerKey`                                         |
| `categorization`       | `categories`, `merchants`, `category_rules`, aprendizaje por corrección      | escucha `movement.recorded`                                  |

Los **parsers** son funciones puras en `src/modules/ingestion/domain/parsers/<banco>/<fuente>.ts` con la interfaz:

```ts
interface BankParser {
  id: string; // "nu.notification", "bbva.email", "mercadopago.csv"
  source: 'notification' | 'email' | 'statement';
  matches(event: RawEvent): boolean;
  parse(event: RawEvent): ParsedTx | null;
}

interface ParsedTx {
  accountHint: string; // últimos 4 dígitos o alias
  amountCents: number; // siempre positivo
  direction: 'debit' | 'credit';
  currency: string; // 'MXN' por defecto
  merchantRaw: string;
  occurredAt: number; // ms UTC
  confidence: number; // 0..1
}
```

Fixtures anonimizados en `src/modules/ingestion/tests/fixtures/<banco>/`.

### 3.3 Código nativo

- **Listener de notificaciones:** módulo local de Expo (Kotlin) con `NotificationListenerService`. Filtra por lista blanca **en Kotlin**, guarda `{package, title, text, bigText, postedAt, key, hash}` en una cola SQLite nativa propia y expone `drain()` a JS. Ubicación propuesta: `native/notification-listener/` con `expo.autolinking.nativeModulesDir` apuntando a `native/` (para no confundir con `src/modules`) _(verificar en el spike de Fase 2)_.
- **Permiso:** `BIND_NOTIFICATION_LISTENER_SERVICE` en el `<service>` (no es permiso de usuario; se concede en Ajustes). Se agrega con un config plugin `plugins/with-notification-listener.js` con tests.
- **PDF:** módulo local Kotlin con PdfBox-Android (`extractText(uri, password?)`). `PdfRenderer` no sirve: solo renderiza imágenes.
- `android/` sigue generado por `expo prebuild`; nada se edita a mano.

## 4. Modelo de datos

### 4.1 Hoy (v1 heredado)

14 tablas replicadas por `drizzle/0000_baseline_v1.sql` (ver `docs/migration-v1-v2.md` §3). Montos `REAL`, fechas ISO texto, saldos guardados y modificados por eventos.

### 4.2 Objetivo v2

Convenciones nuevas: montos en **centavos enteros** (`*_cents`), tiempos en **ms UTC** (`*_at`), ids `integer` autoincrementales.

```
accounts          + bank, last4 (= card_last_four), type += 'wallet', opening_balance_cents
                  balance y current_balance pasan a CALCULARSE (ver 4.3)
movements         + amount_cents, occurred_at, posted_at, status(pending|confirmed),
                    fingerprint, source_event_id, import_batch_id, merchant_raw, merchant_id,
                    origin (movements|savingsGoals|loans|subscriptions|vehicles|accounts|ingestion)
                  - category_name/icon/color (se resuelven desde categories)
raw_events        id, source(notification|email|statement), bank, received_at,
                  payload_encrypted, hash UNIQUE, status(pending|parsed|unparsed|ignored), parser_id
import_batches    id, account_id, file_name, imported_at, tx_count, reverted,
                  opening_balance_cents, closing_balance_cents, period_start, period_end,
                  due_date, minimum_payment_cents
merchants         id, name, normalized_name UNIQUE, default_category_id
categories        id, name, parent_id, icon, color, is_system  (semilla: las 12 de v1 con sus ids)
category_rules    id, pattern, merchant_id?, category_id, priority
conflicts         id, movement_a_id, movement_b_id, reason, resolved_at
```

### 4.3 Saldos derivados

CLAUDE.md §13 prohíbe guardar datos derivables. En v2:

- `saldo(cuenta) = opening_balance_cents + Σ efectos(movements)`, con las reglas de `src/modules/accounts/domain/balance.ts` (ya probadas).
- MSI: la deuda = deuda de movimientos + `remaining_amount` de compras activas (sin movimiento informativo con efecto, como hoy).
- Presupuestos: `current_amount = Σ gastos del periodo vigente` por consulta, lo que también arregla que hoy el acumulado no se reinicia al cambiar de periodo (ver OQ-008).
- Si el rendimiento lo exige, un caché se propone con ADR.

### 4.4 Deduplicación y conciliación

- `fingerprint = sha256(account_id | amount_cents | direction | día local | merchant_normalizado)`.
- Notificación + correo con el mismo fingerprint en ±1 día → un solo movimiento.
- Un `pending` pasa a `confirmed` con un movimiento de estado de cuenta compatible (mismo monto, ±3 días, cuenta igual). Sin contraparte → se crea `confirmed`.
- Ambigüedad (mismo monto y día, comercio distinto) → `conflicts`, nunca se fusiona solo.

## 5. Configuración

Todo vive en `src/config/app.config.ts` (tabla completa en `docs/architecture.md`). Secciones nuevas de v2 (valores propuestos):

| Clave                              | Valor                              | Unidad | Propósito                                                          |
| ---------------------------------- | ---------------------------------- | ------ | ------------------------------------------------------------------ |
| `ingestion.allowedPackages`        | `{}` (se llena con el dispositivo) | —      | Lista blanca banco → paquete Android                               |
| `ingestion.drainIntervalMs`        | 900000                             | ms     | Vaciado periódico de la cola nativa                                |
| `reconciliation.mergeWindowDays`   | 1                                  | días   | Fusión notificación/correo                                         |
| `reconciliation.confirmWindowDays` | 3                                  | días   | Confirmación con estado de cuenta                                  |
| `security.lockOnBackgroundMs`      | 0                                  | ms     | Tiempo en segundo plano antes de pedir biometría (✅ implementado) |
| `statements.maxFileBytes`          | 10485760                           | bytes  | Tamaño máximo de archivo importado                                 |

## 6. Seguridad y privacidad

Detalle en `docs/security.md`. Resumen: todo local; SQLCipher + Keystore; biometría; sin telemetría; el listener descarta todo lo que no esté en la lista blanca **antes** de guardar; la única salida de red prevista es el correo (si se aprueba) y el respaldo a un destino elegido por el usuario.

## 7. Riesgos

| Riesgo                                                                         | Impacto                          | Mitigación                                                                                                                                                                          |
| ------------------------------------------------------------------------------ | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Migrar datos de v1 (REAL→centavos, ISO→ms, saldos guardados→derivados)         | Saldos distintos tras actualizar | Respaldo JSON automático antes de migrar; migración con `algorithmVersion`; test con BD de v1 real anonimizada; comparar saldo guardado vs. derivado y registrar ajuste de apertura |
| Perder la llave de SQLCipher (borrar datos de la app o restaurar sin Keystore) | La BD queda ilegible             | `allowBackup: false`; respaldos por JSON (cifrado en OQ-106); la pantalla de error no borra nada                                                                                    |
| Bancos cambian el texto de sus avisos                                          | El parser deja de reconocer      | Fixtures + tests + bandeja "Sin procesar"                                                                                                                                           |
| Android mata el listener                                                       | Se pierden avisos                | Exclusión de batería, `requestRebind`, indicador de salud; correos y estados de cuenta como red de seguridad                                                                        |
| Token de Gmail caduca en modo Testing                                          | El sync se detiene               | Publicar el proyecto "In production" (uso personal) o IMAP _(OQ-101)_                                                                                                               |
| PDF distinto por producto del mismo banco                                      | Parser frágil                    | Un parser por producto + validación de saldo                                                                                                                                        |
| Pantallas heredadas grandes (hasta 1,700 líneas)                               | Cambios lentos y riesgosos       | Partirlas en `XxxView` + hooks conforme se toquen (deuda registrada en el worklog)                                                                                                  |

## 8. Fases

No se avanza de fase con la anterior rota. Cada fase termina con DoD (`CLAUDE.md` §16).

- **Fase 0 — Fundamentos.** ✅ Reestructura modular, config Zod, core, Drizzle con migración base, transacciones, tooling, CI de checks, smoke tests. ⏳ Partir pantallas grandes (se hace al tocarlas).
- **Fase 1 — Datos v2 y seguridad.** ✅ SQLCipher (llave en secure-store), bloqueo biométrico, `allowBackup: false`, release a GitHub (`release.yml` + plugins). ⏳ Esquema v2 (centavos, ms, saldos derivados, categorías en tabla, `wallet`) regenerando la base (OQ-017); respaldo cifrado (OQ-106).
- **Fase 1b — Estados de cuenta.** `statements` + `ingestion` (sin nativo para CSV/XML), vista previa, lotes reversibles, validación de saldo; después extracción PDF nativa.
- **Fase 2 — Notificaciones.** Spike del listener en dispositivo, módulo nativo, cola, pantalla de permisos, parsers de 1–2 bancos.
- **Fase 3 — Conciliación.** Fingerprint, fusión, `pending/confirmed`, conflictos.
- **Fase 4 — Correos.** _(pendiente OQ-101)_.
- **Fase 5 — Categorización, resumen y presupuestos** con categorías editables y reglas.
- **Fase 6 — Endurecimiento.** Pruebas de regresión con fixtures, revisión de permisos y manifiesto, `npm audit`.
