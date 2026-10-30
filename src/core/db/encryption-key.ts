import { getRandomBytes } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

/** Bytes de la llave SQLCipher (256 bits). */
const KEY_BYTES = 32;
const HEX_KEY = /^[0-9a-f]{64}$/;

export class DatabaseKeyError extends Error {
  override name = 'DatabaseKeyError';
}

const toHex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

/**
 * Llave de cifrado de la BD: se genera una vez en el dispositivo y se guarda en
 * expo-secure-store (Android Keystore). Nunca sale del teléfono ni se escribe en logs.
 */
export async function getOrCreateDatabaseKey(storageKey: string): Promise<string> {
  const existing = await SecureStore.getItemAsync(storageKey);
  if (existing !== null) {
    if (!HEX_KEY.test(existing)) throw new DatabaseKeyError('La llave guardada de la BD no es válida');
    return existing;
  }
  const created = toHex(getRandomBytes(KEY_BYTES));
  await SecureStore.setItemAsync(storageKey, created);
  return created;
}

/** Sentencia PRAGMA para SQLCipher. PRAGMA no admite parámetros; por eso la llave se valida antes. */
export function keyPragma(hexKey: string): string {
  if (!HEX_KEY.test(hexKey)) throw new DatabaseKeyError('Formato de llave inválido');
  return `PRAGMA key = "x'${hexKey}'";`;
}
