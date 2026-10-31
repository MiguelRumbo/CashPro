# Módulo `movements`

**Carpeta:** `src/modules/movements/` · **Interruptor:** `modules.movements.enabled` en `src/config/app.config.ts`

## Propósito

Libro de movimientos: captura manual y registro centralizado de los movimientos que generan otros módulos.

## Datos

Tablas propias: `movements`. Ningún otro módulo las escribe.

## API pública y comunicación

`index.ts` solo exporta `manifest`. Aporta el botón "+" central de la barra (slot `tabbar.fab`). Provee `movementsLedgerKey` (`list`, `getById`, `record`, `update`, `remove`, `findLatest`, `exportCsv`). Emite `movement.recorded` (con `origin` y `affectsBalance`), `movement.updated`, `movement.deleted`. Usa `accountsQueryKey`.

## UI

Pestaña Movimientos; `movements.list`, `movements.add`, `movements.detail`.

## Si se apaga

Metas, préstamos, suscripciones y vehículos devuelven "Se requiere el módulo de movimientos" al registrar dinero; el CSV no se puede exportar. La app arranca igual (smoke test `tests/integration/modules-off.smoke.test.ts`).
