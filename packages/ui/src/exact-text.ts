export function quantityError(
  value: string,
  {
    allowZero = false,
    integer = false,
  }: { allowZero?: boolean; integer?: boolean } = {},
) {
  const parts = /^([+-]?)(\d+)(?:\.(\d+))?$/u.exec(value);
  if (!parts)
    return "Usa un número decimal con punto, sin separadores de millares.";
  const fraction = parts[3] ?? "",
    nonzero = /[1-9]/u.test(parts[2]! + fraction);
  if (fraction.length > 3 || (integer && /[1-9]/u.test(fraction)))
    return "La precisión no corresponde a la unidad.";
  if ((parts[1] === "-" && nonzero) || (!allowZero && !nonzero))
    return allowZero
      ? "La cantidad no puede ser negativa."
      : "La cantidad debe ser positiva.";
  return null;
}
export function formatExact(value: string) {
  const match = /^([+-]?)(\d+)(?:\.(\d+))?$/u.exec(value);
  if (!match) return value;
  const whole = BigInt(match[2]!)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/gu, ".");
  return (
    (match[1] === "-" ? "-" : "") + whole + (match[3] ? "," + match[3] : "")
  );
}
