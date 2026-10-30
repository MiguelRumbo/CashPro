import * as SecureStore from 'expo-secure-store';

import { DatabaseKeyError, getOrCreateDatabaseKey, keyPragma } from './encryption-key';

jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (k: string) => store.get(k) ?? null),
    setItemAsync: jest.fn(async (k: string, v: string) => void store.set(k, v)),
  };
});
jest.mock('expo-crypto', () => ({
  getRandomBytes: (n: number) => Uint8Array.from({ length: n }, (_, i) => i),
}));

describe('llave de la BD', () => {
  it('genera una llave de 64 hex una sola vez y la reutiliza', async () => {
    const first = await getOrCreateDatabaseKey('k');
    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(await getOrCreateDatabaseKey('k')).toBe(first);
    expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(1);
  });

  it('rechaza una llave guardada corrupta', async () => {
    await SecureStore.setItemAsync('bad', 'nope');
    await expect(getOrCreateDatabaseKey('bad')).rejects.toThrow(DatabaseKeyError);
  });

  it('arma el PRAGMA solo con hex válido', () => {
    expect(keyPragma('a'.repeat(64))).toBe(`PRAGMA key = "x'${'a'.repeat(64)}'";`);
    expect(() => keyPragma(`'; DROP TABLE accounts; --`)).toThrow(DatabaseKeyError);
  });
});
