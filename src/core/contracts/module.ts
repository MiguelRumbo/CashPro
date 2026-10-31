import type { ComponentType, ReactNode } from 'react';

import type { FrozenAppConfig, ModuleId } from '@/config/schema';

import type { DbHandle } from '../db/handle';
import type { EventBus } from '../events/bus';
import type { EventHandlers } from '../events/event-map';
import type { Logger } from '../logger/logger';
import type { PreferencesStore } from '../preferences/store';
import type { IconSymbolName } from '../ui-kit/icon-symbol';
import type { CapabilityKey } from './capabilities';

/** Id de pantalla: `<modulo>.<pantalla>`. */
export type ScreenId = `${string}.${string}`;

export interface TabContribution {
  /** Nombre del archivo de ruta dentro de app/(tabs). */
  routeName: string;
  title: string;
  icon: IconSymbolName;
  order: number;
}

/** Slots con nombre donde un módulo puede aportar accesos. */
export type ActionSlot = 'more.menu' | 'tabbar.fab';

export interface ActionContribution {
  id: string;
  slot: ActionSlot;
  title: string;
  subtitle: string;
  icon: IconSymbolName;
  color: string;
  iconBg: string;
  /** Sección del menú "Más" (por defecto, finanzas). */
  section?: 'finance' | 'general';
  /** Ruta pública de Expo Router (no se importa el módulo destino). */
  route: string;
  order: number;
}

/** Exportación/importación/borrado de las tablas de un módulo (respaldo JSON y "borrar todo"). */
export interface DataPort {
  readonly tables: readonly string[];
  exportTables(): Record<string, unknown[]>;
  importTables(data: Readonly<Record<string, unknown>>): void;
  clear(): void;
}

export interface ModuleContext {
  readonly config: FrozenAppConfig;
  readonly db: DbHandle;
  readonly events: EventBus;
  readonly logger: Logger;
  readonly preferences: PreferencesStore;
  provide<T>(key: CapabilityKey<T>, impl: T): void;
  /** Devuelve undefined si el módulo proveedor está apagado. Resolver al usar, no al registrar. */
  resolve<T>(key: CapabilityKey<T>): T | undefined;
  /** Puertos de datos de todos los módulos activos (para respaldo y borrado total). */
  dataPorts(): readonly { moduleId: ModuleId; port: DataPort }[];
}

export interface ModuleManifest {
  readonly id: ModuleId;
  readonly version: string;
  readonly routes: readonly string[];
  readonly tabs?: readonly TabContribution[];
  readonly screens?: Readonly<Record<ScreenId, ComponentType>>;
  readonly actions?: readonly ActionContribution[];
  /** Envuelve toda la app (p. ej. bloqueo biométrico). Se aplican en orden de registro. */
  readonly gate?: ComponentType<{ children: ReactNode }>;
  readonly dataPort?: () => DataPort;
  register(ctx: ModuleContext): void | Promise<void>;
  subscriptions?: () => EventHandlers;
  onReady?(): void | Promise<void>;
  dispose?(): void;
}
