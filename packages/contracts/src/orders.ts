import { z } from 'zod';
export const createOrderSchema = z.strictObject({ code: z.unknown(), warehouseId: z.string(), lines: z.array(z.strictObject({ productId: z.string(), quantity: z.unknown().optional() })).min(1) });
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export const reservationsSchema = z.strictObject({ lines: z.array(z.strictObject({ orderLineId: z.string(), sourceLocationId: z.string(), quantity: z.unknown().optional() })).min(1) });
export type ReservationsInput = z.infer<typeof reservationsSchema>;
export const assignmentSchema = z.strictObject({ operatorId: z.string() });
export const allocationActionSchema = z.strictObject({ lines: z.array(z.strictObject({ allocationId: z.string(), quantity: z.unknown().optional() })).min(1) });
export type AllocationActionInput = z.infer<typeof allocationActionSchema>;
export const cancelOrderSchema = z.strictObject({});
