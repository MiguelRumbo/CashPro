import type { ModuleManifest } from '@/core/contracts/module';

import { disposeAccountsRuntime, getAccountsRuntime, initAccountsRuntime } from './runtime';
import { accountsTexts } from './texts';
import { AccountDetailScreen } from './ui/account-detail-screen';
import { AccountsListScreen } from './ui/accounts-list-screen';
import { AddAccountScreen } from './ui/add-account-screen';
import { EditAccountScreen } from './ui/edit-account-screen';

export const manifest: ModuleManifest = {
  id: 'accounts',
  version: '1.0.0',
  routes: ['/(tabs)/accounts', '/accounts/add-account', '/accounts/edit-account', '/accounts/account-detail'],
  tabs: [{ routeName: 'accounts', title: accountsTexts.tabTitle, icon: 'creditcard.fill', order: 4 }],
  screens: {
    'accounts.list': AccountsListScreen,
    'accounts.add': AddAccountScreen,
    'accounts.edit': EditAccountScreen,
    'accounts.detail': AccountDetailScreen,
  },
  dataPort: () => getAccountsRuntime().dataPort,
  register: initAccountsRuntime,
  subscriptions: () => {
    const { accounts } = getAccountsRuntime();
    return {
      'movement.recorded': ({ movement, affectsBalance }) => accounts.onMovementRecorded(movement, affectsBalance),
      'movement.updated': ({ before, after }) => accounts.onMovementUpdated(before, after),
      'movement.deleted': ({ movement }) => accounts.onMovementDeleted(movement),
    };
  },
  dispose: disposeAccountsRuntime,
};
