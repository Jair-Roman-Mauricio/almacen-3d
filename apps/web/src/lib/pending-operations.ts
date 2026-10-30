"use client";
export interface PendingOperation {
  reference: string;
  path: string;
  method: string;
}
export const mountedCommands = new Set<string>();
export function pendingChanged() {
  window.dispatchEvent(new Event("pending-operations-changed"));
}
export function mountCommand(key: string) {
  mountedCommands.add(key);
  pendingChanged();
  return () => {
    mountedCommands.delete(key);
    pendingChanged();
  };
}
export function readPending(raw: string | null): PendingOperation | null {
  try {
    if (!raw) return null;
    const value = JSON.parse(raw) as PendingOperation;
    if (
      /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/iu.test(value.reference) &&
      typeof value.path === "string" &&
      value.path.startsWith("/") &&
      ["POST", "PATCH", "DELETE", "PUT"].includes(value.method)
    )
      return {
        reference: value.reference,
        path: value.path,
        method: value.method,
      };
  } catch {
    /* Ignore malformed local metadata. */
  }
  return null;
}
