import { ScrollView, View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { formatCurrency } from '@/utils/format';

export default function DashboardScreen() {
  const backgroundColor = useThemeColor({ light: '#f6f8f6', dark: '#112116' }, 'background');
  const surfaceColor = useThemeColor({ light: '#ffffff', dark: '#1a2c20' }, 'surface');
  const textMain = useThemeColor({ light: '#111713', dark: '#ffffff' }, 'text');
  const borderColor = useThemeColor({ light: '#f3f4f6', dark: '#374151' }, 'border');
  const textMuted = '#64748b';
  const primary = '#20df60';

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor }]}>
        <View>
          <ThemedText style={[styles.greeting, { color: textMuted }]}>Buenos días,</ThemedText>
          <ThemedText style={[styles.title, { color: textMain }]}>CashPro</ThemedText>
        </View>
        <TouchableOpacity style={styles.profileContainer}>
          <Image
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmKchyVrOr1KKQEzb8UGkEhD5OS2tcFCwgjBO2jX5tLuPQktpvrkgOSNtsd7J0IyZAEIaJ3rDYAxX5mVfttUj7OBBrO-h0Q2kYkdCvfVqV6qOeI26KhreoRI7FI4rCcQiexb7qf_oVxowxZ0MFyqp2ZhUikMtc5bhDaVDJ2RJOQ0SjvsXZD_B3XnVW1dBADZAFFOCgK7OeIfx4dONiV5oDWbA9yrGz0YnreW-9Ksur_Rx3x-J0G3PFgM0Jl1qoGpiin6Bc0Msd6QbY' }}
            style={[styles.profileImage, { borderColor: surfaceColor }]}
          />
          <View style={[styles.statusDot, { backgroundColor: primary, borderColor: backgroundColor }]} />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Grid: Balance + Income/Expense */}
        <View style={styles.cardsGrid}>
          {/* Balance Card (Full Width) */}
          <View style={[styles.balanceCard, { backgroundColor: surfaceColor }]}>
            {/* Decorative glow */}
            <View style={styles.balanceGlow} />
            <View style={styles.balanceContent}>
              <ThemedText style={[styles.cardLabel, { color: textMuted }]}>
                Balance Total
              </ThemedText>
              <ThemedText style={[styles.balanceAmount, { color: textMain }]}>
                {formatCurrency(2150.00)}
              </ThemedText>
              <View style={[styles.badge, { backgroundColor: 'rgba(32, 223, 96, 0.1)' }]}>
                <IconSymbol size={14} name="arrow.up.right" color={primary} />
                <ThemedText style={[styles.badgeText, { color: primary }]}>
                  +12.5% este mes
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Income & Expense Row */}
          <View style={styles.smallCardsRow}>
            {/* Income Card */}
            <View style={[styles.smallCard, { backgroundColor: surfaceColor, borderColor }]}>
              <View style={[styles.iconCircle, { backgroundColor: '#dcfce7' }]}>
                <IconSymbol size={18} name="arrow.down" color={primary} />
              </View>
              <View>
                <ThemedText style={[styles.smallCardLabel, { color: textMuted }]}>
                  Ingresos
                </ThemedText>
                <ThemedText style={[styles.smallCardAmount, { color: textMain }]}>
                  +{formatCurrency(3400)}
                </ThemedText>
              </View>
            </View>

            {/* Expense Card */}
            <View style={[styles.smallCard, { backgroundColor: surfaceColor, borderColor }]}>
              <View style={[styles.iconCircle, { backgroundColor: '#fef2f2' }]}>
                <IconSymbol size={18} name="arrow.up" color="#ef4444" />
              </View>
              <View>
                <ThemedText style={[styles.smallCardLabel, { color: textMuted }]}>
                  Gastos
                </ThemedText>
                <ThemedText style={[styles.smallCardAmount, { color: textMain }]}>
                  -{formatCurrency(1250)}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* Accounts Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={[styles.sectionTitle, { color: textMain }]}>
              Mis Cuentas
            </ThemedText>
            <TouchableOpacity>
              <ThemedText style={[styles.linkText, { color: primary }]}>Ver todo</ThemedText>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.accountsScroll}
          >
            {/* Bank Card (Dark) */}
            <View style={styles.accountCardDark}>
              {/* Decorative circle */}
              <View style={styles.accountCardGlow} />
              <View style={styles.accountCardHeader}>
                <IconSymbol size={22} name="building.columns.fill" color="rgba(255,255,255,0.8)" />
                <View style={styles.accountBadge}>
                  <ThemedText style={styles.accountBadgeText}>Principal</ThemedText>
                </View>
              </View>
              <View style={styles.accountCardFooter}>
                <ThemedText style={styles.accountNameLight}>BBVA Débito</ThemedText>
                <ThemedText style={styles.accountNumber}>**** 4821</ThemedText>
                <ThemedText style={styles.accountBalance}>{formatCurrency(1850.00)}</ThemedText>
              </View>
            </View>

            {/* Cash Card */}
            <View style={[styles.accountCard, { backgroundColor: surfaceColor, borderColor }]}>
              <View style={styles.accountCardHeader}>
                <IconSymbol size={22} name="banknote" color={primary} />
              </View>
              <View style={styles.accountCardFooter}>
                <ThemedText style={[styles.accountNameMuted, { color: textMuted }]}>
                  Efectivo
                </ThemedText>
                <ThemedText style={[styles.accountNumberDark, { color: textMain }]}>
                  Cartera
                </ThemedText>
                <ThemedText style={[styles.accountBalanceDark, { color: textMain }]}>
                  {formatCurrency(300.00)}
                </ThemedText>
              </View>
            </View>

            {/* Add New Card */}
            <TouchableOpacity style={[styles.addAccountCard, { borderColor: useThemeColor({ light: '#d1d5db', dark: '#374151' }, 'border') }]}>
              <View style={[styles.addAccountButton, { backgroundColor: surfaceColor }]}>
                <IconSymbol size={24} name="plus" color={primary} />
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Categories Section */}
        <View style={[styles.categoriesCard, { backgroundColor: surfaceColor, borderColor }]}>
          <View style={styles.sectionHeader}>
            <ThemedText style={[styles.sectionTitle, { color: textMain }]}>
              Gasto por Categoría
            </ThemedText>
            <TouchableOpacity style={[styles.moreButton, { backgroundColor: useThemeColor({ light: '#f9fafb', dark: 'rgba(255,255,255,0.05)' }, 'surface') }]}>
              <IconSymbol size={18} name="ellipsis" color={textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.categoriesList}>
            {/* Food */}
            <View style={styles.categoryItem}>
              <View style={styles.categoryRow}>
                <View style={styles.categoryInfo}>
                  <View style={[styles.categoryIcon, { backgroundColor: '#ffedd5' }]}>
                    <IconSymbol size={20} name="fork.knife" color="#f97316" />
                  </View>
                  <View>
                    <ThemedText style={[styles.categoryName, { color: textMain }]}>
                      Comida
                    </ThemedText>
                    <ThemedText style={[styles.categoryTransactions, { color: textMuted }]}>
                      12 transacciones
                    </ThemedText>
                  </View>
                </View>
                <ThemedText style={[styles.categoryAmount, { color: textMain }]}>
                  {formatCurrency(450.00)}
                </ThemedText>
              </View>
              <View style={[styles.progressBar, { backgroundColor: useThemeColor({ light: '#f3f4f6', dark: '#1f2937' }, 'surface') }]}>
                <View style={[styles.progressFill, { width: '65%', backgroundColor: '#fb923c' }]} />
              </View>
            </View>

            {/* Transport */}
            <View style={styles.categoryItem}>
              <View style={styles.categoryRow}>
                <View style={styles.categoryInfo}>
                  <View style={[styles.categoryIcon, { backgroundColor: '#dbeafe' }]}>
                    <IconSymbol size={20} name="car.fill" color="#3b82f6" />
                  </View>
                  <View>
                    <ThemedText style={[styles.categoryName, { color: textMain }]}>
                      Transporte
                    </ThemedText>
                    <ThemedText style={[styles.categoryTransactions, { color: textMuted }]}>
                      8 transacciones
                    </ThemedText>
                  </View>
                </View>
                <ThemedText style={[styles.categoryAmount, { color: textMain }]}>
                  {formatCurrency(150.00)}
                </ThemedText>
              </View>
              <View style={[styles.progressBar, { backgroundColor: useThemeColor({ light: '#f3f4f6', dark: '#1f2937' }, 'surface') }]}>
                <View style={[styles.progressFill, { width: '35%', backgroundColor: '#3b82f6' }]} />
              </View>
            </View>

            {/* Shopping */}
            <View style={styles.categoryItem}>
              <View style={styles.categoryRow}>
                <View style={styles.categoryInfo}>
                  <View style={[styles.categoryIcon, { backgroundColor: '#f3e8ff' }]}>
                    <IconSymbol size={20} name="bag.fill" color="#a855f7" />
                  </View>
                  <View>
                    <ThemedText style={[styles.categoryName, { color: textMain }]}>
                      Compras
                    </ThemedText>
                    <ThemedText style={[styles.categoryTransactions, { color: textMuted }]}>
                      3 transacciones
                    </ThemedText>
                  </View>
                </View>
                <ThemedText style={[styles.categoryAmount, { color: textMain }]}>
                  {formatCurrency(85.00)}
                </ThemedText>
              </View>
              <View style={[styles.progressBar, { backgroundColor: useThemeColor({ light: '#f3f4f6', dark: '#1f2937' }, 'surface') }]}>
                <View style={[styles.progressFill, { width: '15%', backgroundColor: '#a855f7' }]} />
              </View>
            </View>
          </View>
        </View>

        {/* Bottom spacer for FABs */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        {/* Expense FAB */}
        <TouchableOpacity style={[styles.fabSecondary, { backgroundColor: surfaceColor, borderColor }]}>
          <ThemedText style={[styles.fabSecondaryText, { color: textMain }]}>Nuevo Gasto</ThemedText>
          <View style={styles.fabSecondaryIcon}>
            <IconSymbol size={22} name="minus" color="#ef4444" />
          </View>
        </TouchableOpacity>

        {/* Income FAB */}
        <TouchableOpacity style={[styles.fabPrimary, { backgroundColor: primary }]}>
          <ThemedText style={styles.fabPrimaryText}>Nuevo Ingreso</ThemedText>
          <View style={styles.fabPrimaryIcon}>
            <IconSymbol size={24} name="plus" color="white" />
          </View>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 16,
    zIndex: 10,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '500',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  profileContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  // Scroll
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  // Cards Grid
  cardsGrid: {
    gap: 12,
    marginTop: 8,
  },
  // Balance Card
  balanceCard: {
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  balanceGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(32, 223, 96, 0.1)',
  },
  balanceContent: {
    zIndex: 1,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
    gap: 4,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Small Cards
  smallCardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  smallCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    height: 128,
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallCardLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  smallCardAmount: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  // Sections
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Account Cards
  accountsScroll: {
    gap: 12,
  },
  accountCardDark: {
    width: 160,
    height: 144,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  accountCardGlow: {
    position: 'absolute',
    top: -16,
    right: -16,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  accountCard: {
    width: 160,
    height: 144,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  accountCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  accountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  accountBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  accountCardFooter: {
    gap: 2,
  },
  accountNameLight: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: '500',
  },
  accountNumber: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  accountBalance: {
    color: 'white',
    fontSize: 18,
    fontWeight: '500',
    marginTop: 4,
  },
  accountNameMuted: {
    fontSize: 12,
    fontWeight: '500',
  },
  accountNumberDark: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  accountBalanceDark: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 4,
  },
  addAccountCard: {
    width: 80,
    height: 144,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(249, 250, 251, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAccountButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  // Categories
  categoriesCard: {
    marginTop: 24,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 2,
    borderWidth: 1,
  },
  moreButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesList: {
    gap: 20,
    marginTop: 16,
  },
  categoryItem: {
    gap: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryTransactions: {
    fontSize: 12,
    marginTop: 2,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  // FABs
  fabContainer: {
    position: 'absolute',
    bottom: 80,
    right: 24,
    gap: 12,
    alignItems: 'flex-end',
    zIndex: 20,
  },
  fabSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 8,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    gap: 8,
  },
  fabSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  fabSecondaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 4,
    paddingVertical: 4,
    borderRadius: 28,
    shadowColor: '#20df60',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    gap: 8,
  },
  fabPrimaryText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  fabPrimaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
