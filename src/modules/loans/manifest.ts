import type { ModuleManifest } from '@/core/contracts/module';

import { disposeLoansRuntime, getLoansRuntime, initLoansRuntime } from './runtime';
import { loansTexts } from './texts';
import { AddLoanScreen } from './ui/add-loan-screen';
import { LoanDetailScreen } from './ui/loan-detail-screen';
import { LoansListScreen } from './ui/loans-list-screen';

export const manifest: ModuleManifest = {
  id: 'loans',
  version: '1.0.0',
  routes: ['/loans', '/loans/add-loan', '/loans/loan-detail'],
  screens: {
    'loans.list': LoansListScreen,
    'loans.add': AddLoanScreen,
    'loans.detail': LoanDetailScreen,
  },
  actions: [
    {
      id: 'loans.menu',
      slot: 'more.menu',
      title: loansTexts.menuTitle,
      subtitle: loansTexts.menuSubtitle,
      icon: 'doc.text',
      color: '#f59e0b',
      iconBg: '#fffbeb',
      route: '/loans',
      order: 3,
    },
  ],
  dataPort: () => getLoansRuntime().dataPort,
  register: initLoansRuntime,
  dispose: disposeLoansRuntime,
};
