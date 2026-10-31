# ADR-004 — Rediseño visual y temas de color

**Fecha:** 2026-10-31 · **Estado:** aceptada

## Contexto

El usuario encontró la UI de v1 demasiado simple. Se le mostraron tres direcciones (A · Bosque nocturno, B · Claro con números grandes, C · Cartera de tarjetas). Eligió A con las tarjetas apiladas de C, y pidió poder cambiar entre las tres paletas desde Ajustes. Las pantallas heredadas usan colores fijos y pares `useThemeColor({ light, dark })` en ~120 lugares.

## Opciones

1. Reescribir todas las pantallas con el nuevo sistema antes de publicar.
2. Tema como preferencia en tiempo de ejecución; `useThemeColor` devuelve el color del tema activo (ignorando los pares de v1) y un codemod lleva fondos pastel y colores fijos de acento a tokens; rediseño a mano de Inicio, Cuentas y la navegación.
3. Tres temas con tipografías distintas (Plus Jakarta Sans, Outfit).

## Decisión

Opción 2, con una sola tipografía (Sora + Manrope) para los tres temas: el usuario pidió "temas de color" y otras familias exigirían más dependencias.

- `core/ui-kit/theme.ts`: `themes` (`forest`, `daylight`, `wallet`), radios, espaciado y familias.
- `core/ui-kit/theme-context.tsx`: `AppThemeProvider`, `useAppTheme`, `usePalette` (sin provider se usa `forest`, útil en tests de vistas).
- `core/preferences`: la preferencia `theme`; el módulo `settings` la guarda en `user_profile.theme` (migración aditiva `0001_profile_theme`).
- `ThemedText` asigna la familia según peso y tamaño (Android no sintetiza negritas en fuentes propias).
- Degradados con `experimental_backgroundImage` de React Native 0.81, sin `expo-linear-gradient`.
- Navegación: "+" central aportado por `movements` (slot `tabbar.fab`); Estadísticas y Ajustes pasan al menú Más.

## Consecuencias

- La app ya no sigue el modo del sistema; manda el tema elegido.
- Las pantallas no rediseñadas a mano heredan paleta y tipografía, pero conservan su maquetación de v1; colores semánticos fijos (rojo de gasto, colores de categoría) no cambian con el tema. Se rediseñan al tocarlas.
