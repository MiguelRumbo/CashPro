# Seguridad y privacidad

## Modelo

- **Todo es local.** No hay backend; la app no tiene cuentas de usuario.
- **Cero credenciales bancarias**, ni ahora ni en v2.
- **BD cifrada con SQLCipher** (`app.json` → `expo-sqlite.android.useSQLCipher`). La llave (256 bits aleatorios, `expo-crypto`) se genera en el primer arranque y se guarda en `expo-secure-store` (Android Keystore) bajo `db.keyStorageKey`. Se aplica con `PRAGMA key` antes de cualquier otra sentencia; si no abre, la app muestra la pantalla de error sin tocar el archivo.
- **`android.allowBackup: false`**: Android no copia la BD a Google Drive (además, sin la llave del Keystore sería ilegible).
- **Bloqueo** (módulo `security`): al abrir y al volver de segundo plano (`security.lockOnBackgroundMs`) se pide huella, rostro o el PIN/patrón del teléfono. Si el teléfono no tiene ningún método configurado, **no hay bloqueo** (no hay con qué verificar); se avisará en Ajustes en una fase posterior.
- **`FLAG_SECURE`** (`security.preventScreenshots`): la app no aparece en capturas ni en la vista de recientes.
- "Exportar base de datos" entrega el archivo **cifrado**; solo se puede abrir con la llave de ese teléfono.

## Salidas de red

| Salida                           | Cuándo                                    | Datos                                                                          | Estado                                                                            |
| -------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| Ninguna en runtime               | —                                         | —                                                                              | Actual                                                                            |
| Compartir archivo (JSON/CSV/.db) | Solo cuando el usuario lo pide en Ajustes | El archivo elegido, al destino que el usuario escoja en el diálogo del sistema | Actual. **El respaldo JSON va en claro** hasta la Fase 1 (cifrado con contraseña) |
| Gmail API (solo lectura)         | v2, Fase 4, si se aprueba OQ-101          | Correos de remitentes bancarios                                                | Pendiente                                                                         |

La pantalla de privacidad dentro de la app se agrega en la Fase 1.

## Permisos Android

Permisos propios de la app (además de los que agregan las librerías de Expo):

| Permiso                                                                                     | Para qué                                              | Fase |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ---- |
| `BIND_NOTIFICATION_LISTENER_SERVICE` (en el `<service>`, se concede en Ajustes del sistema) | Leer notificaciones de apps bancarias en lista blanca | 2    |
| `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`                                                      | Que Android no mate el listener                       | 2    |
| `USE_BIOMETRIC`, `USE_FINGERPRINT` (los agrega `expo-local-authentication`)                 | Bloqueo biométrico                                    | 1 ✅ |
| `INTERNET`                                                                                  | Correo y respaldo                                     | 4    |

## Logs

`core/logger` es el único que escribe en consola. `LogContext` solo admite ids, conteos y nombres técnicos; la UI reporta errores con `useErrorReporter()`, que registra solo el tipo de error. Nunca montos, nombres, comercios ni textos de notificaciones.

## Secretos

- Sin secretos en el repo; `.env` ignorado, `.env.example` sin valores.
- Firma del APK: keystore fuera del repo; en CI como `CASHPRO_KEYSTORE_BASE64` y contraseñas `CASHPRO_RELEASE_*` (pendiente, OQ-006).

## `npm audit`

Se corre antes de cada release y el resultado se anota en el worklog. Último: pendiente (no hay release desde la reestructuración).
