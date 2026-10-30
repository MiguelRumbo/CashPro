# Módulo `settings`

**Carpeta:** `src/modules/settings/` · **Interruptor:** `modules.settings.enabled` en `src/config/app.config.ts`

## Propósito

Perfil, moneda, respaldo JSON/CSV/BD y borrado total.

## Datos

Tablas propias: `user_profile` (fila única id=1). Ningún otro módulo las escribe.

## API pública y comunicación

`index.ts` solo exporta `manifest`. Provee `profileQueryKey`. Orquesta los `dataPort` de todos los módulos para exportar, importar (atómico, validado con Zod) y borrar; emite `data.cleared` y `data.imported`. Persiste la moneda cuando cambia `core/preferences`. Usa `movementsLedgerKey.exportCsv`. Archivos vía `platform/files.ts` (`expo-file-system/legacy`, `expo-sharing`, `expo-document-picker`).

## UI

Pestaña Ajustes; `settings.home`, `settings.editProfile`.

## Si se apaga

Se ocultan Ajustes; la moneda queda en la de `currency.default`. La app arranca igual (smoke test `tests/integration/modules-off.smoke.test.ts`).
