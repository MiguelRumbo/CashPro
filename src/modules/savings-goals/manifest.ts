import type { ModuleManifest } from '@/core/contracts/module';

import { disposeSavingsGoalsRuntime, getSavingsGoalsRuntime, initSavingsGoalsRuntime } from './runtime';
import { savingsGoalsTexts } from './texts';
import { AddGoalScreen } from './ui/add-goal-screen';
import { GoalDetailScreen } from './ui/goal-detail-screen';
import { SavingsGoalsListScreen } from './ui/savings-goals-list-screen';

export const manifest: ModuleManifest = {
  id: 'savingsGoals',
  version: '1.0.0',
  routes: ['/savings-goals', '/savings-goals/add-goal', '/savings-goals/goal-detail'],
  screens: {
    'savingsGoals.list': SavingsGoalsListScreen,
    'savingsGoals.add': AddGoalScreen,
    'savingsGoals.detail': GoalDetailScreen,
  },
  actions: [
    {
      id: 'savingsGoals.menu',
      slot: 'more.menu',
      title: savingsGoalsTexts.menuTitle,
      subtitle: savingsGoalsTexts.menuSubtitle,
      icon: 'target',
      color: '#10b981',
      iconBg: 'rgba(16,185,129,0.16)',
      route: '/savings-goals',
      order: 2,
    },
  ],
  dataPort: () => getSavingsGoalsRuntime().dataPort,
  register: initSavingsGoalsRuntime,
  dispose: disposeSavingsGoalsRuntime,
};
