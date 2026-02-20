# CashPro - Logo e Iconos

## Diseño del Logo

### Concepto Visual

El logo de CashPro debe representar:
- **Gestión financiera profesional**
- **Simplicidad y claridad**
- **Confianza y seguridad**
- **Modernidad**

### Especificaciones del Logo

#### Colores Principales

```
Color Primario: #20df60 (Verde brillante - representa crecimiento y prosperidad)
Color Secundario: #0066FF (Azul - representa confianza y profesionalismo)
Color Acento: #FFD700 (Dorado - representa valor y riqueza)
Fondo Claro: #FFFFFF
Fondo Oscuro: #1A1A1A
```

#### Elementos del Logo

1. **Símbolo:** 
   - Moneda estilizada con flecha ascendente
   - Gráfico de barras simplificado
   - Billetera digital moderna

2. **Tipografía:**
   - Fuente: Sans-serif moderna (ej: Inter, SF Pro, Roboto)
   - Peso: Bold para "Cash", Regular para "Pro"
   - Estilo: Limpio y profesional

### Iconos de la Aplicación

#### Ubicación de Archivos

Los iconos deben colocarse en:

```
apps/mobile/assets/images/
├── icon.png                          # 1024x1024px
├── favicon.png                       # 48x48px
├── splash-icon.png                   # 400x400px
├── android-icon-foreground.png       # 432x432px
├── android-icon-background.png       # 432x432px
└── android-icon-monochrome.png       # 432x432px
```

#### Especificaciones por Plataforma

##### iOS

- **App Icon:** 1024x1024px (icon.png)
- Formato: PNG sin transparencia
- Sin bordes redondeados (iOS los aplica automáticamente)
- Espacio de seguridad: 10% del borde

##### Android

- **Adaptive Icon Foreground:** 432x432px
  - Área segura: 264x264px (centro)
  - Puede tener transparencia
  
- **Adaptive Icon Background:** 432x432px
  - Color sólido o gradiente
  - Sin transparencia
  
- **Monochrome Icon:** 432x432px
  - Para Material You (Android 13+)
  - Blanco sobre transparente

##### Web

- **Favicon:** 48x48px
- Formato: PNG con transparencia

##### Splash Screen

