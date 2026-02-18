import { useState, useEffect } from 'react';
import { TextInput, TextInputProps, StyleSheet } from 'react-native';
import { formatCurrency, parseCurrency } from '@/utils/format';

interface CurrencyInputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  value: string;
  onChangeText: (value: string) => void;
  showSymbol?: boolean;
}

export function CurrencyInput({ 
  value, 
  onChangeText, 
  showSymbol = false,
  ...props 
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    if (value) {
      const numValue = parseFloat(value) || 0;
      const formatted = formatCurrency(numValue, showSymbol);
      setDisplayValue(formatted);
    } else {
      setDisplayValue('');
    }
  }, [value, showSymbol]);

  const handleChange = (text: string) => {
    // Remover todo excepto números y punto decimal
    const cleaned = text.replace(/[^0-9.]/g, '');
    
    // Evitar múltiples puntos decimales
    const parts = cleaned.split('.');
    const formatted = parts.length > 2 
      ? parts[0] + '.' + parts.slice(1).join('')
      : cleaned;
    
    onChangeText(formatted);
  };

  return (
    <TextInput
      {...props}
      value={displayValue}
      onChangeText={handleChange}
      keyboardType="decimal-pad"
    />
  );
}
