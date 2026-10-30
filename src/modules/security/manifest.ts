import type { ModuleManifest } from '@/core/contracts/module';

import { disposeSecurityRuntime, initSecurityRuntime, startSecurityRuntime } from './runtime';
import { LockGate } from './ui/lock-gate';

export const manifest: ModuleManifest = {
  id: 'security',
  version: '1.0.0',
  routes: [],
  gate: LockGate,
  register: initSecurityRuntime,
  onReady: startSecurityRuntime,
  dispose: disposeSecurityRuntime,
};
