import { z } from 'zod';
import { validateQuantityInput } from '@almacen/domain';

export const quantityInputSchema = z.strictObject({
  quantity: z.custom<string>(value => {
    try { validateQuantityInput(value); return true; }
    catch { return false; }
  }, { message: 'La cantidad debe ser una cadena decimal presente y finita.' }),
});
