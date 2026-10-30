"use client";
import { useId, type ComponentPropsWithRef, type ReactNode } from "react";
export function Field({
  label,
  error,
  hint,
  id,
  ...input
}: {
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
} & ComponentPropsWithRef<"input">) {
  const generated = useId(),
    key = id ?? generated,
    description = error ? key + "-error" : hint ? key + "-hint" : undefined;
  return (
    <div className="field">
      <label className="field-label" htmlFor={key}>
        {label}
        {input.required ? <span aria-hidden="true"> *</span> : null}
      </label>
      <input
        {...input}
        id={key}
        className={["control", input.className].filter(Boolean).join(" ")}
        aria-invalid={error ? true : undefined}
        aria-describedby={description}
      />
      {error ? (
        <p className="field-error" id={key + "-error"}>
          {error}
        </p>
      ) : hint ? (
        <p className="field-hint" id={key + "-hint"}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
export function SelectField({
  label,
  error,
  hint,
  id,
  children,
  ...input
}: {
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
  children: ReactNode;
} & ComponentPropsWithRef<"select">) {
  const generated = useId(),
    key = id ?? generated,
    description = error ? key + "-error" : hint ? key + "-hint" : undefined;
  return (
    <div className="field">
      <label className="field-label" htmlFor={key}>
        {label}
        {input.required ? <span aria-hidden="true"> *</span> : null}
      </label>
      <select
        {...input}
        id={key}
        className="control"
        aria-invalid={error ? true : undefined}
        aria-describedby={description}
      >
        {children}
      </select>
      {error ? (
        <p className="field-error" id={key + "-error"}>
          {error}
        </p>
      ) : hint ? (
        <p className="field-hint" id={key + "-hint"}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
export function Button({
  variant = "primary",
  className,
  ...props
}: ComponentPropsWithRef<"button"> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  return (
    <button
      type="button"
      {...props}
      className={["button", variant === "primary" ? "" : variant, className]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
export function FieldErrors({ errors }: { errors: string[] }) {
  return errors.length ? (
    <div className="form-error" role="alert">
      <p>Revisa los campos indicados.</p>
      <ul>
        {errors.map((error, i) => (
          <li key={i}>{error}</li>
        ))}
      </ul>
    </div>
  ) : null;
}
