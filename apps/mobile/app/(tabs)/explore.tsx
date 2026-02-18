import { ScrollView, View, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect, router } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_CONFIG } from '@/config/api';
import { formatCurrency } from '@/utils/format';

const DATE_FILTERS = ['Este mes', 'Mes pasado', '3 meses'];

type CategoryStat = {
  category_name: string;
  category_icon: string;
  category_color: string;
  total: number;
  count: number;
  percentage: number;
};

type MonthlyTrend = {
  label: string;
  amount: number;
  height: number;
  active: boolean;
  weekend?: boolean;
};

const BAR_DATA: MonthlyTrend[] = [
  { label: 'Lun', amount: 0, height: 40, active: false },
  { label: 'Mar', amount: 0, height: 65, active: false },
  { label: 'Mié', amount: 0, height: 85, active: true },
  { label: 'Jue', amount: 0, height: 30, active: false },
  { label: 'Vie', amount: 0, height: 55, active: false },
  { label: 'Sáb', amount: 0, height: 20, active: false, weekend: true },
  { label: 'Dom', amount: 0, height: 25, active: false, weekend: true },
];

// Donut chart using border-based segments
function DonutChart({ 
  surfaceColor, 
  textMain, 
  textMuted, 
  topCategory 
}: { 
  surfaceColor: string; 
  textMain: string; 
  textMuted: string;
  topCategory: CategoryStat | null;
}) {
  const SIZE = 160;
  const BORDER = 20;

  // Calcular colores para el donut basado en las categorías reales
  const topColor = topCategory?.category_color || '#20df60';
  const topPercentage = topCategory?.percentage || 0;

  return (
    <View style={{ width: SIZE, height: SIZE, position: 'relative' }}>
      {/* Pie usando border trick */}
      <View
        style={{
          width: SIZE,
          height: SIZE,
          borderRadius: SIZE / 2,
          borderWidth: BORDER,
          borderTopColor: topColor,
          borderRightColor: topColor + '80',
          borderBottomColor: topColor + '40',
          borderLeftColor: '#e2e8f0',
          transform: [{ rotate: '-45deg' }],
        }}
      />
      {/* Extra wedge overlay */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: SIZE / 2,
        height: SIZE,
        overflow: 'hidden',
      }}>
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: SIZE,
          height: SIZE,
          borderRadius: SIZE / 2,
          borderWidth: BORDER,
          borderColor: 'transparent',
          borderTopColor: topColor,
          borderLeftColor: topColor,
          transform: [{ rotate: '20deg' }],
        }} />
      </View>
      {/* Center hole */}
      <View
        style={[
          styles.donutCenter,
          {
            backgroundColor: surfaceColor,
            width: SIZE - BORDER * 2 - 8,
            height: SIZE - BORDER * 2 - 8,
            borderRadius: (SIZE - BORDER * 2 - 8) / 2,
            top: BORDER + 4,
            left: BORDER + 4,
          },
        ]}
      >
        <ThemedText style={[styles.donutTopLabel, { color: textMuted }]}>Top</ThemedText>
        <ThemedText style={[styles.donutPercentage, { color: textMain }]}>
          {topPercentage.toFixed(0)}%
        </ThemedText>
      </View>
    </View>
  );
}

