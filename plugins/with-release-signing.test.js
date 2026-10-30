const fs = require('node:fs');
const path = require('node:path');

const { applyReleaseSigning } = require('./with-release-signing');

// Extracto real del template de Expo SDK 54 (android/app/build.gradle).
const TEMPLATE = `android {
    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }
    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            // Caution! In production, you need to generate your own keystore file.
            signingConfig signingConfigs.debug
            minifyEnabled enableMinifyInReleaseBuilds
        }
    }
}`;

describe('with-release-signing', () => {
  const out = applyReleaseSigning(TEMPLATE);

  it('agrega signingConfigs.release con propiedades de Gradle', () => {
    expect(out).toContain("storeFile file(findProperty('CASHPRO_RELEASE_STORE_FILE'))");
    expect(out).toContain("keyPassword findProperty('CASHPRO_RELEASE_KEY_PASSWORD')");
  });

  it('el release ya no firma con la llave de debug', () => {
    const release = out.slice(out.indexOf('        release {\n            // Caution'));
    expect(release).toContain('signingConfig signingConfigs.release');
    expect(release).not.toContain('signingConfig signingConfigs.debug');
  });

  it('el debug usa la llave de release si existe', () => {
    expect(out).toContain(
      "signingConfig findProperty('CASHPRO_RELEASE_STORE_FILE') ? signingConfigs.release : signingConfigs.debug",
    );
  });

  it('hace fallar las tareas release sin llave', () => {
    expect(out).toContain('throw new GradleException');
  });

  it('es idempotente', () => {
    expect(applyReleaseSigning(out)).toBe(out);
  });

  it('falla si el template cambia y no encuentra dónde inyectar', () => {
    expect(() => applyReleaseSigning('android {}')).toThrow(/No se encontró/);
  });

  it('funciona sobre el build.gradle generado por prebuild si existe', () => {
    const generated = path.resolve(__dirname, '../android/app/build.gradle');
    if (!fs.existsSync(generated)) return;
    const contents = fs.readFileSync(generated, 'utf8');
    expect(() => applyReleaseSigning(contents)).not.toThrow();
  });
});
