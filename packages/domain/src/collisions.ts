import type { ExactBox, ElementType } from './geometry.js';
export interface Overlap { readonly code: 'OVERLAP'; readonly elementIds: readonly [string, string] }
function forbidden(a: ElementType, b: ElementType): boolean {
  return (a === 'zone' && b === 'zone') || (a === 'rack' && b === 'rack') ||
    (a === 'rack' && b === 'aisle') || (a === 'aisle' && b === 'rack') ||
    (a === 'location' && b === 'location');
}
export function findFirstOverlap(boxes: ReadonlyMap<string, ExactBox>): Overlap | null {
  const groups = new Map<string | null, ExactBox[]>();
  for (const box of boxes.values()) {
    const group = groups.get(box.element.parentId) ?? [];
    group.push(box);
    groups.set(box.element.parentId, group);
  }
  for (const group of groups.values()) {
    group.sort((a, b) => a.min.x.comparedTo(b.min.x));
    let active: ExactBox[] = [];
    for (const current of group) {
      active = active.filter(other => other.max.x.gt(current.min.x));
      for (const other of active) {
        if (!forbidden(current.element.type, other.element.type)) continue;
        if (other.min.y.lt(current.max.y) && current.min.y.lt(other.max.y) && other.min.z.lt(current.max.z) && current.min.z.lt(other.max.z)) {
          return { code: 'OVERLAP', elementIds: [other.element.id, current.element.id] };
        }
      }
      active.push(current);
    }
  }
  return null;
}
