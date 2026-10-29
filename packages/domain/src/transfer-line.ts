import { DomainError } from './domain-error.js';
import { assertSameUnit, quantityFromMinor, type Quantity } from './quantity.js';
export interface TransferLine { readonly productId: string; readonly declared: Quantity; readonly departed: Quantity; readonly received: Quantity }
export interface TransferChange { readonly line: TransferLine; readonly physicalDelta: Quantity; readonly transitDelta: Quantity }
export function transferBalances(line: TransferLine): { inTransit: Quantity; available: Quantity } {
  assertSameUnit(line.declared, line.departed);
  assertSameUnit(line.declared, line.received);
  if (line.declared.minor <= 0n || (line.departed.minor !== 0n && line.departed.minor !== line.declared.minor) || line.received.minor < 0n || line.received.minor > line.departed.minor) {
    throw new DomainError('INVALID_TRANSIT_BALANCE', 'Las cantidades declarada, salida y recibida no son consistentes.');
  }
  return { inTransit: quantityFromMinor(line.departed.minor - line.received.minor, line.declared.unit), available: quantityFromMinor(0n, line.declared.unit) };
}
export function transferState(lines: readonly TransferLine[]): 'registered' | 'in_transit' | 'received' {
  if (lines.length === 0) throw new DomainError('INVALID_TRANSFER', 'El traslado debe contener líneas.');
  const balances = lines.map(transferBalances);
  if (lines.every(line => line.departed.minor === 0n)) return 'registered';
  if (lines.some(line => line.departed.minor === 0n)) throw new DomainError('INVALID_TRANSFER', 'La salida debe confirmar todas las cantidades declaradas.');
  return balances.every(balance => balance.inTransit.minor === 0n) ? 'received' : 'in_transit';
}
export function departTransferLine(line: TransferLine, available: Quantity): TransferChange {
  transferBalances(line);
  assertSameUnit(line.declared, available);
  if (line.departed.minor !== 0n) throw new DomainError('ALREADY_DEPARTED', 'La salida ya fue confirmada.');
  if (available.minor < line.declared.minor) throw new DomainError('INSUFFICIENT_AVAILABLE', 'No hay cantidad no reservada suficiente para la salida.');
  return { line: { ...line, departed: line.declared }, physicalDelta: quantityFromMinor(-line.declared.minor, line.declared.unit), transitDelta: line.declared };
}
export function receiveTransferLine(line: TransferLine, quantity: Quantity): TransferChange {
  const balance = transferBalances(line);
  assertSameUnit(line.declared, quantity);
  if (line.departed.minor === 0n) throw new DomainError('NOT_DEPARTED', 'No se puede recibir antes de confirmar la salida.');
  if (quantity.minor <= 0n) throw new DomainError('INVALID_QUANTITY', 'La cantidad recibida debe ser positiva.');
  if (quantity.minor > balance.inTransit.minor) throw new DomainError('TRANSIT_BALANCE_EXCEEDED', 'La recepción supera el saldo en tránsito.');
  return { line: { ...line, received: quantityFromMinor(line.received.minor + quantity.minor, line.declared.unit) }, physicalDelta: quantity, transitDelta: quantityFromMinor(-quantity.minor, line.declared.unit) };
}
