import { useState, useEffect } from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity, TextInput, Modal, Platform, Alert } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { formatCurrencyInput, getNumericValue } from '@/utils/format';
import * as database from '@/services/database';
import { useCurrency } from '@/contexts/CurrencyContext';

type MovementType = 'expense' | 'income' | 'transfer';

type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  bg: string;
};

type Account = {
  id: number;
  name: string;
  type: string;
  balance: number;
  is_primary?: number;
};

type Movement = {
  id: number;
  type: MovementType;
  amount: number;
  title: string;
  category_id: string | null;
  category_name: string | null;
  category_icon: string | null;
  category_color: string | null;
  account_id: number;
  to_account_id: number | null;
  date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  account_name?: string;
  account_type?: string;
};

const CATEGORIES: Category[] = [
  { id: '1', name: 'Comida', icon: 'fork.knife', color: '#ea580c', bg: '#ffedd5' },
  { id: '2', name: 'Comestibles', icon: 'cart.fill', color: '#16a34a', bg: '#dcfce7' },
  { id: '3', name: 'Compras', icon: 'bag.fill', color: '#dc2626', bg: '#fee2e2' },
  { id: '4', name: 'Transporte', icon: 'car.fill', color: '#2563eb', bg: '#dbeafe' },
  { id: '5', name: 'Entretenimiento', icon: 'film', color: '#db2777', bg: '#fce7f3' },
  { id: '6', name: 'Facturas', icon: 'doc.text.fill', color: '#059669', bg: '#d1fae5' },
  { id: '7', name: 'Regalos', icon: 'gift.fill', color: '#dc2626', bg: '#fee2e2' },
  { id: '8', name: 'Belleza', icon: 'sparkles', color: '#d946ef', bg: '#fae8ff' },
  { id: '9', name: 'Trabajo', icon: 'briefcase.fill', color: '#92400e', bg: '#fef3c7' },
  { id: '10', name: 'Viajes', icon: 'airplane', color: '#0891b2', bg: '#cffafe' },
  { id: '11', name: 'Ingreso', icon: 'dollarsign.circle.fill', color: '#ca8a04', bg: '#fef9c3' },
  { id: '12', name: 'Corrección', icon: 'chart.bar.fill', color: '#7c3aed', bg: '#ede9fe' },
];

