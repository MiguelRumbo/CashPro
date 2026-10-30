import type { ModuleContext } from '@/core/contracts/module';
import { createRuntimeHolder } from '@/core/registry/runtime-holder';

import { deviceSecurity } from './platform/device-security';

function build(ctx: ModuleContext) {
  return {
    device: deviceSecurity,
    lockOnBackgroundMs: ctx.config.security.lockOnBackgroundMs,
    preventScreenshots: ctx.config.security.preventScreenshots,
    logger: ctx.logger,
  };
}

const holder = createRuntimeHolder<ReturnType<typeof build>>('security');

export function initSecurityRuntime(ctx: ModuleContext): void {
  holder.set(build(ctx));
}

/** Activa FLAG_SECURE al arrancar. */
export async function startSecurityRuntime(): Promise<void> {
  const runtime = holder.get();
  if (!runtime.preventScreenshots) return;
  try {
    await runtime.device.preventScreenCapture();
  } catch (error) {
    runtime.logger.error('prevent screen capture failed', {
      errorType: error instanceof Error ? error.name : 'unknown',
    });
  }
}

export const getSecurityRuntime = holder.get;
export const disposeSecurityRuntime = holder.clear;
