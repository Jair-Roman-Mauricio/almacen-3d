"use client";
import { useEffect, useState } from "react";
import type { Confirmation } from "@almacen/contracts";
import { Button } from "@almacen/ui";
import { errorMessage, request } from "../lib/api";
import {
  mountedCommands,
  pendingChanged,
  readPending,
  type PendingOperation,
} from "../lib/pending-operations";
import { useSession } from "./session";
const labels: Record<string, string> = {
  "product-remove": "Retirada de producto",
  "product-edit": "Edición de producto",
  "product-create": "Alta de producto",
  "warehouse-create": "Alta de almacén",
  "user-create": "Alta de cuenta",
  "user-update": "Cambio de cuenta",
  "company-profile": "Perfil de empresa",
};
interface Item extends PendingOperation {
  key: string;
  label: string;
}
/** Recover references whose originating form is no longer mounted, including removed rows. */
export function PendingOperationsNotice() {
  const { session } = useSession(),
    [items, setItems] = useState<Item[]>([]),
    [checking, setChecking] = useState(""),
    [error, setError] = useState(""),
    [recovered, setRecovered] = useState("");
  const prefix = `almacen:pending:v1:${session?.company.id}:${session?.user.id}:`;
  useEffect(() => {
    function update() {
      const next: Item[] = [];
      try {
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (!key?.startsWith(prefix) || mountedCommands.has(key)) continue;
          const value = readPending(sessionStorage.getItem(key));
          if (value)
            next.push({
              ...value,
              key,
              label:
                labels[key.slice(prefix.length).split(":")[0] ?? ""] ??
                "Operación",
            });
        }
      } catch {
        /* Browser storage is optional. */
      }
      setItems(next);
    }
    update();
    window.addEventListener("pending-operations-changed", update);
    return () =>
      window.removeEventListener("pending-operations-changed", update);
  }, [prefix]);
  async function consult(item: Item) {
    setChecking(item.key);
    setError("");
    try {
      const response = await request<{
        data: Confirmation<unknown> | { status: "pending" };
      }>("/operations/" + item.reference);
      if (response.data.status !== "confirmed") {
        setError("La operación continúa pendiente. Conserva la referencia.");
        return;
      }
      sessionStorage.removeItem(item.key);
      pendingChanged();
      window.dispatchEvent(new Event("operation-confirmed"));
      setRecovered(item.label + " · " + item.reference);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setChecking("");
    }
  }
  if (!items.length && !recovered) return null;
  return (
    <aside className="pending-notice" aria-label="Resultados de operaciones">
      {items.length ? (
        <>
          <h2>Hay operaciones por comprobar</h2>
          <p>
            Estas referencias conservan su consulta aunque cambies de pantalla.
          </p>
          <ul>
            {items.map((item) => (
              <li key={item.key}>
                <div>
                  <strong>{item.label}</strong>
                  <span className="reference">{item.reference}</span>
                </div>
                <Button
                  variant="secondary"
                  disabled={!!checking}
                  aria-label={"Consultar operación " + item.reference}
                  onClick={() => void consult(item)}
                >
                  {checking === item.key
                    ? "Consultando…"
                    : "Consultar resultado"}
                </Button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {recovered ? (
        <div role="status">
          <p>Resultado recuperado. Operación confirmada.</p>
          <p className="reference">{recovered}</p>
          <Button variant="ghost" onClick={() => setRecovered("")}>
            Cerrar aviso
          </Button>
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="field-error">
          {error}
        </p>
      ) : null}
    </aside>
  );
}
