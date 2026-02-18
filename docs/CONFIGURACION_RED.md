# 🌐 Configuración de Red para Android

## Problema Resuelto

Android no puede usar `localhost` para conectarse al servidor de desarrollo. Necesita usar la IP local de tu computadora.

## ✅ Solución Implementada

### 1. Utility de Formato de Números

Se creó `apps/mobile/utils/format.ts` con funciones para formatear cantidades:

```typescript
// Formatear moneda con separadores de miles
formatCurrency(1000) // "$1,000.00"
formatCurrency(100000) // "$100,000.00"

// Formatear números sin símbolo
formatNumber(1000) // "1,000"

// Formatear tarjetas
formatCardNumber("1234567890123456") // "1234 5678 9012 3456"

// Ocultar tarjetas
maskCardNumber("1234567890123456") // "•••• 3456"
```

### 2. Configuración de API

Se actualizó `apps/mobile/config/api.ts` para detectar la plataforma:

```typescript
const LOCAL_IP = '192.168.1.6'; // Tu IP actual

export const API_CONFIG = {
  BASE_URL: __DEV__ 
    ? Platform.OS === 'android' 
      ? `http://${LOCAL_IP}:3000/api`  // Android usa IP
      : 'http://localhost:3000/api'     // iOS usa localhost
    : 'http://localhost:3000/api',
};
```

## 🔧 Cómo Obtener tu IP Local

### Windows
```bash
ipconfig
```
Busca "Dirección IPv4" en tu adaptador de red principal (WiFi o Ethernet).

### Mac/Linux
```bash
ifconfig
```
Busca "inet" en tu adaptador de red principal.

## 📱 Configuración Paso a Paso

### 1. Obtén tu IP Local

```bash
# Windows
ipconfig | findstr IPv4

# Resultado ejemplo:
# Dirección IPv4. . . . . . . . . . . . . . : 192.168.1.6
```

### 2. Actualiza la Configuración (Ya está hecha)

El archivo `apps/mobile/config/api.ts` ya está configurado con tu IP: `192.168.1.6`

Si tu IP cambia, solo actualiza esta línea:
```typescript
const LOCAL_IP = '192.168.1.6'; // Cambia aquí
```

### 3. Verifica que el Servidor Esté Corriendo

```bash
# Inicia el backend
pnpm dev:api

# Deberías ver:
# 🚀 Servidor corriendo en http://localhost:3000
# 📊 API disponible en http://localhost:3000/api
```

### 4. Prueba la Conexión

Desde tu computadora:
```bash
curl http://localhost:3000/api/accounts
# Debería responder: {"success":true,"data":[]}
```

Desde tu teléfono Android (en el navegador):
```
http://192.168.1.6:3000/api/accounts
```

### 5. Inicia la App Móvil

```bash
pnpm dev:mobile
```

## 🔍 Verificación de Conectividad

### Checklist

- [ ] Backend corriendo en puerto 3000
- [ ] Computadora y teléfono en la misma red WiFi
- [ ] IP correcta en `apps/mobile/config/api.ts`
- [ ] Firewall de Windows permite conexiones en puerto 3000
- [ ] App móvil reiniciada después de cambiar la IP

### Probar Conectividad desde el Teléfono

1. Abre el navegador en tu teléfono Android
2. Ve a: `http://192.168.1.6:3000/api/accounts`
3. Deberías ver: `{"success":true,"data":[]}`

Si no funciona:
- Verifica que estés en la misma red WiFi
- Revisa el firewall de Windows
- Confirma que el servidor esté corriendo

## 🛡️ Configurar Firewall de Windows

Si el teléfono no puede conectarse, permite el puerto 3000:

```powershell
# Ejecutar como Administrador
New-NetFirewallRule -DisplayName "CashPro API" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

O manualmente:
1. Panel de Control → Sistema y Seguridad → Firewall de Windows
2. Configuración avanzada → Reglas de entrada
3. Nueva regla → Puerto → TCP → 3000
4. Permitir la conexión

## 📊 Formato de Números Implementado

Todas las cantidades ahora usan el formato correcto:

| Entrada | Salida |
|---------|--------|
| 1000 | $1,000.00 |
| 31000 | $31,000.00 |
| 100000 | $100,000.00 |
| 1500000 | $1,500,000.00 |

### Archivos Actualizados

- ✅ `apps/mobile/app/(tabs)/accounts.tsx` - Lista de cuentas
- ✅ `apps/mobile/app/(tabs)/index.tsx` - Dashboard
- ✅ `apps/mobile/app/add-account.tsx` - Agregar cuenta
- ✅ `apps/mobile/config/api.ts` - Configuración de API
- ✅ `apps/mobile/utils/format.ts` - Utilities de formato (nuevo)

## 🚀 Uso del Utility de Formato

### En cualquier componente:

```typescript
import { formatCurrency, formatNumber, formatCardNumber } from '@/utils/format';

// Formatear moneda
const balance = 1500000;
<Text>{formatCurrency(balance)}</Text> // "$1,500,000.00"

// Formatear número sin símbolo
<Text>{formatNumber(1000)}</Text> // "1,000"

// Formatear tarjeta mientras el usuario escribe
const [cardNumber, setCardNumber] = useState('');

const handleCardChange = (text: string) => {
  setCardNumber(formatCardNumber(text));
};

<TextInput
  value={cardNumber}
  onChangeText={handleCardChange}
  maxLength={19} // 16 dígitos + 3 espacios
/>
```

## 🔄 Cambios de IP

Si tu IP cambia (por ejemplo, al cambiar de red WiFi):

1. Obtén la nueva IP:
   ```bash
   ipconfig | findstr IPv4
   ```

2. Actualiza `apps/mobile/config/api.ts`:
   ```typescript
   const LOCAL_IP = 'TU_NUEVA_IP';
   ```

3. Reinicia la app móvil (Ctrl+C y `pnpm dev:mobile`)

## 📝 Notas Importantes

- **Desarrollo**: Usa IP local para Android, localhost para iOS
- **Producción**: Cambia a tu servidor real en `API_CONFIG.BASE_URL`
- **Seguridad**: En desarrollo, no hay autenticación. Agregar en producción.
- **Red**: Ambos dispositivos deben estar en la misma red WiFi

## 🐛 Troubleshooting

### Error: "Network request failed"

**Causa**: La app no puede conectarse al servidor

**Soluciones**:
1. Verifica que el backend esté corriendo
2. Confirma que estés en la misma red WiFi
3. Revisa la IP en `config/api.ts`
4. Prueba la URL en el navegador del teléfono
5. Revisa el firewall de Windows

### Error: "Connection refused"

**Causa**: El puerto 3000 está bloqueado

**Soluciones**:
1. Configura el firewall (ver arriba)
2. Verifica que no haya otro proceso usando el puerto 3000
3. Reinicia el servidor

### La app muestra datos viejos

**Solución**: Usa pull-to-refresh en la pantalla de cuentas

### Los números no se formatean

**Solución**: Asegúrate de importar y usar `formatCurrency` de `@/utils/format`

---

**Última actualización**: 18 de Febrero, 2026  
**Tu IP actual**: 192.168.1.6
