// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

const moduleBoundaries = require('./tools/eslint/module-boundaries');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    ignores: ['dist/*', 'android/*', 'ios/*', 'drizzle/*', 'docs/design/*', 'coverage/*'],
  },
  {
    plugins: { local: { rules: { 'module-boundaries': moduleBoundaries } } },
    rules: {
      'local/module-boundaries': 'error',
      'no-console': 'error',
      'react-hooks/exhaustive-deps': 'error',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
    },
  },
  {
    // Carga perezosa de módulos: require() es intencional (CLAUDE.md §6.4).
    files: ['src/bootstrap/manifest-loaders.ts'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  {
    files: ['**/*.js', 'tests/**', '**/*.test.ts', '**/*.test.tsx'],
    languageOptions: { globals: { __dirname: 'readonly', require: 'readonly', module: 'writable' } },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
]);
