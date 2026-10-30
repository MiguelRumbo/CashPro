import type { SavingsGoalRecord, SavingsGoalsStats } from '@/core/contracts/finance';

const PERCENT = 100;

/** Una meta se completa al alcanzar su objetivo. */
export function statusAfterSaving(goal: Pick<SavingsGoalRecord, 'status' | 'target_amount'>, newAmount: number): string {
  return newAmount >= goal.target_amount && goal.status !== 'completed' ? 'completed' : goal.status;
}

export function computeGoalsStats(goals: readonly SavingsGoalRecord[]): SavingsGoalsStats {
  const active = goals.filter((g) => g.status === 'active');
  const completed = goals.filter((g) => g.status === 'completed');
  const totalTarget = active.reduce((sum, g) => sum + g.target_amount, 0);
  const totalSaved = active.reduce((sum, g) => sum + g.current_amount, 0);
  return {
    total_goals: goals.length,
    active_goals: active.length,
    completed_goals: completed.length,
    total_target: totalTarget,
    total_saved: totalSaved,
    total_remaining: Math.max(0, totalTarget - totalSaved),
    completion_percentage: totalTarget > 0 ? (totalSaved / totalTarget) * PERCENT : 0,
  };
}
