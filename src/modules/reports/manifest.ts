import type { ModuleManifest } from '@/core/contracts/module';

import { ReportsScreen } from './ui/reports-screen';

/** Pestaña Estadísticas: solo lee datos de otros módulos vía capacidades (no tiene tablas). */
export const manifest: ModuleManifest = {
  id: 'reports',
  version: '1.0.0',
  routes: ['/(tabs)/explore'],
  actions: [
    {
      id: 'reports.menu',
      slot: 'more.menu',
      title: 'Estadísticas',
      subtitle: 'Gastos por categoría y tendencias',
      icon: 'chart.bar.fill',
      color: '#7fc0ff',
      iconBg: 'rgba(127,192,255,0.16)',
      route: '/(tabs)/explore',
      order: 0,
    },
  ],
  screens: { 'reports.home': ReportsScreen },
  register: () => undefined,
};
