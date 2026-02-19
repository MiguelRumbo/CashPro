import { useState, useCallback } from 'react';
import { ScrollView, View, StyleSheet, TouchableOpacity, TextInput, Modal, Alert, RefreshControl } from 'react-native';
import { Stack, router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { API_CONFIG } from '@/config/api';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrencyInput, getNumericValue } from '@/utils/format';

type SavingsGoal = {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  icon: string;
  color: string;
  status: string;
  created_at: string;
};

type Contribution = {
  id: number;
  goal_id: number;
  amount: number;
  date: string;
  notes: string | null;
};

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams();
  const [goal, setGoal] = useState<SavingsGoal | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [contributeAmount, setContributeAmount] = useState('');
  const [contributeNotes, setContributeNotes] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const { formatCurrency } = useCurrency();

  const backgroundColor = useThemeColor({ light: '#f6f8f6', dark: '#112116' }, 'background');
  const surfaceColor = useThemeColor({ light: '#ffffff', dark: '#1a2c20' }, 'surface');
  const textMain = useThemeColor({ light: '#111713', dark: '#ffffff' }, 'text');
  const textMuted = '#64748b';
  const borderColor = useThemeColor({ light: '#f3f4f6', dark: '#374151' }, 'border');
  const primary = '#20df60';

  const fetchGoalData = async () => {
    try {
      const [goalResponse, contributionsResponse] = await Promise.all([
        fetch(`${API_CONFIG.BASE_URL}/savings-goals/${id}`),
        fetch(`${API_CONFIG.BASE_URL}/savings-goals/${id}/contributions`),
      ]);

      const goalResult = await goalResponse.json();
      const contributionsResult = await contributionsResponse.json();

      if (goalResult.success) {
        setGoal(goalResult.data);
      }

      if (contributionsResult.success) {
        setContributions(contributionsResult.data);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGoalData();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchGoalData();
    }, [id])
  );

  const handleContribute = async () => {
    if (!contributeAmount || getNumericValue(contributeAmount) === 0) {
      Alert.alert('Error', 'El monto es requerido');
      return;
    }

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/savings-goals/${id}/contribute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: getNumericValue(contributeAmount),
          notes: contributeNotes.trim() || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setShowContributeModal(false);
        setContributeAmount('');
        setContributeNotes('');
        fetchGoalData();
        Alert.alert('Éxito', 'Contribución agregada exitosamente');
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      console.error('Error al agregar contribución:', error);
      Alert.alert('Error', 'No se pudo conectar con el servidor');
    }
  };

  if (!goal) {
    return (
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <Stack.Screen options={{ title: 'Cargando...' }} />
        <View style={styles.loadingContainer}>
          <ThemedText style={[styles.loadingText, { color: textMuted }]}>
            Cargando objetivo...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
  const remaining = goal.target_amount - goal.current_amount;
  const isCompleted = goal.status === 'completed';

  const getDaysRemaining = () => {
    if (!goal.deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(goal.deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysRemaining();

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <Stack.Screen
        options={{
          title: goal.name,
          headerStyle: { backgroundColor: surfaceColor },
          headerTintColor: textMain,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />
        }
      >
        {/* Goal Header */}
        <View style={[styles.goalHeader, { backgroundColor: goal.color + '10' }]}>
          <View style={[styles.goalIconLarge, { backgroundColor: goal.color + '20' }]}>
            <IconSymbol size={48} name={goal.icon as any} color={goal.color} />
          </View>
          <ThemedText style={[styles.goalName, { color: textMain }]}>
            {goal.name}
          </ThemedText>
          {isCompleted && (
            <View style={[styles.completedBadge, { backgroundColor: '#10b981' }]}>
              <IconSymbol size={16} name="checkmark.circle.fill" color="#ffffff" />
              <ThemedText style={styles.completedBadgeText}>¡Meta Alcanzada!</ThemedText>
            </View>
          )}
        </View>

        {/* Progress Card */}
        <View style={[styles.progressCard, { backgroundColor: surfaceColor }]}>
          <View style={styles.progressHeader}>
            <ThemedText style={[styles.progressLabel, { color: textMuted }]}>Progreso</ThemedText>
            <ThemedText style={[styles.progressPercentage, { color: goal.color }]}>
              {progress.toFixed(1)}%
            </ThemedText>
          </View>

          <View style={[styles.progressBar, { backgroundColor: borderColor }]}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${Math.min(progress, 100)}%`, backgroundColor: goal.color }
              ]} 
            />
          </View>

          <View style={styles.amountsRow}>
            <View>
              <ThemedText style={[styles.amountLabel, { color: textMuted }]}>Ahorrado</ThemedText>
              <ThemedText style={[styles.amountValue, { color: textMain }]}>
                {formatCurrency(goal.current_amount)}
              </ThemedText>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <ThemedText style={[styles.amountLabel, { color: textMuted }]}>Meta</ThemedText>
              <ThemedText style={[styles.amountValue, { color: textMain }]}>
                {formatCurrency(goal.target_amount)}
              </ThemedText>
            </View>
          </View>

          {!isCompleted && remaining > 0 && (
            <View style={[styles.remainingCard, { backgroundColor: goal.color + '10' }]}>
              <ThemedText style={[styles.remainingLabel, { color: textMuted }]}>
                Falta por ahorrar
              </ThemedText>
              <ThemedText style={[styles.remainingAmount, { color: goal.color }]}>
                {formatCurrency(remaining)}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Deadline Info */}
        {daysRemaining !== null && !isCompleted && (
          <View style={[styles.deadlineCard, { backgroundColor: surfaceColor }]}>
            <IconSymbol size={24} name="calendar" color={goal.color} />
            <View style={styles.deadlineInfo}>
              <ThemedText style={[styles.deadlineLabel, { color: textMuted }]}>
                Fecha límite
              </ThemedText>
              <ThemedText style={[styles.deadlineValue, { color: textMain }]}>
                {daysRemaining > 0 
                  ? `${daysRemaining} días restantes` 
                  : daysRemaining === 0 
                    ? 'Vence hoy' 
                    : `Venció hace ${Math.abs(daysRemaining)} días`}
              </ThemedText>
            </View>
          </View>
        )}

        {/* Contributions History */}
        <View style={styles.contributionsSection}>
          <View style={styles.contributionsHeader}>
            <ThemedText style={[styles.sectionTitle, { color: textMain }]}>
              Historial de Contribuciones
            </ThemedText>
            <View style={[styles.countBadge, { backgroundColor: goal.color + '20' }]}>
              <ThemedText style={[styles.countBadgeText, { color: goal.color }]}>
                {contributions.length}
              </ThemedText>
            </View>
          </View>

          {contributions.length === 0 ? (
            <View style={[styles.emptyContributions, { backgroundColor: surfaceColor }]}>
              <IconSymbol size={32} name="tray" color={textMuted} />
              <ThemedText style={[styles.emptyText, { color: textMuted }]}>
                No hay contribuciones aún
              </ThemedText>
            </View>
          ) : (
            <View style={styles.contributionsList}>
              {contributions.map((contribution) => (
                <View 
                  key={contribution.id} 
                  style={[styles.contributionItem, { backgroundColor: surfaceColor }]}
                >
                  <View style={[styles.contributionIcon, { backgroundColor: goal.color + '20' }]}>
                    <IconSymbol size={20} name="plus" color={goal.color} />
                  </View>
                  <View style={styles.contributionInfo}>
                    <ThemedText style={[styles.contributionAmount, { color: textMain }]}>
                      +{formatCurrency(contribution.amount)}
                    </ThemedText>
                    <ThemedText style={[styles.contributionDate, { color: textMuted }]}>
                      {new Date(contribution.date).toLocaleDateString('es-MX', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </ThemedText>
                    {contribution.notes && (
                      <ThemedText style={[styles.contributionNotes, { color: textMuted }]}>
                        {contribution.notes}
                      </ThemedText>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Contribute Button */}
      {!isCompleted && (
        <TouchableOpacity 
          style={[styles.contributeButton, { backgroundColor: goal.color }]}
          onPress={() => setShowContributeModal(true)}
        >
          <IconSymbol size={24} name="plus" color="#ffffff" />
          <ThemedText style={styles.contributeButtonText}>Agregar Contribución</ThemedText>
        </TouchableOpacity>
      )}

      {/* Contribute Modal */}
      <Modal
        visible={showContributeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowContributeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: surfaceColor }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: textMain }]}>
                Agregar Contribución
              </ThemedText>
              <TouchableOpacity onPress={() => setShowContributeModal(false)}>
                <IconSymbol size={24} name="xmark" color={textMuted} />
              </TouchableOpacity>
            </View>

            <View style={[styles.modalAmountSection, { backgroundColor: goal.color + '10' }]}>
              <ThemedText style={[styles.modalAmountLabel, { color: textMuted }]}>Monto</ThemedText>
              <View style={styles.modalAmountInput}>
                <ThemedText style={[styles.modalCurrencySymbol, { color: textMain }]}>$</ThemedText>
                <TextInput
                  style={[styles.modalAmountField, { color: textMain }]}
                  placeholder="0"
                  placeholderTextColor={textMuted}
                  keyboardType="decimal-pad"
                  value={contributeAmount}
                  onChangeText={(text) => setContributeAmount(formatCurrencyInput(text))}
                  autoFocus
                />
              </View>
            </View>

            <View style={[styles.modalNotesSection, { borderColor }]}>
              <ThemedText style={[styles.modalNotesLabel, { color: textMuted }]}>
                Notas (Opcional)
              </ThemedText>
              <TextInput
                style={[styles.modalNotesInput, { color: textMain }]}
                placeholder="Ej: Ahorro del mes"
                placeholderTextColor={textMuted}
                multiline
                numberOfLines={3}
                value={contributeNotes}
                onChangeText={setContributeNotes}
              />
            </View>

            <TouchableOpacity 
              style={[styles.modalSaveButton, { backgroundColor: goal.color }]}
              onPress={handleContribute}
            >
              <ThemedText style={styles.modalSaveButtonText}>Agregar</ThemedText>
            </TouchableOpacity>
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
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  // Goal Header
  goalHeader: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  goalIconLarge: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  goalName: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  completedBadgeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  // Progress Card
  progressCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: '700',
  },
  progressBar: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  amountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  remainingCard: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  remainingLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  remainingAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
  // Deadline Card
  deadlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  deadlineInfo: {
    flex: 1,
  },
  deadlineLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  deadlineValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  // Contributions
  contributionsSection: {
    marginBottom: 16,
  },
  contributionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyContributions: {
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
  },
  contributionsList: {
    gap: 12,
  },
  contributionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  contributionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contributionInfo: {
    flex: 1,
  },
  contributionAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  contributionDate: {
    fontSize: 12,
    marginBottom: 4,
  },
  contributionNotes: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  // Contribute Button
  contributeButton: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  contributeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalAmountSection: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  modalAmountLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  modalAmountInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalCurrencySymbol: {
    fontSize: 32,
    fontWeight: '700',
    marginRight: 4,
  },
  modalAmountField: {
    fontSize: 40,
    fontWeight: '700',
    minWidth: 100,
    textAlign: 'center',
  },
  modalNotesSection: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  modalNotesLabel: {
    fontSize: 12,
    marginBottom: 8,
  },
  modalNotesInput: {
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  modalSaveButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSaveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
