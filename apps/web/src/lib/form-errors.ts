"use client";
import { useEffect, useRef } from "react";
import type { FieldPath, FieldValues, UseFormSetError } from "react-hook-form";
import { ApiError } from "./api";
export function applyFieldError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: Record<string, FieldPath<T>>,
) {
  if (!(error instanceof ApiError)) return false;
  const field =
    fields[error.code] ??
    error.details
      .map((detail) => fields["field:" + String(detail.field)])
      .find(Boolean);
  if (!field) return false;
  setError(
    field,
    { type: "server", message: error.message },
    { shouldFocus: true },
  );
  return true;
}

export function useApiFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: Record<string, FieldPath<T>>,
) {
  const mapping = useRef(fields);
  mapping.current = fields;
  useEffect(() => {
    if (error) applyFieldError(error, setError, mapping.current);
  }, [error, setError]);
  return (
    error instanceof ApiError &&
    !!(
      fields[error.code] ??
      error.details
        .map((detail) => fields["field:" + String(detail.field)])
        .find(Boolean)
    )
  );
}
