import { z } from "zod";
export const text = z.string().trim().min(1, "Completa este campo.");
export const email = z.string().trim().email("Indica un correo válido.");
export const password = z.string().min(1, "Indica una contraseña.");
export const accessSchema = z.object({ companyCode: text, email, password });
export const name = text.max(160, "Usa hasta 160 caracteres.");
export const code = text
  .max(64, "Usa hasta 64 caracteres.")
  .regex(
    /^[\p{L}\p{N}\-_./]+$/u,
    "Usa letras, números, guion, guion bajo, punto o barra.",
  );
export const registrationFormSchema = z.object({
  companyName: name,
  companyCode: code,
  timeZone: text,
  adminName: name,
  email,
  password,
});
export const companyFormSchema = z.object({ name, timeZone: text });
export const role = z.enum(["admin", "supervisor", "operator"], {
  error: "Selecciona un rol válido.",
});
export const userFormSchema = z.object({ name, email, password, role });
export const userUpdateFormSchema = z.object({ role, active: z.boolean() });
export const positiveMeasure = text
  .regex(/^\+?\d+(?:\.\d+)?$/u, "Usa un decimal positivo con punto.")
  .refine(
    (value) => /[1-9]/u.test(value),
    "La dimensión debe ser mayor que cero.",
  );
export const warehouseFormSchema = z.object({
  code,
  name,
  width: positiveMeasure,
  height: positiveMeasure,
  depth: positiveMeasure,
});
export const unitKind = z.enum([
  "piece",
  "box",
  "pallet",
  "weight",
  "volume",
  "length",
]);
export const productFormSchema = z.object({
  sku: code,
  name,
  kind: unitKind,
  label: name,
});
export const productEditFormSchema = z.object({ name });
