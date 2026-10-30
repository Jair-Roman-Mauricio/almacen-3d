import { createHash } from 'node:crypto';
export function fingerprintCanonicalData(canonicalData: string): string {
  return createHash('sha256').update(canonicalData, 'utf8').digest('hex');
}
