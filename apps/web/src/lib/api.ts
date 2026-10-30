import type { Session } from "@almacen/contracts";
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details: Record<string, unknown>[] = [],
  ) {
    super(message);
  }
}
export async function request<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    session?: Session | null;
    reference?: string;
    signal?: AbortSignal;
  } = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch("/api/v1" + path, {
      method: options.method ?? "GET",
      credentials: "same-origin",
      cache: "no-store",
      ...(options.signal ? { signal: options.signal } : {}),
      headers: {
        Accept: "application/json",
        ...(options.body !== undefined
          ? { "Content-Type": "application/json" }
          : {}),
        ...(options.session
          ? { "X-CSRF-Token": options.session.csrfToken }
          : {}),
        ...(options.reference ? { "Idempotency-Key": options.reference } : {}),
      },
      ...(options.body !== undefined
        ? { body: JSON.stringify(options.body) }
        : {}),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new ApiError(
      0,
      "NETWORK_FAILURE",
      "No se pudo confirmar la respuesta. Comprueba la conexión.",
    );
  }
  if (response.status === 204) return undefined as T;
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401)
      window.dispatchEvent(new Event("session-expired"));
    if (response.status === 403)
      window.dispatchEvent(new Event("permissions-changed"));
    throw new ApiError(
      response.status,
      payload?.error?.code ?? "REQUEST_FAILED",
      payload?.error?.message ?? "No se pudo completar la solicitud.",
      payload?.error?.details ?? [],
    );
  }
  if (
    !payload ||
    typeof payload !== "object" ||
    !Object.hasOwn(payload, "data")
  )
    throw new ApiError(
      0,
      "RESPONSE_INCOMPLETE",
      "La respuesta está incompleta. Consulta la referencia para confirmar el resultado.",
    );
  return payload as T;
}
export function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "No se pudo completar la solicitud.";
}
