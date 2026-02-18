/**
 * Formatea un número como moneda mexicana
 * @param amount - Cantidad a formatear
 * @param showSymbol - Si debe mostrar el símbolo de peso (default: true)
 * @returns String formateado (ej: $1,000.00)
 */
export const formatCurrency = (amount: number, showSymbol: boolean = true): string => {
  const formatted = new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return showSymbol ? `$${formatted}` : formatted;
};

/**
 * Formatea un número con separadores de miles
 * @param value - Número a formatear
 * @returns String formateado (ej: 1,000)
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('es-MX').format(value);
};

/**
 * Parsea un string formateado a número
 * @param value - String con formato (ej: "1,000.00" o "$1,000.00")
 * @returns Número parseado
 */
export const parseCurrency = (value: string): number => {
  const cleaned = value.replace(/[$,]/g, '');
  return parseFloat(cleaned) || 0;
};

/**
 * Formatea un número de tarjeta con espacios
 * @param cardNumber - Número de tarjeta
 * @returns String formateado (ej: "1234 5678 9012 3456")
 */
export const formatCardNumber = (cardNumber: string): string => {
  const cleaned = cardNumber.replace(/\D/g, '');
  const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
  return formatted;
};

/**
 * Oculta un número de tarjeta excepto los últimos 4 dígitos
 * @param cardNumber - Número de tarjeta completo
 * @returns String con formato "•••• 1234"
 */
export const maskCardNumber = (cardNumber: string): string => {
  const cleaned = cardNumber.replace(/\D/g, '');
  if (cleaned.length < 4) return cardNumber;
  const lastFour = cleaned.slice(-4);
  return `•••• ${lastFour}`;
};

/**
 * Formatea un porcentaje
 * @param value - Valor del porcentaje
 * @param decimals - Número de decimales (default: 2)
 * @returns String formateado (ej: "2.50%")
 */
export const formatPercentage = (value: number, decimals: number = 2): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Formatea un input de moneda mientras el usuario escribe
 * @param value - Valor actual del input
 * @returns String formateado para mostrar
 */
export const formatCurrencyInput = (value: string): string => {
  // Remover todo excepto números y punto decimal
  const cleaned = value.replace(/[^0-9.]/g, '');
  
  // Evitar múltiples puntos decimales
  const parts = cleaned.split('.');
  const integerPart = parts[0];
  const decimalPart = parts.length > 1 ? '.' + parts[1].slice(0, 2) : '';
  
  // Formatear la parte entera con separadores de miles
  const formatted = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return formatted + decimalPart;
};

/**
 * Obtiene el valor numérico de un input formateado
 * @param value - String con formato
 * @returns Número sin formato
 */
export const getNumericValue = (value: string): number => {
  const cleaned = value.replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
};
