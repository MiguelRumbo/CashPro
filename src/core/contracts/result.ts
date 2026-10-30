/** Resultado de una operación de servicio: éxito con datos o error con mensaje para el usuario. */
export type Result<T> =
  | { readonly success: true; readonly data: T; readonly message?: string }
  | { readonly success: false; readonly error: string };

export function ok<T>(data: T, message?: string): Result<T> {
  return message === undefined ? { success: true, data } : { success: true, data, message };
}

export function fail<T = never>(error: string): Result<T> {
  return { success: false, error };
}

/** Convierte una excepción inesperada en Result sin filtrar datos sensibles. */
export function failFromError<T = never>(error: unknown): Result<T> {
  return fail(error instanceof Error ? error.message : String(error));
}

/** Envuelve una lectura opcional (p. ej. de una capacidad) como Result. */
export function fromOptional<T>(value: T | undefined, notFoundMessage = 'No encontrado'): Result<T> {
  return value === undefined ? fail(notFoundMessage) : ok(value);
}
