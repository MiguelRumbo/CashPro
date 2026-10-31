/** Adaptador de autenticación del sistema operativo (biometría o PIN del teléfono). */
import * as LocalAuthentication from 'expo-local-authentication';

export interface DeviceSecurity {
  /** true si el teléfono tiene biometría o credencial configurada. */
  canAuthenticate(): Promise<boolean>;
  authenticate(prompt: { message: string; cancel: string }): Promise<boolean>;
}

export const deviceSecurity: DeviceSecurity = {
  async canAuthenticate() {
    const [hasHardware, enrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    return hasHardware && enrolled;
  },
  async authenticate({ message, cancel }) {
    // disableDeviceFallback=false: si la biometría falla, Android ofrece el PIN o patrón.
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: message,
      cancelLabel: cancel,
      disableDeviceFallback: false,
    });
    return result.success;
  },
};