export default function MovementDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [movement, setMovement] = useState<Movement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { formatCurrency } = useCurrency();

  // Edit state
  const [editType, setEditType] = useState<MovementType>('expense');
  const [editAmount, setEditAmount] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [editToAccount, setEditToAccount] = useState<Account | null>(null);
  const [editDate, setEditDate] = useState(new Date());
  const [accounts, setAccounts] = useState<Account[]>([]);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showToAccountModal, setShowToAccountModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const backgroundColor = useThemeColor({ light: '#f6f8f6', dark: '#0a0f0d' }, 'background');
  const surfaceColor = useThemeColor({ light: '#ffffff', dark: '#1a2c20' }, 'surface');
  const textMain = useThemeColor({ light: '#111713', dark: '#ffffff' }, 'text');
  const textMuted = useThemeColor({ light: '#64748b', dark: '#94a3b8' }, 'text');
  const primary = '#20df60';
  const borderColor = useThemeColor({ light: '#e5e7eb', dark: '#374151' }, 'border');
  const cardBg = useThemeColor({ light: '#ffffff', dark: '#1a2c20' }, 'surface');

  useEffect(() => {
    fetchMovement();
    fetchAccounts();
  }, [id]);

  const fetchMovement = () => {
    try {
      setLoading(true);
      const result = database.getMovementById(Number(id));

      if (result.success) {
        const m = result.data;
        // Enrich with account info
        const accResult = database.getAccountById(m.account_id);
        if (accResult.success) {
          m.account_name = accResult.data.name;
          m.account_type = accResult.data.type;
        }
        setMovement(m);
        populateEditFields(m);
      }
    } catch (error) {
      console.error('Error fetching movement:', error);
      Alert.alert('Error', 'No se pudo cargar el movimiento');
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = () => {
    try {
      const result = database.getAccounts();
      if (result.success) {
        setAccounts(result.data);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const populateEditFields = (m: Movement) => {
    setEditType(m.type);
    setEditAmount(m.amount.toString());
    setEditTitle(m.title);
    setEditNotes(m.notes || '');
    setEditDate(new Date(m.date));

    if (m.category_id) {
      const cat = CATEGORIES.find(c => c.id === m.category_id);
      if (cat) {
        setEditCategory(cat);
      } else {
        setEditCategory({
          id: m.category_id,
          name: m.category_name || '',
          icon: m.category_icon || 'square.grid.2x2',
          color: m.category_color || '#64748b',
          bg: (m.category_color || '#64748b') + '20',
        });
      }
    }
  };

  const handleSave = async () => {
    if (!editAmount || getNumericValue(editAmount) === 0) {
      Alert.alert('Error', 'La cantidad es requerida');
      return;
    }
    if (editType !== 'transfer' && !editCategory) {
      Alert.alert('Error', 'La categoría es requerida');
      return;
    }

    setSaving(true);
    try {
      const updateData: any = {
        type: editType,
        amount: getNumericValue(editAmount),
        title: editTitle.trim() || (editType === 'transfer' ? 'Transferencia' : editCategory?.name),
        date: editDate.toISOString(),
        notes: editNotes.trim(),
      };

      if (editAccount) {
        updateData.account_id = editAccount.id;
      }

      if (editType !== 'transfer' && editCategory) {
        updateData.category_id = editCategory.id;
        updateData.category_name = editCategory.name;
        updateData.category_icon = editCategory.icon;
        updateData.category_color = editCategory.color;
      }

      if (editType === 'transfer' && editToAccount) {
        updateData.to_account_id = editToAccount.id;
      }

      const result = database.updateMovement(Number(id), updateData);

      if (result.success) {
        Alert.alert('Actualizado', 'Movimiento actualizado correctamente. Los balances y presupuestos se han ajustado.', [
          { text: 'OK', onPress: () => { setIsEditing(false); fetchMovement(); } }
        ]);
      } else {
        Alert.alert('Error', result.error || 'No se pudo actualizar');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el movimiento');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Movimiento',
      '¿Estás seguro? Esta acción revertirá el efecto en el balance de la cuenta y los presupuestos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive', onPress: () => {
            try {
              const result = database.deleteMovement(Number(id));
              if (result.success) {
                Alert.alert('Eliminado', 'Movimiento eliminado correctamente', [
                  { text: 'OK', onPress: () => router.back() }
                ]);
              } else {
                Alert.alert('Error', result.error || 'No se pudo eliminar');
              }
            } catch {
              Alert.alert('Error', 'No se pudo eliminar el movimiento');
            }
          }
        },
      ]
    );
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'income': return primary;
      case 'expense': return '#ef4444';
      case 'transfer': return '#3b82f6';
      default: return textMain;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'income': return 'Ingreso';
      case 'expense': return 'Gasto';
      case 'transfer': return 'Transferencia';
      default: return type;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'income': return 'arrow.down';
      case 'expense': return 'arrow.up';
      case 'transfer': return 'arrow.left.arrow.right';
      default: return 'banknote';
    }
  };

  const formatFullDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-MX', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <Stack.Screen options={{ title: 'Detalle', headerStyle: { backgroundColor: surfaceColor }, headerTintColor: textMain }} />
        <View style={styles.loadingContainer}>
          <ThemedText style={{ color: textMuted }}>Cargando...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!movement) {
    return (
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <Stack.Screen options={{ title: 'Detalle', headerStyle: { backgroundColor: surfaceColor }, headerTintColor: textMain }} />
        <View style={styles.loadingContainer}>
          <ThemedText style={{ color: textMuted }}>Movimiento no encontrado</ThemedText>
        </View>
      </ThemedView>
    );
  }

  // VIEW MODE
  if (!isEditing) {
    const typeColor = getTypeColor(movement.type);
    const iconName = movement.category_icon || getTypeIcon(movement.type);
    const iconColor = movement.category_color || typeColor;
    const iconBg = iconColor + '20';

    return (
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <Stack.Screen
          options={{
            title: '',
            headerStyle: { backgroundColor: surfaceColor },
            headerTintColor: textMain,
            headerRight: () => (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.headerBtn}>
                  <IconSymbol size={20} name="pencil" color={primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDelete} style={styles.headerBtn}>
                  <IconSymbol size={20} name="trash" color="#ef4444" />
                </TouchableOpacity>
              </View>
            ),
          }}
        />

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.detailContent} showsVerticalScrollIndicator={false}>
          {/* Amount Hero */}
          <View style={styles.amountHero}>
            <View style={[styles.heroIcon, { backgroundColor: iconBg }]}>
              <IconSymbol size={32} name={iconName as any} color={iconColor} />
            </View>
            <ThemedText style={[styles.heroAmount, { color: textMain }]}>
              {movement.type === 'income' ? '+' : movement.type === 'expense' ? '-' : ''}{formatCurrency(movement.amount)}
            </ThemedText>
            <View style={[styles.typeBadge, { backgroundColor: typeColor + '15' }]}>
              <IconSymbol size={14} name={getTypeIcon(movement.type) as any} color={typeColor} />
              <ThemedText style={[styles.typeBadgeText, { color: typeColor }]}>
                {getTypeLabel(movement.type)}
              </ThemedText>
            </View>
          </View>

          {/* Info Card */}
          <View style={[styles.infoCard, { backgroundColor: cardBg, borderColor }]}>
            <View style={[styles.infoRow, { borderBottomColor: borderColor }]}>
              <View style={styles.infoRowLeft}>
                <IconSymbol size={18} name="text.alignleft" color={textMuted} />
                <ThemedText style={[styles.infoLabel, { color: textMuted }]}>Título</ThemedText>
              </View>
              <ThemedText style={[styles.infoValue, { color: textMain }]}>{movement.title}</ThemedText>
            </View>

            {movement.category_name && (
              <View style={[styles.infoRow, { borderBottomColor: borderColor }]}>
                <View style={styles.infoRowLeft}>
                  <IconSymbol size={18} name="square.grid.2x2" color={textMuted} />
                  <ThemedText style={[styles.infoLabel, { color: textMuted }]}>Categoría</ThemedText>
                </View>
                <View style={styles.categoryBadge}>
                  <View style={[styles.categoryDot, { backgroundColor: movement.category_color || '#64748b' }]} />
                  <ThemedText style={[styles.infoValue, { color: textMain }]}>{movement.category_name}</ThemedText>
                </View>
              </View>
            )}

            <View style={[styles.infoRow, { borderBottomColor: borderColor }]}>
              <View style={styles.infoRowLeft}>
                <IconSymbol size={18} name="creditcard" color={textMuted} />
                <ThemedText style={[styles.infoLabel, { color: textMuted }]}>Cuenta</ThemedText>
              </View>
              <ThemedText style={[styles.infoValue, { color: textMain }]}>{movement.account_name || `Cuenta #${movement.account_id}`}</ThemedText>
            </View>

            <View style={[styles.infoRow, { borderBottomColor: borderColor }]}>
              <View style={styles.infoRowLeft}>
                <IconSymbol size={18} name="calendar" color={textMuted} />
                <ThemedText style={[styles.infoLabel, { color: textMuted }]}>Fecha</ThemedText>
              </View>
              <ThemedText style={[styles.infoValue, { color: textMain }]}>{formatFullDate(movement.date)}</ThemedText>
            </View>

            <View style={[styles.infoRow, { borderBottomColor: borderColor }]}>
              <View style={styles.infoRowLeft}>
                <IconSymbol size={18} name="clock" color={textMuted} />
                <ThemedText style={[styles.infoLabel, { color: textMuted }]}>Hora</ThemedText>
              </View>
              <ThemedText style={[styles.infoValue, { color: textMain }]}>{formatTime(movement.date)}</ThemedText>
            </View>

            {movement.notes ? (
              <View style={styles.notesRow}>
                <View style={styles.infoRowLeft}>
                  <IconSymbol size={18} name="note.text" color={textMuted} />
                  <ThemedText style={[styles.infoLabel, { color: textMuted }]}>Notas</ThemedText>
                </View>
                <ThemedText style={[styles.notesText, { color: textMain }]}>{movement.notes}</ThemedText>
              </View>
            ) : null}
          </View>

          {/* Metadata */}
          <View style={[styles.metaCard, { backgroundColor: cardBg, borderColor }]}>
            <View style={[styles.infoRow, { borderBottomColor: borderColor }]}>
              <ThemedText style={[styles.metaLabel, { color: textMuted }]}>ID</ThemedText>
              <ThemedText style={[styles.metaValue, { color: textMuted }]}>#{movement.id}</ThemedText>
            </View>
            <View style={styles.infoRow}>
              <ThemedText style={[styles.metaLabel, { color: textMuted }]}>Creado</ThemedText>
              <ThemedText style={[styles.metaValue, { color: textMuted }]}>
                {new Date(movement.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
              </ThemedText>
            </View>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity style={[styles.editButton, { backgroundColor: primary }]} onPress={() => setIsEditing(true)}>
            <IconSymbol size={20} name="pencil" color="#fff" />
            <ThemedText style={styles.editButtonText}>Editar Movimiento</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.deleteButton, { borderColor: '#ef4444' }]} onPress={handleDelete}>
            <IconSymbol size={20} name="trash" color="#ef4444" />
            <ThemedText style={[styles.deleteButtonText, { color: '#ef4444' }]}>Eliminar</ThemedText>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </ThemedView>
    );
  }

  // EDIT MODE
  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <Stack.Screen
        options={{
          title: 'Editar Movimiento',
          headerStyle: { backgroundColor: surfaceColor },
          headerTintColor: textMain,
          headerRight: () => (
            <TouchableOpacity onPress={() => { setIsEditing(false); if (movement) populateEditFields(movement); }}>
              <ThemedText style={{ color: '#ef4444', fontWeight: '600' }}>Cancelar</ThemedText>
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.editContent} showsVerticalScrollIndicator={false}>
        {/* Type Selector */}
        <View style={styles.typeSelector}>
          {(['expense', 'income', 'transfer'] as MovementType[]).map((type) => {
            const isActive = editType === type;
            const color = type === 'expense' ? '#ef4444' : type === 'income' ? primary : '#3b82f6';
            const label = type === 'expense' ? 'Gasto' : type === 'income' ? 'Ingreso' : 'Transferir';
            const icon = type === 'expense' ? 'arrow.down' : type === 'income' ? 'arrow.up' : 'arrow.left.arrow.right';
            return (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  { backgroundColor: isActive ? color + '15' : surfaceColor, borderColor: isActive ? color : borderColor, borderWidth: isActive ? 2 : 1 }
                ]}
                onPress={() => setEditType(type)}
              >
                <IconSymbol size={18} name={icon as any} color={isActive ? color : textMuted} />
                <ThemedText style={[styles.typeButtonText, { color: isActive ? color : textMuted }]}>{label}</ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Amount */}
        <View style={[styles.editAmountSection, { backgroundColor: surfaceColor }]}>
          <ThemedText style={[styles.editLabel, { color: textMuted }]}>Cantidad</ThemedText>
          <View style={styles.amountRow}>
            <ThemedText style={[styles.currencySign, { color: textMain }]}>$</ThemedText>
            <TextInput
              style={[styles.amountInput, { color: textMain }]}
              placeholder="0"
              placeholderTextColor={textMuted}
              keyboardType="decimal-pad"
              value={editAmount}
              onChangeText={(t) => setEditAmount(formatCurrencyInput(t))}
            />
          </View>
        </View>

        {/* Category */}
        {editType !== 'transfer' && (
          <TouchableOpacity style={[styles.editField, { backgroundColor: surfaceColor, borderColor }]} onPress={() => setShowCategoryModal(true)}>
            <View style={styles.fieldLeft}>
              {editCategory ? (
                <View style={[styles.fieldIcon, { backgroundColor: editCategory.bg }]}>
                  <IconSymbol size={20} name={editCategory.icon as any} color={editCategory.color} />
                </View>
              ) : (
                <View style={[styles.fieldIcon, { backgroundColor: borderColor }]}>
                  <IconSymbol size={20} name="square.grid.2x2" color={textMuted} />
                </View>
              )}
              <View>
                <ThemedText style={[styles.fieldLabel, { color: textMuted }]}>Categoría</ThemedText>
                <ThemedText style={[styles.fieldValue, { color: textMain }]}>{editCategory?.name || 'Seleccionar'}</ThemedText>
              </View>
            </View>
            <IconSymbol size={20} name="chevron.right" color={textMuted} />
          </TouchableOpacity>
        )}

        {/* Title */}
        <View style={[styles.editField, { backgroundColor: surfaceColor, borderColor }]}>
          <View style={styles.fieldLeft}>
            <View style={[styles.fieldIcon, { backgroundColor: borderColor }]}>
              <IconSymbol size={20} name="text.alignleft" color={textMuted} />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText style={[styles.fieldLabel, { color: textMuted }]}>Título</ThemedText>
              <TextInput
                style={[styles.fieldInput, { color: textMain }]}
                placeholder="Ej: Supermercado"
                placeholderTextColor={textMuted}
                value={editTitle}
                onChangeText={setEditTitle}
              />
            </View>
          </View>
        </View>

        {/* Account */}
        <TouchableOpacity style={[styles.editField, { backgroundColor: surfaceColor, borderColor }]} onPress={() => setShowAccountModal(true)}>
          <View style={styles.fieldLeft}>
            <View style={[styles.fieldIcon, { backgroundColor: borderColor }]}>
              <IconSymbol size={20} name="creditcard" color={textMuted} />
            </View>
            <View>
              <ThemedText style={[styles.fieldLabel, { color: textMuted }]}>{editType === 'transfer' ? 'Desde' : 'Cuenta'}</ThemedText>
              <ThemedText style={[styles.fieldValue, { color: textMain }]}>
                {editAccount?.name || accounts.find(a => a.id === movement?.account_id)?.name || 'Seleccionar'}
              </ThemedText>
            </View>
          </View>
          <IconSymbol size={20} name="chevron.right" color={textMuted} />
        </TouchableOpacity>

        {/* To Account (transfer) */}
        {editType === 'transfer' && (
          <TouchableOpacity style={[styles.editField, { backgroundColor: surfaceColor, borderColor }]} onPress={() => setShowToAccountModal(true)}>
            <View style={styles.fieldLeft}>
              <View style={[styles.fieldIcon, { backgroundColor: borderColor }]}>
                <IconSymbol size={20} name="creditcard.fill" color={textMuted} />
              </View>
              <View>
                <ThemedText style={[styles.fieldLabel, { color: textMuted }]}>Hacia</ThemedText>
                <ThemedText style={[styles.fieldValue, { color: textMain }]}>
                  {editToAccount?.name || accounts.find(a => a.id === movement?.to_account_id)?.name || 'Seleccionar'}
                </ThemedText>
              </View>
            </View>
            <IconSymbol size={20} name="chevron.right" color={textMuted} />
          </TouchableOpacity>
        )}

        {/* Date & Time */}
        <View style={styles.dateTimeRow}>
          <TouchableOpacity style={[styles.dateBtn, { backgroundColor: surfaceColor, borderColor }]} onPress={() => setShowDatePicker(true)}>
            <IconSymbol size={18} name="calendar" color={textMuted} />
            <View>
              <ThemedText style={[styles.fieldLabel, { color: textMuted }]}>Fecha</ThemedText>
              <ThemedText style={[styles.fieldValue, { color: textMain }]}>
                {editDate.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
              </ThemedText>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.dateBtn, { backgroundColor: surfaceColor, borderColor }]} onPress={() => setShowTimePicker(true)}>
            <IconSymbol size={18} name="clock" color={textMuted} />
            <View>
              <ThemedText style={[styles.fieldLabel, { color: textMuted }]}>Hora</ThemedText>
              <ThemedText style={[styles.fieldValue, { color: textMain }]}>
                {editDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
              </ThemedText>
            </View>
          </TouchableOpacity>
        </View>

        {/* Notes */}
        <View style={[styles.notesSection, { backgroundColor: surfaceColor, borderColor }]}>
          <View style={styles.notesHeader}>
            <IconSymbol size={18} name="note.text" color={textMuted} />
            <ThemedText style={[styles.fieldLabel, { color: textMuted }]}>Notas</ThemedText>
          </View>
          <TextInput
            style={[styles.notesInput, { color: textMain }]}
            placeholder="Agregar notas"
            placeholderTextColor={textMuted}
            multiline
            numberOfLines={3}
            value={editNotes}
            onChangeText={setEditNotes}
          />
        </View>

        {/* Warning */}
        <View style={styles.warningBox}>
          <IconSymbol size={18} name="info.circle.fill" color="#f59e0b" />
          <ThemedText style={styles.warningText}>
            Al guardar, los balances de cuentas y presupuestos se ajustarán automáticamente.
          </ThemedText>
        </View>

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: primary, opacity: saving ? 0.6 : 1 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <ThemedText style={styles.saveButtonText}>{saving ? 'Guardando...' : 'Guardar Cambios'}</ThemedText>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker value={editDate} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(e, d) => { setShowDatePicker(false); if (d) setEditDate(d); }} />
      )}
      {showTimePicker && (
        <DateTimePicker value={editDate} mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(e, d) => { setShowTimePicker(false); if (d) { const nd = new Date(editDate); nd.setHours(d.getHours()); nd.setMinutes(d.getMinutes()); setEditDate(nd); } }} />
      )}

      {/* Category Modal */}
      <Modal visible={showCategoryModal} animationType="slide" transparent onRequestClose={() => setShowCategoryModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: surfaceColor }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: textMain }]}>Selecciona Categoría</ThemedText>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <IconSymbol size={24} name="xmark" color={textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.categoriesGrid} showsVerticalScrollIndicator={false}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity key={cat.id} style={styles.categoryItem}
                  onPress={() => { setEditCategory(cat); setShowCategoryModal(false); }}>
                  <View style={[styles.categoryIcon, { backgroundColor: cat.bg }]}>
                    <IconSymbol size={28} name={cat.icon as any} color={cat.color} />
                  </View>
                  <ThemedText style={[styles.categoryName, { color: textMain }]}>{cat.name}</ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Account Modal */}
      <Modal visible={showAccountModal} animationType="slide" transparent onRequestClose={() => setShowAccountModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: surfaceColor }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: textMain }]}>Selecciona Cuenta</ThemedText>
              <TouchableOpacity onPress={() => setShowAccountModal(false)}>
                <IconSymbol size={24} name="xmark" color={textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {accounts.map((acc) => (
                <TouchableOpacity key={acc.id} style={[styles.accountItem, { borderBottomColor: borderColor }]}
                  onPress={() => { setEditAccount(acc); setShowAccountModal(false); }}>
                  <ThemedText style={[styles.accountName, { color: textMain }]}>{acc.name}</ThemedText>
                  <ThemedText style={[styles.accountBalance, { color: textMuted }]}>${acc.balance.toFixed(2)}</ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* To Account Modal */}
      <Modal visible={showToAccountModal} animationType="slide" transparent onRequestClose={() => setShowToAccountModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: surfaceColor }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: textMain }]}>Cuenta Destino</ThemedText>
              <TouchableOpacity onPress={() => setShowToAccountModal(false)}>
                <IconSymbol size={24} name="xmark" color={textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {accounts.filter(a => a.id !== (editAccount?.id || movement?.account_id)).map((acc) => (
                <TouchableOpacity key={acc.id} style={[styles.accountItem, { borderBottomColor: borderColor }]}
                  onPress={() => { setEditToAccount(acc); setShowToAccountModal(false); }}>
                  <ThemedText style={[styles.accountName, { color: textMain }]}>{acc.name}</ThemedText>
                  <ThemedText style={[styles.accountBalance, { color: textMuted }]}>${acc.balance.toFixed(2)}</ThemedText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerBtn: { padding: 8, borderRadius: 20 },
  // Detail View
  detailContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
  amountHero: { alignItems: 'center', paddingVertical: 32, gap: 12 },
  heroIcon: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  heroAmount: { fontSize: 40, fontWeight: '800', letterSpacing: -1.5 },
  typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  typeBadgeText: { fontSize: 14, fontWeight: '600' },
  infoCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  infoRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoLabel: { fontSize: 14, fontWeight: '500' },
  infoValue: { fontSize: 14, fontWeight: '600', maxWidth: 200, textAlign: 'right' },
  categoryBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  categoryDot: { width: 10, height: 10, borderRadius: 5 },
  notesRow: { padding: 16, gap: 8 },
  notesText: { fontSize: 14, lineHeight: 22, paddingLeft: 28 },
  metaCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 24 },
  metaLabel: { fontSize: 13 },
  metaValue: { fontSize: 13 },
  editButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 14, marginBottom: 12 },
  editButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 14, borderWidth: 2 },
  deleteButtonText: { fontSize: 16, fontWeight: '600' },
  // Edit View
  editContent: { padding: 16 },
  typeSelector: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  typeButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12 },
  typeButtonText: { fontSize: 13, fontWeight: '600' },
  editAmountSection: { padding: 24, borderRadius: 16, marginBottom: 16, alignItems: 'center' },
  editLabel: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  amountRow: { flexDirection: 'row', alignItems: 'center' },
  currencySign: { fontSize: 36, fontWeight: '700', marginRight: 4 },
  amountInput: { fontSize: 44, fontWeight: '700', minWidth: 80, textAlign: 'center' },
  editField: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1 },
  fieldLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  fieldIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  fieldLabel: { fontSize: 12, fontWeight: '500', marginBottom: 2 },
  fieldValue: { fontSize: 15, fontWeight: '600' },
  fieldInput: { fontSize: 15, fontWeight: '600', padding: 0, marginTop: 2 },
  dateTimeRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  dateBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 12, borderWidth: 1 },
  notesSection: { padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1 },
  notesHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  notesInput: { fontSize: 14, minHeight: 60, textAlignVertical: 'top' },
  warningBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 16, borderRadius: 12, backgroundColor: 'rgba(245,158,11,0.08)', marginBottom: 20 },
  warningText: { fontSize: 13, lineHeight: 20, color: '#92400e', flex: 1 },
  saveButton: { padding: 16, borderRadius: 14, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 20, paddingBottom: 40, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 16 },
  categoryItem: { width: '22%', alignItems: 'center', gap: 8 },
  categoryIcon: { width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  categoryName: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  accountItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  accountName: { fontSize: 16, fontWeight: '600' },
  accountBalance: { fontSize: 14, fontWeight: '500' },
});
