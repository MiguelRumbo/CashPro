/** Milisegundos en un día. */
export const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Días (redondeo hacia arriba) desde `from` hasta `target`. */
export function daysBetween(from: Date, target: Date): number {
  return Math.ceil((target.getTime() - from.getTime()) / MS_PER_DAY);
}

/** Días hasta el próximo día `targetDay` del mes (este mes o el siguiente). */
export function daysUntilDayOfMonth(targetDay: number, today: Date): number {
  const currentDay = today.getDate();
  const target =
    targetDay < currentDay
      ? new Date(today.getFullYear(), today.getMonth() + 1, targetDay)
      : new Date(today.getFullYear(), today.getMonth(), targetDay);
  return daysBetween(today, target);
}

/** Primer instante del mes de `date` (hora local). */
export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

/** Fecha local en formato AAAA-MM-DD derivada de ISO (formato heredado de v1). */
export function isoDay(date: Date): string {
  return date.toISOString().split('T')[0] ?? '';
}
