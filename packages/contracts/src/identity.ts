import { z } from 'zod';
export const registrationSchema = z.strictObject({
  company: z.strictObject({ code: z.unknown().optional(), name: z.unknown().optional(), timeZone: z.unknown().optional() }),
  administrator: z.strictObject({ name: z.unknown().optional(), email: z.unknown().optional(), password: z.unknown().optional() }),
});
export type RegistrationInput = z.infer<typeof registrationSchema>;
export const loginSchema = z.strictObject({ companyCode: z.unknown().optional(), email: z.unknown().optional(), password: z.unknown().optional() });
export type LoginInput = z.infer<typeof loginSchema>;
export const createUserSchema = z.strictObject({ name: z.unknown().optional(), email: z.unknown().optional(), password: z.unknown().optional(), role: z.unknown().optional() });
export type CreateUserInput = z.infer<typeof createUserSchema>;
export const updateUserSchema = z.strictObject({ name: z.unknown().optional(), role: z.unknown().optional(), active: z.boolean().optional() }).refine(value => Object.keys(value).length > 0, { message: 'Indica un cambio.' });
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export const updateCompanySchema = z.strictObject({ name: z.unknown().optional(), timeZone: z.unknown().optional() }).refine(value => Object.keys(value).length > 0, { message: 'Indica un cambio.' });
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
