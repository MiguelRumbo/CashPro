import { router } from 'expo-router';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AccountRecord, MovementWithAccount } from '@/core/contracts/finance';
import { useCurrency } from '@/core/preferences/use-currency';
import { IconSymbol, type IconSymbolName } from '@/core/ui-kit/icon-symbol';
import { radii, spacing } from '@/core/ui-kit/theme';
import { usePalette } from '@/core/ui-kit/theme-context';
import { ThemedText } from '@/core/ui-kit/themed-text';
import { ThemedView } from '@/core/ui-kit/themed-view';

import { accountsTexts } from '../texts';
import { AccountStackView } from './account-stack-view';
import { useAccountsList } from './use-accounts-list';

/** Pantalla de cuentas: patrimonio, cartera de tarjetas apiladas y movimientos de la seleccionada. */
export function AccountsListScreen() {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  const { formatCurrency } = useCurrency();
  const { accounts, ordered, selected, stats, recent, failed, select, remove } = useAccountsList();
  const { list } = accountsTexts;

  const confirmDelete = (account: AccountRecord) =>
    Alert.alert(list.deleteTitle, list.deleteBody(account.name), [
      { text: list.cancel, style: 'cancel' },
      {
        text: list.delete,
        style: 'destructive',
        onPress: () => {
          const result = remove(account.id);
          if (!result.success) Alert.alert(list.errorTitle, result.error);
        },
      },
    ]);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}>
        <View style={styles.header}>
          <ThemedText style={[styles.title, { color: palette.ink }]} accessibilityRole="header">
            {list.title}
          </ThemedText>
          <TouchableOpacity
            onPress={() => router.push('/accounts/add-account')}
            accessibilityRole="button"
            accessibilityLabel={list.add}
            style={[styles.addIcon, { backgroundColor: palette.chip }]}
          >
            <IconSymbol name="plus" size={22} color={palette.accent} />
          </TouchableOpacity>
        </View>

        <View>
          <ThemedText style={[styles.label, { color: palette.muted }]}>
            {list.totalLabel} · {list.accountsCount(accounts.length)}
          </ThemedText>
          <ThemedText style={[styles.total, { color: palette.ink }]}>
            {formatCurrency(stats?.total_balance ?? 0)}
          </ThemedText>
        </View>

        {failed && <ThemedText style={{ color: palette.negative }}>{list.loadError}</ThemedText>}

        {accounts.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: palette.surface, borderColor: palette.line }]}>
            <IconSymbol name="creditcard.fill" size={36} color={palette.accent} />
            <ThemedText style={[styles.emptyTitle, { color: palette.ink }]}>{list.emptyTitle}</ThemedText>
            <ThemedText style={[styles.emptyBody, { color: palette.muted }]}>{list.emptyBody}</ThemedText>
            <TouchableOpacity
              onPress={() => router.push('/accounts/add-account')}
              accessibilityRole="button"
              style={[styles.primaryButton, { backgroundColor: palette.accent }]}
            >
              <ThemedText style={[styles.primaryButtonText, { color: palette.onAccent }]}>
                {list.add}
              </ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <AccountStackView
              ordered={ordered}
              selectedId={selected?.id}
              formatCurrency={formatCurrency}
              onSelect={select}
              onOpen={(id) => router.push(`/accounts/account-detail?id=${id}`)}
              onLongPress={confirmDelete}
            />
            <ThemedText style={[styles.hint, { color: palette.muted }]}>{list.hint}</ThemedText>
          </>
        )}

        {selected && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={[styles.sectionTitle, { color: palette.ink }]} numberOfLines={1}>
                {list.recent(selected.name)}
              </ThemedText>
              <TouchableOpacity
                onPress={() => router.push(`/accounts/account-detail?id=${selected.id}`)}
                accessibilityRole="link"
              >
                <ThemedText style={[styles.link, { color: palette.accent }]}>{list.viewDetail}</ThemedText>
              </TouchableOpacity>
            </View>
            <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.line }]}>
              {recent.length === 0 ? (
                <ThemedText style={[styles.emptyBody, { color: palette.muted }]}>
                  {list.noMovements}
                </ThemedText>
              ) : (
                recent.map((movement, index) => (
                  <MovementRow
                    key={movement.id}
                    movement={movement}
                    accountId={selected.id}
                    isFirst={index === 0}
                    formatCurrency={formatCurrency}
                  />
                ))
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

function MovementRow({
  movement,
  accountId,
  isFirst,
  formatCurrency,
}: {
  movement: MovementWithAccount;
  accountId: number;
  isFirst: boolean;
  formatCurrency: (amount: number) => string;
}) {
  const palette = usePalette();
  // Una transferencia que llega a esta cuenta es entrada de dinero.
  const incoming =
    movement.type === 'income' || (movement.type === 'transfer' && movement.to_account_id === accountId);
  const color = movement.category_color ?? palette.muted;
  return (
    <TouchableOpacity
      onPress={() => router.push(`/movements/movement-detail?id=${movement.id}`)}
      accessibilityRole="button"
      style={[styles.row, !isFirst && { borderTopWidth: 1, borderTopColor: palette.line }]}
    >
      <View style={[styles.rowIcon, { backgroundColor: `${color}26` }]}>
        <IconSymbol
          name={(movement.category_icon ?? 'arrow.left.arrow.right') as IconSymbolName}
          size={16}
          color={color}
        />
      </View>
      <View style={styles.rowText}>
        <ThemedText style={[styles.rowTitle, { color: palette.ink }]} numberOfLines={1}>
          {movement.title ?? movement.category_name ?? ''}
        </ThemedText>
        <ThemedText style={[styles.rowSub, { color: palette.muted }]}>
          {new Date(movement.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
        </ThemedText>
      </View>
      <ThemedText style={[styles.rowAmount, { color: incoming ? palette.positive : palette.negative }]}>
        {incoming ? '+' : '−'}
        {formatCurrency(movement.amount)}
      </ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 120, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  addIcon: { width: 44, height: 44, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 13, fontWeight: '600' },
  total: { fontSize: 34, fontWeight: '700', letterSpacing: -1 },
  hint: { fontSize: 12, textAlign: 'center' },
  empty: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptyBody: { fontSize: 13, textAlign: 'center' },
  primaryButton: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
  },
  primaryButtonText: { fontSize: 15, fontWeight: '700' },
  section: { gap: spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', flexShrink: 1 },
  link: { fontSize: 13, fontWeight: '700' },
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  rowIcon: { width: 36, height: 36, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '600' },
  rowSub: { fontSize: 12 },
  rowAmount: { fontSize: 14, fontWeight: '700' },
});
