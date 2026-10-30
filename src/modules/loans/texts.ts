export const loansTexts = {
  menuTitle: 'Préstamos',
  menuSubtitle: 'Dinero prestado y por cobrar',
  errors: {
    missingFields: 'Faltan campos requeridos',
    amountMustBePositive: 'El monto debe ser mayor a 0',
    notFound: 'Préstamo no encontrado',
    paymentMissingFields: 'Faltan campos requeridos: amount, date',
    paymentExceedsRemaining: 'El monto del pago no puede ser mayor al monto pendiente',
    ledgerUnavailable: 'Se requiere el módulo de movimientos para registrar el movimiento',
  },
  messages: {
    deleted: 'Préstamo eliminado correctamente',
  },
  movement: {
    categoryName: 'Préstamo',
    categoryIcon: 'banknote',
    lentColor: '#f59e0b',
    paymentColor: '#10b981',
    lentTitle: (person: string) => `Préstamo a ${person}`,
    lentNotes: (person: string) => `Préstamo registrado a ${person}`,
    paymentTitle: (person: string) => `Pago de préstamo - ${person}`,
    paymentNotes: (person: string) => `Pago recibido de ${person}`,
  },
} as const;
