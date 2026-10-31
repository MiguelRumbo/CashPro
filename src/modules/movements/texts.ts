export const movementsTexts = {
  tabTitle: 'Movimientos',
  fabTitle: 'Nuevo movimiento',
  errors: {
    typeAndAmountRequired: 'El tipo y monto son requeridos',
    invalidType: 'Tipo de movimiento inválido',
    categoryRequired: 'La categoría es requerida para gastos e ingresos',
    accountRequired: 'La cuenta es requerida',
    toAccountRequired: 'La cuenta destino es requerida para transferencias',
    accountNotFound: 'Cuenta no encontrada',
    toAccountNotFound: 'Cuenta destino no encontrada',
    notFound: 'Movimiento no encontrado',
    nothingToUpdate: 'No hay campos para actualizar',
    nothingToExport: 'No hay movimientos para exportar',
  },
  messages: {
    created: 'Movimiento creado exitosamente',
    updated: 'Movimiento actualizado exitosamente',
    deleted: 'Movimiento eliminado exitosamente',
  },
  csv: {
    header: 'Fecha,Tipo,Título,Categoría,Monto,Cuenta,Notas',
    typeLabels: { expense: 'Gasto', income: 'Ingreso', transfer: 'Transferencia' },
  },
} as const;
