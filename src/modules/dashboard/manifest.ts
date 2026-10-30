import type { ModuleManifest } from '@/core/contracts/module';

import { DashboardScreen } from './ui/dashboard-screen';

/** Pestaña Inicio: solo lee datos de otros módulos vía capacidades (no tiene tablas). */
export const manifest: ModuleManifest = {
  id: 'dashboard',
  version: '1.0.0',
  routes: ['/(tabs)'],
  tabs: [{ routeName: 'index', title: 'Inicio', icon: 'house.fill', order: 1 }],
  screens: { 'dashboard.home': DashboardScreen },
  register: () => undefined,
};
