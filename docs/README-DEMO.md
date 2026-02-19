# Datos de Demostración - CashPro

Este script carga datos de demostración en la aplicación para mostrar todas las funcionalidades.

## 📊 Datos Incluidos

El script carga los siguientes datos de ejemplo:

### Cuentas (4)
- **BBVA Débito**: $15,420.50 (Cuenta principal)
- **Mercado Pago**: $3,250.75
- **Tarjeta Banamex**: Crédito con $5,420.30 de deuda (límite $30,000)
- **Efectivo**: $1,850.00

### Movimientos (7)
- 2 ingresos (salario y freelance)
- 4 gastos (supermercado, gasolina, suscripciones, restaurante)
- 1 transferencia

### Presupuestos (3)
- Comida y Restaurantes: $3,000/mes (39% usado)
- Transporte: $1,500/mes (30% usado)
- Entretenimiento: $2,000/mes (60% usado)

### Objetivos de Ahorro (3)
- **Vacaciones en Cancún**: $25,000 meta, $8,500 ahorrado (34%)
- **Fondo de Emergencia**: $50,000 meta, $15,000 ahorrado (30%)
- **Nueva Laptop**: ✅ Completado ($15,000)

### Contribuciones (5)
- 3 contribuciones a Vacaciones
- 2 contribuciones a Fondo de Emergencia

### Préstamos (3)
- **Carlos Pérez**: $5,000 prestado, $2,500 pendiente (parcial)
- **María González**: $3,000 prestado, $3,000 pendiente (activo)
- **Juan Martínez**: ✅ Pagado ($2,000)

### Pagos de Préstamos (3)
- 2 pagos de Carlos Pérez
- 1 pago completo de Juan Martínez

## 🚀 Cómo Usar

### Opción 1: Usando npm script (Recomendado)

```bash
cd apps/api
npm run seed
```

### Opción 2: Ejecutar directamente

```bash
cd apps/api
node seed-demo-data.js
```

### Opción 3: Desde la raíz del proyecto

```bash
node apps/api/seed-demo-data.js
```

## ⚠️ Importante

- **Este script SOBRESCRIBE todos los datos existentes**
- Asegúrate de hacer un respaldo si tienes datos importantes
- Después de ejecutar el script, reinicia la aplicación móvil para ver los cambios

## 🔄 Restaurar Datos Limpios

Si quieres volver a empezar desde cero, usa la función "Eliminar Todos los Datos" en la app:

1. Abre la aplicación móvil
2. Ve a **Ajustes** (última pestaña)
3. Desplázate hasta el final
4. Toca **"Eliminar Todos los Datos"**
5. Confirma la acción

## 📝 Personalizar Datos

Puedes editar el archivo `seed-demo-data.js` para personalizar los datos de demostración:

- Modifica los montos, nombres, fechas, etc.
- Agrega o elimina registros
- Cambia las categorías y colores

## 🎯 Casos de Uso

Este conjunto de datos es ideal para:

- **Demos y presentaciones**: Muestra todas las funcionalidades de la app
- **Testing**: Prueba diferentes escenarios sin crear datos manualmente
- **Desarrollo**: Trabaja con datos realistas durante el desarrollo
- **Capturas de pantalla**: Genera imágenes para documentación o marketing

## 💡 Tips

- Los datos están fechados en enero-febrero 2026
- Los presupuestos están configurados para el mes actual
- Los objetivos tienen fechas límite futuras
- Los préstamos tienen diferentes estados (activo, parcial, pagado)

## 🐛 Solución de Problemas

Si el script no funciona:

1. Verifica que estés en el directorio correcto (`apps/api`)
2. Asegúrate de que el servidor NO esté corriendo
3. Verifica que tengas permisos de escritura en el directorio
4. Revisa que el archivo `data.json` exista (se creará si no existe)

## 📞 Soporte

Si encuentras algún problema, revisa:
- Los logs en la consola
- El archivo `data.json` para verificar que se escribió correctamente
- Reinicia el servidor de la API después de cargar los datos
