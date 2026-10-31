import type { ModuleManifest } from '@/core/contracts/module';

import {
  disposeSettingsRuntime,
  getSettingsRuntime,
  initSettingsRuntime,
  startSettingsRuntime,
} from './runtime';
import { settingsTexts } from './texts';
import { EditProfileScreen } from './ui/edit-profile-screen';
import { SettingsScreen } from './ui/settings-screen';

export const manifest: ModuleManifest = {
  id: 'settings',
  version: '1.0.0',
  routes: ['/(tabs)/settings', '/settings/edit-profile'],
  actions: [
    {
      id: 'settings.menu',
      slot: 'more.menu',
      section: 'general',
      title: settingsTexts.tabTitle,
      subtitle: settingsTexts.menuSubtitle,
      icon: 'gearshape.fill',
      color: '#8fa59a',
      iconBg: 'rgba(143,165,154,0.16)',
      route: '/(tabs)/settings',
      order: 1,
    },
  ],
  screens: {
    'settings.home': SettingsScreen,
    'settings.editProfile': EditProfileScreen,
  },
  dataPort: () => getSettingsRuntime().dataPort,
  register: initSettingsRuntime,
  onReady: startSettingsRuntime,
  dispose: disposeSettingsRuntime,
};
