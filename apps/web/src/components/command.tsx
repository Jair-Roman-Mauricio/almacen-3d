"use client";
import { useEffect, useRef, useState } from "react";
import type { Confirmation } from "@almacen/contracts";
import { Button } from "@almacen/ui";
import { ApiError, errorMessage, request } from "../lib/api";
import {
  mountCommand,
  pendingChanged,
  readPending,
  type PendingOperation,
} from "../lib/pending-operations";
import { useSession } from "./session";
type Pending = PendingOperation;
interface Attempt extends Pending {
  body?: unknown;
}
type Status = "idle" | "submitting" | "uncertain" | "confirmed" | "rejected";
export function useCommand<T>(
  name: string,
  onConfirmed?: (value: Confirmation<T>) => void,
) {
  const { session, connected } = useSession(),
    [status, setStatus] = useState<Status>("idle"),
    [pending, setPending] = useState<Pending | null>(null),
    [error, setError] = useState<unknown>(null),
    [checking, setChecking] = useState(false),
    [hydrated, setHydrated] = useState(false),
    attempt = useRef<Attempt | null>(null),
    callback = useRef(onConfirmed),
    inFlight = useRef(false);
  callback.current = onConfirmed;
  const key = session
    ? `almacen:pending:v1:${session.company.id}:${session.user.id}:${name}`
    : null;
  useEffect(() => {
    const unmount = key ? mountCommand(key) : () => {};
    attempt.current = null;
    setPending(null);
    setStatus("idle");
    setError(null);
    setHydrated(false);
    if (key) {
      try {
        const value = readPending(sessionStorage.getItem(key));
        if (value) {
          setPending(value);
          setStatus("uncertain");
        }
      } catch {
        /* Storage is optional; the visible reference remains usable. */
      }
    }
    setHydrated(true);
    return unmount;
  }, [key]);
  function remember(value: Pending | null) {
    setPending(value);
    try {
      if (key) {
        if (value) sessionStorage.setItem(key, JSON.stringify(value));
        else sessionStorage.removeItem(key);
      }
    } catch {
      /* No command bodies are persisted. */
    }
    pendingChanged();
  }
  function confirmed(value: Confirmation<T>) {
    remember(null);
    attempt.current = null;
    setError(null);
    setStatus("confirmed");
    window.dispatchEvent(new Event("operation-confirmed"));
    callback.current?.(value);
  }
  async function send(value: Attempt) {
    if (!session || !connected || inFlight.current) return;
    inFlight.current = true;
    setStatus("submitting");
    setError(null);
    try {
      const result = await request<{ data: Confirmation<T> }>(value.path, {
        method: value.method,
        ...(value.body === undefined ? {} : { body: value.body }),
        session,
        reference: value.reference,
      });
      if (
        !result.data ||
        result.data.status !== "confirmed" ||
        result.data.reference !== value.reference ||
        !result.data.result ||
        typeof result.data.result !== "object"
      )
        throw new ApiError(
          0,
          "RESPONSE_INCOMPLETE",
          "No se recibió una confirmación válida. Consulta la referencia.",
        );
      confirmed(result.data);
      return result.data;
    } catch (caught) {
      setError(caught);
      if (
        caught instanceof ApiError &&
        (caught.status === 0 || caught.status >= 500)
      )
        setStatus("uncertain");
      else {
        remember(null);
        attempt.current = null;
        setStatus("rejected");
      }
    } finally {
      inFlight.current = false;
    }
  }
  async function run(path: string, method: string, body?: unknown) {
    if (!hydrated || status === "uncertain" || inFlight.current || !connected)
      return;
    const value: Attempt = {
      path,
      method,
      reference: crypto.randomUUID(),
      ...(body === undefined ? {} : { body }),
    };
    attempt.current = value;
    remember({ path, method, reference: value.reference });
    return send(value);
  }
  async function consult() {
    if (!pending || checking || inFlight.current) return;
    setChecking(true);
    setError(null);
    try {
      const result = await request<{
        data: Confirmation<T> | { status: "pending" };
      }>("/operations/" + pending.reference);
      if (result.data.status === "confirmed") confirmed(result.data);
      else
        setError(
          new Error(
            "La operación continúa pendiente. Conserva esta referencia.",
          ),
        );
    } catch (caught) {
      setError(
        caught instanceof ApiError && caught.code === "RESULT_NOT_RECORDED"
          ? new Error(
              "Aún no hay un resultado registrado. Esto no confirma que la operación haya fallado.",
            )
          : caught,
      );
    } finally {
      setChecking(false);
    }
  }
  return {
    run,
    consult,
    replay: () => (attempt.current ? send(attempt.current) : undefined),
    status,
    error,
    pending,
    checking,
    canReplay: !!attempt.current,
    locked:
      !hydrated ||
      !connected ||
      status === "submitting" ||
      status === "uncertain",
  };
}
export function CommandFeedback({
  command,
  hideError = false,
}: {
  command: ReturnType<typeof useCommand>;
  hideError?: boolean;
}) {
  return (
    <div className="command-feedback" aria-live="polite">
      {command.status === "submitting" ? (
        <p role="status">Confirmando operación…</p>
      ) : null}
      {command.status === "confirmed" ? (
        <p className="success" role="status">
          Operación confirmada
        </p>
      ) : null}
      {command.status === "uncertain" ? (
        <section className="uncertain">
          <h3>Resultado no confirmado</h3>
          <p>
            Conserva la referencia. Consulta el resultado antes de iniciar otra
            operación.
          </p>
          <p className="reference">{command.pending?.reference}</p>
          <div className="action-row">
            <Button
              variant="secondary"
              disabled={command.checking}
              onClick={() => void command.consult()}
            >
              {command.checking ? "Consultando…" : "Consultar resultado"}
            </Button>
            {command.canReplay ? (
              <Button variant="secondary" onClick={() => void command.replay()}>
                Reenviar misma operación
              </Button>
            ) : null}
          </div>
        </section>
      ) : null}
      {command.error && !hideError ? (
        <p role="alert" className="field-error">
          {errorMessage(command.error)}
        </p>
      ) : null}
    </div>
  );
}
export function CommandFixture() {
  const [code, setCode] = useState(""),
    command = useCommand("fixture");
  const { session } = useSession();
  if (session?.user.role !== "admin") return null;
  return (
    <section>
      <h2>Referencia de operación</h2>
      <FieldFixture code={code} setCode={setCode} locked={command.locked} />
      <Button
        disabled={command.locked || !code}
        onClick={() =>
          void command.run("/warehouses", "POST", {
            code,
            name: "Prueba de referencia",
            dimensions: { width: "10", height: "5", depth: "10" },
          })
        }
      >
        Ejecutar operación de prueba
      </Button>
      <CommandFeedback command={command} />
    </section>
  );
}
function FieldFixture({
  code,
  setCode,
  locked,
}: {
  code: string;
  setCode: (value: string) => void;
  locked: boolean;
}) {
  return (
    <div className="field">
      <label htmlFor="fixture-command">Código de operación de prueba</label>
      <input
        className="control"
        id="fixture-command"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        disabled={locked}
      />
    </div>
  );
}
