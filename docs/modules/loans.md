# Módulo `loans`

**Carpeta:** `src/modules/loans/` · **Interruptor:** `modules.loans.enabled` en `src/config/app.config.ts`

## Propósito

Préstamos a terceros y sus abonos.

## Datos

Tablas propias: `loans`, `loan_payments`. Ningún otro módulo las escribe.

## API pública y comunicación

`index.ts` solo exporta `manifest`. Provee `loansQueryKey` (`list`, `stats`). Usa `movementsLedgerKey` (préstamo como gasto opcional; abonos como ingreso).

## UI

Menú Más → Préstamos; `loans.list`, `loans.add`, `loans.detail`.

## Si se apaga

Desaparece del menú; dashboard y avisos omiten préstamos. La app arranca igual (smoke test `tests/integration/modules-off.smoke.test.ts`).