- **Splash Icon:** 400x400px
- Fondo: Blanco (#FFFFFF) para tema claro
- Fondo: Negro (#000000) para tema oscuro

## Propuesta de Diseño

### Opción 1: Moneda con Flecha

```
┌─────────────────┐
│                 │
│    ╭─────╮     │
│   ╱   $   ╲    │
│  │    ↑    │   │
│   ╲       ╱    │
│    ╰─────╯     │
│                 │
│   CashPro      │
│                 │
└─────────────────┘
```

**Descripción:**
- Círculo con símbolo de dólar ($)
- Flecha ascendente integrada
- Colores: Gradiente verde (#20df60) a azul (#0066FF)

### Opción 2: Billetera Digital

```
┌─────────────────┐
│                 │
│   ┌─────────┐   │
│   │ ▓▓▓▓▓▓▓ │   │
│   │ ▓▓▓▓▓▓▓ │   │
│   │    $    │   │
│   └─────────┘   │
│                 │
│   CashPro      │
│                 │
└─────────────────┘
```

**Descripción:**
- Billetera minimalista
- Tarjetas visibles en la parte superior
- Símbolo de moneda en el centro
- Colores: Azul (#0066FF) con detalles en verde (#20df60)

### Opción 3: Gráfico de Crecimiento

```
┌─────────────────┐
│                 │
│      ╱│         │
│     ╱ │         │
│    ╱  │         │
│   ╱   │         │
│  ╱    │         │
│ ╱     │         │
│───────┴─────    │
│                 │
│   CashPro      │
│                 │
└─────────────────┘
```

**Descripción:**
- Gráfico de barras con tendencia ascendente
- Línea de tendencia superpuesta
- Colores: Verde (#20df60) para las barras, azul (#0066FF) para la línea

## Herramientas Recomendadas

### Para Diseñadores

1. **Figma** (Recomendado)
   - Gratuito para uso personal
   - Colaborativo
   - Exportación en múltiples tamaños

2. **Adobe Illustrator**
   - Profesional
   - Vectorial
   - Control total

3. **Sketch**
   - Específico para diseño de apps
   - Solo macOS

### Para Desarrolladores

1. **Canva**
   - Fácil de usar
   - Templates prediseñados
   - Exportación directa

2. **GIMP**
   - Gratuito y open source
   - Potente editor de imágenes

3. **Inkscape**
   - Gratuito y open source
   - Editor vectorial

### Generadores Online

1. **App Icon Generator**
   - https://www.appicon.co/
   - Genera todos los tamaños necesarios

2. **Figma Icon Generator Plugin**
   - Exporta iconos para todas las plataformas

3. **Android Asset Studio**
   - https://romannurik.github.io/AndroidAssetStudio/
   - Específico para Android

## Proceso de Implementación

### Paso 1: Crear el Diseño Base

1. Diseñar el icono en 1024x1024px
2. Usar vectores para escalabilidad
3. Mantener elementos centrados
4. Respetar áreas de seguridad

### Paso 2: Exportar Tamaños

```bash
# Tamaños necesarios
1024x1024  # iOS App Icon
432x432    # Android Adaptive Icons (x3)
400x400    # Splash Screen
48x48      # Favicon
```

### Paso 3: Optimizar Imágenes

```bash
# Usando ImageMagick (opcional)
convert icon-1024.png -resize 432x432 android-icon-foreground.png
convert icon-1024.png -resize 400x400 splash-icon.png
convert icon-1024.png -resize 48x48 favicon.png
```

### Paso 4: Colocar Archivos

Copiar los archivos generados a:
```
apps/mobile/assets/images/
```

### Paso 5: Verificar Configuración

Revisar `apps/mobile/app.json`:

```json
{
  "expo": {
    "icon": "./assets/images/icon.png",
    "android": {
      "adaptiveIcon": {
        "backgroundColor": "#E6F4FE",
        "foregroundImage": "./assets/images/android-icon-foreground.png",
        "backgroundImage": "./assets/images/android-icon-background.png",
        "monochromeImage": "./assets/images/android-icon-monochrome.png"
      }
    },
    "web": {
      "favicon": "./assets/images/favicon.png"
    }
  }
}
```

### Paso 6: Probar

```bash
# Limpiar caché de Expo
cd apps/mobile
expo start -c

# Probar en dispositivo
expo start --tunnel
```

## Guía de Estilo del Logo

### Uso Correcto

✅ Mantener proporciones originales
✅ Usar sobre fondos apropiados (claro/oscuro)
✅ Respetar espacio mínimo alrededor (10% del tamaño)
✅ Usar versiones oficiales proporcionadas

### Uso Incorrecto

❌ No distorsionar o estirar
❌ No cambiar colores sin autorización
❌ No agregar efectos no autorizados
❌ No usar sobre fondos que dificulten la legibilidad

## Variaciones del Logo

### Logo Completo
- Símbolo + Texto "CashPro"
- Uso: Pantallas de inicio, marketing

### Solo Símbolo
- Solo el icono sin texto
- Uso: App icon, favicon, espacios reducidos

### Logo Horizontal
- Símbolo a la izquierda, texto a la derecha
- Uso: Headers, navegación

### Logo Vertical
- Símbolo arriba, texto abajo
- Uso: Splash screens, pantallas de carga

## Recursos Adicionales

### Paleta de Colores Completa

```css
/* Colores Principales */
--primary-green: #20df60;
--primary-blue: #0066FF;
--accent-gold: #FFD700;

/* Colores de Soporte */
--success: #10b981;
--warning: #f59e0b;
--error: #ef4444;
--info: #3b82f6;

/* Grises */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-200: #e5e7eb;
--gray-300: #d1d5db;
--gray-400: #9ca3af;
--gray-500: #6b7280;
--gray-600: #4b5563;
--gray-700: #374151;
--gray-800: #1f2937;
--gray-900: #111827;

/* Fondos */
--background-light: #FFFFFF;
--background-dark: #1A1A1A;
```

### Tipografía

```css
/* Familia de Fuentes */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 
             'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 
             'Fira Sans', 'Droid Sans', 'Helvetica Neue', 
             sans-serif;

/* Tamaños */
--text-xs: 12px;
--text-sm: 14px;
--text-base: 16px;
--text-lg: 18px;
--text-xl: 20px;
--text-2xl: 24px;
--text-3xl: 30px;
--text-4xl: 36px;
```

## Checklist de Implementación

- [ ] Diseño del logo creado
- [ ] Icon 1024x1024px exportado
- [ ] Android adaptive icons exportados (3 archivos)
- [ ] Splash icon 400x400px exportado
- [ ] Favicon 48x48px exportado
- [ ] Archivos colocados en assets/images/
- [ ] app.json actualizado
- [ ] Probado en iOS
- [ ] Probado en Android
- [ ] Probado en Web
- [ ] Documentación actualizada

## Contacto para Diseño

Si necesitas ayuda profesional con el diseño del logo, considera:

1. Contratar un diseñador en plataformas como:
   - Fiverr
   - Upwork
   - 99designs

2. Usar servicios de diseño de logos:
   - Looka.com
   - Tailor Brands
   - Hatchful by Shopify

3. Comunidad de diseñadores:
   - Dribbble
   - Behance
   - Reddit r/logodesign

---

**Nota:** Los iconos actuales en el proyecto son placeholders. Se recomienda crear iconos personalizados siguiendo estas guías para darle identidad única a CashPro.
