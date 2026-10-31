import type { ModuleContext } from '@/core/contracts/module';
import { createRuntimeHolder } from '@/core/registry/runtime-holder';

import { deviceSecurity } from './platform/device-security';

function build(ctx: ModuleContext) {
  return {
    device: deviceSecurity,
    lockOnBackgroundMs: ctx.config.security.lockOnBackgroundMs,
  };
}

const holder = createRuntimeHolder<ReturnType<typeof build>>('security');

export function initSecurityRuntime(ctx: ModuleContext): void {
  holder.set(build(ctx));
}

export const getSecurityRuntime = holder.get;
export const disposeSecurityRuntime = holder.clear;
