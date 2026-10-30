/**
 * Firma de release para builds locales y de GitHub Actions (CLAUDE.md §12).
 * - Agrega signingConfigs.release leyendo propiedades de Gradle CASHPRO_RELEASE_*.
 * - El release usa esa llave; el debug también si está configurada (dev y prod se instalan uno sobre otro).
 * - Cualquier tarea release sin llave FALLA a propósito: nunca se publica con la llave de debug.
 * - No actúa en EAS Build (EAS firma con sus credenciales remotas).
 */
const { withAppBuildGradle } = require('expo/config-plugins');

const MARKER = '// @cashpro/release-signing';
const STORE_FILE = 'CASHPRO_RELEASE_STORE_FILE';

const RELEASE_SIGNING_CONFIG = `
        release { ${MARKER}
            if (findProperty('${STORE_FILE}')) {
                storeFile file(findProperty('${STORE_FILE}'))
                storePassword findProperty('CASHPRO_RELEASE_STORE_PASSWORD')
                keyAlias findProperty('CASHPRO_RELEASE_KEY_ALIAS')
                keyPassword findProperty('CASHPRO_RELEASE_KEY_PASSWORD')
            }
        }`;

const FAIL_WITHOUT_KEY = `
${MARKER}: falla cualquier tarea release sin la llave de CashPro
gradle.taskGraph.whenReady { graph ->
    def wantsRelease = graph.allTasks.any { it.project.name == 'app' && it.name.toLowerCase().contains('release') }
    if (wantsRelease && !findProperty('${STORE_FILE}')) {
        throw new GradleException("CashPro: falta la llave de release (${STORE_FILE}). Ver docs/release.md")
    }
}
`;

class ReleaseSigningPluginError extends Error {
  name = 'ReleaseSigningPluginError';
}

function replaceOnce(source, search, replacement, what) {
  if (!source.includes(search))
    throw new ReleaseSigningPluginError(`No se encontró ${what} en app/build.gradle`);
  return source.replace(search, replacement);
}

/** Transformación pura de app/build.gradle (probada en with-release-signing.test.js). */
function applyReleaseSigning(gradle) {
  if (gradle.includes(MARKER)) return gradle;
  let out = replaceOnce(
    gradle,
    'signingConfigs {',
    `signingConfigs {${RELEASE_SIGNING_CONFIG}`,
    'signingConfigs',
  );
  const releaseBlock = /(release\s*\{[^}]*?)signingConfig signingConfigs\.debug/;
  if (!releaseBlock.test(out))
    throw new ReleaseSigningPluginError('No se encontró la firma del buildType release');
  out = out.replace(releaseBlock, '$1signingConfig signingConfigs.release');
  out = out.replace(
    /(buildTypes\s*\{\s*debug\s*\{\s*)signingConfig signingConfigs\.debug/,
    `$1signingConfig findProperty('${STORE_FILE}') ? signingConfigs.release : signingConfigs.debug`,
  );
  return `${out}\n${FAIL_WITHOUT_KEY}`;
}

const withReleaseSigning = (config) => {
  if (process.env.EAS_BUILD === 'true') return config;
  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') {
      throw new ReleaseSigningPluginError('Solo se soporta app/build.gradle en Groovy');
    }
    cfg.modResults.contents = applyReleaseSigning(cfg.modResults.contents);
    return cfg;
  });
};

module.exports = withReleaseSigning;
module.exports.applyReleaseSigning = applyReleaseSigning;
