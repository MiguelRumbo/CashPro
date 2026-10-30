import type { ModuleManifest } from '@/core/contracts/module';

import { disposeBudgetsRuntime, getBudgetsRuntime, initBudgetsRuntime } from './runtime';
import { budgetsTexts } from './texts';
import { AddBudgetScreen } from './ui/add-budget-screen';
import { BudgetsListScreen } from './ui/budgets-list-screen';
import { EditBudgetScreen } from './ui/edit-budget-screen';

export const manifest: ModuleManifest = {
  id: 'budgets',
  version: '1.0.0',
  routes: ['/budgets', '/budgets/add-budget', '/budgets/edit-budget'],
  screens: {
    'budgets.list': BudgetsListScreen,
    'budgets.add': AddBudgetScreen,
    'budgets.edit': EditBudgetScreen,
  },
  actions: [
    {
      id: 'budgets.menu',
      slot: 'more.menu',
      title: budgetsTexts.menuTitle,
      subtitle: budgetsTexts.menuSubtitle,
      icon: 'chart.pie.fill',
      color: '#9333ea',
      iconBg: '#faf5ff',
      route: '/budgets',
      order: 1,
    },
  ],
  dataPort: () => getBudgetsRuntime().dataPort,
  register: initBudgetsRuntime,
  subscriptions: () => {
    const { budgets } = getBudgetsRuntime();
    return {
      'movement.recorded': ({ movement, origin }) => budgets.onMovementRecorded(movement, origin),
      'movement.updated': ({ before, after }) => budgets.onMovementUpdated(before, after),
      'movement.deleted': ({ movement }) => budgets.onMovementDeleted(movement),
    };
  },
  dispose: disposeBudgetsRuntime,
};
