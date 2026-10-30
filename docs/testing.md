# Pruebas

## Comandos

```bash
npm run format:check   # Prettier
npm run lint           # ESLint (0 avisos permitidos)
npm run typecheck      # tsc --noEmit
npm test               # Jest
npx expo export --platform android   # verifica que el bundle empaqueta
```

## Qué cubre

| Suite                     | Archivo                                       | Cubre                                                                                                                                          |
| ------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Migración y transacciones | `src/core/db/handle.test.ts`                  | Las 14 tablas de v1, el `CHECK` de tipo de cuenta, rollback y transacciones anidadas, idempotencia de la migración base sobre datos existentes |
| Formato                   | `src/core/units/format.test.ts`               | Tarjetas e inputs de monto                                                                                                                     |
| Regla de límites          | `tools/eslint/module-boundaries.test.js`      | Imports permitidos y prohibidos entre capas y módulos                                                                                          |
| Smoke de módulos          | `tests/integration/modules-off.smoke.test.ts` | Arranque con todos, con cada uno apagado y con todos apagados; pestañas y menú                                                                 |
| Flujo de dinero           | `tests/integration/ledger-flow.test.ts`       | Gasto/edición/borrado → saldo y presupuesto; transferencia a crédito; MSI; rollback; respaldo exportar→borrar→importar                         |

Los tests de integración usan sql.js con las migraciones reales (`src/core/db/testing.ts`).

**Pendiente:** pruebas unitarias de todo el `domain/` de cada módulo (hoy solo están cubiertas indirectamente por los tests de integración) y pruebas de vistas (`XxxView`) cuando se partan las pantallas.

## Pruebas manuales (dispositivo)

Ninguna de estas se ha ejecutado todavía con la build reestructurada.

| ID    | Prueba                               | Pasos                                                                                                            | Esperado                                                     |
| ----- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| MT-01 | Actualizar sobre v1 sin perder datos | 1) En v1, exportar JSON. 2) Anotar patrimonio y saldo de 2 cuentas. 3) Instalar la build nueva encima. 4) Abrir. | Mismos datos, saldos y patrimonio; sin pantalla de error     |
| MT-02 | Instalación limpia                   | Instalar en un dispositivo sin CashPro                                                                           | Abre, se puede crear cuenta y movimiento                     |
| MT-03 | Exportar respaldo JSON y CSV         | Ajustes → Exportar                                                                                               | Abre el diálogo de compartir; el JSON tiene `version: 2.0.0` |
| MT-04 | Importar respaldo de v1              | Ajustes → Importar el JSON de MT-01                                                                              | Mismos datos que en v1                                       |
| MT-05 | Borrar todo                          | Ajustes → Eliminar todos los datos                                                                               | Todo vacío; perfil "Usuario" y avisos activos por defecto    |
| MT-06 | Moneda                               | Cambiar a USD y reiniciar la app                                                                                 | Se conserva USD                                              |
| MT-07 | Pestañas y menú Más                  | Recorrer todas                                                                                                   | Mismas pantallas que v1                                      |
| MT-08 | Módulo apagado                       | Poner `modules.vehicles.enabled: false`, compilar                                                                | Vehículos no aparece en Más; la app funciona                 |
