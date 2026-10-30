# Changelog

Formato: [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Versionado: SemVer.

## [Unreleased]

### Cambiado

- Arquitectura modular: 11 módulos independientes (cuentas, movimientos, presupuestos, metas, préstamos, suscripciones, vehículos, avisos, ajustes, inicio y estadísticas) que se pueden activar o desactivar.
- La base de datos usa migraciones versionadas; los datos de v1 se conservan sin cambios.
- Las operaciones que tocan varias tablas son atómicas: si algo falla, no quedan datos a medias.
- Importar un respaldo JSON es atómico y valida el archivo antes de borrar los datos actuales.
- Los avisos muestran los montos en la moneda elegida.
- El menú "Más" muestra solo los módulos activos.

### Corregido

- Exportar respaldo, CSV y base de datos, e importar archivos, fallaban en Expo SDK 54.
- El detalle de una cuenta no mostraba los últimos dígitos de la tarjeta.
- El cálculo de iniciales del perfil fallaba con espacios dobles.

### Eliminado

- Servidor `apps/api` (la app ya no lo usaba).

## [1.1.0]

Versión v1 previa a la reestructuración (ver `docs/archive/v1/`).
