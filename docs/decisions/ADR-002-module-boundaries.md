# ADR-002 — Módulos desacoplados con capacidades, eventos y regla de límites

**Fecha:** 2026-10-30 · **Estado:** aceptada

## Contexto

En v1, cada función que movía dinero (metas, préstamos, suscripciones, gasolina, MSI) insertaba en `movements` y modificaba `accounts.balance` por su cuenta: la regla de saldos estaba copiada 7 veces. v2 agrega varias fuentes nuevas de movimientos (notificaciones, correos, estados de cuenta), así que ese patrón no escala.

## Opciones

1. Mantener un servicio de datos global.
2. Módulos que se importan entre sí.
3. Módulos aislados que se comunican por capacidades tipadas y eventos, con límites verificados por lint.

## Decisión

Opción 3 (`CLAUDE.md` §6):

- `movements` es el único dueño del libro y expone `movementsLedgerKey.record/update/remove`.
- `accounts` y `budgets` reaccionan a `movement.*`; nadie más escribe en sus tablas.
- `movement.recorded` lleva `origin` y `affectsBalance` para conservar dos reglas de v1: los presupuestos solo suman la captura manual, y el pago de MSI no vuelve a afectar el saldo.
- La regla ESLint local `tools/eslint/module-boundaries.js` (con tests) falla si un módulo importa a otro, si `core` importa módulos o si `app/` importa un módulo.
- Cada módulo se puede apagar; un smoke test arranca la app con cada uno apagado.

## Consecuencias

- Agregar una fuente de movimientos en v2 = un módulo nuevo que llama a `record`; los saldos y presupuestos se actualizan solos.
- Las lecturas cruzadas (dashboard, avisos) dependen de capacidades opcionales y deben tolerar `undefined`.
- Los contratos compartidos viven en `core/contracts/finance.ts`; cambiar uno es un cambio de API entre módulos.
