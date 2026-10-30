export const alertsTexts = {
  creditCutoff: {
    titleSoon: 'Fecha de corte próxima',
    titleToday: 'Fecha de corte hoy',
    message: (account: string, days: number, debt: string) =>
      `Tu tarjeta ${account} ${days === 0 ? 'tiene fecha de corte hoy' : `tiene fecha de corte en ${days} días`}. Deuda actual: ${debt}`,
  },
  creditPayment: {
    title: (days: number) => (days === 0 ? 'Pago vence hoy' : `Pago vence en ${days} días`),
    message: (account: string, days: number, amount: string) =>
      `${days === 0 ? 'Hoy vence' : `Tu pago de ${account} vence en ${days} días`}. Monto: ${amount}`,
  },
  budgetExceeded: {
    title: 'Presupuesto excedido',
    message: (budget: string, over: string) => `Excediste tu presupuesto de ${budget} por ${over}`,
  },
  budgetWarning: {
    title: (percent: number) => `Presupuesto al ${percent}%`,
    message: (budget: string, percent: string, left: string) =>
      `Tu presupuesto de ${budget} va al ${percent}%. Quedan ${left} del límite`,
  },
  loanDue: {
    title: 'Préstamo por vencer',
    message: (person: string, days: number, pending: string) =>
      `El préstamo a ${person} vence en ${days} días. Monto pendiente: ${pending}`,
  },
  subscriptionDue: {
    title: (days: number) => (days === 1 ? 'Suscripción mañana' : days === 0 ? 'Suscripción hoy' : `Suscripción en ${days} días`),
    message: (name: string, days: number, amount: string) =>
      `Tu suscripción de ${name} se cobra ${days === 1 ? 'mañana' : days === 0 ? 'hoy' : `en ${days} días`}: ${amount}`,
  },
  goalBehind: {
    title: 'Objetivo de ahorro atrasado',
    message: (goal: string, monthly: string) =>
      `Para cumplir tu meta ${goal} a tiempo, necesitas ahorrar ${monthly} este mes`,
  },
} as const;
