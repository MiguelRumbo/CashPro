# Configuración del Módulo de Cuentas

## Implementación Completada ✅

Se ha implementado la funcionalidad completa de gestión de cuentas con base de datos SQLite.

## Estructura Implementada

### Backend (API)

```
apps/api/
├── src/
│   ├── database/
│   │   └── db.js              # Configuración de SQLite
│   ├── routes/
│   │   └── accounts.js        # Rutas CRUD de cuentas
│   └── index.js               # Servidor Express
└── cashpro.db                 # Base de datos SQLite (se crea automáticamente)
```

### Frontend (Mobile)

```
apps/mobile/
├── app/
│   ├── (tabs)/
│   │   └── accounts.tsx       # Pantalla principal de cuentas
│   └── add-account.tsx        # Modal para agregar cuentas
└── config/
    └── api.ts                 # Configuración de API
```

## Esquema de Base de Datos

### Tabla: `accounts`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER | ID único (autoincremental) |
| name | TEXT | Nombre de la cuenta |
| type | TEXT | Tipo: 'cash', 'bank', 'debit', 'credit' |
| balance | REAL | Saldo disponible |
| currency | TEXT | Moneda (default: MXN) |
| icon | TEXT | Icono personalizado |
| color | TEXT | Color personalizado |
| clabe | TEXT | CLABE interbancaria (banco) |
| bank_name | TEXT | Nombre del banco |
| card_number | TEXT | Número completo de tarjeta (almacenado) |
| card_last_four | TEXT | Últimos 4 dígitos (para mostrar) |
| generates_interest | BOOLEAN | Si genera intereses |
| interest_rate | REAL | Tasa de interés (%) |
| credit_limit | REAL | Límite de crédito (tarjetas) |
| current_balance | REAL | Saldo actual/deuda (crédito) |
| cut_off_day | INTEGER | Día de corte (crédito) |
| payment_due_day | INTEGER | Día límite de pago (crédito) |
| is_primary | BOOLEAN | Cuenta principal |
| created_at | DATETIME | Fecha de creación |
| updated_at | DATETIME | Última actualización |

## API Endpoints

### GET `/api/accounts`
Obtiene todas las cuentas ordenadas por prioridad.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Efectivo",
      "type": "cash",
      "balance": 500.00,
      "currency": "MXN",
      ...
    }
  ]
}
```

### GET `/api/accounts/:id`
Obtiene una cuenta específica por ID.

### POST `/api/accounts`
Crea una nueva cuenta.

**Body (Efectivo):**
```json
{
  "name": "Mi Billetera",
  "type": "cash",
  "balance": 500.00
}
```

**Body (Banco):**
```json
{
  "name": "BBVA Ahorro",
  "type": "bank",
  "balance": 10000.00,
  "clabe": "012180001234567890",
  "bank_name": "BBVA",
  "generates_interest": 1,
  "interest_rate": 2.5
}
```

**Body (Débito):**
```json
{
  "name": "Santander Débito",
  "type": "debit",
  "balance": 5000.00,
  "card_number": "1234567890123456",
  "bank_name": "Santander",
  "generates_interest": 0
}
```

**Body (Crédito):**
```json
{
  "name": "Visa Oro",
  "type": "credit",
  "card_number": "1234567890123456",
  "bank_name": "BBVA",
  "credit_limit": 50000.00,
  "current_balance": 5000.00,
  "cut_off_day": 15,
  "payment_due_day": 20
}
```

### PUT `/api/accounts/:id`
Actualiza una cuenta existente.

### DELETE `/api/accounts/:id`
Elimina una cuenta.

### GET `/api/accounts/stats/total-balance`
Obtiene el balance total de todas las cuentas.

**Response:**
```json
{
  "success": true,
  "data": {
    "total_balance": 15000.00,
    "assets": 20000.00,
    "debts": 5000.00
  }
}
```

## Tipos de Cuenta

### 1. Efectivo (cash)
- **Campos requeridos**: name, balance
- **Uso**: Para dinero en efectivo, billetera física

### 2. Banco (bank)
- **Campos requeridos**: name, clabe, bank_name, balance
- **Campos opcionales**: generates_interest, interest_rate
- **Uso**: Cuentas bancarias de ahorro o cheques

### 3. Débito (debit)
- **Campos requeridos**: name, card_number, balance
- **Campos opcionales**: bank_name, generates_interest, interest_rate
- **Uso**: Tarjetas de débito
- **Nota**: Solo se muestran los últimos 4 dígitos

### 4. Crédito (credit)
- **Campos requeridos**: name, card_number, bank_name, credit_limit, current_balance, cut_off_day, payment_due_day
- **Uso**: Tarjetas de crédito
- **Nota**: current_balance representa la deuda actual

## Instrucciones de Uso

### 1. Iniciar el Backend

```bash
# Desde la raíz del proyecto
pnpm dev:api

