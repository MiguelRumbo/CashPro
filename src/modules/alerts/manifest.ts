import type { ModuleManifest } from '@/core/contracts/module';

import { disposeAlertsRuntime, getAlertsRuntime, initAlertsRuntime } from './runtime';
import { AlertSettingsScreen } from './ui/alert-settings-screen';
import { AlertsInboxScreen } from './ui/alerts-inbox-screen';

export const manifest: ModuleManifest = {
  id: 'alerts',
  version: '1.0.0',
  routes: ['/notifications', '/settings/notifications'],
  screens: {
    'alerts.inbox': AlertsInboxScreen,
    'alerts.settings': AlertSettingsScreen,
  },
  dataPort: () => getAlertsRuntime().dataPort,
  register: initAlertsRuntime,
  onReady: () => {
    getAlertsRuntime().alerts.ensureSettings();
  },
  subscriptions: () => {
    const { alerts } = getAlertsRuntime();
    return {
      'data.cleared': () => alerts.ensureSettings(),
      'data.imported': () => alerts.ensureSettings(),
    };
  },
  dispose: disposeAlertsRuntime,
};
