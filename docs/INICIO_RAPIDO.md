# 🚀 Inicio Rápido - CashPro

## ⚡ Comandos Esenciales

### Iniciar Todo
```bash
# Desde la raíz del proyecto
pnpm dev
```
Esto inicia el backend (API) y la app móvil simultáneamente.

### Iniciar Solo Backend
```bash
pnpm dev:api
```
El servidor estará en: `http://localhost:3000`

### Iniciar Solo App Móvil
```bash
pnpm dev:mobile
```

## 📱 Configuración para Android

### Tu IP Local Actual
```
192.168.1.6
```

### Si tu IP cambia:
1. Obtén tu nueva IP:
   ```bash
   ipconfig | findstr IPv4
   ```

2. Actualiza el archivo `apps/mobile/config/api.ts`:
   ```typescript
   const LOCAL_IP = 'TU_NUEVA_IP';
   ```

3. Reinicia la app móvil

## ✅ Verificación Rápida

### 1. Backend funcionando
```bash
curl http://localhost:3000/api/accounts
```
Debe responder: `{"success":true,"data":[]}`

### 2. Desde tu teléfono
Abre el navegador y ve a:
```
http://192.168.1.6:3000/api/accounts
```

### 3. Firewall (si es necesario)
```powershell
# Ejecutar como Administrador
New-NetFirewallRule -DisplayName "CashPro API" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

## 📊 Formato de Números

Todos los números ahora se formatean automáticamente:
- `1000` → `$1,000.00`
- `31000` → `$31,000.00`
- `100000` → `$100,000.00`

## 🎯 Probar la App

1. Inicia el backend: `pnpm dev:api`
2. Inicia la app: `pnpm dev:mobile`
3. Abre la app en tu dispositivo
4. Ve a "Cuentas"
5. Presiona "Agregar nueva cuenta"
6. Crea una cuenta de prueba

## 📚 Documentación Completa

- `docs/README.md` - Documentación general
- `docs/CAMBIOS_REALIZADOS.md` - Cambios recientes
- `docs/CONFIGURACION_RED.md` - Configuración de red
- `docs/IMPLEMENTACION_CUENTAS.md` - Implementación completa

## 🆘 Problemas Comunes

### "Network request failed"
- Verifica que el backend esté corriendo
- Confirma que estés en la misma red WiFi
- Revisa la IP en `apps/mobile/config/api.ts`

### "Connection refused"
- Configura el firewall (ver arriba)
- Verifica que el puerto 3000 esté libre

### Los números no se formatean
- Asegúrate de que la app se haya reiniciado
- Verifica que uses `formatCurrency` de `@/utils/format`

---

**Estado del Servidor**: 🟢 Corriendo  
**Puerto**: 3000  
**IP Local**: 192.168.1.6
