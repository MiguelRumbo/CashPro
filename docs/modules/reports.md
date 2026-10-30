# Módulo `reports`

**Carpeta:** `src/modules/reports/` · **Interruptor:** `modules.reports.enabled` en `src/config/app.config.ts`

## Propósito

Pestaña Estadísticas: gastos por categoría, tendencias, presupuestos, metas y suscripciones por periodo.

## Datos

Tablas propias: — (no tiene tablas). Ningún otro módulo las escribe.

## API pública y comunicación

`index.ts` solo exporta `manifest`. Solo lee `movementsLedgerKey`, `budgetsQueryKey`, `savingsGoalsQueryKey`, `subscriptionsQueryKey`.

## UI

Pestaña Estadísticas; `reports.home`.

## Si se apaga

Se oculta la pestaña Estadísticas. La app arranca igual (smoke test `tests/integration/modules-off.smoke.test.ts`).
