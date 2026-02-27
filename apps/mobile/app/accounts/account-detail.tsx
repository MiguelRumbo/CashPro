import { useState, useEffect } from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity, Alert, Switch, Modal, TextInput } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as database from '@/services/database';
import { formatCurrency, maskCardNumber } from '@/utils/format';
import { useCurrency } from '@/contexts/CurrencyContext';

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
  const [msiPurchases, setMsiPurchases] = useState<any[]>([]);
  const [showMsiModal, setShowMsiModal] = useState(false);
  const [msiDescription, setMsiDescription] = useState('');
  const [msiAmount, setMsiAmount] = useState('');
  const [msiInstallments, setMsiInstallments] = useState('');
  const { formatCurrency: formatCurrencyCtx } = useCurrency();

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

  const fetchMsiPurchases = () => {
    try {
      const result = database.getMsiPurchases(Number(accountId));
      if (result.success) {
        setMsiPurchases(result.data);
      }
    } catch (error) {
      console.error('Error al cargar MSI:', error);
    }
  };

  useEffect(() => {
    if (account?.type === 'credit') {
      fetchMsiPurchases();
    }
  }, [account?.type]);

  const handleAddMsi = () => {
    if (!msiDescription.trim() || !msiAmount || !msiInstallments) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }

    const totalAmount = parseFloat(msiAmount);
    const installments = parseInt(msiInstallments);

    if (totalAmount <= 0 || installments <= 0) {
      Alert.alert('Error', 'Los valores deben ser mayores a 0');
      return;
    }

    try {
      const result = database.createMsiPurchase({
        account_id: Number(accountId),
        description: msiDescription.trim(),
        total_amount: totalAmount,
        installments,
        start_date: new Date().toISOString(),
      });

      if (result.success) {
        setShowMsiModal(false);
        setMsiDescription('');
        setMsiAmount('');
        setMsiInstallments('');
        fetchAccount();
        fetchMsiPurchases();
      } else {
        Alert.alert('Error', result.error || 'No se pudo registrar');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo registrar la compra MSI');
    }
  };

  const handleDeleteMsi = (id: number, desc: string) => {
    Alert.alert(
      'Eliminar MSI',
      `¿Eliminar "${desc}"? Se revertirá el monto restante al crédito disponible.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            try {
              const result = database.deleteMsiPurchase(id);
              if (result.success) {
                fetchAccount();
                fetchMsiPurchases();
              } else {
                Alert.alert('Error', result.error || 'No se pudo eliminar');
              }
            } catch {
              Alert.alert('Error', 'No se pudo eliminar');
            }
          },
        },
      ]
    );
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
  const creditAvailable = isCredit ? (account.credit_limit || 0) - (account.current_balance || 0) : 0;
  const displayBalance = isCredit ? creditAvailable : account.balance;

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
            {isCredit ? 'Crédito Disponible' : 'Balance Disponible'}
          </ThemedText>
          <ThemedText style={[styles.balanceAmount, { color: isCredit ? primary : textMain }]}>
            {formatCurrency(displayBalance)}
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
                  {formatCurrency(creditAvailable)}
                </ThemedText>
              </View>

              <View style={[styles.divider, { backgroundColor: borderColor }]} />

              <View style={styles.infoRow}>
                <ThemedText style={[styles.infoLabel, { color: textSub }]}>Crédito Utilizado</ThemedText>
                <ThemedText style={[styles.infoValue, { color: '#dc2626' }]}>
                  {formatCurrency(account.current_balance || 0)}
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
                      ? 'El crédito disponible se suma al balance total' 
                      : 'El crédito disponible no afecta el balance total'}
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

        {/* MSI Purchases - Solo para crédito */}
        {isCredit && (
          <View style={[styles.section, { backgroundColor: surfaceColor }]}>
            <View style={styles.msiHeader}>
              <ThemedText style={[styles.sectionTitle, { color: textMain }]}>
                Compras a MSI
              </ThemedText>
              <TouchableOpacity
                style={[styles.msiAddButton, { backgroundColor: primary }]}
                onPress={() => setShowMsiModal(true)}
              >
                <IconSymbol size={16} name="plus" color="#ffffff" />
                <ThemedText style={styles.msiAddButtonText}>Agregar</ThemedText>
              </TouchableOpacity>
            </View>

            {msiPurchases.length === 0 ? (
              <View style={styles.msiEmpty}>
                <IconSymbol size={32} name="creditcard" color={textSub} />
                <ThemedText style={[styles.msiEmptyText, { color: textSub }]}>
                  No hay compras a MSI
                </ThemedText>
              </View>
            ) : (
              msiPurchases.map((msi) => {
                const progress = msi.installments > 0
                  ? ((msi.paid_installments) / msi.installments) * 100
                  : 0;
                return (
                  <TouchableOpacity
                    key={msi.id}
                    style={[styles.msiItem, { borderColor }]}
                    onLongPress={() => handleDeleteMsi(msi.id, msi.description)}
                  >
                    <View style={styles.msiItemHeader}>
                      <ThemedText style={[styles.msiItemTitle, { color: textMain }]}>
                        {msi.description}
                      </ThemedText>
                      <ThemedText style={[styles.msiItemAmount, { color: textMain }]}>
                        {formatCurrency(msi.total_amount)}
                      </ThemedText>
                    </View>
                    <View style={styles.msiItemDetails}>
                      <ThemedText style={[styles.msiItemDetail, { color: textSub }]}>
                        {formatCurrency(msi.monthly_payment)}/mes x {msi.installments} meses
                      </ThemedText>
                      <ThemedText style={[styles.msiItemDetail, { color: textSub }]}>
                        {msi.paid_installments}/{msi.installments} pagados
                      </ThemedText>
                    </View>
                    <View style={[styles.msiProgressBar, { backgroundColor: borderColor }]}>
                      <View
                        style={[
                          styles.msiProgressFill,
                          { width: `${Math.min(progress, 100)}%`, backgroundColor: primary }
                        ]}
                      />
                    </View>
                    <ThemedText style={[styles.msiRemaining, { color: '#dc2626' }]}>
                      Restante: {formatCurrency(msi.remaining_amount)}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
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

      {/* Modal MSI */}
      <Modal visible={showMsiModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: surfaceColor }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: textMain }]}>
                Nueva Compra MSI
              </ThemedText>
              <TouchableOpacity onPress={() => setShowMsiModal(false)}>
                <IconSymbol name="xmark" size={24} color={textSub} />
              </TouchableOpacity>
            </View>

            <ThemedText style={[styles.modalLabel, { color: textMain }]}>Descripción</ThemedText>
            <TextInput
              style={[styles.modalInput, { backgroundColor, borderColor, color: textMain }]}
              value={msiDescription}
              onChangeText={setMsiDescription}
              placeholder="Ej: Laptop, Televisión"
              placeholderTextColor={textSub}
            />

            <ThemedText style={[styles.modalLabel, { color: textMain }]}>Monto Total</ThemedText>
            <TextInput
              style={[styles.modalInput, { backgroundColor, borderColor, color: textMain }]}
              value={msiAmount}
              onChangeText={setMsiAmount}
              placeholder="0.00"
              placeholderTextColor={textSub}
              keyboardType="decimal-pad"
            />

            <ThemedText style={[styles.modalLabel, { color: textMain }]}>Número de Meses</ThemedText>
            <View style={styles.msiMonthsGrid}>
              {[3, 6, 9, 12, 18, 24].map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[
                    styles.msiMonthChip,
                    {
                      backgroundColor: msiInstallments === n.toString() ? primary + '20' : backgroundColor,
                      borderColor: msiInstallments === n.toString() ? primary : borderColor,
                    },
                  ]}
                  onPress={() => setMsiInstallments(n.toString())}
                >
                  <ThemedText
                    style={[
                      styles.msiMonthChipText,
                      { color: msiInstallments === n.toString() ? primary : textSub },
                    ]}
                  >
                    {n}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            {msiAmount && msiInstallments ? (
              <View style={[styles.msiPreview, { backgroundColor: primary + '10', borderColor: primary + '30' }]}>
                <ThemedText style={[styles.msiPreviewText, { color: primary }]}>
                  Mensualidad: {formatCurrency(parseFloat(msiAmount) / parseInt(msiInstallments))}
                </ThemedText>
              </View>
            ) : null}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: borderColor }]}
                onPress={() => setShowMsiModal(false)}
              >
                <ThemedText style={[styles.modalButtonText, { color: textMain }]}>Cancelar</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: primary }]}
                onPress={handleAddMsi}
              >
                <ThemedText style={[styles.modalButtonText, { color: '#ffffff' }]}>Guardar</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  // MSI styles
  msiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  msiAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  msiAddButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  msiEmpty: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  msiEmptyText: {
    fontSize: 14,
  },
  msiItem: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  msiItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  msiItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  msiItemAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  msiItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  msiItemDetail: {
    fontSize: 12,
  },
  msiProgressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  msiProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  msiRemaining: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 4,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  msiMonthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  msiMonthChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 56,
    alignItems: 'center',
  },
  msiMonthChipText: {
    fontSize: 15,
    fontWeight: '600',
  },
  msiPreview: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    alignItems: 'center',
  },
  msiPreviewText: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
