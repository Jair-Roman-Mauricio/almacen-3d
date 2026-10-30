import { z } from 'zod';
export const uploadImportSchema = z.object({ kind: z.enum(['catalogue', 'initial_stock']), warehouseId: z.string().optional() }).strict();
export const validateImportSchema = z.object({}).strict();
export const applyImportSchema = z.object({ contentHash: z.string() }).strict();
export const thresholdSchema = z.object({ warehouseId: z.string(), productId: z.string(), quantity: z.unknown().optional() }).strict();
