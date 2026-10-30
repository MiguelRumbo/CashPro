# Migración CashPro v1 → v2

> Qué cambió al pasar de v1 a la base de v2, qué falta y cómo actualizar el teléfono sin perder datos.
> Fecha de la reestructuración: 2026-10-30. Rama: `refactor/modular-architecture-v2`.

## 1. Decisión: actualizar, no empezar de cero

El análisis del 2026-10-30 concluyó que conviene **evolucionar este repositorio**:

- El stack de v1 ya era el de la propuesta: Expo, expo-router, `expo-sqlite`, `expo-document-picker`, `expo-file-system` y EAS con perfil `development`.
- v1 tiene funciones que la propuesta no cubre (préstamos, metas, suscripciones, vehículos, MSI) y que un proyecto nuevo habría tenido que rehacer.
- Los datos reales viven en `cashpro.db` en el teléfono; migrarlos dentro de la misma app (mismo package `com.cashpro.app` y misma firma) es más simple que pasarlos a otra.

El obstáculo era la capa de datos, no la UI. Por eso la Fase 0 fue una **reestructuración sin cambiar el comportamiento**, y los cambios de datos van en la Fase 1.

## 2. Cambios estructurales (Fase 0, ya hechos)

| v1                                                                                            | v2                                                                                                                              |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Monorepo pnpm: `apps/mobile`, `apps/api` (Express sin uso), `packages/shared` (vacío)         | Una app Expo en la raíz, **npm**. `apps/api` y `packages/shared` eliminados                                                     |
| `services/database.ts` (2,217 líneas, 256 `any`, SQL a mano)                                  | 11 módulos en `src/modules/*` con `domain/`, `data/` (Drizzle), `services/`, `ui/` y `manifest.ts`                              |
| `initDatabase()` con `CREATE TABLE IF NOT EXISTS` y sin versiones                             | Migraciones Drizzle en `drizzle/`; la `0000_baseline_v1` replica el esquema de v1                                               |
| Escrituras multi-tabla sin transacción                                                        | `db.transaction()` en cada operación de servicio; los efectos entre módulos corren dentro de la misma transacción               |
| Cada función que creaba un movimiento tocaba `accounts.balance` a mano (7 copias de la regla) | Una regla pura (`accounts/domain/balance.ts`) aplicada por eventos `movement.*`                                                 |
| Pantallas en `app/` con lógica, SQL y estilos                                                 | `app/` solo tiene cascarones (`<ModuleScreen screenId>`); las pantallas viven en `src/modules/*/ui`                             |
| `contexts/CurrencyContext.tsx`                                                                | `core/preferences` (store observable) + `useCurrency()`; el módulo `settings` persiste la moneda                                |
| Constantes repetidas (categorías en 2 pantallas, íconos de presupuesto en 2, iniciales en 3)  | Un solo lugar por constante (`movements/domain/categories.ts`, `budgets/domain/budget-icons.ts`, `core/units/initials.ts`)      |
| Umbrales de avisos y factores de suscripciones en el código                                   | `src/config/app.config.ts` validado con Zod                                                                                     |
| Pestaña "Más" con enlaces fijos                                                               | Menú armado con las `actions` que aportan los módulos activos                                                                   |
| Sin pruebas                                                                                   | Jest + sql.js: BD real en memoria, smoke test con cada módulo apagado, regla de límites                                         |
| Sin lint estricto                                                                             | ESLint con `no-explicit-any`, `no-console`, `exhaustive-deps` como error y regla local de límites; Prettier; husky + commitlint |

Mapa de archivos: `app/(tabs)/index.tsx` → `src/modules/dashboard/ui/dashboard-screen.tsx`, `app/(tabs)/explore.tsx` → `reports`, `app/(tabs)/accounts.tsx` y `app/accounts/*` → `accounts`, `app/notifications.tsx` y `app/settings/notifications.tsx` → `alerts`, `app/(tabs)/settings.tsx` y `app/settings/edit-profile.tsx` → `settings`; el resto conserva su nombre de módulo. Las **rutas públicas no cambiaron** (los deep links siguen funcionando).

## 3. Compatibilidad de la base de datos

- **Mismo archivo:** `cashpro.db` (`app.config.ts → db.fileName`; no se debe cambiar).
- **Migración base idempotente:** `drizzle/0000_baseline_v1.sql` usa `CREATE TABLE IF NOT EXISTS` (editado a mano). En un teléfono con v1 no hace nada; en una instalación nueva crea las 14 tablas. Drizzle registra la migración en `__drizzle_migrations`.
- **Diferencia de DDL aceptada:** en instalaciones nuevas, las columnas con `DEFAULT` son además `NOT NULL`; en la BD de v1 no lo son. Los tipos de TypeScript asumen no nulos. La importación JSON ya no inserta `NULL` en esas columnas (deja que aplique el default). Ver ADR-001.
- **Respaldos JSON de v1:** el formato (`version: '2.0.0'`, `data.<tabla>`) se conserva. Importar ahora es **atómico** (si una tabla es inválida no se borra nada) y valida con Zod.
- **Probado:** `src/core/db/handle.test.ts` ejecuta la migración base dos veces sobre una BD con datos y verifica que no se pierden.

