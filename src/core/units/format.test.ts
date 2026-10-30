import { formatCardNumber, formatCurrencyInput, getNumericValue, maskCardNumber } from './format';

describe('format', () => {
  it('formatCardNumber agrupa de 4 en 4', () => {
    expect(formatCardNumber('1234567890123456')).toBe('1234 5678 9012 3456');
    expect(formatCardNumber('12-34')).toBe('1234');
  });

  it('maskCardNumber deja solo los últimos 4', () => {
    expect(maskCardNumber('1234 5678 9012 3456')).toBe('•••• 3456');
    expect(maskCardNumber('12')).toBe('12');
  });

  it('formatCurrencyInput agrega miles y recorta decimales', () => {
    expect(formatCurrencyInput('1234567.891')).toBe('1,234,567.89');
    expect(formatCurrencyInput('$12a3.')).toBe('123.');
    expect(formatCurrencyInput('')).toBe('');
  });

  it('getNumericValue limpia el formato', () => {
    expect(getNumericValue('1,234.50')).toBe(1234.5);
    expect(getNumericValue('abc')).toBe(0);
  });
});
