# Módulo `accounts`

**Carpeta:** `src/modules/accounts/` · **Interruptor:** `modules.accounts.enabled` en `src/config/app.config.ts`

## Propósito

Cuentas (efectivo, banco, débito, crédito) y compras a MSI.

## Datos

Tablas propias: `accounts`, `msi_purchases`. Ningún otro módulo las escribe.

## API pública y comunicación

`index.ts` solo exporta `manifest`. Provee `accountsQueryKey` (`list`, `getById`, `stats`). Escucha `movement.recorded/updated/deleted` y aplica los efectos de saldo de `domain/balance.ts`. Emite `account.deleted`. Usa `movementsLedgerKey` (opcional) para el movimiento informativo del pago MSI.

## UI

Pestaña Cuentas; `accounts.list`, `accounts.add`, `accounts.edit`, `accounts.detail`.

## Si se apaga

Sin cuentas no se pueden crear movimientos (la validación de cuenta falla) y las pantallas de otros módulos muestran listas de cuentas vacías. La app arranca igual (smoke test `tests/integration/modules-off.smoke.test.ts`).
