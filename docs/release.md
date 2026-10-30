# Release

## Estado

- `checks.yml` (formato, lint, typecheck, tests) existe y corre en cada PR.
- `release.yml`, los plugins `with-release-signing` y `with-android-abis` y los secretos **aún no existen**: dependen de recuperar la llave con la que se firmó el APK v1 (OQ-006). Sin esa llave, el APK nuevo no se puede instalar encima del actual.

## Flujo previsto (CLAUDE.md §11)

1. Rama → código + tests → push → PR → `checks.yml` en verde.
2. Development build (`npm run build:dev` en EAS, pidiendo permiso, o `npx expo run:android`) y pruebas manuales de `docs/testing.md`.
3. Con OK del usuario: subir versión (`app.json` + `package.json` + `versionCode` + `CHANGELOG.md`) → merge a `main` → `release.yml` publica el APK en GitHub Releases.

## Versionado

SemVer en `app.json` (`expo.version`) y `package.json`, hoy **1.1.0**. La reestructuración no sube versión (requiere OK). `eas.json` usa `appVersionSource: remote`: si conviven EAS y builds locales, el `versionCode` de `app.json` debe quedar por encima del contador remoto.

## Pendiente para el primer release de v2

- [ ] OQ-006: keystore y huella SHA-256 del certificado.
- [ ] OQ-016: confirmar package `com.cashpro.app`.
- [ ] Plugins de firma y ABIs con tests; `release.yml`.
- [ ] `npm audit`.
