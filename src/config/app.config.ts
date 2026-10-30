import { buildConfig, type FrozenAppConfig } from './schema';

/**
 * Único punto de parametrización de CashPro.
 * Cada valor nuevo: tipo en schema.ts + valor aquí + fila en docs/architecture.md.
 */
export const rawAppConfig = {
  app: { name: 'CashPro', locale: 'es-MX' },
  modules: {
    dashboard: { enabled: true },
    movements: { enabled: true },
    reports: { enabled: true },
    accounts: { enabled: true },
    budgets: { enabled: true },
    savingsGoals: { enabled: true },
    loans: { enabled: true },
    subscriptions: { enabled: true },
    vehicles: { enabled: true },
    alerts: { enabled: true },
    settings: { enabled: true },
    security: { enabled: true },
  },
  // Nombre del archivo SQLite. NO cambiar: los datos de v1 viven en este archivo.
  db: {
    fileName: 'cashpro.db',
    keyStorageKey: 'cashpro.db.key', // entrada de expo-secure-store con la llave SQLCipher
  },
  logger: { devMinLevel: 'debug', prodMinLevel: 'warn' },
  currency: {
    default: 'MXN',
    formats: {
      MXN: { locale: 'es-MX', symbol: '$' },
      USD: { locale: 'en-US', symbol: '$' },
      EUR: { locale: 'de-DE', symbol: '€' },
    },
    fractionDigits: 2, // dígitos decimales mostrados
  },
  accounts: {
    cardLastDigits: 4, // dígitos de tarjeta que se guardan (nunca el número completo)
  },
  budgets: {
    defaults: {
      savingIcon: 'arrow.up.circle.fill',
      savingColor: '#20df60',
      expenseIcon: 'arrow.down.circle.fill',
      expenseColor: '#ef4444',
    },
  },
  savingsGoals: {
    defaults: { icon: 'target', color: '#20df60' },
  },
  subscriptions: {
    // multiplicador para convertir el monto de cada frecuencia a monto mensual
    monthlyFactor: { weekly: 4.33, biweekly: 2, monthly: 1, yearly: 1 / 12 },
    upcomingWindowDays: 7, // días: ventana de "próximos pagos" en el dashboard
    defaults: { icon: 'creditcard', color: '#6b7280', notifyBeforeDays: 1 },
  },
  alerts: {
    creditCutoffDaysBefore: [3, 0], // días antes del corte en que se avisa
    creditPaymentDaysBefore: [5, 3, 0], // días antes de la fecha límite de pago
    budgetWarningPercent: 80, // % del presupuesto que dispara advertencia
    budgetExceededPercent: 100, // % que se considera excedido
    loanDueWithinDays: 7, // días: préstamos por vencer dentro de esta ventana
    subscriptionDueDaysBefore: [1, 0], // días antes del cobro de una suscripción
    goalDaysPerMonth: 30, // días: aproximación de un mes para metas de ahorro
    goalBehindRatio: 0.5, // fracción del restante por mes que marca la meta como atrasada
  },
  security: {
    lockOnBackgroundMs: 0, // ms en segundo plano antes de volver a pedir autenticación (0 = siempre)
    preventScreenshots: true, // FLAG_SECURE: oculta la app en capturas y en recientes
  },
  ui: {
    splashFadeMs: 250, // ms
    primaryColor: '#20df60',
  },
} as const;

export const appConfig: FrozenAppConfig = buildConfig(rawAppConfig);
