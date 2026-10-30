/**
 * Fija `reactNativeArchitectures` en gradle.properties (CLAUDE.md §12). El plugin de React Native
 * lo convierte en abiFilters, así que el APK solo lleva los .so de esas arquitecturas.
 * Compilación puntual para otra ABI: ./gradlew assembleRelease -PreactNativeArchitectures=x86_64
 */
const { withGradleProperties } = require('expo/config-plugins');

const KEY = 'reactNativeArchitectures';
const KNOWN_ABIS = ['armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64'];

class AndroidAbisPluginError extends Error {
  name = 'AndroidAbisPluginError';
}

/** Transformación pura de la lista de propiedades (probada en with-android-abis.test.js). */
function applyAbis(properties, architectures) {
  if (!Array.isArray(architectures) || architectures.length === 0) {
    throw new AndroidAbisPluginError('architectures debe ser una lista no vacía');
  }
  const unknown = architectures.filter((abi) => !KNOWN_ABIS.includes(abi));
  if (unknown.length > 0) throw new AndroidAbisPluginError(`ABI desconocida: ${unknown.join(', ')}`);
  const value = architectures.join(',');
  const others = properties.filter((p) => !(p.type === 'property' && p.key === KEY));
  return [...others, { type: 'property', key: KEY, value }];
}

const withAndroidAbis = (config, props = {}) =>
  withGradleProperties(config, (cfg) => {
    cfg.modResults = applyAbis(cfg.modResults, props.architectures);
    return cfg;
  });

module.exports = withAndroidAbis;
module.exports.applyAbis = applyAbis;
