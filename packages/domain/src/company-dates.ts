import { DomainError } from './domain-error.js';
export function companyTimeZone(zone: unknown = 'America/Lima'): string {
  if (typeof zone !== 'string' || !zone || /^[+-]/u.test(zone)) throw new DomainError('INVALID_TIME_ZONE', 'La zona horaria IANA no es válida.');
  try { return new Intl.DateTimeFormat('en', { timeZone: zone }).resolvedOptions().timeZone; }
  catch { throw new DomainError('INVALID_TIME_ZONE', 'La zona horaria IANA no es válida.'); }
}
function calendarDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value) || value.startsWith('0000')) throw new DomainError('INVALID_DATE_RANGE', 'La fecha debe tener formato YYYY-MM-DD y existir en el calendario.');
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new DomainError('INVALID_DATE_RANGE', 'La fecha no existe en el calendario.');
  return date;
}
function formatter(timeZone: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat('en-US-u-ca-iso8601-nu-latn', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit', era: 'short',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  });
}
type DateFields = Record<'year' | 'month' | 'day' | 'era' | 'hour' | 'minute' | 'second', string>;
function fields(format: Intl.DateTimeFormat, epoch: number): DateFields {
  return Object.fromEntries(format.formatToParts(epoch).map(part => [part.type, part.value])) as DateFields;
}
function localDateKey(format: Intl.DateTimeFormat, epoch: number): number {
  const parts = fields(format, epoch);
  const year = parts.era === 'BC' ? 1 - Number(parts.year) : Number(parts.year);
  return year * 10000 + Number(parts.month) * 100 + Number(parts.day);
}
function dayBoundary(day: Date, format: Intl.DateTimeFormat): number {
  const key = day.getUTCFullYear() * 10000 + (day.getUTCMonth() + 1) * 100 + day.getUTCDate();
  // Search the first instant of this civil day, including a midnight DST gap.
  // The window bounds the UTC offset; no day duration is assumed for the result.
  let low = day.getTime() - 172800000;
  let high = day.getTime() + 172800000;
  while (low < high) {
    const middle = low + Math.floor((high - low) / 2);
    if (localDateKey(format, middle) < key) low = middle + 1;
    else high = middle;
  }
  return low;
}
export function companyDateRange(from: string, to: string, zone?: unknown): { fromInclusive: string; toExclusive: string; timeZone: string } {
  const first = calendarDate(from);
  const last = calendarDate(to);
  if (last < first) throw new DomainError('INVALID_DATE_RANGE', 'La fecha final no puede preceder a la inicial.');
  const timeZone = companyTimeZone(zone);
  const format = formatter(timeZone);
  last.setUTCDate(last.getUTCDate() + 1);
  return { fromInclusive: new Date(dayBoundary(first, format)).toISOString(), toExclusive: new Date(dayBoundary(last, format)).toISOString(), timeZone };
}
export function formatCompanyInstant(instant: string, zone?: unknown): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/u.test(instant)) {
    throw new DomainError('INVALID_DATE_RANGE', 'El instante debe indicar fecha, hora y zona explícita.');
  }
  calendarDate(instant.slice(0, 10));
  const epoch = Date.parse(instant);
  if (!Number.isFinite(epoch)) throw new DomainError('INVALID_DATE_RANGE', 'El instante no es válido.');
  const parts = fields(formatter(companyTimeZone(zone)), epoch);
  return `${parts.year.padStart(4, '0')}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}
