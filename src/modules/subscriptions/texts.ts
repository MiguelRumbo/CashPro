export const subscriptionsTexts = {
  menuTitle: 'Suscripciones y Pagos',
  menuSubtitle: 'Pagos recurrentes y suscripciones',
  errors: {
    missingFields: 'Faltan campos requeridos',
    amountMustBePositive: 'El monto debe ser mayor a 0',
    notFound: 'Pago recurrente no encontrado',
    ledgerUnavailable: 'Se requiere el módulo de movimientos para registrar el pago',
  },
  messages: {
    deleted: 'Pago recurrente eliminado correctamente',
  },
  categoryNames: {
    subscription: 'Suscripción',
    salary: 'Salario',
    recurring_expense: 'Gasto Recurrente',
    recurring_income: 'Ingreso Recurrente',
    fallback: 'Recurrente',
  },
  movementNotes: (name: string) => `Pago recurrente: ${name}`,
} as const;
