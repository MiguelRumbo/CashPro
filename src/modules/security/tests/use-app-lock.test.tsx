import { act, renderHook, waitFor } from '@testing-library/react-native';

import type { DeviceSecurity } from '../platform/device-security';
import { useAppLock } from '../ui/use-app-lock';

const fakeSecurity = (available: boolean, results: boolean[]): DeviceSecurity => ({
  canAuthenticate: jest.fn(async () => available),
  authenticate: jest.fn(async () => results.shift() ?? false),
});

describe('useAppLock', () => {
  it('sin biometría ni PIN configurados no bloquea', async () => {
    const security = fakeSecurity(false, []);
    const { result } = await renderHook(() => useAppLock(security, 0));
    await waitFor(() => expect(result.current.status).toBe('unlocked'));
    expect(security.authenticate).not.toHaveBeenCalled();
  });

  it('pide autenticación al abrir y desbloquea si es correcta', async () => {
    const security = fakeSecurity(true, [true]);
    const { result } = await renderHook(() => useAppLock(security, 0));
    await waitFor(() => expect(result.current.status).toBe('unlocked'));
    expect(security.authenticate).toHaveBeenCalledTimes(1);
  });

  it('sigue bloqueado si falla y permite reintentar', async () => {
    const security = fakeSecurity(true, [false, true]);
    const { result } = await renderHook(() => useAppLock(security, 0));
    await waitFor(() => expect(result.current.failed).toBe(true));
    expect(result.current.status).toBe('locked');
    await act(async () => {
      await result.current.unlock();
    });
    expect(result.current.status).toBe('unlocked');
  });
});
