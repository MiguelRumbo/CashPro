import type { ReactNode } from 'react';

import { getSecurityRuntime } from '../runtime';
import { LockView } from './lock-view';
import { useAppLock } from './use-app-lock';

/** Envuelve toda la app: no muestra datos hasta que el usuario se autentica. */
export function LockGate({ children }: { children: ReactNode }) {
  const { device, lockOnBackgroundMs } = getSecurityRuntime();
  const { status, failed, unlock } = useAppLock(device, lockOnBackgroundMs);
  if (status === 'unlocked') return <>{children}</>;
  return <LockView canUnlock={status === 'locked'} failed={failed} onUnlock={() => void unlock()} />;
}
