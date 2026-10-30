# CLAUDE.md — Reglas de trabajo del agente

> Fuente de verdad sobre **cómo** trabajas en este proyecto.
> El **qué** está en `requirement.md` y el **cómo técnico** en `specs.md`.
> Léelo completo al inicio de cada sesión. Si algo aquí choca con tu criterio, gana este archivo; si algo está mal, pregunta al usuario.

---

## 1. Contexto

App móvil **de finanzas personales local-first** (cuentas, movimientos, presupuestos, metas, préstamos, suscripciones, vehículos y, en v2, captura automática de movimientos bancarios) hecha con **Expo SDK 54 (React Native 0.81) + TypeScript**. El agente construye todo el proyecto; el usuario es desarrollador y revisa o aprueba las decisiones sensibles.

- Nombre: **CashPro** · package Android: `com.cashpro.app` · esquema: `cashpro` · proyecto EAS: `791a2f26-10f0-4509-b6c6-989827055765`.
- Plataformas: **solo Android** (v2 depende de APIs exclusivas de Android). El código no debe cerrar iOS sin preguntar: `app.json` conserva su configuración.
- Distribución: **uso personal (APK en GitHub Releases)**.
- Gestor de paquetes: **npm** (`package-lock.json`). No usar pnpm ni yarn.
- Estado: v1 reestructurada a la arquitectura modular (§6); v2 en curso según `specs.md` §Fases. Ver `docs/migration-v1-v2.md`.
- Idioma: código, identificadores y commits en **inglés**; documentación y UI en **español**.
- Alcance: `requirement.md`. Decisiones técnicas: `specs.md`. Guía de transición: `docs/migration-v1-v2.md`.

---

## 2. Regla principal: NO INVENTES

- No inventes requisitos, features, APIs, librerías, versiones, nombres de paquetes, valores ni comportamientos.
- Si algo no está en `requirement.md` o `specs.md`, **no lo asumas: pregunta**.
- Si no estás seguro de que una librería, API o comando exista o funcione así, **verifícalo** antes de usarlo:
  - en los tipos o el código instalado en `node_modules`,
  - en la documentación oficial,
  - en el SDK oficial descargado con `npm pack <paquete>` en una carpeta temporal (solo para leerlo),
  - con `git ls-remote --tags <repo>` para versiones de GitHub Actions,
  - o ejecutándolo.

  Nunca de memoria.

- Si descubres que algo de las specs es inviable o está mal (incluidos términos de uso de un proveedor), **detente y repórtalo**; no lo rodees en silencio.
- Cuando preguntes: sé concreto y ofrece 2-3 opciones con su trade-off, con tu recomendación primero. Agrupa las dudas en una sola ronda, no hagas un interrogatorio.
- Registra cada duda y su respuesta en `docs/open-questions.md`.

---

## 3. Qué requiere PREGUNTAR antes de hacerlo

1. Añadir una **dependencia nueva** que no esté en la lista aprobada de `specs.md` (o cambiar versiones mayores). Esto incluye declarar en `package.json` un paquete que ya venga anidado dentro de Expo.
2. **Migraciones destructivas** de BD (borrar o renombrar columnas o tablas, pérdida de datos) o cualquier comando que borre datos del usuario.
3. Cambiar **permisos** de la app (ubicación, sensores, notificaciones, almacenamiento) o su justificación y textos.
4. Cualquier cosa de **privacidad**: enviar datos fuera del dispositivo, analytics, telemetría, crash reporting, logs con datos personales o de ubicación.
5. Tocar **identificadores y firma**: bundle id / package name, keystores, credenciales, cuentas de EAS o de tiendas.
6. Acciones de git de **alto impacto**: force push, reescribir historial, borrar ramas o tags, configurar remotos.
7. **Publicar**, generar builds para tiendas, gastar dinero o usar servicios de pago (incluido gastar builds del plan de EAS).
8. **Cambiar el alcance**: agregar, quitar o redefinir features o requisitos.
9. Elegir **proveedores externos** (mapas, APIs, servicios de terceros).
10. Cambios que **rompan los principios de arquitectura** (§6) o la config central (§7).
11. **Subir la versión** (`app.json` / `package.json` / CHANGELOG): solo con el OK del usuario.
12. Cualquier acción irreversible fuera del repositorio.

