import { DomainError } from './domain-error.js';
import { lineBalances, type OrderLine } from './order-line.js';
export type OrderStatus = 'pending' | 'partially_dispatched' | 'dispatched' | 'cancelled';
export function deriveOrderState(lines: readonly OrderLine[], cancelled = false): { status: OrderStatus; cancelable: boolean } {
  if (lines.length === 0) throw new DomainError('INVALID_ORDER_BALANCE', 'El pedido debe contener líneas.');
  const balances = lines.map(lineBalances);
  const hasDispatch = lines.some(line => line.dispatched.minor > 0n);
  const hasPreparation = balances.some(balance => balance.preparedPending.minor > 0n);
  if (cancelled) {
    if (hasDispatch || hasPreparation || balances.some(balance => balance.reserved.minor > 0n)) {
      throw new DomainError('INVALID_CANCELLED_ORDER', 'Un pedido cancelado no puede conservar preparación, despacho o reservas.');
    }
    return { status: 'cancelled', cancelable: false };
  }
  const complete = balances.every(balance => balance.pending.minor === 0n);
  return { status: complete ? 'dispatched' : hasDispatch ? 'partially_dispatched' : 'pending', cancelable: !hasDispatch && !hasPreparation };
}
