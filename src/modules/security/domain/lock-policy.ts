/**
 * ¿Hay que pedir autenticación al volver de segundo plano?
 * `backgroundedAt` es undefined si la app no pasó por segundo plano.
 */
export function shouldLockOnResume(
  backgroundedAt: number | undefined,
  now: number,
  thresholdMs: number,
): boolean {
  if (backgroundedAt === undefined) return false;
  return now - backgroundedAt >= thresholdMs;
}
