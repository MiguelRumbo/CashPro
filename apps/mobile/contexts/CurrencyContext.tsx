import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_CONFIG } from '@/config/api';

type CurrencyCode = 'MXN' | 'USD' | 'EUR';

type CurrencyContextType = {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  formatCurrency: (amount: number, showSymbol?: boolean) => string;
  isLoading: boolean;
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const CURRENCY_CONFIG = {
  MXN: { locale: 'es-MX', currency: 'MXN', symbol: '$' },
  USD: { locale: 'en-US', currency: 'USD', symbol: '$' },
  EUR: { locale: 'de-DE', currency: 'EUR', symbol: '€' },
};

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>('MXN');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCurrency();
  }, []);

  const loadCurrency = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/profile`);
      const result = await response.json();
      
      if (result.success && result.data?.currency) {
        setCurrencyState(result.data.currency as CurrencyCode);
      }
    } catch (error) {
      console.error('Error al cargar moneda:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setCurrency = async (newCurrency: CurrencyCode) => {
    setCurrencyState(newCurrency);
    
    // Guardar en el backend
    try {
      const profileResponse = await fetch(`${API_CONFIG.BASE_URL}/profile`);
      const profileResult = await profileResponse.json();
      
      if (profileResult.success && profileResult.data) {
        await fetch(`${API_CONFIG.BASE_URL}/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: profileResult.data.name,
            email: profileResult.data.email,
            currency: newCurrency,
          }),
        });
      }
    } catch (error) {
      console.error('Error al guardar moneda:', error);
    }
  };

  const formatCurrency = (amount: number, showSymbol: boolean = true): string => {
    const config = CURRENCY_CONFIG[currency];
    
    const formatted = new Intl.NumberFormat(config.locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

    return showSymbol ? `${config.symbol}${formatted}` : formatted;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatCurrency, isLoading }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
