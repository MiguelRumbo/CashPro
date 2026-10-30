/** Separa un número de tarjeta en grupos de 4 dígitos. */
export function formatCardNumber(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\D/g, '');
  return cleaned.match(/.{1,4}/g)?.join(' ') ?? cleaned;
}

/** Muestra solo los últimos 4 dígitos: "•••• 1234". */
export function maskCardNumber(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\D/g, '');
  if (cleaned.length < 4) return cardNumber;
  return `•••• ${cleaned.slice(-4)}`;
}

/** Formatea un input de monto mientras se escribe: separadores de miles y máximo 2 decimales. */
export function formatCurrencyInput(value: string): string {
  const cleaned = value.replace(/[^0-9.]/g, '');
  const [integerPart = '', ...rest] = cleaned.split('.');
  const decimalPart = rest.length > 0 ? `.${(rest[0] ?? '').slice(0, 2)}` : '';
  return integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + decimalPart;
}

/** Valor numérico de un input formateado (0 si no es válido). */
export function getNumericValue(value: string): number {
  return parseFloat(value.replace(/[^0-9.]/g, '')) || 0;
}
