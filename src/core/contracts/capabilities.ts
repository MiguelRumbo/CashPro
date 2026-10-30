/** Clave tipada de una capacidad (dependencia blanda entre módulos). */
export interface CapabilityKey<T> {
  readonly id: string;
  /** Solo para inferencia de tipos; nunca tiene valor en runtime. */
  readonly __type?: T;
}

export function createCapabilityKey<T>(id: string): CapabilityKey<T> {
  return Object.freeze({ id });
}
