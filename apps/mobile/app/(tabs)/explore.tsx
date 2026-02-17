import { ScrollView, View, StyleSheet, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';

const DATE_FILTERS = ['Este mes', 'Mes pasado', '3 meses'];

const BAR_DATA = [
  { label: 'Lun', height: 40, active: false },
  { label: 'Mar', height: 65, active: false },
  { label: 'Mié', height: 85, active: true },
  { label: 'Jue', height: 30, active: false },
  { label: 'Vie', height: 55, active: false },
  { label: 'Sáb', height: 20, active: false, weekend: true },
  { label: 'Dom', height: 25, active: false, weekend: true },
];

const DONUT_SEGMENTS = [
  { label: 'Hogar', amount: '$558.00', color: '#20df60', darkColor: '#20df60' },
  { label: 'Comida', amount: '$310.12', color: '#86efac', darkColor: '#166534' },
  { label: 'Transporte', amount: '$186.00', color: '#bbf7d0', darkColor: '#14532d' },
  { label: 'Otros', amount: '$186.38', color: '#e2e8f0', darkColor: '#52525b' },
];

// Donut chart using border-based segments
function DonutChart({ surfaceColor, textMain, textMuted }: { surfaceColor: string; textMain: string; textMuted: string }) {
  const SIZE = 160;
  const BORDER = 20;

  return (
    <View style={{ width: SIZE, height: SIZE, position: 'relative' }}>
      {/* Pie using border trick: 4 segments of 90° each */}
      <View
        style={{
          width: SIZE,
          height: SIZE,
          borderRadius: SIZE / 2,
          borderWidth: BORDER,
          borderTopColor: '#20df60',
          borderRightColor: '#86efac',
          borderBottomColor: '#bbf7d0',
          borderLeftColor: '#e2e8f0',
          transform: [{ rotate: '-45deg' }],
        }}
      />
      {/* Extra wedge overlay to extend primary segment (make it ~45% instead of 25%) */}
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
          borderTopColor: '#20df60',
          borderLeftColor: '#20df60',
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
        <ThemedText style={[styles.donutPercentage, { color: textMain }]}>45%</ThemedText>
      </View>
    </View>
  );
}

export default function ReportesScreen() {
  const [activeFilter, setActiveFilter] = useState('Este mes');
  const backgroundColor = useThemeColor({ light: '#f6f8f6', dark: '#112116' }, 'background');
  const surfaceColor = useThemeColor({ light: '#ffffff', dark: '#1a2c22' }, 'surface');
  const textMain = useThemeColor({ light: '#1e293b', dark: '#ffffff' }, 'text');
  const borderColor = useThemeColor({ light: 'rgba(255,255,255,0.5)', dark: '#334155' }, 'border');
  const textMuted = useThemeColor({ light: '#64748b', dark: '#94a3b8' }, 'text');
  const barBg = useThemeColor({ light: '#f1f5f9', dark: '#1e293b' }, 'surface');
  const chipBg = useThemeColor({ light: '#ffffff', dark: '#1a2c22' }, 'surface');
  const chipBorder = useThemeColor({ light: '#f1f5f9', dark: '#334155' }, 'border');
  const chipText = useThemeColor({ light: '#475569', dark: '#cbd5e1' }, 'text');
  const primary = '#20df60';

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
      >
        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          {/* Gasto Total */}
          <View style={[styles.summaryCard, { backgroundColor: surfaceColor, borderColor }]}>
            <View style={styles.summaryCardTop}>
              <View style={[styles.summaryIconBg, { backgroundColor: '#ffe4e6' }]}>
                <IconSymbol size={22} name="arrow.down.right" color="#e11d48" />
              </View>
              <View style={[styles.percentBadge, { backgroundColor: '#fff1f2' }]}>
                <ThemedText style={styles.percentBadgeText}>-12%</ThemedText>
              </View>
            </View>
            <ThemedText style={[styles.summaryLabel, { color: textMuted }]}>Gasto Total</ThemedText>
            <View style={styles.summaryAmountRow}>
              <ThemedText style={[styles.summaryAmount, { color: textMain }]}>$1,240</ThemedText>
              <ThemedText style={[styles.summaryAmountCents, { color: textMuted }]}>.50</ThemedText>
            </View>
          </View>

          {/* Presupuesto */}
          <View style={[styles.summaryCard, { backgroundColor: surfaceColor, borderColor }]}>
            <View style={styles.summaryCardTop}>
              <View style={[styles.summaryIconBg, { backgroundColor: 'rgba(32, 223, 96, 0.2)' }]}>
                <IconSymbol size={22} name="creditcard.fill" color={primary} />
              </View>
            </View>
            <ThemedText style={[styles.summaryLabel, { color: textMuted }]}>Presupuesto</ThemedText>
            <View style={styles.summaryAmountRow}>
              <ThemedText style={[styles.summaryAmount, { color: textMain }]}>$1,500</ThemedText>
              <ThemedText style={[styles.summaryAmountCents, { color: textMuted }]}>.00</ThemedText>
            </View>
          </View>
        </View>

        {/* Donut Chart Section */}
        <View style={[styles.chartCard, { backgroundColor: surfaceColor, borderColor }]}>
          <View style={styles.chartCardHeader}>
            <ThemedText style={[styles.chartTitle, { color: textMain }]}>Gastos por Categoría</ThemedText>
            <TouchableOpacity style={styles.chartMoreButton}>
              <IconSymbol size={20} name="ellipsis.vertical" color={primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.donutSection}>
            {/* Donut Chart */}
            <DonutChart surfaceColor={surfaceColor} textMain={textMain} textMuted={textMuted} />

            {/* Legend */}
            <View style={styles.legendContainer}>
              {DONUT_SEGMENTS.map((segment) => (
                <View key={segment.label} style={styles.legendItem}>
                  <View style={styles.legendLeft}>
                    <View style={[styles.legendDot, { backgroundColor: segment.color }]} />
                    <ThemedText style={[styles.legendLabel, { color: textMuted }]}>
                      {segment.label}
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.legendAmount, { color: textMain }]}>
                    {segment.amount}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Bar Chart Section */}
        <View style={[styles.chartCard, { backgroundColor: surfaceColor, borderColor }]}>
          <View style={styles.chartCardHeader}>
            <ThemedText style={[styles.chartTitle, { color: textMain }]}>Tendencia Mensual</ThemedText>
          </View>

          <View style={styles.barChartContainer}>
            {BAR_DATA.map((bar) => (
              <View key={bar.label} style={styles.barColumn}>
                <View style={[styles.barTrack, { backgroundColor: barBg }]}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: `${bar.height}%`,
                        backgroundColor: bar.weekend
                          ? useThemeColor({ light: '#cbd5e1', dark: '#475569' }, 'text')
                          : bar.active
                            ? primary
                            : `rgba(32, 223, 96, ${bar.height / 130})`,
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
    color: '#e11d48',
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
