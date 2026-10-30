import { z } from 'zod';
export const createTransferSchema = z.strictObject({ code: z.unknown(), sourceWarehouseId: z.string(), targetWarehouseId: z.string(), lines: z.array(z.strictObject({ productId: z.string(), sourceLocationId: z.string(), quantity: z.unknown().optional() })).min(1) });
export type CreateTransferInput = z.infer<typeof createTransferSchema>;
export const transferDepartureSchema = z.strictObject({ lines: z.array(z.strictObject({ transferLineId: z.string(), quantity: z.unknown().optional() })).min(1) });
export type TransferDepartureInput = z.infer<typeof transferDepartureSchema>;
export const transferReceiptSchema = z.strictObject({ lines: z.array(z.strictObject({ transferLineId: z.string(), targetLocationId: z.string(), quantity: z.unknown().optional() })).min(1) });
export type TransferReceiptInput = z.infer<typeof transferReceiptSchema>;
