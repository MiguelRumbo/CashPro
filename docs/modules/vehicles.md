# Módulo `vehicles`

**Carpeta:** `src/modules/vehicles/` · **Interruptor:** `modules.vehicles.enabled` en `src/config/app.config.ts`

## Propósito

Vehículos, cargas de gasolina y mantenimiento.

## Datos

Tablas propias: `vehicles`, `fuel_loads`, `maintenance`. Ningún otro módulo las escribe.

## API pública y comunicación

`index.ts` solo exporta `manifest`. Provee `vehiclesQueryKey` (`list`, `stats`). Usa `accountsQueryKey` y `movementsLedgerKey` (gastos de Transporte; la edición localiza el movimiento con `findLatest`, OQ-011).

## UI

Menú Más → Vehículos; `vehicles.list`, `vehicles.add`, `vehicles.edit`, `vehicles.detail`.

## Si se apaga

Desaparece del menú; el detalle de un movimiento de gasolina no puede saltar al vehículo. La app arranca igual (smoke test `tests/integration/modules-off.smoke.test.ts`).
