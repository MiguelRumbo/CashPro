const path = require('node:path');

// babel-preset-expo viene anidado dentro de `expo`; se resuelve desde ahí para no declarar
// un paquete duplicado (ver docs/open-questions.md, OQ-004).
const expoPreset = require.resolve('babel-preset-expo', {
  paths: [path.dirname(require.resolve('expo/package.json'))],
});

module.exports = function (api) {
  api.cache(true);
  return {
    presets: [expoPreset],
    // Empaqueta las migraciones .sql de Drizzle como strings.
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
