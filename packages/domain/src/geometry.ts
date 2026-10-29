import { Decimal } from 'decimal.js';
import { DomainError } from './domain-error.js';
export type Axis = 'x' | 'y' | 'z';
export type ElementType = 'zone' | 'aisle' | 'rack' | 'level' | 'location';
export interface Dimensions { readonly width: string; readonly height: string; readonly depth: string }
export interface LayoutElement { readonly id: string; readonly type: ElementType; readonly parentId: string | null; readonly position: Readonly<Record<Axis, string>>; readonly dimensions: Dimensions }
export interface ExactBox { readonly element: LayoutElement; readonly min: Readonly<Record<Axis, Decimal>>; readonly max: Readonly<Record<Axis, Decimal>> }
const axes = ['x', 'y', 'z'] as const;
const dimensionFor: Record<Axis, keyof Dimensions> = { x: 'width', y: 'height', z: 'depth' };
const allowedParents: Record<ElementType, readonly ElementType[]> = { zone: [], aisle: ['zone'], rack: ['zone'], level: ['rack'], location: ['level', 'zone'] };
function reject(code: string, message: string, elementId: string, field: string): never {
  throw new DomainError(code, message, { elementId, field });
}
export function validateLayout(dimensions: Dimensions, elements: readonly LayoutElement[]): ReadonlyMap<string, ExactBox> {
  let integerDigits = 1;
  let fractionalDigits = 0;
  function check(value: unknown, id: string, field: string, positive: boolean): void {
    if (typeof value !== 'string' || !/^[+-]?\d+(?:\.\d+)?$/u.test(value)) reject('INVALID_DIMENSIONS', 'El valor debe ser decimal finito en metros.', id, field);
    const parsed = new Decimal(value);
    if (!parsed.isFinite() || parsed.lt(0) || (positive && parsed.isZero())) reject('INVALID_DIMENSIONS', 'Las posiciones no pueden ser negativas y las dimensiones deben ser positivas.', id, field);
    const [whole = '0', fraction = ''] = value.replace(/^[+-]/u, '').split('.');
    integerDigits = Math.max(integerDigits, whole.replace(/^0+/u, '').length);
    fractionalDigits = Math.max(fractionalDigits, fraction.length);
  }
  for (const axis of axes) check(dimensions[dimensionFor[axis]], 'warehouse', `dimensions.${dimensionFor[axis]}`, true);
  const byId = new Map<string, LayoutElement>();
  for (const element of elements) {
    if (!element.id || byId.has(element.id)) reject('INVALID_HIERARCHY', 'El identificador debe existir y ser único.', element.id, 'id');
    if (!Object.hasOwn(allowedParents, element.type)) reject('INVALID_HIERARCHY', 'El tipo de elemento no es válido.', element.id, 'type');
    byId.set(element.id, element);
    for (const axis of axes) {
      check(element.position[axis], element.id, `position.${axis}`, false);
      check(element.dimensions[dimensionFor[axis]], element.id, `dimensions.${dimensionFor[axis]}`, true);
    }
  }
  for (const element of elements) {
    const parent = element.parentId === null ? undefined : byId.get(element.parentId);
    const valid = element.type === 'zone' ? element.parentId === null : parent && allowedParents[element.type].includes(parent.type);
    if (!valid) reject('INVALID_HIERARCHY', 'El contenedor no existe o no admite este tipo de elemento.', element.id, 'parentId');
  }
  // An upper bound for all digits in any sum along a path, plus carry margin.
  // Clone locally: another layout or consumer cannot change this calculation.
  const precision = integerDigits + fractionalDigits + Math.ceil(Math.log10(elements.length + 2)) + 4;
  const Exact = Decimal.clone({ precision: Math.max(32, precision) });
  const boxes = new Map<string, ExactBox>();
  function resolve(element: LayoutElement): ExactBox {
    const existing = boxes.get(element.id);
    if (existing) return existing;
    const parent = element.parentId === null ? undefined : byId.get(element.parentId)!;
    const parentBox = parent ? resolve(parent) : undefined;
    const parentDimensions = parent?.dimensions ?? dimensions;
    const min = { x: new Exact(0), y: new Exact(0), z: new Exact(0) };
    const max = { ...min };
    for (const axis of axes) {
      const position = new Exact(element.position[axis]);
      const size = new Exact(element.dimensions[dimensionFor[axis]]);
      if (position.plus(size).gt(parentDimensions[dimensionFor[axis]])) reject('CONTAINMENT', 'El elemento excede los límites de su contenedor.', element.id, `position.${axis}`);
      min[axis] = new Exact(parentBox?.min[axis] ?? 0).plus(position);
      max[axis] = min[axis].plus(size);
    }
    const box: ExactBox = { element, min, max };
    boxes.set(element.id, box);
    return box;
  }
  for (const element of elements) resolve(element);
  return boxes;
}
