"use client";
import type { FieldErrors, FieldValues } from "react-hook-form";
import { FieldErrors as Summary } from "@almacen/ui";
const labels: Record<string, string> = {
  companyName: "Empresa",
  companyCode: "Código de empresa",
  adminName: "Administrador",
  name: "Nombre",
  timeZone: "Zona horaria",
  email: "Correo electrónico",
  password: "Contraseña",
  role: "Rol",
  sku: "SKU",
  kind: "Tipo de unidad",
  label: "Unidad base",
  code: "Código",
  width: "Ancho",
  height: "Alto",
  depth: "Profundidad",
};
export function FormSummary<T extends FieldValues>({
  errors,
}: {
  errors: FieldErrors<T>;
}) {
  const messages = Object.entries(errors).flatMap(([key, error]) =>
    typeof error?.message === "string"
      ? [`${labels[key] ?? key}: ${error.message}`]
      : [],
  );
  return messages.length > 1 ? <Summary errors={messages} /> : null;
}