## 4. Qué puedes hacer SIN preguntar

- Implementar lo que ya está especificado, dentro de los límites de este archivo.
- Fixes de bugs, refactors dentro de un módulo, mejoras de legibilidad y rendimiento sin cambiar el comportamiento.
- Añadir o ajustar tests, tipos, lint, formato y documentación.
- Corregir código que tú escribiste, mientras respete el alcance y la arquitectura.
- Commits atómicos y **push de la rama de trabajo** al terminar todos los cambios de la tarea, con lint, typecheck y tests en verde.
- Ajustar un valor de config que la spec no define, documentándolo. Si afecta el comportamiento visible, pregunta.

---

## 5. Flujo de trabajo

1. Lee `CLAUDE.md`, `requirement.md`, `specs.md` y `docs/progress/worklog.md`.
2. Si el entorno tiene un script de arranque o dependencias faltantes, arréglalo o instala a mano (`npm ci`) **antes** de empezar, y dilo. En la nube, el script de configuración del entorno no debe depender de `CLAUDE_PROJECT_DIR` con `set -u` (falló así en la primera sesión).
3. Toma **una tarea pequeña** a la vez y anuncia qué vas a hacer.
4. Implementa → prueba → documenta → commit. Una tarea puede ser uno o varios commits atómicos.
5. Antes de dar algo por terminado, verifica:
   - `format:check`, `lint`, `typecheck` y `test` en verde;
   - `npx expo export --platform android` empaqueta;
   - si tocaste config nativa, `npx expo prebuild --clean --no-install` genera lo esperado.
6. Actualiza `docs/progress/worklog.md`: qué se hizo, qué se verificó, qué no, qué sigue y los bloqueos.
7. Reporta de forma breve qué cambió, qué probaste y qué queda pendiente o dudoso.
8. **No reportes algo como funcionando si no lo ejecutaste.** Di exactamente qué verificaste y qué no (por ejemplo, "no probado en dispositivo").

**Sesiones en la nube:** trabaja en la rama que creó el entorno (`claude/...`) y, al hacer push, **publica también el mismo commit en una rama con nombre descriptivo** según §10.1 (p. ej. `refactor/modular-architecture-v2`), porque el nombre autogenerado no describe el cambio. No crees otras ramas. No abras PR sin que el usuario lo pida.

Orden de fases: `specs.md` §Fases. No avances de fase con la anterior rota.

---

## 6. Arquitectura: módulos desacoplados

### 6.1 Capas y dependencias

```
app/         Rutas de Expo Router: cascarones finos, sin lógica
src/
  config/    app.config.ts + schema.ts (Zod). No importa nada del proyecto
  core/      contracts, events, registry, db, logger, ui-kit, units, preferences
  modules/   <modulo>/ autocontenido (UI, lógica, datos, tests)
  bootstrap/ composition root: arranque, carga de módulos, tareas de 2º plano
plugins/     config plugins locales de Expo (Android nativo)
tests/       integración entre módulos, plugins, smoke tests
tools/       reglas ESLint locales (límites de importación)
drizzle/     migraciones versionadas
docs/        documentación viva
```

Módulos actuales (`src/modules/`): `accounts`, `movements`, `budgets`, `savings-goals`, `loans`, `subscriptions`, `vehicles`, `alerts`, `settings`, `dashboard`, `reports`, `security`. Módulos v2 previstos: `ingestion` (eventos crudos y bandeja "Sin procesar"), `notification-capture`, `email-sync`, `statements`, `reconciliation`, `categorization`. Detalle en `specs.md` §3.

Reglas de dependencia (las hace cumplir una regla ESLint local, `tools/eslint/module-boundaries.js`):

| Desde       | No puede importar                                           |
| ----------- | ----------------------------------------------------------- |
| `config`    | `core`, `modules`, `bootstrap`, `app`                       |
| `core`      | `modules`, `bootstrap`, `app`                               |
| módulo A    | módulo B (ni su `index.ts`), `bootstrap`, `app`             |
| `bootstrap` | `app`; de un módulo solo su `index.ts`                      |
| `app`       | `modules` (solo usa el registry: `<ModuleScreen screenId>`) |

Si una regla de límites estorba, **no la desactives**: pregunta.

### 6.2 Anatomía de un módulo

