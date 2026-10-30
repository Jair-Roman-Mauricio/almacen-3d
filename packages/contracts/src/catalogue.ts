import { z } from 'zod';
export const createProductSchema = z.strictObject({ sku: z.unknown(), name: z.unknown(), unit: z.strictObject({ kind: z.unknown(), label: z.unknown() }) });
export const updateProductSchema = z.strictObject({ name: z.unknown() });
export type CreateProductInput = z.infer<typeof createProductSchema>;
