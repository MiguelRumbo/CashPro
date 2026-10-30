import type { CurrencyCode, FrozenAppConfig } from '@/config/schema';

type CurrencyConfig = FrozenAppConfig['currency'];

/** Formatea un monto con el símbolo y la configuración regional de la moneda. */
export function formatMoney(
  amount: number,
  currency: CurrencyCode,
  config: CurrencyConfig,
  showSymbol = true,
): string {
  const format = config.formats[currency] ?? config.formats[config.default];
  const formatted = new Intl.NumberFormat(format?.locale, {
    minimumFractionDigits: config.fractionDigits,
    maximumFractionDigits: config.fractionDigits,
  }).format(amount);
  return showSymbol ? `${format?.symbol ?? ''}${formatted}` : formatted;
}