## 4. Migración de datos pendiente (Fase 1)

Cambios que sí tocan datos del usuario. Cada uno es una migración Drizzle con prueba sobre una copia de la BD real anonimizada, y se ejecuta **después de un respaldo JSON automático**.

| #   | Cambio                                                                                                                                 | Tipo                                     | Requiere OK |
| --- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ----------- |
| M1  | Agregar `*_cents` y `*_at` (ms UTC) a todas las tablas y llenarlas desde `REAL`/ISO                                                    | Aditiva                                  | No          |
| M2  | `movements`: `status`, `fingerprint`, `origin`, `source_event_id`, `import_batch_id`, `merchant_raw`, `merchant_id`, `posted_at`       | Aditiva                                  | No          |
| M3  | Tablas nuevas: `raw_events`, `import_batches`, `merchants`, `categories` (semilla con los 12 ids de v1), `category_rules`, `conflicts` | Aditiva                                  | No          |
| M4  | `accounts.type` admite `wallet` (hay que recrear la tabla por el `CHECK`)                                                              | Recreación de tabla                      | **Sí**      |
| M5  | Saldos derivados: `opening_balance_cents = saldo_guardado − Σ efectos`; dejar de usar `balance`/`current_balance`                      | Cambio de algoritmo (`algorithmVersion`) | **Sí**      |
| M6  | Quitar columnas `REAL`, ISO y `category_name/icon/color` ya migradas                                                                   | Destructiva                              | **Sí**      |
| M7  | Cifrar la BD con SQLCipher (`sqlcipher_export` a archivo nuevo, verificar, reemplazar)                                                 | Archivo                                  | **Sí**      |

M5 conserva exactamente el saldo que hoy ve el usuario: la diferencia entre el saldo guardado y el recalculado se guarda como saldo de apertura, así el saldo derivado coincide desde el primer día.

## 5. Comportamiento: qué cambió y qué se conservó a propósito

### 5.1 Correcciones incluidas en la Fase 0

- **Exportar e importar en Ajustes fallaba en SDK 54.** `expo-file-system` movió `writeAsStringAsync`, `getInfoAsync`, etc. a `expo-file-system/legacy`; desde la raíz lanzan error en runtime. Ahora se usa `legacy` en `settings/platform/files.ts`.
- **Detalle de cuenta:** mostraba la tarjeta con `account.card_number`, que nunca existió; ahora usa `card_last_four`.
- **Iniciales del perfil:** un nombre con dos espacios seguidos rompía el cálculo; ya no.
- **Atomicidad:** antes, un error a la mitad de una operación (p. ej. pagar un préstamo) podía dejar el abono guardado sin el movimiento, o el saldo cambiado sin el movimiento. Ahora todo o nada.
- **Formato de montos:** los avisos y algunas pantallas usaban `$` fijo; ahora usan la moneda elegida.

### 5.2 Rarezas de v1 conservadas (decisión pendiente)

Se mantuvieron para no cambiar el comportamiento en la Fase 0. Están registradas en `docs/open-questions.md`:

- **OQ-007:** los presupuestos solo suman gastos capturados a mano; los de suscripciones con categoría no suman. Sin embargo, editar o borrar cualquier movimiento sí ajusta el presupuesto.
- **OQ-008:** el acumulado del presupuesto nunca se reinicia al cambiar de semana o mes.
- **OQ-009:** borrar el movimiento informativo de un pago MSI vuelve a reducir la deuda de la tarjeta, aunque ese movimiento nunca la aumentó.
- **OQ-010:** la "fecha fin" del presupuesto se muestra en el formulario pero nunca se guardó (no existe la columna).
- **OQ-011:** editar o borrar una carga de gasolina localiza su movimiento por categoría, fecha y monto (heurística); en v2 se enlazará por id.
- **OQ-012:** borrar una cuenta deja sus movimientos huérfanos.
- **OQ-013:** importar un archivo `.db` reemplaza el archivo con la BD abierta (riesgo de corrupción con WAL).

## 6. Cómo actualizar el teléfono

1. En v1: **Ajustes → Exportar respaldo JSON** y guárdalo fuera del teléfono.
2. Instala la build nueva **firmada con la misma llave** que v1 (si la llave cambia, Android no deja instalar encima y se pierden los datos). Ver OQ-006.
3. Abre la app: la migración base corre sola y no modifica los datos.
4. Verifica patrimonio, saldos de 2–3 cuentas y el último movimiento contra lo que veías en v1 (prueba manual MT-01 en `docs/testing.md`).
5. Si algo no cuadra: reinstala v1 o importa el respaldo JSON del paso 1.

## 7. Qué sigue

Ver `specs.md` §8 (fases) y `docs/progress/worklog.md`.
