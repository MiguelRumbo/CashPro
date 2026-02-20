# CashPro - Guía de Implementación APK

Guía paso a paso para generar el APK de CashPro e instalarlo en un dispositivo Android.

---

## Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Configuración Inicial](#configuración-inicial)
3. [Generar APK (Preview)](#generar-apk-preview)
4. [Generar AAB para Play Store](#generar-aab-para-play-store)
5. [Instalar APK en Dispositivo](#instalar-apk-en-dispositivo)
6. [Respaldo y Transferencia de Datos](#respaldo-y-transferencia-de-datos)
7. [Actualizar la App](#actualizar-la-app)
8. [Solución de Problemas](#solución-de-problemas)

---

## Requisitos Previos

### Software Necesario

| Software | Versión Mínima | Instalación |
|----------|---------------|-------------|
| Node.js | v18+ | [nodejs.org](https://nodejs.org) |
| pnpm | 10.x | `npm install -g pnpm` |
| EAS CLI | ≥ 15.0.0 | `npm install -g eas-cli` |

### Cuenta Expo

1. Crear cuenta gratuita en [expo.dev](https://expo.dev)
2. Iniciar sesión en terminal:

```bash
eas login
```

### Verificar Instalación

```bash
# Verificar Node.js
node --version

# Verificar pnpm
pnpm --version

# Verificar EAS CLI
eas --version

# Verificar login
eas whoami
```

---

## Configuración Inicial

### 1. Instalar Dependencias

```bash
cd cash_pro
pnpm install
```

### 2. Verificar Configuración

Asegurar que los siguientes archivos existen y están correctos:

**`apps/mobile/app.json`** — Debe contener:
```json
{
  "expo": {
    "name": "CashPro",
    "slug": "cashpro",
    "android": {
      "package": "com.cashpro.app"
    },
    "plugins": ["expo-router", "expo-splash-screen", "expo-sqlite"]
  }
}
```

**`apps/mobile/eas.json`** — Debe contener:
```json
{
  "cli": {
    "version": ">= 15.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true,
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

### 3. Configurar Proyecto en EAS (Primera Vez)

```bash
cd apps/mobile
eas build:configure
```

Esto vincula el proyecto con tu cuenta de Expo. Solo es necesario la primera vez.

---

## Generar APK (Preview)

El perfil **preview** genera un archivo `.apk` que puedes instalar directamente en cualquier dispositivo Android sin necesidad de Google Play Store.

### Comando

```bash
# Desde la raíz del proyecto
pnpm build:apk

# O desde apps/mobile/
cd apps/mobile
pnpm build:apk

# O directamente con EAS
eas build --platform android --profile preview
```

### Proceso

1. EAS sube el código a los servidores de Expo
2. Se compila el proyecto en la nube (~10-20 minutos la primera vez)
3. Al terminar, se proporciona un enlace de descarga del APK

### Ejemplo de Salida

```
✔ Build finished
🤖 Android app:
   https://expo.dev/artifacts/eas/XXXXX.apk
```

### Descargar el APK

- **Opción 1:** Hacer clic en el enlace proporcionado
- **Opción 2:** Desde el dashboard de Expo en [expo.dev](https://expo.dev)
- **Opción 3:** Usando EAS CLI:
  ```bash
  eas build:list --platform android --status finished
  ```

---

## Generar AAB para Play Store

El perfil **production** genera un archivo `.aab` (Android App Bundle) optimizado para publicar en Google Play Store.

### Comando

```bash
# Desde la raíz del proyecto
pnpm build:production

# O directamente
cd apps/mobile
eas build --platform android --profile production
```

### Notas

- El AAB no se puede instalar directamente en un dispositivo
- Google Play Store genera APKs optimizados a partir del AAB
- La versión se auto-incrementa con cada build

---

## Instalar APK en Dispositivo

### Método 1: Descarga Directa (Recomendado)

1. En el dispositivo Android, abrir el enlace del APK en el navegador
2. Descargar el archivo `.apk`
3. Abrir el archivo descargado
4. Si es la primera vez, habilitar "Instalar desde fuentes desconocidas":
   - Ir a **Ajustes → Seguridad → Fuentes desconocidas** (Android antiguo)
   - O **Ajustes → Apps → Permisos especiales → Instalar apps desconocidas** → seleccionar el navegador (Android moderno)
5. Confirmar la instalación

### Método 2: Transferencia por USB

1. Descargar el APK en tu computadora
2. Conectar el dispositivo Android por USB
3. Copiar el APK a la carpeta `Downloads` del dispositivo
4. En el dispositivo, abrir un explorador de archivos
5. Navegar a `Downloads` y tocar el APK para instalar

### Método 3: QR Code desde Expo

1. Ir a [expo.dev](https://expo.dev) → Tu proyecto → Builds
2. Seleccionar el build más reciente
3. Escanear el código QR con el dispositivo Android

---

## Respaldo y Transferencia de Datos

CashPro almacena todos los datos localmente en el dispositivo. Para respaldar o transferir datos a otro dispositivo:

### Exportar Datos

Desde la app: **Configuración → Datos**

| Formato | Descripción | Uso |
|---------|-------------|-----|
| **JSON** | Respaldo completo de todas las tablas | Ideal para respaldo y restauración |
| **CSV** | Solo movimientos en formato tabular | Ideal para analizar en Excel |
| **Base de Datos** | Archivo SQLite (.db) directo | Respaldo completo del archivo de BD |

### Importar Datos en Otro Dispositivo

1. Exportar datos en formato JSON o .db desde el dispositivo origen
2. Transferir el archivo al nuevo dispositivo (email, USB, nube, etc.)
3. Instalar CashPro en el nuevo dispositivo
4. Ir a **Configuración → Datos → Importar Datos**
5. Seleccionar el archivo JSON o .db

### Notas Importantes

- La importación **reemplaza** todos los datos existentes
- Se recomienda exportar un respaldo antes de importar
- El formato JSON es más portable; el formato .db es más rápido
- Los archivos exportados se comparten mediante la función nativa de compartir del dispositivo

---

## Actualizar la App

### Generar Nueva Versión

1. Actualizar la versión en `apps/mobile/app.json`:
   ```json
   "version": "1.2.0"
   ```

2. Generar nuevo APK:
   ```bash
   pnpm build:apk
   ```

3. Instalar el nuevo APK en el dispositivo (se actualiza sobre la versión anterior)

### Los Datos se Conservan

- Al instalar una actualización, los datos de SQLite se **conservan**
- No es necesario exportar/importar al actualizar
- Solo se pierden datos si se desinstala la app completamente

---

## Solución de Problemas

### Error: "eas: command not found"

```bash
npm install -g eas-cli
```

### Error: "Not logged in"

```bash
eas login
```

### Error: "Missing android.package"

Verificar que `app.json` contiene:
```json
"android": {
  "package": "com.cashpro.app"
}
```

### Error: "expo-sqlite plugin missing"

Verificar que `app.json` contiene `expo-sqlite` en plugins:
```json
"plugins": ["expo-router", "expo-splash-screen", "expo-sqlite"]
```

### Build falla con error de dependencias

```bash
cd apps/mobile
pnpm install
eas build --platform android --profile preview --clear-cache
```

### APK no se instala: "App not installed"

- Verificar que no haya una versión con diferente firma instalada
- Desinstalar la versión anterior e intentar de nuevo
- Verificar espacio disponible en el dispositivo

### La app se cierra al abrir

- Verificar que el dispositivo tiene Android 7.0 o superior
- Revisar logs: `adb logcat | grep -i cashpro`
- Intentar reinstalar con un build limpio:
  ```bash
  eas build --platform android --profile preview --clear-cache
  ```

### Los datos no aparecen después de importar

- Verificar que el archivo JSON tiene el formato correcto (exportado desde CashPro)
- Cerrar y reabrir la app después de importar
- Verificar que el archivo .db es un SQLite válido

---

## Referencia Rápida

```bash
# Instalar dependencias
pnpm install

# Login en EAS
eas login

# Generar APK para instalar directamente
pnpm build:apk

# Generar AAB para Play Store
pnpm build:production

# Ver builds anteriores
eas build:list --platform android

# Configurar proyecto (primera vez)
eas build:configure
```

---

**Última actualización:** Febrero 2026
