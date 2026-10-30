# Módulo `alerts`

**Carpeta:** `src/modules/alerts/` · **Interruptor:** `modules.alerts.enabled` en `src/config/app.config.ts`

## Propósito

Avisos internos calculados al vuelo (no son notificaciones push) y su configuración.

## Datos

Tablas propias: `notification_settings` (fila única id=1). Ningún otro módulo las escribe.

## API pública y comunicación

`index.ts` solo exporta `manifest`. Lee `accountsQueryKey`, `budgetsQueryKey`, `loansQueryKey`, `subscriptionsQueryKey`, `savingsGoalsQueryKey` (cada fuente apagada simplemente no genera avisos). Escucha `data.cleared` y `data.imported` para volver a sembrar la configuración. Umbrales en `alerts.*`.

## UI

`alerts.inbox` (`/notifications`), `alerts.settings` (`/settings/notifications`).

## Si se apaga

Las rutas muestran "Función no disponible". La app arranca igual (smoke test `tests/integration/modules-off.smoke.test.ts`).
