import { z } from 'zod';
const receiptLine = z.strictObject({ productId: z.string(), targetLocationId: z.string(), quantity: z.unknown() });
export const receiptSchema = z.strictObject({ warehouseId: z.string(), lines: z.array(receiptLine).min(1) });
export type ReceiptInput = z.infer<typeof receiptSchema>;
export const moveSchema = z.strictObject({ warehouseId: z.string(), lines: z.array(receiptLine.extend({ sourceLocationId: z.string() })).min(1) });
export type MoveInput = z.infer<typeof moveSchema>;
export const blockLocationSchema = z.strictObject({});
export const unblockLocationSchema = z.strictObject({ reason: z.unknown().optional() });
