/** Adaptadores de seguridad del sistema operativo (biometría y capturas de pantalla). */
import * as LocalAuthentication from 'expo-local-authentication';
import * as ScreenCapture from 'expo-screen-capture';

export interface DeviceSecurity {
  /** true si el teléfono tiene biometría o credencial configurada. */
  canAuthenticate(): Promise<boolean>;
  authenticate(prompt: { message: string; cancel: string }): Promise<boolean>;
  preventScreenCapture(): Promise<void>;
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
  // FLAG_SECURE en Android: oculta la app en capturas y en la vista de recientes.
  preventScreenCapture: () => ScreenCapture.preventScreenCaptureAsync(),
};
