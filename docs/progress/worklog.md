# Bitácora

## 2026-10-30 — Reestructuración modular (Fase 0) y documentos de v2

**Rama:** `claude/nifty-hypatia-kdc8j8`, publicada también como `refactor/modular-architecture-v2`.

### Hecho

- Análisis de viabilidad de la propuesta de v2: se actualiza este proyecto (no uno nuevo).
- Repo aplanado: app Expo en la raíz con npm; eliminados `apps/api` (sin uso) y `packages/shared` (vacío); documentos de v1 archivados en `docs/archive/v1/`, diseños en `docs/design/`.
- `src/config` (Zod + deepFreeze), `src/core` (contratos, bus de eventos, registry, `ModuleScreen`, menú de acciones, BD Drizzle con transacciones, data ports, logger, preferencias, ui-kit, units) y `src/bootstrap` (arranque en dos fases, loaders perezosos).
- `services/database.ts` repartido en 11 módulos con `domain/`, `data/`, `services/`, `ui/`, `runtime.ts`, `manifest.ts` y `texts.ts`. `app/` quedó con cascarones.
- Migración base `0000_baseline_v1` idempotente.
- Correcciones: export/import de Ajustes con `expo-file-system/legacy`, tarjeta en detalle de cuenta, iniciales, atomicidad, moneda en avisos.
- Tooling: ESLint (regla local de límites, sin `any`, sin `console`, `exhaustive-deps` como error), Prettier, husky + lint-staged + commitlint, `checks.yml`.
- Documentos: `CLAUDE.md` adaptado, `requirement.md`, `specs.md`, `docs/migration-v1-v2.md`, arquitectura, módulos, ADR-001/002, seguridad, pruebas, release y preguntas abiertas.

### Verificado

- `npm run format:check`, `npm run lint` (0 avisos), `npm run typecheck`, `npm test` (5 suites, 37 tests) en verde.
- `npx expo export --platform android` empaqueta (5.6 MB, migración embebida).
- Migración base sobre una BD con datos: no pierde filas (sql.js).

### No verificado

- **Nada se ha probado en un dispositivo.** Pendientes MT-01 a MT-08 (`docs/testing.md`), sobre todo MT-01 (actualizar sobre v1).
- `npx expo prebuild` (no se tocó config nativa salvo `expo-dev-client`).
- Pantallas: se movieron y tiparon sin cambiar su lógica visual, pero no se han abierto.

### Sigue

1. Respuestas a `docs/open-questions.md` (sobre todo OQ-006, OQ-016, OQ-105).
2. Development build y MT-01..MT-08 en el teléfono.
3. Tests unitarios del `domain/` de cada módulo.
4. Partir pantallas grandes en `XxxView` + hooks y mover sus textos a `texts.ts`.
5. Fase 1 (`specs.md` §8).

### Bloqueos

- Release firmado: falta el keystore de v1 (OQ-006).
- Script de configuración del entorno en la nube falla en la línea 10 (OQ-014); en esta sesión se instaló a mano con `npm install`.