```
src/modules/<modulo>/
  index.ts       API pública: solo exporta `manifest`
  manifest.ts    id, version, routes, tabs, screens, secciones, acciones, subscriptions, register, onReady, dispose
  runtime.ts     servicios del módulo, creados en register (init/get/dispose)
  texts.ts       textos de UI del módulo
  domain/        funciones PURAS (sin React ni Expo), 100 % probadas
  data/          repositorios (único lugar que usa ctx.db)
  platform/      adaptadores a SO, red o hardware detrás de puertos (interfaces)
  services/      orquestación (usa domain + data + platform)
  ui/            componentes "tontos" (XxxView) + contenedores (XxxScreen) + hooks
  tests/         unitarios, integración (BD real en memoria), vistas
```

### 6.3 Comunicación entre módulos

- **Eventos tipados** en `core/events/event-map.ts`. Son hechos pasados, con payload congelado. Se despachan **síncronos dentro de la transacción del emisor** (si un manejador falla, se revierte todo). Actuales: `movement.recorded`, `movement.updated`, `movement.deleted`, `account.deleted`, `data.cleared`, `data.imported`.
- **El saldo de las cuentas y el acumulado de presupuestos** solo cambian por eventos `movement.*`; ningún módulo escribe en tablas de otro. Para registrar un movimiento desde otro módulo se usa la capacidad `movementsLedgerKey`.
- **Capacidades** (dependencias blandas):
  - un módulo hace `ctx.provide(key, impl)`;
  - otro hace `ctx.resolve(key)`, que devuelve `undefined` si el proveedor está apagado;
  - las claves se crean con `createCapabilityKey<T>()` en `core/contracts` (las de finanzas están en `core/contracts/finance.ts`);
  - se resuelven **al usarse**, no al registrarse.
- **Contribuciones a la UI vía manifest**: `tabs` (con ícono semántico), `screens` (por `ScreenId`), `settingsSections`, `detailSections`, `actions` (slots con nombre), `panels`, `gate` (envuelve toda la app; ADR-003). El registry las ordena por `order`.

### 6.4 Interruptor por módulo

- Cada módulo se enciende o apaga en `app.config.ts` → `modules.<id>.enabled`.
- Apagado significa:
  - el loader nunca evalúa su código (`require` perezoso en `bootstrap/manifest-loaders.ts`);
  - no aporta pantallas, pestañas ni botones;
  - no escucha eventos.
- Si un módulo falla al registrarse, se registra el error y la app **sigue sin él**.
- Arranque en dos fases: `register` + suscripciones de todos los módulos, y luego `onReady` (eventos de arranque, recuperación).
- Cada módulo tiene un **smoke test**: la app arranca con él apagado y los demás activos.

### 6.5 Anti-patrones prohibidos

Imports cruzados entre módulos, estado global compartido a escondidas, lógica de negocio dentro de componentes, `utils.ts` cajón de sastre, archivos gigantes, dependencias circulares, `eslint-disable` para callar reglas de hooks (rediseña: `useMemo` del objeto, snapshot inmutable para `useSyncExternalStore`, `useState(() => Date.now())` en lugar de `Date.now()` en el render).

---

## 7. Parametrización en UN solo punto

- **Todo valor configurable vive en `src/config/app.config.ts`**: umbrales, flags de módulos, intervalos, unidades, URLs de APIs, límites, tamaños de UI con significado, textos clave.
- Se **valida con Zod** (`schema.ts`, objetos `.strict()` con `refine` para reglas cruzadas) al importarse y se **congela en profundidad** (`deepFreeze`): es inmutable en runtime.
- **Prohibido** hardcodear números mágicos, strings de config o flags en otro archivo, ni siquiera temporalmente. Las constantes físicas o de formato van con nombre y comentario (`EARTH_RADIUS_M`, `MS_PER_S`).
- Variables de entorno: se leen **solo** en `app.config.ts`, con acceso estático (`process.env.EXPO_PUBLIC_X`), y se validan (por ejemplo, rechazar tokens secretos `sk.`).
- Parámetro nuevo = tipo en el esquema + valor + comentario con la unidad + fila en la tabla de `docs/architecture.md`.
- Los tokens de diseño (colores, espaciado, tipografía) viven en `core/ui-kit/theme.ts`: son el sistema visual, no comportamiento.
- Los tests construyen config alterna con `buildConfig({...rawAppConfig, ...})`; nunca modifican el archivo real.

