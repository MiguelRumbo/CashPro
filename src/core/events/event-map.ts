import type { AccountType, MovementRecord } from '../contracts/finance';

/** Instantánea mínima de un movimiento para efectos en otros módulos. */
export type MovementSnapshot = Readonly<
  Pick<MovementRecord, 'id' | 'type' | 'amount' | 'account_id' | 'to_account_id' | 'category_id' | 'date'>
>;

/**
 * Hechos pasados que los módulos publican. Los payloads se congelan al emitirse.
 */
export interface EventMap {
  'movement.recorded': {
    movement: MovementSnapshot;
    origin: string;
    affectsBalance: boolean;
  };
  'movement.updated': { before: MovementSnapshot; after: MovementSnapshot };
  'movement.deleted': { movement: MovementSnapshot };
  'account.deleted': { accountId: number; accountType: AccountType };
  'data.cleared': Record<string, never>;
  'data.imported': Record<string, never>;
}

export type EventName = keyof EventMap;
export type EventHandler<K extends EventName> = (payload: Readonly<EventMap[K]>) => void;
export type EventHandlers = { [K in EventName]?: EventHandler<K> };
