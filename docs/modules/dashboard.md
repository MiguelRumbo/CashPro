# Módulo `dashboard`

**Carpeta:** `src/modules/dashboard/` · **Interruptor:** `modules.dashboard.enabled` en `src/config/app.config.ts`

## Propósito

Pestaña Inicio: patrimonio, resumen del mes y tarjetas de cada módulo.

## Datos

Tablas propias: — (no tiene tablas). Ningún otro módulo las escribe.

## API pública y comunicación

`index.ts` solo exporta `manifest`. Solo lee capacidades: perfil, cuentas, libro, metas, préstamos, presupuestos, suscripciones y vehículos. `domain/month-summary.ts` calcula ingresos, gastos y variación del mes.

## UI

Pestaña Inicio; `dashboard.home`.

## Si se apaga

Se oculta la pestaña Inicio. La app arranca igual (smoke test `tests/integration/modules-off.smoke.test.ts`).
