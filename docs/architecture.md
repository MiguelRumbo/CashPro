# Arquitectura

Resumen operativo. Las reglas obligatorias están en `CLAUDE.md` §6–§7; el plan de v2, en `specs.md`.

## Capas

```
app/          Rutas de Expo Router: solo <ModuleScreen screenId> (y el layout de pestañas)
src/config/   app.config.ts + schema.ts (Zod, deepFreeze)
src/core/     contracts · events · registry · db · logger · preferences · ui-kit · units
src/modules/  un módulo autocontenido por carpeta
src/bootstrap/ arranque en dos fases, loaders perezosos, useBoot()
drizzle/      migraciones versionadas (0000_baseline_v1 = esquema v1)
tests/        integración entre módulos y smoke tests
tools/eslint/ regla module-boundaries (+ su test)
plugins/      config plugins de Expo (vacío por ahora)
```

Límites de importación: los hace cumplir `tools/eslint/module-boundaries.js` (ver tabla en `CLAUDE.md` §6.1).

## Arranque

1. `app/_layout.tsx` llama a `useBoot()` y mantiene el splash.
2. `openAppDatabase()` obtiene la llave SQLCipher de secure-store (la crea la primera vez), abre `cashpro.db` con `PRAGMA key` (WAL, `foreign_keys = ON`) y aplica las migraciones de `drizzle/`. Si fallan, se muestra la pantalla de error (`coreTexts.bootError*`) y no se toca nada más.
3. `startModules()`:
   - **Fase 1:** por cada módulo con `enabled: true`, `require` perezoso de su `index.ts` y `register(ctx)` (crea servicios y `ctx.provide` de capacidades). Si un módulo falla, se revocan sus capacidades y la app sigue sin él.
   - Suscribe los `subscriptions()` de todos los módulos activos al `EventBus`.
   - **Fase 2:** `onReady()` de cada módulo (siembra de filas por defecto, sincronizar preferencias).
4. `CoreProvider` expone registry, preferencias, config y logger a la UI; `ModuleGates` aplica los `gate` (bloqueo); se oculta el splash.

## Comunicación entre módulos

- **Capacidades** (`core/contracts/finance.ts`): `accountsQueryKey`, `movementsLedgerKey`, `budgetsQueryKey`, `savingsGoalsQueryKey`, `loansQueryKey`, `subscriptionsQueryKey`, `vehiclesQueryKey`, `profileQueryKey`. Se resuelven al usarse (`ctx.resolve` en servicios, `useCapability` en UI) y valen `undefined` si el proveedor está apagado.
- **Eventos** (`core/events/event-map.ts`): `movement.recorded` (con `origin` y `affectsBalance`), `movement.updated`, `movement.deleted`, `account.deleted`, `data.cleared`, `data.imported`. Despacho síncrono dentro de la transacción del emisor.
- **Libro de movimientos:** cualquier módulo que necesite registrar dinero llama `movementsLedgerKey.record(...)`; `accounts` ajusta saldos y `budgets` acumulados escuchando los eventos.
- **Contribuciones a la UI:** `tabs`, `screens` (por `ScreenId`), `actions` (slots `more.menu`, con sección `finance` o `general`, y `tabbar.fab` para el "+" central), `gate` (envoltorio de toda la app, p. ej. el bloqueo; ver ADR-003) y `dataPort` (respaldo JSON y "borrar todo").

## Rutas

| Ruta                                                               | ScreenId                                              | Módulo        |
| ------------------------------------------------------------------ | ----------------------------------------------------- | ------------- |
| `/(tabs)` (Inicio)                                                 | `dashboard.home`                                      | dashboard     |
| `/(tabs)/movements`                                                | `movements.list`                                      | movements     |
| `/(tabs)/explore` (se abre desde Más)                              | `reports.home`                                        | reports       |
| `/(tabs)/accounts`                                                 | `accounts.list`                                       | accounts      |
| `/(tabs)/add`                                                      | — (botón "+" central, abre `/movements/add-movement`) | core          |
| `/(tabs)/more`                                                     | — (`ActionMenuScreen`, núcleo)                        | core          |
| `/(tabs)/settings` (se abre desde Más)                             | `settings.home`                                       | settings      |
| `/accounts/{add-account,edit-account,account-detail}`              | `accounts.{add,edit,detail}`                          | accounts      |
| `/movements/{add-movement,movement-detail}`                        | `movements.{add,detail}`                              | movements     |
| `/budgets`, `/budgets/{add-budget,edit-budget}`                    | `budgets.{list,add,edit}`                             | budgets       |
| `/savings-goals`, `/savings-goals/{add-goal,goal-detail}`          | `savingsGoals.{list,add,detail}`                      | savingsGoals  |
| `/loans`, `/loans/{add-loan,loan-detail}`                          | `loans.{list,add,detail}`                             | loans         |
| `/subscriptions`, `/subscriptions/{add-subscription,sub-detail}`   | `subscriptions.{list,add,detail}`                     | subscriptions |
| `/vehicles`, `/vehicles/{add-vehicle,edit-vehicle,vehicle-detail}` | `vehicles.{list,add,edit,detail}`                     | vehicles      |
| `/notifications`, `/settings/notifications`                        | `alerts.{inbox,settings}`                             | alerts        |
| `/settings/edit-profile`                                           | `settings.editProfile`                                | settings      |

