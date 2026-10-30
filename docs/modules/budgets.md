# Módulo `budgets`

**Carpeta:** `src/modules/budgets/` · **Interruptor:** `modules.budgets.enabled` en `src/config/app.config.ts`

## Propósito

Presupuestos de gasto por categoría con acumulado.

## Datos

Tablas propias: `budgets`. Ningún otro módulo las escribe.

## API pública y comunicación

`index.ts` solo exporta `manifest`. Provee `budgetsQueryKey`. Escucha `movement.*`: al registrarse solo suma los de `origin = movements` (captura manual); al editar/borrar ajusta cualquiera (comportamiento v1, OQ-007).

## UI

Menú Más → Presupuestos; `budgets.list`, `budgets.add`, `budgets.edit`.

## Si se apaga

Desaparece del menú Más; el dashboard y los avisos no muestran presupuestos. La app arranca igual (smoke test `tests/integration/modules-off.smoke.test.ts`).
