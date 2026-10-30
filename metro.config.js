const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
// Migraciones de Drizzle (.sql) se importan desde drizzle/migrations.js.
config.resolver.sourceExts.push('sql');

module.exports = config;