---

## 8. Código limpio

- **TypeScript estricto** (`strict`, `noUncheckedIndexedAccess`). Prohibido `any` (usa `unknown` + validación) y `@ts-ignore` sin justificación aprobada.
- Funciones pequeñas, una responsabilidad, nombres que revelan la intención. Comenta el **por qué**, no lo obvio.
- Sin código muerto, sin `console.log`, sin TODOs sin entrada en `docs/`.
- DRY con criterio: no abstraigas hasta tener 3 usos reales.
- Errores tipados (`class XError extends Error { name = 'XError' }`), nunca tragados. Los mensajes nunca incluyen tokens, URLs con credenciales ni datos personales.
- Toda entrada externa (respuestas HTTP, archivos, sensores, env) se valida con Zod en el borde.
- Puertos HTTP con `AbortController` + timeout de la config + `fetchFn` inyectable para tests.
- UI:
  - componentes "tontos" (`XxxView`) que reciben datos y callbacks, probados sin registry;
  - la lógica va en hooks o servicios;
  - accesibilidad básica (`accessibilityRole`, `accessibilityLabel`, `accessibilityState`);
  - UI oscura y modo oscuro.
- Listas largas: virtualizadas (`FlatList` / `SectionList`) y paginadas desde la BD. Trabajo pesado en lotes cediendo el hilo (`setTimeout(0)`) para no congelar la UI.
- Prettier + ESLint automáticos. El código que no pasa lint no se commitea.

---

## 9. Seguridad y privacidad

- Por defecto **todo es local**; nada sale del dispositivo sin autorización explícita. Cada salida de red se documenta en `docs/security.md` y en la pantalla de privacidad de la app.
- **Sin secretos en el repo**: `.env` local ignorado, `.env.example` sin valores reales, keystores fuera del repo, secretos de CI en GitHub Secrets.
- Permisos mínimos, pedidos solo cuando se necesitan, con explicación al usuario.
- Nunca imprimas datos personales ni de ubicación en logs (`LogContext` solo con ids y conteos).
- BD con consultas **parametrizadas** (ORM/query builder), nunca SQL concatenado. Foreign keys ON y `ON DELETE CASCADE`.
- Respeta los **términos de los proveedores** (por ejemplo, resultados de APIs que no se pueden guardar: solo en memoria).
- Debe existir **borrar un elemento** y **borrar todos los datos** de forma real, incluidos cachés, archivos exportados y datos offline (evento `data.cleared`).
- `npm audit` antes de cada release; versiones fijadas por el lockfile.
- Telemetría de SDKs de terceros **apagada**.

---

## 10. Control de versiones (git)

### 10.1 Ramas y commits

- Rama principal `prod` (rama por defecto del repo; OQ-020), siempre estable (compila, lint y tests en verde). Los cambios llegan **solo por PR**.
- Ramas `feat/<tema>`, `fix/<tema>`, `chore/<tema>`, `docs/<tema>`, `refactor/<tema>`. El `<tema>` describe el cambio real (`fix/gps-gaps-idle-trips`), no un nombre genérico. En sesiones en la nube, la rama del entorno.
- **Conventional Commits** en inglés, imperativo, asunto ≤ 72 caracteres: `feat(tracking): add background location task`.
  - Tipos: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `build`, `ci`.
  - El scope es el módulo o área: `feat(places)`, `build(android)`, `ci`.
- Commits **atómicos**: un cambio lógico por commit y el proyecto compila en cada uno. Cuerpo cuando el porqué no es obvio, con la referencia `RF-xx`.
- Nunca commitear secretos, `node_modules`, `android/` o `ios/` generados, builds, archivos de IDE ni datos reales de usuarios.
- Hooks: husky + lint-staged (eslint + prettier en lo staged), `typecheck` en pre-commit y commitlint en commit-msg. **No usar `--no-verify`.**
- **Push** de la rama de trabajo sin preguntar al terminar la tarea. Force push, reescribir historia, borrar ramas o tags y tocar remotos requieren permiso.
- GitHub borra la rama al hacer merge (`delete_branch_on_merge`). Si el PR de tu rama ya se mezcló, el trabajo nuevo empieza desde `prod` actualizado.

