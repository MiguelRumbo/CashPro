import type { ModuleManifest } from '@/core/contracts/module';

import { disposeMovementsRuntime, getMovementsRuntime, initMovementsRuntime } from './runtime';
import { movementsTexts } from './texts';
import { AddMovementScreen } from './ui/add-movement-screen';
import { MovementDetailScreen } from './ui/movement-detail-screen';
import { MovementsListScreen } from './ui/movements-list-screen';

export const manifest: ModuleManifest = {
  id: 'movements',
  version: '1.0.0',
  routes: ['/(tabs)/movements', '/movements/add-movement', '/movements/movement-detail'],
  tabs: [{ routeName: 'movements', title: movementsTexts.tabTitle, icon: 'receipt', order: 2 }],
  screens: {
    'movements.list': MovementsListScreen,
    'movements.add': AddMovementScreen,
    'movements.detail': MovementDetailScreen,
  },
  actions: [
    {
      id: 'movements.fab',
      slot: 'tabbar.fab',
      title: movementsTexts.fabTitle,
      subtitle: movementsTexts.fabTitle,
      icon: 'plus',
      color: '#3ee08f',
      iconBg: 'transparent',
      route: '/movements/add-movement',
      order: 1,
    },
  ],
  dataPort: () => getMovementsRuntime().dataPort,
  register: initMovementsRuntime,
  dispose: disposeMovementsRuntime,
};
