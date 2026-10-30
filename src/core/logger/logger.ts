export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** Contexto de log: solo ids, conteos y nombres técnicos. Nunca datos personales ni montos. */
export type LogContext = Readonly<Record<string, string | number | boolean | undefined>>;

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
}

export type LogSink = (level: LogLevel, message: string, context?: LogContext) => void;

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

/* eslint-disable no-console -- el logger es el único punto autorizado para escribir en consola */
const consoleSink: LogSink = (level, message, context) => {
  const line = `[${level}] ${message}`;
  if (level === 'error') console.error(line, context ?? '');
  else if (level === 'warn') console.warn(line, context ?? '');
  else console.log(line, context ?? '');
};
/* eslint-enable no-console */

export function createLogger(minLevel: LogLevel, sink: LogSink = consoleSink): Logger {
  const log = (level: LogLevel) => (message: string, context?: LogContext) => {
    if (LEVEL_ORDER[level] >= LEVEL_ORDER[minLevel]) sink(level, message, context);
  };
  return { debug: log('debug'), info: log('info'), warn: log('warn'), error: log('error') };
}

export const silentLogger: Logger = createLogger('error', () => undefined);
