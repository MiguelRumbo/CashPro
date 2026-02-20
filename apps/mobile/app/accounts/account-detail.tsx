import { useState, useEffect } from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity, Alert, Switch } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as database from '@/services/database';
import { formatCurrency, maskCardNumber } from '@/utils/format';

interface Account {
  id: number;
  name: string;
  type: 'cash' | 'bank' | 'debit' | 'credit';
  balance: number;
  currency: string;
  clabe?: string;
  bank_name?: string;
  card_number?: string;
  card_last_four?: string;
  generates_interest?: number;
  interest_rate?: number;
  credit_limit?: number;
  current_balance?: number;
  cut_off_day?: number;
  payment_due_day?: number;
  include_in_balance?: number;
  is_primary?: number;
  created_at: string;
  updated_at: string;
}

export default function AccountDetailScreen() {
  const params = useLocalSearchParams();
  const accountId = params.id as string;
  
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [includeInBalance, setIncludeInBalance] = useState(true);
  const [isPrimary, setIsPrimary] = useState(false);

  const backgroundColor = useThemeColor({ light: '#f6f8f6', dark: '#112116' }, 'background');
  const surfaceColor = useThemeColor({ light: '#ffffff', dark: '#1c2e24' }, 'surface');
  const textMain = useThemeColor({ light: '#111713', dark: '#ffffff' }, 'text');
  const textSub = '#64876f';
  const primary = '#20df60';
  const borderColor = useThemeColor({ light: '#e5e7eb', dark: '#374151' }, 'border');

  useEffect(() => {
    fetchAccount();
  }, [accountId]);

  const fetchAccount = () => {
    try {
      const result = database.getAccountById(Number(accountId));

      if (result.success) {
        setAccount(result.data);
        setIncludeInBalance(result.data.include_in_balance === 1 || result.data.include_in_balance === undefined);
        setIsPrimary(result.data.is_primary === 1);
      } else {
        Alert.alert('Error', 'No se pudo cargar la cuenta');
        router.back();
      }
    } catch (error) {
      console.error('Error al cargar cuenta:', error);
      Alert.alert('Error', 'No se pudo cargar la cuenta');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'cash': return { name: 'banknote', color: '#16a34a', bg: '#f0fdf4' };
      case 'bank': return { name: 'building.columns.fill', color: '#2563eb', bg: '#eff6ff' };
      case 'debit': return { name: 'creditcard', color: '#7c3aed', bg: '#faf5ff' };
      case 'credit': return { name: 'creditcard.fill', color: '#dc2626', bg: '#fef2f2' };
      default: return { name: 'banknote', color: '#64748b', bg: '#f1f5f9' };
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'cash': return 'Efectivo';
      case 'bank': return 'Banco';
      case 'debit': return 'Débito';
      case 'credit': return 'Crédito';
      default: return type;
    }
  };

  const handleEdit = () => {
    router.push(`/accounts/edit-account?id=${accountId}`);
  };

  const handleToggleIncludeInBalance = (value: boolean) => {
    try {
      const result = database.updateAccount(Number(accountId), { include_in_balance: value ? 1 : 0 });

      if (result.success) {
        setIncludeInBalance(value);
        setAccount(result.data);
        Alert.alert(
          'Actualizado',
          value
            ? 'Esta cuenta ahora se incluye en el balance general'
            : 'Esta cuenta ya no se incluye en el balance general'
        );
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      console.error('Error al actualizar cuenta:', error);
      Alert.alert('Error', 'No se pudo actualizar la configuración');
    }
  };

  const handleTogglePrimary = (value: boolean) => {
    try {
      if (value) {
        // Marcar como principal
        const result = database.setAccountPrimary(Number(accountId));

        if (result.success) {
          setIsPrimary(true);
          setAccount(result.data);
          Alert.alert(
            'Actualizado',
            'Esta cuenta ahora es tu cuenta principal. Los cambios se verán reflejados en el dashboard.',
            [
              {
                text: 'OK',
                onPress: () => {
                  // Forzar recarga del dashboard al regresar
                  router.back();
                }
              }
            ]
          );
        } else {
          Alert.alert('Error', result.error);
        }
      } else {
        // Desmarcar como principal
        const result = database.updateAccount(Number(accountId), { is_primary: 0 });

        if (result.success) {
          setIsPrimary(false);
          setAccount(result.data);
          Alert.alert('Actualizado', 'Esta cuenta ya no es la principal');
        } else {
          Alert.alert('Error', result.error);
        }
      }
    } catch (error) {
      console.error('Error al establecer cuenta principal:', error);
      Alert.alert('Error', 'No se pudo actualizar la cuenta principal');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Cuenta',
      `¿Estás seguro de eliminar "${account?.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            try {
              const result = database.deleteAccount(Number(accountId));

              if (result.success) {
                router.back();
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

  if (loading || !account) {
    return (
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <Stack.Screen options={{ title: 'Cargando...' }} />
        <View style={styles.loadingContainer}>
          <ThemedText style={{ color: textSub }}>Cargando...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const iconData = getAccountIcon(account.type);
  const isCredit = account.type === 'credit';
  const displayBalance = isCredit ? account.current_balance || 0 : account.balance;

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <Stack.Screen
        options={{
          title: account.name,
          headerStyle: { backgroundColor: surfaceColor },
          headerTintColor: textMain,
          headerRight: () => (
            <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
              <IconSymbol size={22} name="pencil" color={primary} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance Card */}
        <View style={[styles.balanceCard, { backgroundColor: iconData.bg }]}>
          <View style={[styles.iconLarge, { backgroundColor: surfaceColor }]}>
            <IconSymbol size={48} name={iconData.name as any} color={iconData.color} />
          </View>
          <ThemedText style={[styles.balanceLabel, { color: textSub }]}>
            {isCredit ? 'Saldo Actual (Deuda)' : 'Balance Disponible'}
          </ThemedText>
          <ThemedText style={[styles.balanceAmount, { color: isCredit ? '#dc2626' : textMain }]}>
            {isCredit ? '-' : ''}{formatCurrency(displayBalance)}
          </ThemedText>
          {isCredit && account.credit_limit && (
            <ThemedText style={[styles.creditLimit, { color: textSub }]}>
              Límite: {formatCurrency(account.credit_limit)}
            </ThemedText>
          )}
        </View>

        {/* Información General */}
        <View style={[styles.section, { backgroundColor: surfaceColor }]}>
          <ThemedText style={[styles.sectionTitle, { color: textMain }]}>
            Información General
          </ThemedText>

          {/* Toggle Cuenta Principal */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <ThemedText style={[styles.toggleTitle, { color: textMain }]}>
                Cuenta Principal
              </ThemedText>
              <ThemedText style={[styles.toggleDescription, { color: textSub }]}>
                {isPrimary 
                  ? 'Esta es tu cuenta principal para transacciones' 
                  : 'Marca como principal para usar por defecto'}
              </ThemedText>
            </View>
            <Switch
              value={isPrimary}
              onValueChange={handleTogglePrimary}
              trackColor={{ false: '#d1d5db', true: primary }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: borderColor }]} />

          <View style={styles.infoRow}>
            <ThemedText style={[styles.infoLabel, { color: textSub }]}>Tipo de Cuenta</ThemedText>
            <ThemedText style={[styles.infoValue, { color: textMain }]}>
              {getTypeLabel(account.type)}
            </ThemedText>
          </View>

          <View style={[styles.divider, { backgroundColor: borderColor }]} />

          <View style={styles.infoRow}>
            <ThemedText style={[styles.infoLabel, { color: textSub }]}>Moneda</ThemedText>
            <ThemedText style={[styles.infoValue, { color: textMain }]}>
              {account.currency}
            </ThemedText>
          </View>

          {account.bank_name && (
            <>
              <View style={[styles.divider, { backgroundColor: borderColor }]} />
              <View style={styles.infoRow}>
                <ThemedText style={[styles.infoLabel, { color: textSub }]}>Banco</ThemedText>
                <ThemedText style={[styles.infoValue, { color: textMain }]}>
                  {account.bank_name}
                </ThemedText>
              </View>
            </>
          )}

          {account.card_number && (
            <>
              <View style={[styles.divider, { backgroundColor: borderColor }]} />
              <View style={styles.infoRow}>
                <ThemedText style={[styles.infoLabel, { color: textSub }]}>Tarjeta</ThemedText>
                <ThemedText style={[styles.infoValue, { color: textMain }]}>
                  {maskCardNumber(account.card_number)}
                </ThemedText>
              </View>
            </>
          )}

          {account.clabe && (
            <>
              <View style={[styles.divider, { backgroundColor: borderColor }]} />
              <View style={styles.infoRow}>
                <ThemedText style={[styles.infoLabel, { color: textSub }]}>CLABE</ThemedText>
                <ThemedText style={[styles.infoValue, { color: textMain }]}>
                  {account.clabe}
                </ThemedText>
              </View>
            </>
          )}
        </View>

        {/* Información de Interés */}
        {account.generates_interest === 1 && (
          <View style={[styles.section, { backgroundColor: surfaceColor }]}>
            <ThemedText style={[styles.sectionTitle, { color: textMain }]}>
              Información de Interés
            </ThemedText>

            <View style={styles.infoRow}>
              <ThemedText style={[styles.infoLabel, { color: textSub }]}>Tasa de Interés</ThemedText>
              <ThemedText style={[styles.infoValue, { color: primary }]}>
                {account.interest_rate}%
              </ThemedText>
            </View>
          </View>
        )}

        {/* Información de Crédito */}
        {isCredit && (
          <>
            <View style={[styles.section, { backgroundColor: surfaceColor }]}>
              <ThemedText style={[styles.sectionTitle, { color: textMain }]}>
                Información de Crédito
              </ThemedText>

              <View style={styles.infoRow}>
                <ThemedText style={[styles.infoLabel, { color: textSub }]}>Límite de Crédito</ThemedText>
                <ThemedText style={[styles.infoValue, { color: textMain }]}>
                  {formatCurrency(account.credit_limit || 0)}
                </ThemedText>
              </View>

              <View style={[styles.divider, { backgroundColor: borderColor }]} />

              <View style={styles.infoRow}>
                <ThemedText style={[styles.infoLabel, { color: textSub }]}>Crédito Disponible</ThemedText>
                <ThemedText style={[styles.infoValue, { color: primary }]}>
                  {formatCurrency((account.credit_limit || 0) - (account.current_balance || 0))}
                </ThemedText>
              </View>

              <View style={[styles.divider, { backgroundColor: borderColor }]} />

              <View style={styles.infoRow}>
                <ThemedText style={[styles.infoLabel, { color: textSub }]}>Día de Corte</ThemedText>
                <ThemedText style={[styles.infoValue, { color: textMain }]}>
                  {account.cut_off_day}
                </ThemedText>
              </View>

              <View style={[styles.divider, { backgroundColor: borderColor }]} />

              <View style={styles.infoRow}>
                <ThemedText style={[styles.infoLabel, { color: textSub }]}>Día de Pago</ThemedText>
                <ThemedText style={[styles.infoValue, { color: textMain }]}>
                  {account.payment_due_day}
                </ThemedText>
              </View>
            </View>

            {/* Toggle para incluir en balance */}
            <View style={[styles.section, { backgroundColor: surfaceColor }]}>
              <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                  <ThemedText style={[styles.toggleTitle, { color: textMain }]}>
                    Incluir en Balance General
                  </ThemedText>
                  <ThemedText style={[styles.toggleDescription, { color: textSub }]}>
                    {includeInBalance 
                      ? 'La deuda de esta tarjeta se resta del balance total' 
                      : 'La deuda de esta tarjeta no afecta el balance total'}
                  </ThemedText>
                </View>
                <Switch
                  value={includeInBalance}
                  onValueChange={handleToggleIncludeInBalance}
                  trackColor={{ false: '#d1d5db', true: primary }}
                  thumbColor="#ffffff"
                />
              </View>
            </View>
          </>
        )}

        {/* Botón Eliminar */}
        <TouchableOpacity
          style={[styles.deleteButton, { borderColor: '#dc2626' }]}
          onPress={handleDelete}
        >
          <IconSymbol size={20} name="trash" color="#dc2626" />
          <ThemedText style={styles.deleteButtonText}>Eliminar Cuenta</ThemedText>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    marginRight: 16,
    padding: 8,
  },
  balanceCard: {
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  iconLarge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -1,
  },
  creditLimit: {
    fontSize: 14,
    marginTop: 8,
  },
  section: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginTop: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
  },
});
