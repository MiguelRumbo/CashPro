import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { useStableCallback } from '@/core/ui-kit/use-stable-callback';

import { shouldLockOnResume } from '../domain/lock-policy';
import type { DeviceSecurity } from '../platform/device-security';
import { securityTexts } from '../texts';

export type LockStatus = 'checking' | 'locked' | 'unlocked';

/** Estado del bloqueo: pide autenticación al abrir y al volver de segundo plano. */
export function useAppLock(security: DeviceSecurity, thresholdMs: number) {
  const [status, setStatus] = useState<LockStatus>('checking');
  const [failed, setFailed] = useState(false);
  const enabled = useRef(false);
  const authenticating = useRef(false);
  const backgroundedAt = useRef<number | undefined>(undefined);

  const unlock = useStableCallback(async () => {
    if (authenticating.current) return;
    authenticating.current = true;
    try {
      const ok = await security.authenticate({ message: securityTexts.prompt, cancel: securityTexts.cancel });
      setFailed(!ok);
      if (ok) setStatus('unlocked');
    } finally {
      authenticating.current = false;
    }
  });

  useEffect(() => {
    let cancelled = false;
    security.canAuthenticate().then((available) => {
      if (cancelled) return;
      enabled.current = available;
      // Sin biometría ni PIN configurados no hay con qué bloquear (documentado en docs/security.md).
      if (!available) return setStatus('unlocked');
      setStatus('locked');
      void unlock();
    });
    return () => {
      cancelled = true;
    };
  }, [security, unlock]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (!enabled.current || authenticating.current) return;
      if (state === 'background') backgroundedAt.current = Date.now();
      if (state === 'active') {
        if (shouldLockOnResume(backgroundedAt.current, Date.now(), thresholdMs)) {
          setStatus('locked');
          void unlock();
        }
        backgroundedAt.current = undefined;
      }
    });
    return () => subscription.remove();
  }, [thresholdMs, unlock]);

  return { status, failed, unlock };
}
