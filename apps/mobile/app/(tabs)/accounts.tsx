import { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_CONFIG } from '@/config/api';
import { formatCurrency } from '@/utils/format';

interface Account {
  id: number;
  name: string;
  type: 'cash' | 'bank' | 'debit' | 'credit';
  balance: number;
  currency: string;
  card_last_four?: string;
  bank_name?: string;
  credit_limit?: number;
  current_balance?: number;
  cut_off_day?: number;
  payment_due_day?: number;
}

export default function AccountsScreen() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const backgroundColor = useThemeColor({ light: '#f6f8f6', dark: '#112116' }, 'background');
  const surfaceColor = useThemeColor({ light: '#ffffff', dark: '#1c2e24' }, 'surface');
  const textMain = useThemeColor({ light: '#111713', dark: '#ffffff' }, 'text');
  const borderColor = useThemeColor({ light: '#f3f4f6', dark: '#374151' }, 'border');
  const textSub = '#64876f';
  const primary = '#20df60';

  const fetchAccounts = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/accounts`);
      const result = await response.json();
      
      if (result.success) {
        setAccounts(result.data);
      }
    } catch (error) {
      console.error('Error al cargar cuentas:', error);
      Alert.alert('Error', 'No se pudieron cargar las cuentas. Verifica que el servidor esté corriendo.');
    }
  };

  const fetchTotalBalance = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/accounts/stats/total-balance`);
      const result = await response.json();
      
      if (result.success) {
        setTotalBalance(result.data.total_balance);
      }
    } catch (error) {
      console.error('Error al cargar balance:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchAccounts(), fetchTotalBalance()]);
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchAccounts();
      fetchTotalBalance();
    }, [])
  );

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'cash': return { name: 'banknote', color: '#16a34a', bg: '#f0fdf4' };
      case 'bank': return { name: 'building.columns.fill', color: '#2563eb', bg: '#eff6ff' };
      case 'debit': return { name: 'creditcard', color: '#7c3aed', bg: '#faf5ff' };
      case 'credit': return { name: 'creditcard.fill', color: '#dc2626', bg: '#fef2f2' };
      default: return { name: 'banknote', color: '#64748b', bg: '#f1f5f9' };
    }
  };

  const formatCurrencyLocal = (amount: number) => {
    return formatCurrency(amount);
  };

  const handleDeleteAccount = (id: number, name: string) => {
    Alert.alert(
      'Eliminar Cuenta',
      `¿Estás seguro de eliminar "${name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_CONFIG.BASE_URL}/accounts/${id}`, {
                method: 'DELETE',
              });
              const result = await response.json();
              
              if (result.success) {
                fetchAccounts();
                fetchTotalBalance();
              } else {
                Alert.alert('Error', result.error);
              }
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la cuenta');
            }
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor, borderBottomColor: borderColor }]}>
        <View>
          <ThemedText style={[styles.headerTitle, { color: textMain }]}>Mis Cuentas</ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: textSub }]}>Gestión financiera</ThemedText>
        </View>
        <TouchableOpacity style={[styles.notificationButton, { backgroundColor: surfaceColor }]}>
          <IconSymbol size={20} name="bell.fill" color={textMain} />
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
        {/* Total Balance Card */}
        <View style={styles.balanceCard}>
          {/* Decorative glows */}
          <View style={styles.balanceGlowTopRight} />
          <View style={styles.balanceGlowBottomLeft} />
          <View style={styles.balanceContent}>
            <ThemedText style={styles.balanceLabel}>Balance Total</ThemedText>
            <ThemedText style={styles.balanceAmount}>{formatCurrencyLocal(totalBalance)}</ThemedText>
            <View style={styles.balanceBadge}>
              <IconSymbol size={14} name="arrow.up.right" color={primary} />
              <ThemedText style={styles.balanceBadgeText}>{accounts.length} cuenta{accounts.length !== 1 ? 's' : ''}</ThemedText>
            </View>
          </View>
        </View>

        {/* Action Bar */}
        <View style={styles.actionBar}>
          <ThemedText style={[styles.sectionTitle, { color: textMain }]}>Cuentas Activas</ThemedText>
          <TouchableOpacity>
            <ThemedText style={[styles.linkText, { color: primary }]}>Ver todo</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Account List */}
        <View style={styles.accountList}>
          {accounts.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol size={48} name="tray" color={textSub} />
              <ThemedText style={[styles.emptyText, { color: textSub }]}>
                No tienes cuentas registradas
              </ThemedText>
              <ThemedText style={[styles.emptySubtext, { color: textSub }]}>
                Agrega tu primera cuenta para comenzar
              </ThemedText>
            </View>
          ) : (
            accounts.map((account) => {
              const iconData = getAccountIcon(account.type);
              const isCredit = account.type === 'credit';
              const displayBalance = isCredit ? account.current_balance || 0 : account.balance;
              
              return (
                <TouchableOpacity
                  key={account.id}
                  style={[styles.accountItem, { backgroundColor: surfaceColor }]}
                  onPress={() => router.push(`/account-detail?id=${account.id}`)}
                  onLongPress={() => handleDeleteAccount(account.id, account.name)}
                >
                  <View style={[styles.accountIcon, { backgroundColor: iconData.bg }]}>
                    <IconSymbol size={24} name={iconData.name as any} color={iconData.color} />
                  </View>
                  <View style={styles.accountInfo}>
                    <ThemedText style={[styles.accountName, { color: textMain }]}>
                      {account.name}
                    </ThemedText>
                    <ThemedText style={[styles.accountDetail, { color: textSub }]}>
                      {account.card_last_four 
                        ? `•••• ${account.card_last_four}`
                        : account.bank_name || 'Efectivo'}
                    </ThemedText>
                  </View>
                  <View style={styles.accountRight}>
                    <ThemedText 
                      style={[
                        isCredit ? styles.accountAmountNegative : styles.accountAmount,
                        { color: isCredit ? '#ef4444' : textMain }
                      ]}
                    >
                      {isCredit ? '-' : ''}{formatCurrencyLocal(displayBalance)}
                    </ThemedText>
                    {isCredit && account.credit_limit && (
                      <ThemedText style={[styles.accountSubDetail, { color: textSub }]}>
                        Límite: {formatCurrencyLocal(account.credit_limit)}
                      </ThemedText>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Add Account Button */}
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/add-account')}
        >
          <IconSymbol size={24} name="plus.circle.fill" color="white" />
          <ThemedText style={styles.addButtonText}>Agregar nueva cuenta</ThemedText>
        </TouchableOpacity>

        {/* Footer Text */}
        <ThemedText style={[styles.footerText, { color: textSub }]}>
          Puedes vincular tus cuentas bancarias de forma segura o agregar registros manuales.
        </ThemedText>

        {/* Bottom spacer */}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 16,
    borderBottomWidth: 1,
    zIndex: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 2,
  },
  // Scroll
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  // Balance Card
  balanceCard: {
    marginTop: 16,
    marginBottom: 24,
    borderRadius: 16,
    backgroundColor: '#111713',
    padding: 24,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#20df60',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
  },
  balanceGlowTopRight: {
    position: 'absolute',
    top: -16,
    right: -16,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(32, 223, 96, 0.2)',
  },
  balanceGlowBottomLeft: {
    position: 'absolute',
    bottom: -16,
    left: -16,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(32, 223, 96, 0.3)',
  },
  balanceContent: {
    zIndex: 10,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -1,
    marginBottom: 8,
  },
  balanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  balanceBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#20df60',
  },
  // Action Bar
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Account List
  accountList: {
    gap: 16,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  accountItemDashed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(249, 250, 251, 0.5)',
    opacity: 0.85,
  },
  accountIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
  },
  accountDetail: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  accountRight: {
    alignItems: 'flex-end',
  },
  accountAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  accountAmountNegative: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ef4444',
  },
  accountSubDetail: {
    fontSize: 12,
    marginTop: 2,
  },
  accountWarning: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(239, 68, 68, 0.7)',
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: 'rgba(32, 223, 96, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#20df60',
  },
  progressBarSmall: {
    width: 64,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFillSmall: {
    width: '75%',
    height: '100%',
    backgroundColor: '#fb923c',
  },
  // Add Button
  addButton: {
    marginTop: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#20df60',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#20df60',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  // Footer
  footerText: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 32,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});
