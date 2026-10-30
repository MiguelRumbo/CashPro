import type { ModuleManifest } from '@/core/contracts/module';

import { ReportsScreen } from './ui/reports-screen';

/** Pestaña Estadísticas: solo lee datos de otros módulos vía capacidades (no tiene tablas). */
export const manifest: ModuleManifest = {
  id: 'reports',
  version: '1.0.0',
  routes: ['/(tabs)/explore'],
  tabs: [{ routeName: 'explore', title: 'Estadísticas', icon: 'chart.bar.fill', order: 3 }],
  screens: { 'reports.home': ReportsScreen },
  register: () => undefined,
};
