# Bitácora

## 2026-10-31 — Release 2.0.0 publicado; se permiten capturas

### Hecho

- `release.yml` (run 2) en verde: GitHub Release `v2.0.0` con `cashpro-v2.0.0.apk` (53 MB), firma verificada contra la huella de EAS.
- A pedido del usuario se retiró `FLAG_SECURE` (OQ-022): fuera `expo-screen-capture`, `security.preventScreenshots`, RNF-12 y MT-12.

### Verificado

- `typecheck`, `lint`, tests en verde.

### No verificado

- En dispositivo: que las capturas funcionen (debería, ya no se activa la bandera).

### Sigue

- Propuesta de rediseño visual (UI/UX) para que el usuario elija dirección antes de tocar las pantallas.

## 2026-10-30 — Primer `release.yml`: falló la verificación de la huella

### Hecho

- Se mezcló el PR #1 a `prod`; `release.yml` corrió por primera vez. `checks` pasó y `assembleRelease` compiló y firmó el APK (14 min 12 s), pero el paso de la huella falló: `apksigner` imprime `Signer #1: certificate SHA-256 digest: <hex>` y el script tomaba el segundo campo en lugar del último. No se publicó ningún Release ni tag.
- Corregido: se toma el último campo y se valida que sean 64 hex; si no, se imprime la salida de `apksigner`.

### Verificado

- Parseo probado localmente con los dos formatos de línea (con y sin `:` tras `Signer #1`). YAML válido.

### No verificado

- Que la huella real del APK coincida con la de EAS: se sabrá al volver a correr `release.yml`.

### Sigue

- Merge de este fix a `prod` → `release.yml` vuelve a correr (el tag `v2.0.0` no existe, así que compila y publica).

## 2026-10-30 — Release 2.0.0 y rama estable `prod`

### Hecho

- Llave de release: keystore de EAS para `com.cashpro.app`; alias y SHA-256 fijos en `release.yml`; secretos cargados por el usuario en GitHub.
- La rama estable es `prod` (OQ-020): `release.yml`, CLAUDE.md y docs ajustados.
- `CHANGELOG.md`: sección `[2.0.0] - 2026-10-30` (OK del usuario).

### Verificado

- `format:check`, `lint`, `typecheck`, `test` en verde; YAML de `release.yml` válido.

### No verificado

- `release.yml` nunca ha corrido; el merge del PR a `prod` lo ejecutará por primera vez.
- Nada probado en dispositivo (MT-01..MT-13).

### Sigue

- Revisar la ejecución de `release.yml` tras el merge e instalar el APK (MT-13, MT-09..MT-12).
- Esquema v2 con migraciones (OQ-021).

## 2026-10-30 — Fase 1 (parte 1): seguridad y release

**Decisiones del usuario:** package `com.cashpro.app`; llaves en EAS; no hay APK instalado (sin datos que preservar); versión 2.0.0 / versionCode 3; dependencias de v2 aprobadas.

### Hecho

- Dependencias: `expo-secure-store`, `expo-local-authentication`, `expo-crypto`, `expo-screen-capture`.
- SQLCipher (`app.json`) con llave de 256 bits en secure-store (`core/db/encryption-key.ts`), `PRAGMA key` al abrir y verificación de lectura.
- Módulo `security`: bloqueo biométrico/PIN al abrir y al volver (`LockGate`, `useAppLock`, `LockView`) y `FLAG_SECURE`. Nueva contribución `gate` (ADR-003).
- `android.allowBackup: false`.
- Plugins `with-release-signing` y `with-android-abis` con tests; `release.yml`.
- Versión 2.0.0 / versionCode 3 en `app.json` y `package.json`.
- Docs: release (cómo sacar la llave de EAS), seguridad, pruebas MT-09..13, arquitectura, módulo security, ADR-003, preguntas abiertas.

### Verificado

- `format:check`, `lint`, `typecheck`, `test` (11 suites, 57 tests) en verde; `expo export --platform android` empaqueta.
- `expo prebuild --clean --no-install`: `build.gradle` con firma de release, `reactNativeArchitectures=arm64-v8a`, `expo.sqlite.useSQLCipher=true`, `allowBackup="false"`, permisos `USE_BIOMETRIC`/`USE_FINGERPRINT`.

### No verificado

- **Nada en dispositivo**: MT-01..MT-13 pendientes (en especial que SQLCipher abra y el bloqueo funcione).
- `release.yml` no se ha ejecutado: faltan los secretos y variables en GitHub (`docs/release.md`). Tampoco `./gradlew assembleRelease` local (no hay SDK de Android en el entorno).

### Sigue

1. Cargar secretos de firma en GitHub y correr `release.yml` (o un dev build) para probar en el teléfono.
2. Esquema v2: centavos, ms, saldos derivados, categorías en tabla, `wallet` (regenerando la base, OQ-017).
3. Respaldo cifrado (OQ-106).

### Bloqueos

- OQ-106 (librería de cifrado para el respaldo) y OQ-107 (ABIs).

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
