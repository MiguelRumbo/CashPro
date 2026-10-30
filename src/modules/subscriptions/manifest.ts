import type { ModuleManifest } from '@/core/contracts/module';

import { disposeSubscriptionsRuntime, getSubscriptionsRuntime, initSubscriptionsRuntime } from './runtime';
import { subscriptionsTexts } from './texts';
import { AddSubscriptionScreen } from './ui/add-subscription-screen';
import { SubscriptionDetailScreen } from './ui/sub-detail-screen';
import { SubscriptionsListScreen } from './ui/subscriptions-list-screen';

export const manifest: ModuleManifest = {
  id: 'subscriptions',
  version: '1.0.0',
  routes: ['/subscriptions', '/subscriptions/add-subscription', '/subscriptions/sub-detail'],
  screens: {
    'subscriptions.list': SubscriptionsListScreen,
    'subscriptions.add': AddSubscriptionScreen,
    'subscriptions.detail': SubscriptionDetailScreen,
  },
  actions: [
    {
      id: 'subscriptions.menu',
      slot: 'more.menu',
      title: subscriptionsTexts.menuTitle,
      subtitle: subscriptionsTexts.menuSubtitle,
      icon: 'repeat',
      color: '#3b82f6',
      iconBg: '#eff6ff',
      route: '/subscriptions',
      order: 4,
    },
  ],
  dataPort: () => getSubscriptionsRuntime().dataPort,
  register: initSubscriptionsRuntime,
  dispose: disposeSubscriptionsRuntime,
};
