import { ScrollView, View, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useState, useCallback, useMemo } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as database from '@/services/database';
import { useCurrency } from '@/contexts/CurrencyContext';

type RecentMovement = {
  id: number;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  title: string;
  category_icon?: string;
  category_color?: string;
  date: string;
};

type Account = {
  id: number;
  name: string;
  type: string;
  balance: number;
  card_last_four?: string;
  bank_name?: string;
  credit_limit?: number;
  current_balance?: number;
  is_primary?: number;
};

type CategoryStat = {
  category_name: string;
  category_icon: string;
  category_color: string;
  total: number;
  count: number;
};

type SavingsGoalSummary = {
  total_goals: number;
  active_goals: number;
  total_target: number;
  total_saved: number;
  completion_percentage: number;
};

type LoansSummary = {
  total_loans: number;
  active_loans: number;
  total_lent: number;
  total_pending: number;
  total_recovered: number;
  recovery_percentage: number;
};

type Budget = {
  id: number;
  name: string;
  amount: number;
  current_amount: number;
  period: string;
  icon: string;
  color: string;
};

type SubscriptionsSummary = {
  total_active: number;
  monthly_subscriptions: number;
  monthly_recurring_expenses: number;
  monthly_recurring_income: number;
  upcoming_payments: Array<{
    id: number;
    name: string;
    amount: number;
    type: string;
    next_date: string;
    icon: string;
    color: string;
  }>;
};