### 10.2 Versionado (SemVer + CHANGELOG)

- `MAYOR.MENOR.PARCHE`, sincronizado en `app.json` (`expo.version`) y `package.json`.
- **MAYOR**: solo cuando el usuario lo indique.
- **MENOR**: un gran conjunto de cambios, o cuando el PARCHE llegaría a 10 (`1.2.9` → `1.3.0`, nunca `1.2.10`). Reinicia el PARCHE a 0.
- **PARCHE**: +1 por cada fix menor publicado.
- `android.versionCode` (entero) **sube en cada APK** que se instale encima del anterior.
- `CHANGELOG.md` en formato Keep a Changelog, en español: `## [Unreleased]` → al publicar, `## [X.Y.Z] - AAAA-MM-DD` con `### Añadido / Cambiado / Corregido`. Esa sección se usa como notas del GitHub Release.
- Subir la versión **solo con el OK del usuario** (puede ir en el mismo PR del cambio): commit `chore: release X.Y.Z`.

---

## 11. CI/CD con GitHub Actions

### 11.1 `checks.yml` (cada PR y reutilizable)

`npm ci` → `format:check` → `lint` → `typecheck` → `test --ci`, con Node LTS, `HUSKY=0` y `permissions: contents: read`.

### 11.2 `release.yml` (push a `prod` y manual)

Jobs:

1. **`version`**:
   - falla si `app.json` y `package.json` difieren o si el CHANGELOG no tiene `## [X.Y.Z]`;
   - en `prod`, si el tag `vX.Y.Z` ya existe, **no compila** (un merge sin subir versión no gasta minutos).
2. **`checks`** (reutiliza `checks.yml`) y **`apk`** corren **en paralelo**. Pasos de `apk`:
   - revisar que existan los secretos;
   - Node + Java 17 + caché de Gradle (`actions/cache` de `~/.gradle/caches` y `~/.gradle/wrapper`, con clave según `package-lock.json`, `app.json` y `plugins/**`);
   - `npm ci`;
   - restaurar el keystore desde base64 en `$RUNNER_TEMP`;
   - `npx expo prebuild --clean --platform android --no-install`;
   - `./gradlew assembleRelease --no-daemon --build-cache`, con las contraseñas como `ORG_GRADLE_PROJECT_*` (nunca escritas a disco);
   - borrar el keystore (`if: always()`);
   - **verificar la huella SHA-256 del certificado** con `apksigner`, comparando solo los digests (la etiqueta cambia según la versión de build-tools);
   - subir el APK como artefacto (7 días).
3. **`publish`** (solo `prod`, `needs: [version, checks, apk]`): descarga el artefacto y crea o actualiza el GitHub Release `vX.Y.Z` con las notas del CHANGELOG (`gh release create … --notes-file`).

Secretos: `CASHPRO_KEYSTORE_BASE64`, `CASHPRO_RELEASE_STORE_PASSWORD`, `CASHPRO_RELEASE_KEY_PASSWORD` y los tokens públicos que necesite el build (`EXPO_PUBLIC_*`). El alias y la huella del certificado no son secretos y van en el YAML.

Antes de fijar la versión de una acción (`actions/checkout@vN`, etc.), verifícala con `git ls-remote --tags https://github.com/<owner>/<action>`.

### 11.3 Flujo de release

1. Rama → código + tests → push → PR → `checks.yml` en verde.
2. Development build en el teléfono y pruebas manuales (`docs/testing.md`) **antes** de cualquier build de producción.
3. Con el OK del usuario: subir la versión + `versionCode` + CHANGELOG → merge → `release.yml` publica el APK.
4. Instalar desde el Release y ejecutar la prueba manual del release.

---

## 12. Builds Android

- **Development build** (no Expo Go) con `expo-dev-client`:
  - EAS Build (perfil `development`, APK, distribución interna), pidiendo permiso antes de gastar builds;
  - o local con `npx expo run:android`.