Una pestaña cuyo módulo está apagado se oculta (`href: null`); una ruta de módulo apagado muestra "Función no disponible".

## Configuración (`src/config/app.config.ts`)

| Clave                                 | Valor                                            | Unidad     | Propósito                                                                                  |
| ------------------------------------- | ------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------ |
| `app.name`                            | `CashPro`                                        | —          | Nombre visible                                                                             |
| `app.locale`                          | `es-MX`                                          | BCP 47     | Formato de fechas en CSV                                                                   |
| `modules.<id>.enabled`                | `true` (los 12)                                  | bool       | Interruptor por módulo                                                                     |
| `db.fileName`                         | `cashpro.db`                                     | —          | Archivo SQLite                                                                             |
| `db.keyStorageKey`                    | `cashpro.db.key`                                 | —          | Entrada de secure-store con la llave SQLCipher                                             |
| `logger.devMinLevel` / `prodMinLevel` | `debug` / `warn`                                 | nivel      | Nivel mínimo de log                                                                        |
| `currency.default`                    | `MXN`                                            | ISO 4217   | Moneda por defecto                                                                         |
| `currency.formats`                    | MXN `es-MX $`, USD `en-US $`, EUR `de-DE €`      | —          | Locale y símbolo por moneda                                                                |
| `currency.fractionDigits`             | 2                                                | dígitos    | Decimales mostrados                                                                        |
| `accounts.cardLastDigits`             | 4                                                | dígitos    | Dígitos de tarjeta que se guardan                                                          |
| `budgets.defaults.*`                  | íconos y colores                                 | —          | Valores por defecto al crear presupuesto                                                   |
| `savingsGoals.defaults.*`             | `target`, `#20df60`                              | —          | Ícono y color por defecto de metas                                                         |
| `subscriptions.monthlyFactor`         | semanal 4.33, quincenal 2, mensual 1, anual 1/12 | factor     | Conversión a monto mensual                                                                 |
| `subscriptions.upcomingWindowDays`    | 7                                                | días       | Ventana de "próximos pagos"                                                                |
| `subscriptions.defaults.*`            | `creditcard`, `#6b7280`, 1                       | —, —, días | Valores por defecto                                                                        |
| `alerts.creditCutoffDaysBefore`       | [3, 0]                                           | días       | Avisos antes del corte                                                                     |
| `alerts.creditPaymentDaysBefore`      | [5, 3, 0]                                        | días       | Avisos antes del pago                                                                      |
| `alerts.budgetWarningPercent`         | 80                                               | %          | Advertencia de presupuesto                                                                 |
| `alerts.budgetExceededPercent`        | 100                                              | %          | Presupuesto excedido                                                                       |
| `alerts.loanDueWithinDays`            | 7                                                | días       | Ventana de préstamos por vencer                                                            |
| `alerts.subscriptionDueDaysBefore`    | [1, 0]                                           | días       | Aviso de cobro de suscripción                                                              |
| `alerts.goalDaysPerMonth`             | 30                                               | días       | Aproximación de mes para metas                                                             |
| `alerts.goalBehindRatio`              | 0.5                                              | fracción   | Umbral de meta atrasada                                                                    |
| `security.lockOnBackgroundMs`         | 0                                                | ms         | Tiempo en segundo plano antes de volver a pedir autenticación                              |
| `ui.splashFadeMs`                     | 250                                              | ms         | Desvanecido del splash                                                                     |
| `ui.defaultTheme`                     | `forest`                                         | id         | Tema inicial: `forest` (A), `daylight` (B) o `wallet` (C); el usuario lo cambia en Ajustes |

## Tema visual (ADR-004)

- Tres temas en `core/ui-kit/theme.ts` (`forest`, `daylight`, `wallet`) con la misma tipografía (Sora para títulos y cifras ≥ 22 pt, Manrope para el resto; `core/ui-kit/typography.ts`).
- El tema es una preferencia (`core/preferences`), se guarda en `user_profile.theme` (migración `0001`) y lo aplica `ThemedApp` a la UI, a la navegación y a la barra de estado.
- Las pantallas leen colores con `usePalette()` / `useAppTheme()`; `useThemeColor` de v1 sigue funcionando y devuelve el color del tema activo.

## Deuda técnica conocida

- Las pantallas heredadas siguen siendo grandes (hasta ~1,700 líneas) y mezclan presentación con cálculo; se parten en `XxxView` + hooks cuando se toquen. Los textos de esas pantallas siguen en línea (solo los de servicios y manifest están en `texts.ts`).
- Muchos valores de estilo (colores, tamaños) siguen en las pantallas en lugar de `core/ui-kit/theme.ts`.
- `dashboard` muestra secciones vacías si un módulo está apagado; en v2 cada módulo aportará su panel.
