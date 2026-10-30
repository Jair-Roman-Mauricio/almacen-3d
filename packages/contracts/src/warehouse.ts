import { z } from 'zod';
export const dimensionsSchema = z.strictObject({ width: z.unknown(), height: z.unknown(), depth: z.unknown() });
export const createWarehouseSchema = z.strictObject({ code: z.unknown(), name: z.unknown(), dimensions: dimensionsSchema });
export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;
export const layoutElementSchema = z.strictObject({ id: z.string(), type: z.string(), parentId: z.string().nullable(), code: z.unknown(), name: z.unknown(), position: z.strictObject({ x: z.unknown(), y: z.unknown(), z: z.unknown() }), dimensions: dimensionsSchema, blocked: z.boolean().default(false) });
export const saveLayoutSchema = z.strictObject({ baseRevision: z.unknown(), elements: z.array(layoutElementSchema) });
export type SaveLayoutInput = z.infer<typeof saveLayoutSchema>;