- **Release**: GitHub Actions (ruta principal) o local con `./gradlew assembleRelease`, siempre firmado con la **misma llave** (si cambia la llave, el APK no se instala encima del anterior y se pierden los datos).
- `android/` e `ios/` son **generados** (`expo prebuild`) y están en `.gitignore`. Toda personalización nativa va en **config plugins** (`plugins/`), con tests de su transformación:
  - `with-release-signing.js`: inyecta `signingConfigs.release` leyendo propiedades de Gradle (`CASHPRO_RELEASE_STORE_FILE`, …) y hace **fallar a propósito** cualquier tarea release sin llave, para nunca publicar con la llave de debug. El debug usa la misma llave si está configurada, así dev y prod se instalan uno sobre otro. No actúa si `EAS_BUILD=true`.
  - `with-android-abis.js`: fija `reactNativeArchitectures` en `gradle.properties` (por ejemplo, solo `arm64-v8a`). El plugin de React Native lo convierte en `abiFilters`, así que también salen del APK los `.so` precompilados de otras arquitecturas. Reduce mucho el tamaño y el tiempo. Para una compilación puntual: `-PreactNativeArchitectures=x86_64`.
- Gradle vía propiedades del template de Expo, solo si se aprueban: `android.enableMinifyInReleaseBuilds`, `android.enableShrinkResourcesInReleaseBuilds` (R8: más minutos de compilación y más riesgo en runtime).
- `eas.json`: `appVersionSource: remote` si se usa EAS. Si conviven EAS y builds locales, mantén el `versionCode` de `app.json` por encima del contador remoto.
- Splash: plugin `expo-splash-screen` (imagen sin fondo + `backgroundColor` del tema). `SplashScreen.preventAutoHideAsync()` al cargar el bootstrap y `setOptions({ fade, duration })` + `hide()` cuando la BD y los módulos están listos.
- `npx expo install` puede fallar sin red a la API de Expo. En ese caso instala con npm la versión de `node_modules/expo/bundledNativeModules.json`.

---

## 13. Base de datos

- `expo-sqlite` + **Drizzle ORM** (estable) + `drizzle-kit`. Las migraciones `.sql` se empaquetan con `babel-plugin-inline-import`, y Metro agrega `sql` a `sourceExts`.
- Un solo handle compartido (UI y tareas en segundo plano), `PRAGMA foreign_keys = ON`, migraciones al arrancar con pantalla de error si fallan.
- Unidades internas SI, timestamps en ms UTC; la conversión solo ocurre en presentación (`core/units`). **Montos: centavos enteros.** Excepción temporal: las tablas heredadas de v1 guardan `REAL` e ISO strings hasta el nuevo esquema de la Fase 1 (`docs/migration-v1-v2.md` §4); no agregues columnas nuevas con esos formatos.
- No hay datos de v1 instalados en ningún teléfono (OQ-017): **hasta publicar 2.0.0** el esquema se puede regenerar desde cero; **después de publicar 2.0.0, nunca** se reescriben migraciones publicadas ni se cambia `db.fileName`.
- La BD está cifrada con SQLCipher; la llave vive en secure-store (`db.keyStorageKey`). Nunca la registres ni la exportes.
- No se guardan datos derivables (se calculan con consultas). Si el rendimiento exige un caché, se propone con un ADR.
- Migraciones **aditivas** sin preguntar; destructivas, solo con permiso. Cambiar el algoritmo de un cálculo guardado usa `algorithmVersion` en la config con un recálculo único al abrir.
- Tests de repositorios con **sql.js** en memoria aplicando las migraciones reales (`core/db/testing.ts`, nunca importado desde el código de la app).

---

## 14. Pruebas y calidad

- Jest con `jest-expo` + `@testing-library/react-native` (en v14, `render` y `fireEvent` son **async**: siempre `await`).
- Obligatorio:
  - **unitarias** de todo el `domain/`;
  - **integración** de repositorios (sql.js) y de servicios con puertos simulados;
  - **vistas** (`XxxView`) sin registry;
  - **smoke** `tests/integration/modules-off.smoke.test.ts`: arranca con todos los módulos, con cada uno apagado y con todos apagados, y comprueba pestañas, secciones y pantallas;
  - **tests de cada config plugin**.
- Nativos simulados en `tests/integration/support.ts` (`mockNativeModules()` + `startApp(disabled, db, env)`).
- `testTimeout` amplio (20 s) para la caché fría de CI.
- Lo que no se prueba sin dispositivo (GPS real, segundo plano, sensores, notificaciones, archivos compartidos) va como **prueba manual MT-xx** en `docs/testing.md`, con pasos reproducibles. **No declares que funciona** sin probarlo.
- Scripts mínimos: `lint`, `typecheck`, `test`, `format`, `format:check`.

