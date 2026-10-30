# ADR-003 — Contribución `gate` para envolver la app

**Fecha:** 2026-10-30 · **Estado:** aceptada

## Contexto

El bloqueo biométrico debe impedir ver **cualquier** pantalla hasta autenticarse, incluidas las de otros módulos. Las contribuciones existentes (`tabs`, `screens`, `actions`) solo agregan piezas; ninguna puede envolver la app. Ponerlo en `app/_layout.tsx` metería lógica en las rutas e impediría apagarlo como módulo.

## Opciones

1. Bloqueo dentro de `core` (siempre activo).
2. Lógica en `app/_layout.tsx`.
3. Nueva contribución de manifest `gate: ComponentType<{ children }>` que el registry aplica alrededor del `Stack`.

## Decisión

Opción 3. `ModuleManifest.gate`, `ModuleRegistry.gates()` y `core/registry/module-gates.tsx` (`<ModuleGates>`). Los gates se anidan en orden de registro (el primero queda por fuera).

## Consecuencias

- El bloqueo es un módulo (`security`) que se puede apagar y probar por separado.
- Un gate se monta antes que cualquier pantalla: debe ser ligero y no depender de capacidades de otros módulos.
