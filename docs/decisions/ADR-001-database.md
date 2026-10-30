# ADR-001 — Base de datos: expo-sqlite + Drizzle con migración base idempotente

**Fecha:** 2026-10-30 · **Estado:** aceptada

## Contexto

v1 creaba 14 tablas con `CREATE TABLE IF NOT EXISTS` y SQL concatenado en un solo archivo, sin versiones ni transacciones. El teléfono del usuario ya tiene `cashpro.db` con datos reales. v2 necesita migraciones (columnas nuevas, tablas nuevas, cifrado) y pruebas de repositorios.

## Opciones

1. Seguir con SQL a mano + `PRAGMA user_version`.
2. Drizzle ORM + drizzle-kit (expo-sqlite en la app, sql.js en tests).
3. Otra BD (WatermelonDB, Realm).

## Decisión

Opción 2. El esquema de cada módulo vive en `src/modules/*/data/schema.ts`; `drizzle.config.ts` los junta. La primera migración, `0000_baseline_v1`, replica el esquema v1 y se **editó a mano** a `CREATE TABLE IF NOT EXISTS` para que sea un no-op en dispositivos con v1.

Detalles:

- Un solo handle síncrono (`DbHandle`) con `transaction()` reentrante (las llamadas anidadas se unen a la exterior). Los eventos entre módulos corren dentro de esa transacción.
- Columnas con `DEFAULT` declaradas `NOT NULL` en Drizzle: los tipos de TS no aceptan nulos. En la BD de v1 esas columnas son anulables; como toda escritura pasa por Drizzle con defaults y la importación JSON omite nulos, no se esperan nulos. La recreación de tablas de la Fase 1 unifica el DDL.
- Las referencias entre tablas de **distintos** módulos (p. ej. `movements.account_id`) no son foreign keys, igual que en v1; las de un mismo módulo sí (`ON DELETE CASCADE`).
- Las migraciones `.sql` se empaquetan con `babel-plugin-inline-import`; Metro agrega `sql` a `sourceExts`.

## Consecuencias

- `npm run db:generate` genera migraciones nuevas a partir de los esquemas; **nunca** se edita ni se regenera `0000`.
- Los tests usan la BD real en memoria (`src/core/db/testing.ts`) con las mismas migraciones.
- Diferencia temporal de DDL (NOT NULL) entre instalaciones nuevas y actualizadas, documentada en `docs/migration-v1-v2.md` §3.