export default function ReportesScreen() {
  const [activeFilter, setActiveFilter] = useState('Este mes');
  const [totalExpense, setTotalExpense] = useState(0);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrend[]>(BAR_DATA);
  const [refreshing, setRefreshing] = useState(false);
  const [expenseChange, setExpenseChange] = useState(0);
  
  const backgroundColor = useThemeColor({ light: '#f6f8f6', dark: '#112116' }, 'background');
  const surfaceColor = useThemeColor({ light: '#ffffff', dark: '#1a2c22' }, 'surface');
  const textMain = useThemeColor({ light: '#1e293b', dark: '#ffffff' }, 'text');
  const borderColor = useThemeColor({ light: 'rgba(255,255,255,0.5)', dark: '#334155' }, 'border');
  const textMuted = useThemeColor({ light: '#64748b', dark: '#94a3b8' }, 'text');
  const barBg = useThemeColor({ light: '#f1f5f9', dark: '#1e293b' }, 'surface');
  const chipBg = useThemeColor({ light: '#ffffff', dark: '#1a2c22' }, 'surface');
  const chipBorder = useThemeColor({ light: '#f1f5f9', dark: '#334155' }, 'border');
  const chipText = useThemeColor({ light: '#475569', dark: '#cbd5e1' }, 'text');
  const weekendBarColor = useThemeColor({ light: '#cbd5e1', dark: '#475569' }, 'text');
  const primary = '#20df60';

  const BUDGET = 1500; // Mock - mantener como constante

  const fetchData = async () => {
    try {
      // Obtener movimientos
      const movementsResponse = await fetch(`${API_CONFIG.BASE_URL}/movements`);
      const movementsResult = await movementsResponse.json();
      
      if (movementsResult.success) {
        const movements = movementsResult.data;
        
        // Calcular total de gastos
        const expenses = movements.filter((m: any) => m.type === 'expense');
        const total = expenses.reduce((sum: number, m: any) => sum + m.amount, 0);
        setTotalExpense(total);
        
        // Calcular cambio porcentual (mock por ahora)
        const change = total > 0 ? -12 : 0;
        setExpenseChange(change);
        
        // Calcular estadísticas por categoría
        calculateCategoryStats(expenses);
        
        // Calcular tendencia mensual
        calculateMonthlyTrend(movements);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    }
  };

  const calculateCategoryStats = (expenses: any[]) => {
    const categoryMap = new Map<string, CategoryStat>();
    let totalAmount = 0;
    
    expenses
      .filter(m => m.category_name)
      .forEach(movement => {
        totalAmount += movement.amount;
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
            percentage: 0,
          });
        }
      });

    // Calcular porcentajes
    const stats = Array.from(categoryMap.values())
      .map(stat => ({
        ...stat,
        percentage: totalAmount > 0 ? (stat.total / totalAmount) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 4);
    
    setCategoryStats(stats);
  };

  const calculateMonthlyTrend = (movements: any[]) => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Domingo, 1 = Lunes, etc.
    const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    
    // Crear array de los últimos 7 días
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    // Calcular gastos por día
    const dailyExpenses = last7Days.map((date, index) => {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayExpenses = movements.filter((m: any) => {
        if (m.type !== 'expense') return false;
        const movementDate = new Date(m.date);
        return movementDate >= dayStart && movementDate <= dayEnd;
      });
      
      const total = dayExpenses.reduce((sum: number, m: any) => sum + m.amount, 0);
      const dayOfWeek = date.getDay();
      const isToday = index === 6;
      
      return {
        label: daysOfWeek[dayOfWeek],
        amount: total,
        height: 0,
        active: isToday,
        weekend: dayOfWeek === 0 || dayOfWeek === 6,
      };
    });

    // Calcular alturas relativas
    const maxAmount = Math.max(...dailyExpenses.map(d => d.amount), 1);
    const trendData = dailyExpenses.map(day => ({
      ...day,
      height: maxAmount > 0 ? (day.amount / maxAmount) * 100 : 20,
    }));

    setMonthlyTrend(trendData);
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

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.headerButton}>
            <IconSymbol size={24} name="arrow.backward" color={textMain} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: textMain }]}>Reportes</ThemedText>
          <TouchableOpacity style={styles.headerButton}>
            <IconSymbol size={24} name="ellipsis" color={textMain} />
          </TouchableOpacity>
        </View>

        {/* Date Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {DATE_FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterPill,
                activeFilter === filter
                  ? styles.filterPillActive
                  : { backgroundColor: chipBg, borderColor: chipBorder, borderWidth: 1 },
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <ThemedText
                style={[
                  styles.filterPillText,
                  activeFilter === filter
                    ? styles.filterPillTextActive
                    : { color: chipText },
                ]}
              >
                {filter}
              </ThemedText>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.calendarButton, { backgroundColor: chipBg, borderColor: chipBorder, borderWidth: 1 }]}
          >
            <IconSymbol size={20} name="calendar" color={chipText} />
          </TouchableOpacity>
        </ScrollView>
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
        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          {/* Gasto Total */}
          <View style={[styles.summaryCard, { backgroundColor: surfaceColor, borderColor }]}>
            <View style={styles.summaryCardTop}>
              <View style={[styles.summaryIconBg, { backgroundColor: '#ffe4e6' }]}>
                <IconSymbol size={22} name="arrow.down.right" color="#e11d48" />
              </View>
              <View style={[styles.percentBadge, { backgroundColor: expenseChange < 0 ? '#fff1f2' : '#dcfce7' }]}>
                <ThemedText style={[styles.percentBadgeText, { color: expenseChange < 0 ? '#e11d48' : '#16a34a' }]}>
                  {expenseChange > 0 ? '+' : ''}{expenseChange}%
                </ThemedText>
              </View>
            </View>
            <ThemedText style={[styles.summaryLabel, { color: textMuted }]}>Gasto Total</ThemedText>
            <View style={styles.summaryAmountRow}>
              <ThemedText style={[styles.summaryAmount, { color: textMain }]}>
                ${Math.floor(totalExpense).toLocaleString('en-US')}
              </ThemedText>
              <ThemedText style={[styles.summaryAmountCents, { color: textMuted }]}>
                .{(totalExpense % 1).toFixed(2).split('.')[1]}
              </ThemedText>
            </View>
          </View>

          {/* Presupuesto */}
          <TouchableOpacity 
            style={[styles.summaryCard, { backgroundColor: surfaceColor, borderColor }]}
            onPress={() => router.push('/budgets')}
          >
            <View style={styles.summaryCardTop}>
              <View style={[styles.summaryIconBg, { backgroundColor: 'rgba(32, 223, 96, 0.2)' }]}>
                <IconSymbol size={22} name="chart.pie.fill" color={primary} />
              </View>
            </View>
            <ThemedText style={[styles.summaryLabel, { color: textMuted }]}>Presupuestos</ThemedText>
            <View style={styles.summaryAmountRow}>
              <ThemedText style={[styles.summaryAmount, { color: textMain }]}>
                Ver
              </ThemedText>
            </View>
          </TouchableOpacity>
        </View>

        {/* Donut Chart Section */}
        <View style={[styles.chartCard, { backgroundColor: surfaceColor, borderColor }]}>
          <View style={styles.chartCardHeader}>
            <ThemedText style={[styles.chartTitle, { color: textMain }]}>Gastos por Categoría</ThemedText>
            <TouchableOpacity style={styles.chartMoreButton}>
              <IconSymbol size={20} name="ellipsis" color={primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.donutSection}>
            {/* Donut Chart */}
            <DonutChart 
              surfaceColor={surfaceColor} 
              textMain={textMain} 
              textMuted={textMuted}
              topCategory={categoryStats[0] || null}
            />

            {/* Legend */}
            <View style={styles.legendContainer}>
              {categoryStats.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                  <ThemedText style={[styles.legendLabel, { color: textMuted }]}>
                    No hay gastos registrados
                  </ThemedText>
                </View>
              ) : (
                categoryStats.map((segment) => (
                  <View key={segment.category_name} style={styles.legendItem}>
                    <View style={styles.legendLeft}>
                      <View style={[styles.legendDot, { backgroundColor: segment.category_color }]} />
                      <ThemedText style={[styles.legendLabel, { color: textMuted }]}>
                        {segment.category_name}
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.legendAmount, { color: textMain }]}>
                      {formatCurrency(segment.total)}
                    </ThemedText>
                  </View>
                ))
              )}
            </View>
          </View>
        </View>

        {/* Bar Chart Section */}
        <View style={[styles.chartCard, { backgroundColor: surfaceColor, borderColor }]}>
          <View style={styles.chartCardHeader}>
            <ThemedText style={[styles.chartTitle, { color: textMain }]}>Tendencia Mensual</ThemedText>
          </View>

          <View style={styles.barChartContainer}>
            {monthlyTrend.map((bar) => (
              <View key={bar.label} style={styles.barColumn}>
                <View style={[styles.barTrack, { backgroundColor: barBg }]}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: `${bar.height}%`,
                        backgroundColor: bar.weekend
                          ? weekendBarColor
                          : bar.active
                            ? primary
                            : `rgba(32, 223, 96, ${Math.max(bar.height / 130, 0.3)})`,
                      },
                      bar.active && styles.barFillActive,
                    ]}
                  />
                </View>
                <ThemedText
                  style={[
                    styles.barLabel,
                    {
                      color: bar.active ? primary : textMuted,
                      fontWeight: bar.active ? '700' : '400',
                    },
                  ]}
                >
                  {bar.label}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* Insight Box */}
        <View style={styles.insightBox}>
          <View style={styles.insightIconBg}>
            <IconSymbol size={24} name="lightbulb" color="#1ab84e" />
          </View>
          <View style={styles.insightContent}>
            <ThemedText style={[styles.insightTitle, { color: textMain }]}>
              Salud Financiera: Excelente
            </ThemedText>
            <ThemedText style={[styles.insightText, { color: textMuted }]}>
              Has gastado un{' '}
              <ThemedText style={{ fontWeight: '700', color: primary }}>12% menos</ThemedText>
              {' '}en comida comparado con el mes anterior. ¡Sigue así para alcanzar tu meta de ahorro!
            </ThemedText>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Header
  header: {
    paddingTop: 48,
    paddingBottom: 8,
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  // Filters
  filtersRow: {
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 8,
  },
  filterPill: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterPillActive: {
    backgroundColor: '#0f172a',
  },
  filterPillText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterPillTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  calendarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Scroll
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  // Summary Cards
  summaryRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  summaryCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryIconBg: {
    padding: 8,
    borderRadius: 12,
  },
  percentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  percentBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  summaryAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: '700',
  },
  summaryAmountCents: {
    fontSize: 18,
  },
  // Chart Cards
  chartCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  chartCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  chartMoreButton: {
    padding: 4,
    borderRadius: 8,
  },
  // Donut
  donutSection: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 24,
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutTopLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  donutPercentage: {
    fontSize: 18,
    fontWeight: '700',
  },
  // Legend
  legendContainer: {
    width: '100%',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  legendAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  // Bar Chart
  barChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 160,
    gap: 8,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    height: '100%',
  },
  barTrack: {
    flex: 1,
    width: '100%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  barFillActive: {
    shadowColor: '#20df60',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  barLabel: {
    fontSize: 12,
  },
  // Insight Box
  insightBox: {
    flexDirection: 'row',
    gap: 16,
    padding: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(32, 223, 96, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(32, 223, 96, 0.2)',
    marginBottom: 24,
  },
  insightIconBg: {
    padding: 12,
    backgroundColor: 'rgba(32, 223, 96, 0.2)',
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 22,
  },
});
