# Release

## Workflows

- **`checks.yml`** (cada PR y reutilizable): `npm ci` → `format:check` → `lint` → `typecheck` → `test --ci`.
- **`release.yml`** (push a `main` y manual):
  1. `version`: falla si `app.json` y `package.json` difieren o si `CHANGELOG.md` no tiene `## [X.Y.Z]`; en `main`, si el tag `vX.Y.Z` ya existe, no compila.
  2. `checks` y `apk` en paralelo. `apk`: revisa secretos → Node 22 + Java 17 + caché de Gradle → `npm ci` → keystore en `$RUNNER_TEMP` → `expo prebuild --clean` → `./gradlew assembleRelease` (contraseñas como `ORG_GRADLE_PROJECT_*`) → borra el keystore → verifica la huella SHA-256 con `apksigner` → sube `cashpro-vX.Y.Z.apk` (7 días).
  3. `publish` (solo `main`): crea o actualiza el GitHub Release `vX.Y.Z` con la sección del CHANGELOG como notas.

## Firma

- La llave es la de **EAS** para `com.cashpro.app` (la misma con la que se firmó la versión de producción 1.1.0, versionCode 2).
- `plugins/with-release-signing.js` agrega `signingConfigs.release` desde las propiedades `CASHPRO_RELEASE_*` y **hace fallar** cualquier `assembleRelease` sin llave. En EAS Build (`EAS_BUILD=true`) no actúa: EAS firma con sus credenciales.
- `plugins/with-android-abis.js` deja solo `arm64-v8a` (`app.json`). Para un emulador x86_64: `./gradlew assembleRelease -PreactNativeArchitectures=x86_64`.

### Configurar GitHub una sola vez

1. Descargar la llave de EAS: `npx eas-cli credentials -p android` → perfil `production` → _Keystore_ → **Download existing keystore**. Anota el **key alias**, las contraseñas del keystore y de la llave, y el **SHA256 Fingerprint** que muestra la misma pantalla.
2. En GitHub → Settings → Secrets and variables → Actions:
   - **Secrets:** `CASHPRO_KEYSTORE_BASE64` (salida de `base64 -w0 archivo.jks`), `CASHPRO_RELEASE_STORE_PASSWORD`, `CASHPRO_RELEASE_KEY_PASSWORD`.
   - **Variables:** `CASHPRO_KEY_ALIAS` y `CASHPRO_CERT_SHA256` (no son secretos; con o sin `:`).
3. Guarda el `.jks` fuera del repo (`*.jks` está en `.gitignore`). Nunca lo subas.

> CLAUDE.md §11.2 pide el alias y la huella dentro del YAML. Como aún no se conocen, el workflow los lee de variables del repositorio; se pueden pasar al YAML cuando estén confirmados.

## Versionado

- Versión actual: **2.0.0**, `android.versionCode` **3** (producción anterior: 1.1.0 / versionCode 2).
- `eas.json` usa `appVersionSource: remote`. Si se vuelve a compilar con EAS, su contador remoto debe quedar por debajo del `versionCode` de `app.json`.
- Para publicar: renombrar `## [Unreleased]` a `## [2.0.0] - AAAA-MM-DD` en `CHANGELOG.md` (con OK del usuario) y hacer merge a `main`. Sin esa sección, `release.yml` falla a propósito en el job `version`.

## Builds locales

```bash
npx expo prebuild --clean --platform android --no-install
cd android
./gradlew assembleRelease \
  -PCASHPRO_RELEASE_STORE_FILE=/ruta/cashpro.jks -PCASHPRO_RELEASE_KEY_ALIAS=<alias> \
  -PCASHPRO_RELEASE_STORE_PASSWORD=... -PCASHPRO_RELEASE_KEY_PASSWORD=...
```

## Pendiente

- [ ] Cargar secretos y variables en GitHub (pasos de arriba).
- [ ] Primera ejecución de `release.yml` (no se ha corrido; tamaño y tiempo de build por medir).
- [ ] `npm audit` antes de publicar.
