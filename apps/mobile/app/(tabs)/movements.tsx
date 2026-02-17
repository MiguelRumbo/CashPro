import { ScrollView, View, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useState } from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';

const FILTERS = ['Mes', 'Hoy', 'Semana', 'Año', 'Personalizado'];

type Transaction = {
  id: string;
  name: string;
  time: string;
  category: string;
  amount: string;
  isIncome: boolean;
  icon: React.ComponentProps<typeof IconSymbol>['name'];
  iconColor: string;
  iconBg: string;
};

type Section = {
  title: string;
  data: Transaction[];
};

const SECTIONS: Section[] = [
  {
    title: 'Hoy',
    data: [
      { id: '1', name: 'Supermercado', time: '14:30 PM', category: 'Comestibles', amount: '-$45.00', isIncome: false, icon: 'bag.fill', iconColor: '#ea580c', iconBg: '#ffedd5' },
      { id: '2', name: 'Transferencia recibida', time: '10:15 AM', category: 'Nómina', amount: '+$1,250.00', isIncome: true, icon: 'creditcard.fill', iconColor: '#20df60', iconBg: 'rgba(32, 223, 96, 0.2)' },
      { id: '3', name: 'Starbucks', time: '08:45 AM', category: 'Desayuno', amount: '-$8.50', isIncome: false, icon: 'cup.and.saucer.fill', iconColor: '#b45309', iconBg: '#fef3c7' },
    ],
  },
  {
    title: 'Ayer',
    data: [
      { id: '4', name: 'Gasolinera Shell', time: '18:20 PM', category: 'Transporte', amount: '-$30.00', isIncome: false, icon: 'fuelpump.fill', iconColor: '#2563eb', iconBg: '#dbeafe' },
      { id: '5', name: 'Netflix', time: '09:00 AM', category: 'Suscripción', amount: '-$15.99', isIncome: false, icon: 'film', iconColor: '#dc2626', iconBg: '#fee2e2' },
      { id: '6', name: 'Pago Proyecto Web', time: '09:00 AM', category: 'Freelance', amount: '+$550.00', isIncome: true, icon: 'banknote', iconColor: '#20df60', iconBg: 'rgba(32, 223, 96, 0.2)' },
    ],
  },
  {
    title: '24 Octubre',
    data: [
      { id: '7', name: 'Gimnasio Planet', time: '19:30 PM', category: 'Salud', amount: '-$29.99', isIncome: false, icon: 'dumbbell', iconColor: '#9333ea', iconBg: '#f3e8ff' },
      { id: '8', name: 'Farmacia Central', time: '14:15 PM', category: 'Salud', amount: '-$12.45', isIncome: false, icon: 'cross.case.fill', iconColor: '#0d9488', iconBg: '#ccfbf1' },
    ],
  },
];

export default function MovementsScreen() {
  const [activeFilter, setActiveFilter] = useState('Mes');
  const backgroundColor = useThemeColor({ light: '#ffffff', dark: '#112116' }, 'background');
  const surfaceColor = useThemeColor({ light: '#ffffff', dark: '#112116' }, 'surface');
  const textMain = useThemeColor({ light: '#1F2937', dark: '#ffffff' }, 'text');
  const borderColor = useThemeColor({ light: '#f3f4f6', dark: '#374151' }, 'border');
  const searchBg = useThemeColor({ light: '#f3f4f6', dark: '#374151' }, 'surface');
  const textMuted = '#9CA3AF';
  const primary = '#20df60';

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor, borderBottomColor: borderColor }]}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.headerButton}>
            <IconSymbol size={24} name="arrow.backward" color={textMain} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: textMain }]}>Movimientos</ThemedText>
          <TouchableOpacity style={styles.headerButton}>
            <IconSymbol size={24} name="plus.circle.fill" color={primary} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: searchBg }]}>
          <IconSymbol size={20} name="magnifyingglass" color={textMuted} />
          <TextInput
            style={[styles.searchInput, { color: textMain }]}
            placeholder="Buscar movimientos"
            placeholderTextColor={textMuted}
          />
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
        >
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterChip,
                activeFilter === filter
                  ? styles.filterChipActive
                  : { backgroundColor: searchBg },
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <ThemedText
                style={[
                  styles.filterText,
                  activeFilter === filter
                    ? styles.filterTextActive
                    : { color: useThemeColor({ light: '#4b5563', dark: '#d1d5db' }, 'text') },
                ]}
              >
                {filter}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Transaction List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {SECTIONS.map((section) => (
          <View key={section.title}>
            {/* Date Header */}
            <View style={[styles.dateHeader, { backgroundColor }]}>
              <ThemedText style={styles.dateHeaderText}>
                {section.title}
              </ThemedText>
            </View>

            {/* Transactions */}
            {section.data.map((item, index) => (
              <View key={item.id}>
                <TouchableOpacity style={styles.transactionItem}>
                  <View style={styles.transactionLeft}>
                    <View style={[styles.transactionIcon, { backgroundColor: item.iconBg }]}>
                      <IconSymbol size={24} name={item.icon} color={item.iconColor} />
                    </View>
                    <View style={styles.transactionInfo}>
                      <ThemedText style={[styles.transactionName, { color: textMain }]} numberOfLines={1}>
                        {item.name}
                      </ThemedText>
                      <ThemedText style={[styles.transactionMeta, { color: textMuted }]}>
                        {item.time} • {item.category}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText
                    style={[
                      styles.transactionAmount,
                      { color: item.isIncome ? primary : textMain },
                    ]}
                  >
                    {item.amount}
                  </ThemedText>
                </TouchableOpacity>
                {/* Separator */}
                {index < section.data.length - 1 && (
                  <View style={[styles.separator, { backgroundColor: borderColor }]} />
                )}
              </View>
            ))}
          </View>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab}>
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
    paddingTop: 48,
    borderBottomWidth: 1,
    zIndex: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    padding: 0,
  },
  // Filters
  filtersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 20,
  },
  filterChipActive: {
    backgroundColor: '#20df60',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  // List
  scrollView: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 24,
  },
  dateHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#6b7280',
  },
  // Transaction Item
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: '600',
  },
  transactionMeta: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  separator: {
    height: 1,
    marginLeft: 80,
  },
  // FAB
  fab: {
    position: 'absolute',
    bottom: 88,
    right: 16,
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
