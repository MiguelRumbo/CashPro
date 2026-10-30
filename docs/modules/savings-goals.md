# Módulo `savingsGoals`

**Carpeta:** `src/modules/savings-goals/` · **Interruptor:** `modules.savingsGoals.enabled` en `src/config/app.config.ts`

## Propósito

Metas de ahorro con aportaciones.

## Datos

Tablas propias: `savings_goals`, `goal_contributions`. Ningún otro módulo las escribe.

## API pública y comunicación

`index.ts` solo exporta `manifest`. Provee `savingsGoalsQueryKey` (`list`, `stats`). Usa `accountsQueryKey` y `movementsLedgerKey` (cada aportación es un gasto "Ahorro").

## UI

Menú Más → Objetivos de Ahorro; `savingsGoals.list`, `savingsGoals.add`, `savingsGoals.detail`.

## Si se apaga

Desaparece del menú; dashboard, estadísticas y avisos omiten metas. La app arranca igual (smoke test `tests/integration/modules-off.smoke.test.ts`).
