import { Pressable, StyleSheet, View } from 'react-native';

import type { AccountRecord } from '@/core/contracts/finance';
import { accountCardColors, radii, spacing } from '@/core/ui-kit/theme';
import { useAppTheme } from '@/core/ui-kit/theme-context';
import { ThemedText } from '@/core/ui-kit/themed-text';

import { cardAmount } from '../domain/card-stack';
import { accountsTexts } from '../texts';

export const ACCOUNT_CARD_HEIGHT = 156;

export interface AccountCardViewProps {
  account: AccountRecord;
  formatCurrency: (amount: number) => string;
  onPress: () => void;
  onLongPress: () => void;
}

/** Tarjeta de cuenta estilo tarjeta bancaria (componente tonto). */
export function AccountCardView({ account, formatCurrency, onPress, onLongPress }: AccountCardViewProps) {
  const theme = useAppTheme();
  const { list, typeLabels } = accountsTexts;
  const [dark, light] = accountCardColors[account.type];
  const outlined = theme.accountCards === 'outlined';
  const ink = outlined ? theme.palette.ink : theme.palette.white;
  const sub = outlined ? theme.palette.muted : 'rgba(255,255,255,0.8)';
  const { amount, debt } = cardAmount(account);
  const right =
    account.is_primary === 1 ? list.primary : account.cut_off_day ? list.cutOff(account.cut_off_day) : '';

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={`${account.name}, ${typeLabels[account.type]}, ${formatCurrency(amount)}`}
      style={[
        styles.card,
        outlined
          ? {
              backgroundColor: theme.palette.surface,
              borderColor: theme.palette.line,
              borderLeftColor: light,
            }
          : {
              backgroundColor: dark,
              experimental_backgroundImage: `linear-gradient(135deg, ${dark}, ${light})`,
            },
        outlined && styles.outlined,
      ]}
    >
      <View style={styles.top}>
        <ThemedText style={[styles.name, { color: ink }]} numberOfLines={1}>
          {account.bank_name ? `${account.bank_name} · ${typeLabels[account.type]}` : account.name}
        </ThemedText>
        {right !== '' && <ThemedText style={[styles.badge, { color: sub }]}>{right}</ThemedText>}
      </View>
      <View>
        <ThemedText style={[styles.label, { color: sub }]}>
          {account.type === 'credit' ? list.available : list.balance}
        </ThemedText>
        <ThemedText style={[styles.amount, { color: ink }]}>{formatCurrency(amount)}</ThemedText>
      </View>
      <View style={styles.meta}>
        <ThemedText style={[styles.metaText, { color: sub }]}>
          {account.card_last_four ? `•••• ${account.card_last_four}` : account.name}
        </ThemedText>
        {debt !== null && (
          <ThemedText style={[styles.metaText, { color: sub }]}>
            {list.debt} {formatCurrency(debt)}
          </ThemedText>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    height: ACCOUNT_CARD_HEIGHT,
    borderRadius: radii.lg,
    padding: spacing.lg,
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  outlined: { borderWidth: 1, borderLeftWidth: 6, elevation: 2, shadowOpacity: 0.06 },
  top: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  name: { fontSize: 14, fontWeight: '700', flexShrink: 1 },
  badge: { fontSize: 12, fontWeight: '600' },
  label: { fontSize: 11, fontWeight: '600' },
  amount: { fontSize: 26, fontWeight: '700', letterSpacing: -0.5 },
  meta: { flexDirection: 'row', justifyContent: 'space-between' },
  metaText: { fontSize: 12, fontWeight: '500', letterSpacing: 1 },
});