---

## 15. Documentación

Documentar es parte de terminar. Mantén al día:

- `README.md`: qué es, estado y versión, requisitos, instalación, cómo correr (dev build), scripts, estructura y enlaces a `docs/`.
- `CHANGELOG.md`.
- `docs/architecture.md`: capas, módulos, capacidades, rutas, arranque y **tabla de toda la config** (clave, unidad, valor, propósito).
- `docs/modules/<modulo>.md`: propósito, API pública, eventos, datos, funcionamiento, config y cómo apagarlo.
- `docs/decisions/ADR-NNN-titulo.md`: contexto, opciones, decisión y consecuencias.
- `docs/progress/worklog.md`: bitácora fechada (la más reciente arriba) con Hecho / Verificado / No verificado / Sigue / Bloqueos.
- `docs/open-questions.md`: tablas Abiertas y Resueltas (ID, pregunta, fecha, respuesta).
- `docs/security.md`: modelo de privacidad, cada salida de red, permisos y su justificación, secretos, `npm audit`.
- `docs/testing.md`: comandos, qué cubre y pruebas manuales MT-xx.
- `docs/release.md`: flujo de release, workflows, secretos, firma, versionado, tamaño y tiempo de build.

Un cambio que altera comportamiento, config, módulos o setup **sin su doc actualizada no está terminado**. Documentación breve, precisa y sin relleno.

---

## 16. Definition of Done (por tarea)

- [ ] Cumple el requisito y sus criterios de aceptación.
- [ ] Respeta la arquitectura (límites de módulos) y la config central.
- [ ] `format:check`, `lint`, `typecheck` y tests en verde; `expo export` empaqueta.
- [ ] Módulo probado **apagado** sin romper la app.
- [ ] Sin secretos, sin logs sensibles, permisos mínimos; privacidad documentada.
- [ ] Docs actualizadas (README, docs, worklog, CHANGELOG si aplica).
- [ ] Commits atómicos con Conventional Commits y push de la rama.
- [ ] Dudas registradas en `docs/open-questions.md`.

---

## 17. Archivos de referencia

| Archivo          | Contenido                                                                                     |
| ---------------- | --------------------------------------------------------------------------------------------- |
| `requirement.md` | Qué se construye: visión, alcance, fuera de alcance, RF/RNF con criterios, preguntas abiertas |
| `specs.md`       | Cómo: stack y dependencias aprobadas, arquitectura, modelo de datos, config, riesgos, fases   |
| `docs/`          | Documentación viva                                                                            |

---

## 18. Arranque del proyecto (Fase 0) — referencia

> CashPro **no** se creó desde cero: la Fase 0 se aplicó reestructurando v1 (ver `docs/migration-v1-v2.md`). Esta sección queda como referencia de la configuración esperada; si algo del repo no coincide, el repo manda y se documenta la diferencia.

### 18.1 Pasos

1. Crear el proyecto con `npx create-expo-app@latest --template blank-typescript`, usar Expo Router y TS estricto.
2. Dependencias base con `npx expo install`:
   - `expo-router`, `react-native-safe-area-context`, `react-native-screens`;
   - `expo-linking`, `expo-constants`, `expo-status-bar`;
   - `expo-dev-client`, `expo-splash-screen`;
   - `expo-sqlite`, `drizzle-orm` + `drizzle-kit`;
   - `zod`.
3. Calidad:
   - `eslint` + `eslint-config-expo` + `eslint-config-prettier` + la regla local de límites;
   - `prettier`;
   - `jest`, `jest-expo`, `@testing-library/react-native`, `sql.js`;
   - `husky`, `lint-staged`, `@commitlint/cli`, `@commitlint/config-conventional`.
4. Estructura de carpetas de §6.1, `config` con Zod, y en `core`: event bus, registry, contratos, BD, logger y ui-kit.
5. `.gitignore` (`node_modules`, `android/`, `ios/`, `.expo/`, `.env`, `*.jks`, `*.keystore`, `credentials*`, builds), `.env.example`, `.gitattributes`.
6. Docs iniciales: README, CHANGELOG, `docs/` completo, ADR-001 (BD) y ADR-002 (límites de módulos).
7. Plugins `with-release-signing` y `with-android-abis`, workflows `checks.yml` y `release.yml`, y secretos en GitHub.
8. Primer commit `chore: scaffold project` y spike en dispositivo de los riesgos técnicos antes de las features.

