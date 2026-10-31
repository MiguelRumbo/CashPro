import { LayoutAnimation, StyleSheet, View } from 'react-native';

import type { AccountRecord } from '@/core/contracts/finance';

import { ACCOUNT_CARD_HEIGHT, AccountCardView } from './account-card-view';

/** Parte visible de cada tarjeta que queda detrás de la seleccionada. */
const STACK_OFFSET = 52;

export interface AccountStackViewProps {
  ordered: readonly AccountRecord[];
  selectedId: number | undefined;
  formatCurrency: (amount: number) => string;
  onSelect: (id: number) => void;
  onOpen: (id: number) => void;
  onLongPress: (account: AccountRecord) => void;
}

/**
 * Cartera de tarjetas apiladas (de la dirección C): la seleccionada queda al frente.
 * Tocar una tarjeta de atrás la trae al frente; tocar la del frente abre su detalle.
 */
export function AccountStackView({
  ordered,
  selectedId,
  formatCurrency,
  onSelect,
  onOpen,
  onLongPress,
}: AccountStackViewProps) {
  const height = ACCOUNT_CARD_HEIGHT + Math.max(0, ordered.length - 1) * STACK_OFFSET;
  return (
    <View style={[styles.stack, { height }]}>
      {ordered.map((account, index) => (
        <View key={account.id} style={[styles.slot, { top: index * STACK_OFFSET }]}>
          <AccountCardView
            account={account}
            formatCurrency={formatCurrency}
            onLongPress={() => onLongPress(account)}
            onPress={() => {
              if (account.id === selectedId) return onOpen(account.id);
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              onSelect(account.id);
            }}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { position: 'relative' },
  slot: { position: 'absolute', left: 0, right: 0 },
});
