import { Redirect } from 'expo-router';

/** Ruta del botón "+" central. El botón navega por su cuenta; esta ruta solo existe por Expo Router. */
export default function Route() {
  return <Redirect href="/" />;
}
