# Módulo `security`

**Carpeta:** `src/modules/security/` · **Interruptor:** `modules.security.enabled` en `src/config/app.config.ts`

## Propósito

Bloqueo de la app con biometría o el PIN del teléfono (RNF-11) y `FLAG_SECURE` (RNF-12). El cifrado de la BD (RNF-10) no vive aquí: la llave se maneja en `core/db/encryption-key.ts` porque se necesita antes de arrancar cualquier módulo.

## Datos

No tiene tablas.

## API pública y comunicación

`index.ts` solo exporta `manifest`. Aporta un `gate` (`LockGate`) que envuelve toda la app (ADR-003). En `onReady` activa `FLAG_SECURE` si `security.preventScreenshots` es `true`. El acceso al sistema operativo pasa por `platform/device-security.ts` (`expo-local-authentication`, `expo-screen-capture`), que los tests reemplazan por un doble.

## Funcionamiento

- Al arrancar: si el teléfono tiene biometría o credencial configurada, muestra `LockView` y abre el diálogo del sistema. Si no tiene ninguna, no bloquea.
- Al volver de segundo plano tras `security.lockOnBackgroundMs` ms (0 = siempre), vuelve a bloquear.
- Si la autenticación falla o se cancela, queda la pantalla de bloqueo con el botón "Desbloquear".

## Si se apaga

No hay bloqueo ni `FLAG_SECURE`; la BD sigue cifrada. La app arranca igual (smoke test).
