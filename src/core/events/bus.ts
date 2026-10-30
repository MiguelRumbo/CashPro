import type { Logger } from '../logger/logger';
import type { EventHandler, EventMap, EventName } from './event-map';

function freezeDeep<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freezeDeep);
    Object.freeze(value);
  }
  return value;
}

export class EventBusError extends Error {
  override name = 'EventBusError';
}

/**
 * Bus síncrono: los manejadores corren dentro de la misma transacción que el emisor,
 * así un fallo en un manejador revierte toda la operación.
 */
export class EventBus {
  private readonly handlers = new Map<EventName, Set<(payload: unknown) => void>>();

  constructor(private readonly logger: Logger) {}

  on<K extends EventName>(event: K, handler: EventHandler<K>): () => void {
    const set = this.handlers.get(event) ?? new Set();
    set.add(handler as (payload: unknown) => void);
    this.handlers.set(event, set);
    return () => set.delete(handler as (payload: unknown) => void);
  }

  emit<K extends EventName>(event: K, payload: EventMap[K]): void {
    const frozen = freezeDeep(payload);
    const set = this.handlers.get(event);
    if (!set) return;
    for (const handler of [...set]) {
      try {
        handler(frozen);
      } catch (error) {
        this.logger.error('event handler failed', { event });
        throw new EventBusError(
          `Falló un manejador de ${event}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}
