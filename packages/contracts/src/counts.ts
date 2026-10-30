import { z } from 'zod';
export const createCountSchema = z.strictObject({ warehouseId: z.string(), locationId: z.string(), productId: z.string(), observed: z.unknown().optional() });
export type CreateCountInput = z.infer<typeof createCountSchema>;
export const adjustmentSchema = z.strictObject({ reason: z.unknown().optional() });
