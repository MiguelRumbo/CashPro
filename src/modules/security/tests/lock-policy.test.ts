import { shouldLockOnResume } from '../domain/lock-policy';

describe('shouldLockOnResume', () => {
  it('no bloquea si la app no estuvo en segundo plano', () => {
    expect(shouldLockOnResume(undefined, 1000, 0)).toBe(false);
  });
  it('bloquea al pasar el umbral (0 = siempre)', () => {
    expect(shouldLockOnResume(1000, 1000, 0)).toBe(true);
    expect(shouldLockOnResume(1000, 1500, 1000)).toBe(false);
    expect(shouldLockOnResume(1000, 2000, 1000)).toBe(true);
  });
});
