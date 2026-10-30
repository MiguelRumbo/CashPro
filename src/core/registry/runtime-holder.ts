export class ModuleNotReadyError extends Error {
  override name = 'ModuleNotReadyError';
}

/** Contenedor de los servicios de un módulo, creados en register y liberados en dispose. */
export function createRuntimeHolder<T>(moduleId: string) {
  let current: T | undefined;
  return {
    set(value: T): T {
      current = value;
      return value;
    },
    get(): T {
      if (current === undefined) throw new ModuleNotReadyError(`El módulo ${moduleId} no está inicializado`);
      return current;
    },
    clear(): void {
      current = undefined;
    },
  };
}
