# CashPro

App móvil de finanzas personales **local-first** para Android: cuentas, movimientos, presupuestos, metas de ahorro, préstamos, suscripciones, vehículos y compras a MSI. La v2 agrega la captura automática de movimientos bancarios (notificaciones, correos y estados de cuenta) sin pedir credenciales bancarias.

- **Versión:** 2.1.0 · **Estado:** rediseño visual con temas; Fase 1 en curso (falta el esquema de datos v2).
- **Plataforma:** Android (Expo SDK 54, development build). Uso personal; APK en GitHub Releases.

## Requisitos

- Node 22 LTS y npm.
- Android Studio / SDK para `expo run:android`, o una cuenta de EAS para builds en la nube.

## Instalación y ejecución

```bash
npm ci
npm run android        # development build local (no usa Expo Go)
# o: npm run build:dev  (EAS, perfil development)
npm start              # servidor de Metro para el dev client
```

## Scripts

| Script                            | Qué hace                                                |
| --------------------------------- | ------------------------------------------------------- |
| `npm run lint`                    | ESLint con la regla de límites entre módulos (0 avisos) |
| `npm run typecheck`               | TypeScript estricto                                     |
| `npm test`                        | Jest (BD real en memoria con sql.js)                    |
| `npm run format` / `format:check` | Prettier                                                |
| `npm run db:generate`             | Genera una migración Drizzle a partir de los esquemas   |
| `npm run doctor`                  | expo-doctor                                             |

## Estructura

```
app/            rutas (cascarones que muestran pantallas de módulos)
src/config/     configuración única validada con Zod
src/core/       contratos, eventos, registry, BD, logger, ui-kit, unidades
src/modules/    accounts · movements · budgets · savings-goals · loans · subscriptions
                vehicles · alerts · settings · dashboard · reports
src/bootstrap/  arranque de módulos
drizzle/        migraciones
tests/          integración y smoke tests
tools/eslint/   regla de límites
docs/           documentación viva
```

## Documentación

- [`CLAUDE.md`](CLAUDE.md): reglas de trabajo del agente.
- [`requirement.md`](requirement.md): qué se construye en v2.
- [`specs.md`](specs.md): cómo se construye (stack, módulos, modelo de datos, fases).
- [`docs/migration-v1-v2.md`](docs/migration-v1-v2.md): qué cambió desde v1 y cómo actualizar sin perder datos.
- [`docs/architecture.md`](docs/architecture.md), [`docs/modules/`](docs/modules), [`docs/decisions/`](docs/decisions)
- [`docs/testing.md`](docs/testing.md), [`docs/security.md`](docs/security.md), [`docs/release.md`](docs/release.md)
- [`docs/open-questions.md`](docs/open-questions.md), [`docs/progress/worklog.md`](docs/progress/worklog.md)
