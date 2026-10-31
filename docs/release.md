# Release

## Workflows

- **`checks.yml`** (cada PR y reutilizable): `npm ci` → `format:check` → `lint` → `typecheck` → `test --ci`.
- **`release.yml`** (push a `prod` y manual):
  1. `version`: falla si `app.json` y `package.json` difieren o si `CHANGELOG.md` no tiene `## [X.Y.Z]`; en `prod`, si el tag `vX.Y.Z` ya existe, no compila.
  2. `checks` y `apk` en paralelo. `apk`: revisa secretos → Node 22 + Java 17 + caché de Gradle → `npm ci` → keystore en `$RUNNER_TEMP` → `expo prebuild --clean` → `./gradlew assembleRelease` (contraseñas como `ORG_GRADLE_PROJECT_*`) → borra el keystore → verifica la huella SHA-256 con `apksigner` → sube `cashpro-vX.Y.Z.apk` (7 días).
  3. `publish` (solo `prod`): crea o actualiza el GitHub Release `vX.Y.Z` con la sección del CHANGELOG como notas.

## Firma

- La llave es la de **EAS** para `com.cashpro.app` (la misma con la que se firmó la versión de producción 1.1.0, versionCode 2).
- `plugins/with-release-signing.js` agrega `signingConfigs.release` desde las propiedades `CASHPRO_RELEASE_*` y **hace fallar** cualquier `assembleRelease` sin llave. En EAS Build (`EAS_BUILD=true`) no actúa: EAS firma con sus credenciales.
- `plugins/with-android-abis.js` deja solo `arm64-v8a` (`app.json`). Para un emulador x86_64: `./gradlew assembleRelease -PreactNativeArchitectures=x86_64`.

### Llave

Keystore de EAS para `com.cashpro.app` (Build Credentials `qvBeHpmqek`), descargado con `npx eas-cli credentials -p android` → _Download existing keystore_ (genera `credentials.json` y `credentials/android/keystore.jks`; ambos están en `.gitignore` por la regla `credentials*`).

| Dato                    | Valor                                                                                             | Dónde                         |
| ----------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------- |
| Key alias               | `d44c8df3e59f117e436be4abbf896f0c`                                                                | `release.yml` (`KEY_ALIAS`)   |
| SHA-256 del certificado | `B6:42:C9:3C:1B:83:9E:D9:45:CD:59:68:C7:6D:EF:32:E5:49:0E:D6:27:73:52:90:6B:86:EF:F9:F7:22:4F:03` | `release.yml` (`CERT_SHA256`) |

### Secretos de GitHub (Settings → Secrets and variables → Actions → Secrets)

| Secreto                          | Valor                                                                                                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `CASHPRO_KEYSTORE_BASE64`        | `keystore.jks` en base64, en una sola línea. PowerShell: `[Convert]::ToBase64String([IO.File]::ReadAllBytes("credentials\android\keystore.jks")) \| Set-Clipboard` |
| `CASHPRO_RELEASE_STORE_PASSWORD` | `keystorePassword` de `credentials.json`                                                                                                                           |
| `CASHPRO_RELEASE_KEY_PASSWORD`   | `keyPassword` de `credentials.json`                                                                                                                                |

Respalda `keystore.jks` y `credentials.json` fuera del repo (gestor de contraseñas). Siguen también en EAS.

## Versionado

- Versión actual: **2.1.0**, `android.versionCode` **4** (anteriores: 2.0.0 / 3, 1.1.0 / 2).
- `eas.json` usa `appVersionSource: remote`. Si se vuelve a compilar con EAS, su contador remoto debe quedar por debajo del `versionCode` de `app.json`.
- Para publicar: renombrar `## [Unreleased]` a `## [2.0.0] - AAAA-MM-DD` en `CHANGELOG.md` (con OK del usuario) y hacer merge a `prod`. Sin esa sección, `release.yml` falla a propósito en el job `version`.

## Builds locales

```bash
npx expo prebuild --clean --platform android --no-install
cd android
./gradlew assembleRelease \
  -PCASHPRO_RELEASE_STORE_FILE=/ruta/cashpro.jks -PCASHPRO_RELEASE_KEY_ALIAS=<alias> \
  -PCASHPRO_RELEASE_STORE_PASSWORD=... -PCASHPRO_RELEASE_KEY_PASSWORD=...
```

## Pendiente

- [ ] Cargar los 3 secretos en GitHub (tabla de arriba).
- [ ] Primera ejecución de `release.yml` (no se ha corrido; tamaño y tiempo de build por medir).
- [ ] `npm audit` antes de publicar.