### 18.2 `package.json` (scripts y configuración)

```json
{
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "android": "expo run:android",
    "lint": "eslint . --max-warnings 0",
    "typecheck": "tsc --noEmit",
    "test": "jest",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "db:generate": "drizzle-kit generate",
    "doctor": "npx expo-doctor",
    "prepare": "husky"
  },
  "jest": {
    "preset": "jest-expo",
    "testTimeout": 20000,
    "roots": ["<rootDir>/src", "<rootDir>/app", "<rootDir>/tools", "<rootDir>/tests"]
  },
  "lint-staged": {
    "*.{ts,tsx,js}": ["eslint --max-warnings 0 --no-warn-ignored", "prettier --write"],
    "*.{json,md}": "prettier --write"
  }
}
```

### 18.3 Hooks de husky

- `.husky/pre-commit`: `npx lint-staged && npm run typecheck`
- `.husky/commit-msg`: `npx --no -- commitlint --edit "$1"`
- `commitlint.config.js`: `module.exports = { extends: ['@commitlint/config-conventional'] };`

### 18.4 `src/config/app.config.ts` (forma)

```ts
import { buildConfig, type FrozenAppConfig } from './schema';

export const rawAppConfig = {
  app: { name: 'CashPro', locale: 'es-MX' },
  modules: { moduloA: { enabled: true }, moduloB: { enabled: true } },
  db: { fileName: 'cashpro.db' },
  logger: { devMinLevel: 'debug', prodMinLevel: 'warn' },
  // …una sección por módulo, cada valor con comentario de unidad…
  env: { apiToken: process.env.EXPO_PUBLIC_API_TOKEN?.trim() || undefined },
  ui: { theme: 'dark', splashFadeMs: 250 },
  texts: {/* textos clave de producto */},
} as const;

export const appConfig: FrozenAppConfig = buildConfig(rawAppConfig);
```

### 18.5 Manifest de un módulo (forma)

```ts
export const xManifest: ModuleManifest = {
  id: 'x',
  version: '0.1.0',
  routes: ['/x'],
  tabs: [{ routeName: 'x', title: appConfig.texts.tabX, icon: 'x', order: 3 }],
  screens: { 'x.main': XScreen },
  settingsSections: [],
  actions: [],
  async register(ctx) {
    await initXRuntime(ctx);
  },
  subscriptions: () => ({ 'data.cleared': () => getXRuntime().clear() }),
  dispose() {
    disposeXRuntime();
  },
};
```

### 18.6 `.github/workflows/release.yml` (esqueleto)

```yaml
name: Release
on:
  push: { branches: [prod] }
  workflow_dispatch:
concurrency: { group: release-${{ github.ref }}, cancel-in-progress: false }
permissions: { contents: write }
env:
  NODE_VERSION: '22'
  JAVA_VERSION: '17'
  KEY_ALIAS: '<alias>'           # no es secreto
  CERT_SHA256: '<sha256-cert>'   # no es secreto

jobs:
  version:        # valida versiones + CHANGELOG; build=false si el tag ya existe en prod
  checks:
    needs: version
    if: needs.version.outputs.build == 'true'
    uses: ./.github/workflows/checks.yml
  apk:
    needs: version
    if: needs.version.outputs.build == 'true'
    runs-on: ubuntu-latest
    timeout-minutes: 60
    steps:
      # check secrets → checkout → setup-node → setup-java → actions/cache (gradle)
      # → npm ci → restore keystore → expo prebuild --clean --no-install
      # → ./gradlew assembleRelease --no-daemon --build-cache (ORG_GRADLE_PROJECT_*)
      # → rm keystore (always) → verificar SHA-256 → upload-artifact
  publish:
    needs: [version, checks, apk]
    if: github.ref == 'refs/heads/prod'
    runs-on: ubuntu-latest
    steps:
      # checkout → download-artifact → gh release create/upload vX.Y.Z --notes-file (sección del CHANGELOG)
```
