export const savingsGoalsTexts = {
  menuTitle: 'Objetivos de Ahorro',
  menuSubtitle: 'Metas de ahorro con seguimiento',
  errors: {
    nameAndTargetRequired: 'El nombre y monto objetivo son requeridos',
    targetMustBePositive: 'El monto objetivo debe ser mayor a 0',
    notFound: 'Objetivo no encontrado',
    amountMustBePositive: 'El monto debe ser mayor a 0',
    accountRequired: 'La cuenta es requerida',
    accountNotFound: 'Cuenta no encontrada',
    insufficientFunds: 'Saldo insuficiente en la cuenta',
    ledgerUnavailable: 'Se requieren los módulos de cuentas y movimientos para registrar contribuciones',
  },
  messages: {
    created: 'Objetivo creado exitosamente',
    updated: 'Objetivo actualizado exitosamente',
    deleted: 'Objetivo eliminado exitosamente',
    contributionAdded: 'Contribución agregada exitosamente',
  },
  contributionMovement: {
    categoryName: 'Ahorro',
    categoryIcon: 'target',
    categoryColor: '#10b981',
    title: (goal: string) => `Contribución a ${goal}`,
    notes: (goal: string) => `Contribución al objetivo: ${goal}`,
  },
} as const;
