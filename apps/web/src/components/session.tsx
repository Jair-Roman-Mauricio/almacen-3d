"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { QueryStatus } from "@almacen/ui";
import type { Session } from "@almacen/contracts";
import { ApiError, request } from "../lib/api";
interface SessionState {
  session: Session | null;
  loading: boolean;
  connected: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}
const Context = createContext<SessionState | null>(null);
export const roleLabels = {
  admin: "Administrador",
  supervisor: "Supervisor",
  operator: "Operador",
};
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null),
    [loading, setLoading] = useState(true),
    [connected, setConnected] = useState(true),
    sequence = useRef(0);
  const refresh = useCallback(async () => {
    const seq = ++sequence.current;
    try {
      const result = await request<{ data: Session }>("/sessions/current");
      if (seq === sequence.current) {
        setSession(result.data);
        setConnected(true);
      }
    } catch (error) {
      if (seq !== sequence.current) return;
      if (error instanceof ApiError && error.status === 401) setSession(null);
      else setConnected(false);
    } finally {
      if (seq === sequence.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
    const update = () => {
        void refresh();
      },
      expired = () => {
        ++sequence.current;
        setSession(null);
        setConnected(true); // A server response confirmed that the session expired.
        setLoading(false);
      },
      offline = () => setConnected(false),
      visible = () => {
        if (document.visibilityState === "visible") update();
      };
    window.addEventListener("focus", update);
    window.addEventListener("online", update);
    window.addEventListener("offline", offline);
    window.addEventListener("pageshow", update);
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("session-expired", expired);
    window.addEventListener("permissions-changed", update);
    return () => {
      ++sequence.current;
      window.removeEventListener("focus", update);
      window.removeEventListener("online", update);
      window.removeEventListener("offline", offline);
      window.removeEventListener("pageshow", update);
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener("session-expired", expired);
      window.removeEventListener("permissions-changed", update);
    };
  }, [refresh]);
  async function logout() {
    await request("/sessions/current", { method: "DELETE", session });
    ++sequence.current;
    setSession(null);
  }
  return (
    <Context.Provider value={{ session, loading, connected, refresh, logout }}>
      {children}
    </Context.Provider>
  );
}
export function useSession() {
  const state = useContext(Context);
  if (!state) throw new Error("SessionProvider requerido.");
  return state;
}
export function Protected({
  children,
  admin = false,
}: {
  children: ReactNode;
  admin?: boolean;
}) {
  const { session, loading, connected, refresh } = useSession();
  if (loading) return <QueryStatus state="loading" />;
  if (!session)
    return (
      <main className="access-status">
        <QueryStatus
          state={connected ? "forbidden" : "error"}
          title={
            connected
              ? "Sesión no disponible"
              : "No se pudo comprobar la sesión"
          }
          description={
            connected
              ? "Inicia sesión para acceder a tu empresa."
              : "Comprueba la conexión y vuelve a intentarlo."
          }
          action={
            connected ? (
              <Link className="button" href="/acceso">
                Ir al acceso
              </Link>
            ) : (
              <button className="button" onClick={() => void refresh()}>
                Reintentar
              </button>
            )
          }
        />
      </main>
    );
  if (admin && session.user.role !== "admin")
    return <QueryStatus state="forbidden" />;
  return children;
}