# O directamente
cd apps/api
pnpm dev
```

El servidor se iniciará en `http://localhost:3000` y creará automáticamente la base de datos SQLite.

### 2. Iniciar la App Móvil

```bash
# Desde la raíz del proyecto
pnpm dev:mobile

# O directamente
cd apps/mobile
pnpm start
```

### 3. Usar la Aplicación

1. Abre la app en tu dispositivo/emulador
2. Ve a la pestaña "Cuentas"
3. Presiona "Agregar nueva cuenta"
4. Selecciona el tipo de cuenta
5. Llena los campos requeridos según el tipo
6. Presiona "Guardar"

### 4. Gestionar Cuentas

- **Ver cuentas**: La lista se actualiza automáticamente
- **Actualizar**: Desliza hacia abajo para refrescar (pull to refresh)
- **Eliminar**: Mantén presionada una cuenta y confirma la eliminación

## Características Implementadas

✅ CRUD completo de cuentas
✅ 4 tipos de cuenta (efectivo, banco, débito, crédito)
✅ Validaciones por tipo de cuenta
✅ Ocultamiento de números de tarjeta (solo últimos 4 dígitos)
✅ Cálculo de balance total
✅ Interfaz adaptativa según tipo de cuenta
✅ Pull to refresh
✅ Estado vacío cuando no hay cuentas
✅ Confirmación antes de eliminar
✅ Manejo de errores

## Seguridad

- Los números de tarjeta completos se almacenan en la BD local
- Solo se muestran los últimos 4 dígitos en la UI
- La base de datos es local (SQLite)
- No hay transmisión de datos sensibles por red (excepto localhost en desarrollo)

## Próximos Pasos

- [ ] Agregar edición de cuentas
- [ ] Implementar vista de detalle de cuenta
- [ ] Agregar iconos y colores personalizados
- [ ] Implementar transferencias entre cuentas
- [ ] Agregar gráficos de evolución de balance
- [ ] Implementar backup/restore de la base de datos
- [ ] Agregar cifrado a la base de datos (opcional)

## Troubleshooting

### Error: "No se pudo conectar con el servidor"

1. Verifica que el backend esté corriendo en `http://localhost:3000`
2. En Android, asegúrate de usar la IP correcta (no localhost)
3. Revisa que no haya firewall bloqueando el puerto 3000

### Error: "SQLITE_ERROR: no such table: accounts"

La tabla se crea automáticamente al iniciar el servidor. Si persiste:
1. Detén el servidor
2. Elimina el archivo `apps/api/cashpro.db`
3. Reinicia el servidor

### La app no muestra las cuentas

1. Verifica que el backend esté corriendo
2. Revisa la consola del backend para ver si hay errores
3. Usa pull to refresh en la app
4. Verifica la URL de la API en `apps/mobile/config/api.ts`

## Notas de Desarrollo

- La base de datos se crea en `apps/api/cashpro.db`
- Los logs del servidor muestran todas las queries SQL
- En desarrollo, la API está en `http://localhost:3000`
- La app móvil usa `__DEV__` para detectar modo desarrollo
