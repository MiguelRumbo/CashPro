import { ScrollView, View, StyleSheet, TouchableOpacity, TextInput, RefreshControl, Alert } from 'react-native';
import { useState, useCallback, useEffect } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_CONFIG } from '@/config/api';
import { useCurrency } from '@/contexts/CurrencyContext';

const FILTERS = ['Mes', 'Hoy', 'Semana', 'Año', 'Personalizado'];

type Transaction = {
  id: number;
  type: 'expense' | 'income' | 'transfer';
  amount: number;
  title: string;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  account_name?: string;
  account_type?: string;
  date: string;
  notes?: string;
};

type Section = {
  title: string;
  data: Transaction[];
};

export default function MovementsScreen() {
  const [activeFilter, setActiveFilter] = useState('Mes');
  const [movements, setMovements] = useState<Transaction[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { formatCurrency } = useCurrency();
  
  const backgroundColor = useThemeColor({ light: '#ffffff', dark: '#112116' }, 'background');
  const surfaceColor = useThemeColor({ light: '#ffffff', dark: '#112116' }, 'surface');
  const textMain = useThemeColor({ light: '#1F2937', dark: '#ffffff' }, 'text');
  const borderColor = useThemeColor({ light: '#f3f4f6', dark: '#374151' }, 'border');
  const searchBg = useThemeColor({ light: '#f3f4f6', dark: '#374151' }, 'surface');
  const textMuted = '#9CA3AF';
  const primary = '#20df60';

  useFocusEffect(
    useCallback(() => {
      fetchMovements();
    }, [])
  );

  useEffect(() => {
    applyFilters();
  }, [movements, activeFilter, searchQuery]);

  const fetchMovements = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/movements`);
      const result = await response.json();
      
      if (result.success) {
        setMovements(result.data);
      }
    } catch (error) {
      console.error('Error al cargar movimientos:', error);
      Alert.alert('Error', 'No se pudieron cargar los movimientos');
    }
  };

  const applyFilters = () => {
    let filtered = [...movements];

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m => 
        m.title.toLowerCase().includes(query) ||
        (m.category_name && m.category_name.toLowerCase().includes(query)) ||
        (m.notes && m.notes.toLowerCase().includes(query))
      );
    }

    // Filtrar por fecha
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (activeFilter) {
      case 'Hoy':
        filtered = filtered.filter(m => {
          const movementDate = new Date(m.date);
          const movementDay = new Date(movementDate.getFullYear(), movementDate.getMonth(), movementDate.getDate());
          return movementDay.getTime() === today.getTime();
        });
        break;
      
      case 'Semana':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        filtered = filtered.filter(m => {
          const movementDate = new Date(m.date);
          return movementDate >= weekAgo && movementDate <= now;
        });
        break;
      
      case 'Mes':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        filtered = filtered.filter(m => {
          const movementDate = new Date(m.date);
          return movementDate >= monthStart && movementDate <= now;
        });
        break;
      
      case 'Año':
        const yearStart = new Date(now.getFullYear(), 0, 1);
        filtered = filtered.filter(m => {
          const movementDate = new Date(m.date);
          return movementDate >= yearStart && movementDate <= now;
        });
        break;
      
      case 'Personalizado':
        // Por ahora mostrar todos, después se puede agregar un date picker
        break;
    }

    setFilteredMovements(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMovements();
    setRefreshing(false);
  };

  const groupMovementsByDate = (): Section[] => {
    const groups: { [key: string]: Transaction[] } = {};
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    filteredMovements.forEach((movement) => {
      const movementDate = new Date(movement.date);
      let dateKey: string;

      if (movementDate.toDateString() === today.toDateString()) {
        dateKey = 'Hoy';
      } else if (movementDate.toDateString() === yesterday.toDateString()) {
        dateKey = 'Ayer';
      } else {
        dateKey = movementDate.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' });
      }

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(movement);
    });

    return Object.keys(groups).map(key => ({
      title: key,
      data: groups[key]
    }));
  };

  const getMovementIcon = (movement: Transaction) => {
    if (movement.type === 'transfer') {
      return { name: 'arrow.left.arrow.right', color: '#3b82f6', bg: '#dbeafe' };
    }
    
    if (movement.category_icon && movement.category_color) {
      const bgColor = movement.category_color + '20';
      return { name: movement.category_icon, color: movement.category_color, bg: bgColor };
    }

    return movement.type === 'income'
      ? { name: 'arrow.down', color: primary, bg: 'rgba(32, 223, 96, 0.2)' }
      : { name: 'arrow.up', color: '#ef4444', bg: '#fee2e2' };
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  };

  const sections = groupMovementsByDate();

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor, borderBottomColor: borderColor }]}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <View style={styles.headerButton} />
          <ThemedText style={[styles.headerTitle, { color: textMain }]}>Movimientos</ThemedText>
          <View style={styles.headerButton} />
        </View>

        {/* Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: searchBg }]}>
          <IconSymbol size={20} name="magnifyingglass" color={textMuted} />
          <TextInput
            style={[styles.searchInput, { color: textMain }]}
            placeholder="Buscar movimientos"
            placeholderTextColor={textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <IconSymbol size={18} name="xmark.circle.fill" color={textMuted} />
            </TouchableOpacity>
          )}
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />
        }
      >
        {sections.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol size={64} name="tray" color={textMuted} />
            <ThemedText style={[styles.emptyText, { color: textMuted }]}>
              No hay movimientos
            </ThemedText>
            <ThemedText style={[styles.emptySubtext, { color: textMuted }]}>
              Agrega tu primer movimiento
            </ThemedText>
          </View>
        ) : (
          sections.map((section) => (
            <View key={section.title}>
              {/* Date Header */}
              <View style={[styles.dateHeader, { backgroundColor }]}>
                <ThemedText style={styles.dateHeaderText}>
                  {section.title}
                </ThemedText>
              </View>

              {/* Transactions */}
              {section.data.map((item, index) => {
                const iconData = getMovementIcon(item);
                const isIncome = item.type === 'income';
                const isTransfer = item.type === 'transfer';
                const isCreditCard = item.account_type === 'credit';
                
                return (
                  <View key={item.id}>
                    <TouchableOpacity style={styles.transactionItem} onPress={() => router.push(`/movements/movement-detail?id=${item.id}`)}>
                      <View style={styles.transactionLeft}>
                        <View style={[styles.transactionIcon, { backgroundColor: iconData.bg }]}>
                          <IconSymbol size={24} name={iconData.name as any} color={iconData.color} />
                        </View>
                        <View style={styles.transactionInfo}>
                          <View style={styles.transactionTitleRow}>
                            <ThemedText style={[styles.transactionName, { color: textMain }]} numberOfLines={1}>
                              {item.title}
                            </ThemedText>
                            {isCreditCard && (
                              <View style={styles.creditBadge}>
                                <IconSymbol size={12} name="creditcard.fill" color="#dc2626" />
                              </View>
                            )}
                          </View>
                          <ThemedText style={[styles.transactionMeta, { color: textMuted }]}>
                            {formatTime(item.date)} • {item.category_name || (isTransfer ? 'Transferencia' : 'Sin categoría')}
                            {item.account_name && ` • ${item.account_name}`}
                          </ThemedText>
                        </View>
                      </View>
                      <ThemedText
                        style={[
                          styles.transactionAmount,
                          { color: isIncome ? primary : isTransfer ? '#3b82f6' : textMain },
                        ]}
                        numberOfLines={1}
                      >
                        {isIncome ? '+' : isTransfer ? '' : '-'}{formatCurrency(item.amount)}
                      </ThemedText>
                    </TouchableOpacity>
                    {/* Separator */}
                    {index < section.data.length - 1 && (
                      <View style={[styles.separator, { backgroundColor: borderColor }]} />
                    )}
                  </View>
                );
              })}
            </View>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
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
  transactionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  creditBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
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
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
  },
  // FAB
  fab: {
    position: 'absolute',
    bottom: 120,
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
