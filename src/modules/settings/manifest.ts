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
  tabs: [{ routeName: 'settings', title: settingsTexts.tabTitle, icon: 'gearshape.fill', order: 6 }],
  screens: {
    'settings.home': SettingsScreen,
    'settings.editProfile': EditProfileScreen,
  },
  dataPort: () => getSettingsRuntime().dataPort,
  register: initSettingsRuntime,
  onReady: startSettingsRuntime,
  dispose: disposeSettingsRuntime,
};
