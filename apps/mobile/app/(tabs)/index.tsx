import { ScrollView, View, StyleSheet, TouchableOpacity, Image, RefreshControl, Alert } from 'react-native';
import { useState, useCallback } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { formatCurrency } from '@/utils/format';
import { API_CONFIG } from '@/config/api';

type Account = {
  id: number;
  name: string;
  type: string;
  balance: number;
  card_last_four?: string;
  bank_name?: string;
  credit_limit?: number;
  current_balance?: number;
};

type CategoryStat = {
  category_name: string;
  category_icon: string;
  category_color: string;
  total: number;
  count: number;
};

export default function DashboardScreen() {
  const [totalBalance, setTotalBalance] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const backgroundColor = useThemeColor({ light: '#f6f8f6', dark: '#112116' }, 'background');
  const surfaceColor = useThemeColor({ light: '#ffffff', dark: '#1a2c20' }, 'surface');
  const textMain = useThemeColor({ light: '#111713', dark: '#ffffff' }, 'text');
  const borderColor = useThemeColor({ light: '#f3f4f6', dark: '#374151' }, 'border');
  const textMuted = '#64748b';
  const primary = '#20df60';
  const progressBarBg = useThemeColor({ light: '#f3f4f6', dark: '#1f2937' }, 'surface');
  const addAccountBorderColor = useThemeColor({ light: '#d1d5db', dark: '#374151' }, 'border');

  const fetchData = async () => {
    try {
      // Obtener balance total
      const balanceResponse = await fetch(`${API_CONFIG.BASE_URL}/accounts/stats/total-balance`);
      const balanceResult = await balanceResponse.json();
      if (balanceResult.success) {
        setTotalBalance(balanceResult.data.total_balance);
      }

      // Obtener estadísticas de movimientos
      const statsResponse = await fetch(`${API_CONFIG.BASE_URL}/movements/stats/summary`);
      const statsResult = await statsResponse.json();
      if (statsResult.success) {
        setTotalIncome(statsResult.data.total_income);
        setTotalExpense(statsResult.data.total_expense);
      }

      // Obtener cuentas
      const accountsResponse = await fetch(`${API_CONFIG.BASE_URL}/accounts`);
      const accountsResult = await accountsResponse.json();
      if (accountsResult.success) {
        setAccounts(accountsResult.data.slice(0, 3)); // Solo las primeras 3
      }

      // Obtener movimientos para calcular categorías
      const movementsResponse = await fetch(`${API_CONFIG.BASE_URL}/movements`);
      const movementsResult = await movementsResponse.json();
      if (movementsResult.success) {
        calculateCategoryStats(movementsResult.data);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    }
  };

  const calculateCategoryStats = (movements: any[]) => {
    const categoryMap = new Map<string, CategoryStat>();
    
    movements
      .filter(m => m.type === 'expense' && m.category_name)
      .forEach(movement => {
        const existing = categoryMap.get(movement.category_name);
        if (existing) {
          existing.total += movement.amount;
          existing.count += 1;
        } else {
          categoryMap.set(movement.category_name, {
            category_name: movement.category_name,
            category_icon: movement.category_icon || 'square.grid.2x2',
            category_color: movement.category_color || '#64748b',
            total: movement.amount,
            count: 1,
          });
        }
      });

    const stats = Array.from(categoryMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);
    
    setCategoryStats(stats);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'cash': return 'banknote';
      case 'bank': return 'building.columns.fill';
      case 'debit': return 'creditcard';
      case 'credit': return 'creditcard.fill';
      default: return 'banknote';
    }
  };

  const netChange = totalIncome - totalExpense;
  const changePercentage = totalBalance > 0 ? ((netChange / totalBalance) * 100).toFixed(1) : '0.0';

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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />
        }
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
                {formatCurrency(totalBalance)}
              </ThemedText>
              <View style={[styles.badge, { backgroundColor: netChange >= 0 ? 'rgba(32, 223, 96, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
                <IconSymbol size={14} name={netChange >= 0 ? "arrow.up.right" : "arrow.down.right"} color={netChange >= 0 ? primary : '#ef4444'} />
                <ThemedText style={[styles.badgeText, { color: netChange >= 0 ? primary : '#ef4444' }]}>
                  {netChange >= 0 ? '+' : ''}{changePercentage}% este mes
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
                  +{formatCurrency(totalIncome)}
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
                  -{formatCurrency(totalExpense)}
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
            <TouchableOpacity onPress={() => router.push('/(tabs)/accounts')}>
              <ThemedText style={[styles.linkText, { color: primary }]}>Ver todo</ThemedText>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.accountsScroll}
          >
            {accounts.length === 0 ? (
              <View style={[styles.accountCard, { backgroundColor: surfaceColor, borderColor }]}>
                <View style={styles.accountCardHeader}>
                  <IconSymbol size={22} name="tray" color={textMuted} />
                </View>
                <View style={styles.accountCardFooter}>
                  <ThemedText style={[styles.accountNameMuted, { color: textMuted }]}>
                    Sin cuentas
                  </ThemedText>
                  <ThemedText style={[styles.accountNumberDark, { color: textMain }]}>
                    Agrega una
                  </ThemedText>
                </View>
              </View>
            ) : (
              accounts.map((account, index) => {
                const isFirst = index === 0;
                const displayBalance = account.type === 'credit' ? account.current_balance || 0 : account.balance;
                
                if (isFirst) {
                  return (
                    <TouchableOpacity 
                      key={account.id}
                      style={styles.accountCardDark}
                      onPress={() => router.push(`/accounts/account-detail?id=${account.id}`)}
                    >
                      <View style={styles.accountCardGlow} />
                      <View style={styles.accountCardHeader}>
                        <IconSymbol size={22} name={getAccountIcon(account.type) as any} color="rgba(255,255,255,0.8)" />
                        <View style={styles.accountBadge}>
                          <ThemedText style={styles.accountBadgeText}>Principal</ThemedText>
                        </View>
                      </View>
                      <View style={styles.accountCardFooter}>
                        <ThemedText style={styles.accountNameLight}>{account.name}</ThemedText>
                        <ThemedText style={styles.accountNumber}>
                          {account.card_last_four ? `**** ${account.card_last_four}` : account.bank_name || 'Efectivo'}
                        </ThemedText>
                        <ThemedText style={styles.accountBalance}>{formatCurrency(displayBalance)}</ThemedText>
                      </View>
                    </TouchableOpacity>
                  );
                }
                
                return (
                  <TouchableOpacity 
                    key={account.id}
                    style={[styles.accountCard, { backgroundColor: surfaceColor, borderColor }]}
                    onPress={() => router.push(`/accounts/account-detail?id=${account.id}`)}
                  >
                    <View style={styles.accountCardHeader}>
                      <IconSymbol size={22} name={getAccountIcon(account.type) as any} color={primary} />
                    </View>
                    <View style={styles.accountCardFooter}>
                      <ThemedText style={[styles.accountNameMuted, { color: textMuted }]}>
                        {account.name}
                      </ThemedText>
                      <ThemedText style={[styles.accountNumberDark, { color: textMain }]}>
                        {account.card_last_four ? `**** ${account.card_last_four}` : account.bank_name || 'Efectivo'}
                      </ThemedText>
                      <ThemedText style={[styles.accountBalanceDark, { color: textMain }]}>
                        {formatCurrency(displayBalance)}
                      </ThemedText>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}

            {/* Add New Card */}
            <TouchableOpacity 
              style={[styles.addAccountCard, { borderColor: addAccountBorderColor }]}
              onPress={() => router.push('/accounts/add-account')}
            >
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
            {categoryStats.length === 0 ? (
              <View style={styles.emptyCategories}>
                <IconSymbol size={32} name="chart.bar" color={textMuted} />
                <ThemedText style={[styles.emptyCategoriesText, { color: textMuted }]}>
                  No hay gastos registrados
                </ThemedText>
              </View>
            ) : (
              categoryStats.map((category, index) => {
                const maxAmount = categoryStats[0].total;
                const percentage = (category.total / maxAmount) * 100;
                const bgColor = category.category_color + '20';
                
                return (
                  <View key={index} style={styles.categoryItem}>
                    <View style={styles.categoryRow}>
                      <View style={styles.categoryInfo}>
                        <View style={[styles.categoryIcon, { backgroundColor: bgColor }]}>
                          <IconSymbol size={20} name={category.category_icon as any} color={category.category_color} />
                        </View>
                        <View>
                          <ThemedText style={[styles.categoryName, { color: textMain }]}>
                            {category.category_name}
                          </ThemedText>
                          <ThemedText style={[styles.categoryTransactions, { color: textMuted }]}>
                            {category.count} transaccion{category.count !== 1 ? 'es' : ''}
                          </ThemedText>
                        </View>
                      </View>
                      <ThemedText style={[styles.categoryAmount, { color: textMain }]}>
                        {formatCurrency(category.total)}
                      </ThemedText>
                    </View>
                    <View style={[styles.progressBar, { backgroundColor: progressBarBg }]}>
                      <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: category.category_color }]} />
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>

        {/* Bottom spacer for FABs */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/movements/add-movement')}
      >
        <IconSymbol size={28} name="plus" color="white" />
      </TouchableOpacity>
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
  // Empty Categories
  emptyCategories: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyCategoriesText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // FAB
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#20df60',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#20df60',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 40,
  },
});
