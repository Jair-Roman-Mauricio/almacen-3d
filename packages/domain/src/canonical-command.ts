import { DomainError } from './domain-error.js';
import { normalizeCode, normalizeEmail } from './identifiers.js';
export interface CommandData {
  tenantId: string;
  type: string;
  data: unknown;
}
const quantities = new Set(['quantity', 'requested', 'reserved', 'physical', 'observed', 'preparedPending', 'dispatched', 'received', 'departed', 'threshold', 'physicalDelta', 'reservedDelta', 'transitDelta']);
const unordered = new Set(['lines', 'elements', 'entries', 'warehouseIds']);
function invalid(): never { throw new DomainError('INVALID_COMMAND_DATA', 'Los datos canónicos deben ser valores de negocio exactos sin secretos.'); }
function decimal(value: unknown): string {
  if (typeof value !== 'string' || !/^[+-]?\d+(?:\.\d+)?$/u.test(value))
    invalid();
  const [whole = '0', fraction = ''] = value.replace(/^[+-]/u, '').split('.');
  if (fraction.length > 3)
    invalid();
  const integer = BigInt(whole).toString();
  const part = fraction.replace(/0+$/u, '');
  const zero = integer === '0' && !part;
  return `${value.startsWith('-') && !zero ? '-' : ''}${integer}${part ? '.' + part : ''}`;
}
export function canonicalCommand(input: CommandData): string {
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/iu.test(input.tenantId) || typeof input.type !== 'string' || !input.type)
    invalid();
  const seen = new WeakSet<object>();
  function visit(value: unknown, key = ''): unknown {
    if (/password|token|secret/iu.test(key))
      invalid();
    if (quantities.has(key))
      return decimal(value);
    if (value === null || typeof value === 'boolean')
      return value;
    if (typeof value === 'string') {
      if (['sku', 'code', 'companyCode', 'locationCode'].includes(key))
        return normalizeCode(value).key;
      if (key === 'email')
        return normalizeEmail(value);
      return /(?:^id$|Id$|Ids$)/u.test(key) && /^[0-9a-f-]{36}$/iu.test(value) ? value.toLowerCase() : value;
    }
    if (typeof value === 'number') {
      if (!Number.isSafeInteger(value))
        invalid();
      return value;
    }
    if (typeof value !== 'object' || seen.has(value))
      invalid();
    seen.add(value);
    try {
      if (Array.isArray(value)) {
        const result = value.map(item => visit(item, key === 'warehouseIds' ? 'id' : ''));
        return unordered.has(key) ? result.sort((a, b) => { const x = JSON.stringify(a), y = JSON.stringify(b); return x < y ? -1 : x > y ? 1 : 0; }) : result;
      }
      if (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)
        invalid();
      return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([field, item]) => {
        if (['__proto__', 'constructor', 'prototype'].includes(field))
          invalid();
        return [field, visit(item, field)];
      }));
    }
    finally {
      seen.delete(value);
    }
  }
  return JSON.stringify(visit({ tenantId: input.tenantId.toLowerCase(), type: input.type, data: input.data }));
}
