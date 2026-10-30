export const vehiclesTexts = {
  menuTitle: 'Vehículos',
  menuSubtitle: 'Gasolina y mantenimiento',
  errors: {
    missingFields: 'Faltan campos requeridos',
    notFound: 'Vehículo no encontrado',
    accountNotFound: 'Cuenta no encontrada',
    fuelLoadNotFound: 'Carga de gasolina no encontrada',
    ledgerUnavailable: 'Se requieren los módulos de cuentas y movimientos para registrar gastos del vehículo',
  },
  messages: {
    deleted: 'Vehículo eliminado',
  },
  fuelMovement: {
    categoryName: 'Transporte',
    categoryIcon: 'car',
    categoryColor: '#3b82f6',
    title: (vehicle: string) => `Gasolina - ${vehicle}`,
  },
  maintenanceMovement: {
    categoryName: 'Transporte',
    categoryIcon: 'wrench',
    categoryColor: '#f59e0b',
    typeLabels: {
      oil_change: 'Cambio de Aceite',
      tires: 'Llantas',
      brakes: 'Frenos',
      service: 'Servicio',
      repair: 'Reparación',
      other: 'Mantenimiento',
    } as Record<string, string>,
    fallbackLabel: 'Mantenimiento',
  },
} as const;
