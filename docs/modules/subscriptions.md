# Módulo `subscriptions`

**Carpeta:** `src/modules/subscriptions/` · **Interruptor:** `modules.subscriptions.enabled` en `src/config/app.config.ts`

## Propósito

Suscripciones, salarios y pagos recurrentes.

## Datos

Tablas propias: `recurring_payments`. Ningún otro módulo las escribe.

## API pública y comunicación

`index.ts` solo exporta `manifest`. Provee `subscriptionsQueryKey` (`list`, `stats`). Usa `movementsLedgerKey` al registrar un cobro. Config: `subscriptions.*`.

## UI

Menú Más → Suscripciones y Pagos; `subscriptions.list`, `subscriptions.add`, `subscriptions.detail`.

## Si se apaga

Desaparece del menú; dashboard, estadísticas y avisos omiten pagos recurrentes. La app arranca igual (smoke test `tests/integration/modules-off.smoke.test.ts`).
