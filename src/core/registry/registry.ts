import type { ComponentType } from 'react';

import type { ModuleId } from '@/config/schema';

import type { CapabilityKey } from '../contracts/capabilities';
import type {
  ActionContribution,
  ActionSlot,
  DataPort,
  ModuleManifest,
  ScreenId,
  TabContribution,
} from '../contracts/module';

export class CapabilityConflictError extends Error {
  override name = 'CapabilityConflictError';
}

const byOrder = <T extends { order: number }>(a: T, b: T) => a.order - b.order;

/** Catálogo de módulos activos, sus contribuciones a la UI y sus capacidades. */
export class ModuleRegistry {
  private readonly manifests = new Map<ModuleId, ModuleManifest>();
  private readonly capabilities = new Map<string, unknown>();
  private readonly failures = new Map<ModuleId, string>();

  add(manifest: ModuleManifest): void {
    this.manifests.set(manifest.id, manifest);
  }

  remove(id: ModuleId, reason: string): void {
    this.manifests.delete(id);
    this.failures.set(id, reason);
  }

  provide<T>(key: CapabilityKey<T>, impl: T): void {
    if (this.capabilities.has(key.id)) {
      throw new CapabilityConflictError(`La capacidad ${key.id} ya tiene proveedor`);
    }
    this.capabilities.set(key.id, impl);
  }

  /** Quita las capacidades registradas por un módulo que falló al registrarse. */
  revoke(ids: readonly string[]): void {
    ids.forEach((id) => this.capabilities.delete(id));
  }

  resolve<T>(key: CapabilityKey<T>): T | undefined {
    return this.capabilities.get(key.id) as T | undefined;
  }

  isActive(id: ModuleId): boolean {
    return this.manifests.has(id);
  }

  activeModules(): ModuleManifest[] {
    return [...this.manifests.values()];
  }

  failedModules(): ReadonlyMap<ModuleId, string> {
    return this.failures;
  }

  tabs(): TabContribution[] {
    return this.activeModules()
      .flatMap((m) => m.tabs ?? [])
      .sort(byOrder);
  }

  screen(id: ScreenId): ComponentType | undefined {
    for (const manifest of this.manifests.values()) {
      const screen = manifest.screens?.[id];
      if (screen) return screen;
    }
    return undefined;
  }

  actions(slot: ActionSlot): ActionContribution[] {
    return this.activeModules()
      .flatMap((m) => m.actions ?? [])
      .filter((a) => a.slot === slot)
      .sort(byOrder);
  }

  dataPorts(): { moduleId: ModuleId; port: DataPort }[] {
    return this.activeModules().flatMap((m) => (m.dataPort ? [{ moduleId: m.id, port: m.dataPort() }] : []));
  }
}