export default function DashboardScreen() {
  const [totalBalance, setTotalBalance] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [expenseChange, setExpenseChange] = useState(0);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [savingsGoalsSummary, setSavingsGoalsSummary] = useState<SavingsGoalSummary | null>(null);
  const [loansSummary, setLoansSummary] = useState<LoansSummary | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [subscriptionsSummary, setSubscriptionsSummary] = useState<SubscriptionsSummary | null>(null);
  const [vehiclesSummary, setVehiclesSummary] = useState<any>(null);
  const [recentMovements, setRecentMovements] = useState<RecentMovement[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [profileName, setProfileName] = useState('Usuario');
  const [profileInitials, setProfileInitials] = useState('U');
  const { formatCurrency } = useCurrency();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días,';
    if (hour < 19) return 'Buenas tardes,';
    return 'Buenas noches,';
  }, []);

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
      // Obtener perfil
      const profileResult = database.getProfile();
      if (profileResult.success && profileResult.data) {
        const name = profileResult.data.name || 'Usuario';
        setProfileName(name);

        // Generar iniciales
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
          setProfileInitials((parts[0][0] + parts[1][0]).toUpperCase());
        } else {
          setProfileInitials(name.substring(0, 2).toUpperCase());
        }
      }

      // Obtener balance total
      const balanceResult = database.getAccountsStats();
      if (balanceResult.success) {
        setTotalBalance(balanceResult.data.total_balance);
      }

      // Obtener movimientos
      const movementsResult = database.getMovements();

      if (movementsResult.success) {
        const allMovements = movementsResult.data;

        // Filtrar movimientos del mes actual
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const currentMonthMovements = allMovements.filter((m: any) => {
          const movementDate = new Date(m.date);
          return movementDate >= monthStart && movementDate <= now;
        });

        // Calcular estadísticas solo del mes actual
        const expenses = currentMonthMovements.filter((m: any) => m.type === 'expense');
        const incomes = currentMonthMovements.filter((m: any) => m.type === 'income');

        const totalExpense = expenses.reduce((sum: number, m: any) => sum + m.amount, 0);
        const totalIncome = incomes.reduce((sum: number, m: any) => sum + m.amount, 0);

        setTotalIncome(totalIncome);
        setTotalExpense(totalExpense);

        // Calcular cambio porcentual comparando con mes anterior
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        const lastMonthMovements = allMovements.filter((m: any) => {
          const movementDate = new Date(m.date);
          return movementDate >= lastMonthStart && movementDate <= lastMonthEnd;
        });

        const lastMonthExpenses = lastMonthMovements.filter((m: any) => m.type === 'expense');
        const lastMonthTotal = lastMonthExpenses.reduce((sum: number, m: any) => sum + m.amount, 0);

        let change = 0;
        if (lastMonthTotal > 0) {
          change = ((totalExpense - lastMonthTotal) / lastMonthTotal) * 100;
        } else if (totalExpense > 0) {
          change = 100;
        }
        setExpenseChange(change);

        // Calcular categorías solo del mes actual
        calculateCategoryStats(expenses);

        // Últimos 5 movimientos para la sección reciente
        setRecentMovements(allMovements.slice(0, 5));
      }

      // Obtener cuentas
      const accountsResult = database.getAccounts();
      if (accountsResult.success) {
        // Las cuentas ya vienen ordenadas por is_primary DESC desde la API
        setAccounts(accountsResult.data.slice(0, 3)); // Solo las primeras 3
      }

      // Obtener resumen de objetivos de ahorro
      const goalsStatsResult = database.getSavingsGoalsStats();
      if (goalsStatsResult.success) {
        setSavingsGoalsSummary(goalsStatsResult.data);
      }

      // Obtener resumen de préstamos
      const loansStatsResult = database.getLoansStats();
      if (loansStatsResult.success) {
        setLoansSummary(loansStatsResult.data);
      }

      // Obtener presupuestos
      const budgetsResult = database.getBudgets();
      if (budgetsResult.success) {
        setBudgets(budgetsResult.data);
      }

      // Obtener resumen de suscripciones
      const subsResult = database.getRecurringPaymentsStats();
      if (subsResult.success) {
        setSubscriptionsSummary(subsResult.data);
      }

      // Obtener resumen de vehículos
      const vehiclesResult = database.getVehicles();
      if (vehiclesResult.success && vehiclesResult.data.length > 0) {
        // Obtener estadísticas del primer vehículo
        const firstVehicle = vehiclesResult.data[0];
        const statsResult = database.getVehicleStats(firstVehicle.id);
        if (statsResult.success) {
          setVehiclesSummary({
            vehicle: firstVehicle,
            stats: statsResult.data,
            total_vehicles: vehiclesResult.data.length,
          });
        }
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

  const changePercentage = expenseChange.toFixed(1);

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.profileContainer} onPress={() => router.push('/settings')}>
            <View style={[styles.profileImage, { borderColor: surfaceColor, backgroundColor: primary }]}>
              <ThemedText style={{ color: '#ffffff', fontSize: 18, fontWeight: '700' }}>
                {profileInitials}
              </ThemedText>
            </View>
            <View style={[styles.statusDot, { backgroundColor: primary, borderColor: backgroundColor }]} />
          </TouchableOpacity>
          <View>
            <ThemedText style={[styles.greeting, { color: textMuted }]}>{greeting}</ThemedText>
            <ThemedText style={[styles.title, { color: textMain }]}>{profileName}</ThemedText>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.notificationButton, { backgroundColor: surfaceColor }]}
          onPress={() => router.push('/notifications')}
        >
          <IconSymbol size={22} name="bell.fill" color={textMain} />
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
              <ThemedText style={[styles.balanceAmount, { color: textMain }]} numberOfLines={1} adjustsFontSizeToFit>
                {formatCurrency(totalBalance)}
              </ThemedText>
              <View style={[styles.badge, { backgroundColor: expenseChange <= 0 ? 'rgba(32, 223, 96, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
                <IconSymbol size={14} name={expenseChange <= 0 ? "arrow.down.right" : "arrow.up.right"} color={expenseChange <= 0 ? primary : '#ef4444'} />
                <ThemedText style={[styles.badgeText, { color: expenseChange <= 0 ? primary : '#ef4444' }]}>
                  {expenseChange > 0 ? '+' : ''}{changePercentage}% este mes
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
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.smallCardLabel, { color: textMuted }]}>
                  Ingresos
                </ThemedText>
                <ThemedText style={[styles.smallCardAmount, { color: textMain }]} numberOfLines={1} adjustsFontSizeToFit>
                  +{formatCurrency(totalIncome)}
                </ThemedText>
              </View>
            </View>

            {/* Expense Card */}
            <View style={[styles.smallCard, { backgroundColor: surfaceColor, borderColor }]}>
              <View style={[styles.iconCircle, { backgroundColor: '#fef2f2' }]}>
                <IconSymbol size={18} name="arrow.up" color="#ef4444" />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.smallCardLabel, { color: textMuted }]}>
                  Gastos
                </ThemedText>
                <ThemedText style={[styles.smallCardAmount, { color: textMain }]} numberOfLines={1} adjustsFontSizeToFit>
                  -{formatCurrency(totalExpense)}
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {[
            { icon: 'plus.circle.fill' as const, label: 'Agregar', color: primary, onPress: () => router.push('/movements/add-movement') },
            { icon: 'arrow.left.arrow.right' as const, label: 'Transferir', color: '#3b82f6', onPress: () => router.push('/movements/add-movement') },
            { icon: 'chart.pie.fill' as const, label: 'Presupuestos', color: '#9333ea', onPress: () => router.push('/budgets') },
            { icon: 'target' as const, label: 'Objetivos', color: '#f59e0b', onPress: () => router.push('/savings-goals') },
          ].map((action, i) => (
            <TouchableOpacity key={i} style={styles.quickActionItem} onPress={action.onPress}>
              <View style={[styles.quickActionIcon, { backgroundColor: action.color + '18' }]}>
                <IconSymbol size={22} name={action.icon} color={action.color} />
              </View>
              <ThemedText style={[styles.quickActionLabel, { color: textMuted }]}>
                {action.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
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
                const isPrimary = account.is_primary === 1;
                const displayBalance = account.type === 'credit' ? account.current_balance || 0 : account.balance;
                
                if (isPrimary) {
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
                        <ThemedText style={styles.accountBalance} numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(displayBalance)}</ThemedText>
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
                      <ThemedText style={[styles.accountBalanceDark, { color: textMain }]} numberOfLines={1} adjustsFontSizeToFit>
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

        {/* Savings Goals Section */}
        {savingsGoalsSummary && savingsGoalsSummary.active_goals > 0 && (
          <TouchableOpacity 
            style={[styles.savingsGoalsCard, { backgroundColor: surfaceColor, borderColor }]}
            onPress={() => router.push('/savings-goals')}
          >
            <View style={styles.savingsGoalsHeader}>
              <View style={styles.savingsGoalsHeaderLeft}>
                <View style={[styles.savingsGoalsIcon, { backgroundColor: 'rgba(32, 223, 96, 0.2)' }]}>
                  <IconSymbol size={24} name="target" color={primary} />
                </View>
                <View>
                  <ThemedText style={[styles.sectionTitle, { color: textMain }]}>
                    Objetivos de Ahorro
                  </ThemedText>
                  <ThemedText style={[styles.savingsGoalsSubtitle, { color: textMuted }]}>
                    {savingsGoalsSummary.active_goals} objetivo{savingsGoalsSummary.active_goals !== 1 ? 's' : ''} activo{savingsGoalsSummary.active_goals !== 1 ? 's' : ''}
                  </ThemedText>
                </View>
              </View>
              <IconSymbol size={20} name="chevron.right" color={textMuted} />
            </View>

            <View style={[styles.savingsGoalsProgress, { backgroundColor: progressBarBg }]}>
              <View 
                style={[
                  styles.savingsGoalsProgressFill, 
                  { 
                    width: `${Math.min(savingsGoalsSummary.completion_percentage, 100)}%`, 
                    backgroundColor: primary 
                  }
                ]} 
              />
            </View>

            <View style={styles.savingsGoalsAmounts}>
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.savingsGoalsLabel, { color: textMuted }]}>
                  Ahorrado
                </ThemedText>
                <ThemedText style={[styles.savingsGoalsAmount, { color: textMain }]} numberOfLines={1} adjustsFontSizeToFit>
                  {formatCurrency(savingsGoalsSummary.total_saved)}
                </ThemedText>
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <ThemedText style={[styles.savingsGoalsLabel, { color: textMuted }]}>
                  Meta Total
                </ThemedText>
                <ThemedText style={[styles.savingsGoalsAmount, { color: textMain }]} numberOfLines={1} adjustsFontSizeToFit>
                  {formatCurrency(savingsGoalsSummary.total_target)}
                </ThemedText>
              </View>
            </View>

            <View style={[styles.savingsGoalsBadge, { backgroundColor: primary + '20' }]}>
              <ThemedText style={[styles.savingsGoalsBadgeText, { color: primary }]}>
                {savingsGoalsSummary.completion_percentage.toFixed(1)}% completado
              </ThemedText>
            </View>
          </TouchableOpacity>
        )}

        {/* Loans Section */}
        {loansSummary && loansSummary.active_loans > 0 && (
          <TouchableOpacity 
            style={[styles.loansCard, { backgroundColor: surfaceColor, borderColor }]}
            onPress={() => router.push('/loans')}
          >
            <View style={styles.loansHeader}>
              <View style={styles.loansHeaderLeft}>
                <View style={[styles.loansIcon, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                  <IconSymbol size={24} name="doc.text" color="#f59e0b" />
                </View>
                <View>
                  <ThemedText style={[styles.sectionTitle, { color: textMain }]}>
                    Préstamos
                  </ThemedText>
                  <ThemedText style={[styles.loansSubtitle, { color: textMuted }]}>
                    {loansSummary.active_loans} préstamo{loansSummary.active_loans !== 1 ? 's' : ''} activo{loansSummary.active_loans !== 1 ? 's' : ''}
                  </ThemedText>
                </View>
              </View>
              <IconSymbol size={20} name="chevron.right" color={textMuted} />
            </View>

            <View style={styles.loansAmounts}>
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.loansLabel, { color: textMuted }]}>
                  Pendiente por Cobrar
                </ThemedText>
                <ThemedText style={[styles.loansAmount, { color: '#f59e0b' }]} numberOfLines={1} adjustsFontSizeToFit>
                  {formatCurrency(loansSummary.total_pending)}
                </ThemedText>
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <ThemedText style={[styles.loansLabel, { color: textMuted }]}>
                  Total Prestado
                </ThemedText>
                <ThemedText style={[styles.loansAmount, { color: textMain }]} numberOfLines={1} adjustsFontSizeToFit>
                  {formatCurrency(loansSummary.total_lent)}
                </ThemedText>
              </View>
            </View>

            <View style={[styles.loansProgress, { backgroundColor: progressBarBg }]}>
              <View 
                style={[
                  styles.loansProgressFill, 
                  { 
                    width: `${Math.min(loansSummary.recovery_percentage, 100)}%`, 
                    backgroundColor: '#10b981' 
                  }
                ]} 
              />
            </View>

            <View style={[styles.loansBadge, { backgroundColor: '#10b981' + '20' }]}>
              <ThemedText style={[styles.loansBadgeText, { color: '#10b981' }]}>
                {loansSummary.recovery_percentage.toFixed(1)}% recuperado
              </ThemedText>
            </View>
          </TouchableOpacity>
        )}

        {/* Budgets Section */}
        {budgets.length > 0 && (
          <TouchableOpacity
            style={[styles.budgetsCard, { backgroundColor: surfaceColor, borderColor }]}
            onPress={() => router.push('/budgets')}
          >
            <View style={styles.budgetsHeader}>
              <View style={styles.budgetsHeaderLeft}>
                <View style={[styles.budgetsIcon, { backgroundColor: 'rgba(147, 51, 234, 0.2)' }]}>
                  <IconSymbol size={24} name="chart.pie.fill" color="#9333ea" />
                </View>
                <View>
                  <ThemedText style={[styles.sectionTitle, { color: textMain }]}>
                    Presupuestos
                  </ThemedText>
                  <ThemedText style={[styles.budgetsSubtitle, { color: textMuted }]}>
                    {budgets.length} presupuesto{budgets.length !== 1 ? 's' : ''} activo{budgets.length !== 1 ? 's' : ''}
                  </ThemedText>
                </View>
              </View>
              <IconSymbol size={20} name="chevron.right" color={textMuted} />
            </View>

            {budgets.slice(0, 3).map((budget, index) => {
              const percentage = budget.amount > 0 ? (budget.current_amount / budget.amount) * 100 : 0;
              const barColor = percentage >= 100 ? '#ef4444' : percentage >= 80 ? '#f59e0b' : '#10b981';
              return (
                <View key={budget.id} style={[styles.budgetItem, index < Math.min(budgets.length, 3) - 1 && { marginBottom: 12 }]}>
                  <View style={styles.budgetItemHeader}>
                    <View style={styles.budgetItemInfo}>
                      <View style={[styles.budgetItemIcon, { backgroundColor: budget.color + '20' }]}>
                        <IconSymbol size={16} name={budget.icon as any} color={budget.color} />
                      </View>
                      <ThemedText style={[styles.budgetItemName, { color: textMain }]}>
                        {budget.name}
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.budgetItemAmount, { color: textMuted }]} numberOfLines={1}>
                      {formatCurrency(budget.current_amount)} / {formatCurrency(budget.amount)}
                    </ThemedText>
                  </View>
                  <View style={[styles.budgetProgressBar, { backgroundColor: progressBarBg }]}>
                    <View
                      style={[
                        styles.budgetProgressFill,
                        { width: `${Math.min(percentage, 100)}%`, backgroundColor: barColor }
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </TouchableOpacity>
        )}

        {/* Subscriptions Section */}
        {subscriptionsSummary && subscriptionsSummary.total_active > 0 && (
          <TouchableOpacity
            style={[styles.subscriptionsCard, { backgroundColor: surfaceColor, borderColor }]}
            onPress={() => router.push('/subscriptions')}
          >
            <View style={styles.subscriptionsHeader}>
              <View style={styles.subscriptionsHeaderLeft}>
                <View style={[styles.subscriptionsIcon, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                  <IconSymbol size={24} name="repeat" color="#3b82f6" />
                </View>
                <View>
                  <ThemedText style={[styles.sectionTitle, { color: textMain }]}>
                    Suscripciones
                  </ThemedText>
                  <ThemedText style={[styles.subscriptionsSubtitle, { color: textMuted }]}>
                    {subscriptionsSummary.total_active} activa{subscriptionsSummary.total_active !== 1 ? 's' : ''}
                  </ThemedText>
                </View>
              </View>
              <IconSymbol size={20} name="chevron.right" color={textMuted} />
            </View>

            <View style={styles.subscriptionsAmounts}>
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.subscriptionsLabel, { color: textMuted }]}>
                  Gastos Recurrentes /mes
                </ThemedText>
                <ThemedText style={[styles.subscriptionsAmount, { color: '#ef4444' }]} numberOfLines={1} adjustsFontSizeToFit>
                  -{formatCurrency(subscriptionsSummary.monthly_recurring_expenses)}
                </ThemedText>
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <ThemedText style={[styles.subscriptionsLabel, { color: textMuted }]}>
                  Ingresos Recurrentes /mes
                </ThemedText>
                <ThemedText style={[styles.subscriptionsAmount, { color: '#10b981' }]} numberOfLines={1} adjustsFontSizeToFit>
                  +{formatCurrency(subscriptionsSummary.monthly_recurring_income)}
                </ThemedText>
              </View>
            </View>

            {subscriptionsSummary.upcoming_payments.length > 0 && (
              <View style={[styles.upcomingSection, { borderTopColor: borderColor }]}>
                <ThemedText style={[styles.upcomingTitle, { color: textMuted }]}>
                  Próximos cobros
                </ThemedText>
                {subscriptionsSummary.upcoming_payments.slice(0, 3).map((up) => (
                  <View key={up.id} style={styles.upcomingItem}>
                    <View style={styles.upcomingItemLeft}>
                      <View style={[styles.upcomingItemIcon, { backgroundColor: up.color + '20' }]}>
                        <IconSymbol size={14} name={up.icon as any} color={up.color} />
                      </View>
                      <ThemedText style={[styles.upcomingItemName, { color: textMain }]}>
                        {up.name}
                      </ThemedText>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <ThemedText style={[styles.upcomingItemAmount, { color: textMain }]}>
                        {up.type === 'salary' || up.type === 'recurring_income' ? '+' : '-'}{formatCurrency(up.amount)}
                      </ThemedText>
                      <ThemedText style={[styles.upcomingItemDate, { color: textMuted }]}>
                        {new Date(up.next_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                      </ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Vehicles Section */}
        {vehiclesSummary && (
          <TouchableOpacity
            style={[styles.vehiclesCard, { backgroundColor: surfaceColor, borderColor }]}
            onPress={() => router.push('/vehicles')}
          >
            <View style={styles.vehiclesHeader}>
              <View style={styles.vehiclesHeaderLeft}>
                <View style={[styles.vehiclesIcon, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                  <IconSymbol size={24} name="car" color="#3b82f6" />
                </View>
                <View>
                  <ThemedText style={[styles.sectionTitle, { color: textMain }]}>
                    Vehículo
                  </ThemedText>
                  <ThemedText style={[styles.vehiclesSubtitle, { color: textMuted }]}>
                    {vehiclesSummary.vehicle.name}
                  </ThemedText>
                </View>
              </View>
              <IconSymbol size={20} name="chevron.right" color={textMuted} />
            </View>

            <View style={styles.vehiclesStats}>
              <View style={styles.vehicleStatItem}>
                <IconSymbol name="speedometer" size={16} color={textMuted} />
                <ThemedText style={[styles.vehicleStatValue, { color: textMain }]}>
                  {vehiclesSummary.vehicle.odometer.toLocaleString()} km
                </ThemedText>
              </View>
              {vehiclesSummary.stats.avg_efficiency > 0 && (
                <View style={styles.vehicleStatItem}>
                  <IconSymbol name="gauge" size={16} color={textMuted} />
                  <ThemedText style={[styles.vehicleStatValue, { color: textMain }]}>
                    {vehiclesSummary.stats.avg_efficiency.toFixed(1)} km/L
                  </ThemedText>
                </View>
              )}
            </View>

            <View style={styles.vehiclesAmounts}>
              <View style={{ flex: 1 }}>
                <ThemedText style={[styles.vehiclesLabel, { color: textMuted }]}>
                  Gasto este mes
                </ThemedText>
                <ThemedText style={[styles.vehiclesAmount, { color: '#ef4444' }]} numberOfLines={1} adjustsFontSizeToFit>
                  {formatCurrency(vehiclesSummary.stats.month_total_cost)}
                </ThemedText>
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <ThemedText style={[styles.vehiclesLabel, { color: textMuted }]}>
                  Gasto total
                </ThemedText>
                <ThemedText style={[styles.vehiclesAmount, { color: textMain }]} numberOfLines={1} adjustsFontSizeToFit>
                  {formatCurrency(vehiclesSummary.stats.total_cost)}
                </ThemedText>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Recent Movements */}
        {recentMovements.length > 0 && (
          <View style={[styles.recentCard, { backgroundColor: surfaceColor, borderColor }]}>
            <View style={styles.sectionHeader}>
              <ThemedText style={[styles.sectionTitle, { color: textMain }]}>
                Últimos Movimientos
              </ThemedText>
              <TouchableOpacity onPress={() => router.push('/(tabs)/movements')}>
                <ThemedText style={[styles.linkText, { color: primary }]}>Ver todo</ThemedText>
              </TouchableOpacity>
            </View>

            {recentMovements.map((movement, index) => {
              const isIncome = movement.type === 'income';
              const isTransfer = movement.type === 'transfer';
              const iconName = movement.category_icon || (isTransfer ? 'arrow.left.arrow.right' : isIncome ? 'arrow.down' : 'arrow.up');
              const iconColor = movement.category_color || (isTransfer ? '#3b82f6' : isIncome ? primary : '#ef4444');

              return (
                <TouchableOpacity
                  key={movement.id}
                  style={[styles.recentItem, index < recentMovements.length - 1 && { borderBottomWidth: 1, borderBottomColor: borderColor }]}
                  onPress={() => router.push(`/movements/movement-detail?id=${movement.id}`)}
                >
                  <View style={styles.recentItemLeft}>
                    <View style={[styles.recentItemIcon, { backgroundColor: iconColor + '18' }]}>
                      <IconSymbol size={18} name={iconName as any} color={iconColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={[styles.recentItemTitle, { color: textMain }]} numberOfLines={1}>
                        {movement.title}
                      </ThemedText>
                      <ThemedText style={[styles.recentItemDate, { color: textMuted }]}>
                        {new Date(movement.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText style={[styles.recentItemAmount, { color: isIncome ? primary : isTransfer ? '#3b82f6' : textMain }]} numberOfLines={1}>
                    {isIncome ? '+' : isTransfer ? '' : '-'}{formatCurrency(movement.amount)}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Categories Section */}
        <View style={[styles.categoriesCard, { backgroundColor: surfaceColor, borderColor }]}>
          <View style={styles.sectionHeader}>
            <ThemedText style={[styles.sectionTitle, { color: textMain }]}>
              Gasto por Categoría
            </ThemedText>
            <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
              <ThemedText style={[styles.linkText, { color: primary }]}>Estadísticas</ThemedText>
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
                      <ThemedText style={[styles.categoryAmount, { color: textMain }]} numberOfLines={1}>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  greeting: {
    fontSize: 13,
    fontWeight: '500',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  profileContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
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
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  quickActionItem: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '600',
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
    fontSize: 17,
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
  // Recent Movements
  recentCard: {
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
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  recentItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  recentItemIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentItemTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  recentItemDate: {
    fontSize: 11,
    marginTop: 2,
  },
  recentItemAmount: {
    fontSize: 14,
    fontWeight: '700',
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
  // Savings Goals Card
  savingsGoalsCard: {
    padding: 20,
    borderRadius: 16,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 2,
    borderWidth: 1,
  },
  savingsGoalsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  savingsGoalsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  savingsGoalsIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savingsGoalsSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  savingsGoalsProgress: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  savingsGoalsProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  savingsGoalsAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  savingsGoalsLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  savingsGoalsAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  savingsGoalsBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'center',
  },
  savingsGoalsBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Loans Card
  loansCard: {
    padding: 20,
    borderRadius: 16,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 2,
    borderWidth: 1,
  },
  loansHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  loansHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  loansIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loansSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  loansAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  loansLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  loansAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  loansProgress: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  loansProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  loansBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'center',
  },
  loansBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Budgets Card
  budgetsCard: {
    padding: 20,
    borderRadius: 16,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 2,
    borderWidth: 1,
  },
  budgetsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  budgetsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  budgetsIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetsSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  budgetItem: {
    gap: 8,
  },
  budgetItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  budgetItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  budgetItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetItemName: {
    fontSize: 14,
    fontWeight: '600',
  },
  budgetItemAmount: {
    fontSize: 12,
    fontWeight: '500',
  },
  budgetProgressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  budgetProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  // Subscriptions Card
  subscriptionsCard: {
    padding: 20,
    borderRadius: 16,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 2,
    borderWidth: 1,
  },
  subscriptionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  subscriptionsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  subscriptionsIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscriptionsSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  subscriptionsAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  subscriptionsLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  subscriptionsAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  upcomingSection: {
    borderTopWidth: 1,
    paddingTop: 16,
    marginTop: 8,
  },
  upcomingTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
  },
  upcomingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  upcomingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  upcomingItemIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upcomingItemName: {
    fontSize: 13,
    fontWeight: '500',
  },
  upcomingItemAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  upcomingItemDate: {
    fontSize: 11,
    marginTop: 2,
  },
  // Vehicles Card
  vehiclesCard: {
    padding: 20,
    borderRadius: 16,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 2,
    borderWidth: 1,
  },
  vehiclesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  vehiclesHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  vehiclesIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehiclesSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  vehiclesStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  vehicleStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vehicleStatValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  vehiclesAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  vehiclesLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  vehiclesAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
});
