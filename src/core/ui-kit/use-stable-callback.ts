import { useCallback, useLayoutEffect, useRef } from 'react';

/**
 * Devuelve una función con identidad estable que siempre ejecuta la versión más reciente de `fn`.
 * Permite listar las funciones de carga en las dependencias de useEffect/useFocusEffect sin
 * provocar recargas en cada render (alternativa a silenciar react-hooks/exhaustive-deps).
 */
export function useStableCallback<A extends unknown[], R>(fn: (...args: A) => R): (...args: A) => R {
  const ref = useRef(fn);
  useLayoutEffect(() => {
    ref.current = fn;
  });
  return useCallback((...args: A) => ref.current(...args), []);
}
