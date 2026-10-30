import { useMemo } from 'react';

import type { CurrencyCode } from '@/config/schema';

import { useCore, usePreferences } from '../registry/react';
import { formatMoney } from '../units/money';

/** Moneda preferida y formateador (reemplaza al CurrencyContext de v1). */
export function useCurrency() {
  const { currency } = usePreferences();
  const { config, preferences } = useCore();
  return useMemo(
    () => ({
      currency,
      setCurrency: (next: CurrencyCode) => preferences.set({ currency: next }),
      formatCurrency: (amount: number, showSymbol = true) =>
        formatMoney(amount, currency, config.currency, showSymbol),
    }),
    [currency, config, preferences],
  );
}
