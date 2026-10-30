import type { ReactNode } from 'react';

import { useRegistry } from './react';

/** Aplica los `gate` de los módulos activos alrededor de la app (el primero registrado queda por fuera). */
export function ModuleGates({ children }: { children: ReactNode }) {
  const gates = useRegistry().gates();
  return gates.reduceRight<ReactNode>((inner, Gate) => <Gate>{inner}</Gate>, children);
}
