"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Warehouse } from "@almacen/contracts";
import { useSession } from "./session";
import { useWarehouses } from "./query-scope";
interface ContextState {
  warehouses: Warehouse[];
  warehouse: Warehouse | null;
  select: (id: string) => void;
  loading: boolean;
  error: unknown;
  reload: () => void;
}
const Context = createContext<ContextState | null>(null);
export function WarehouseProvider({ children }: { children: ReactNode }) {
  const query = useWarehouses(),
    { session } = useSession(),
    [preferred, setPreferred] = useState("");
  const key = `almacen:warehouse:v1:${session?.company.id}:${session?.user.id}`;
  useEffect(() => {
    try {
      setPreferred(localStorage.getItem(key) ?? "");
    } catch {
      setPreferred("");
    }
  }, [key]);
  const rows = query.data ?? [],
    warehouse = rows.find((row) => row.id === preferred) ?? rows[0] ?? null;
  function select(id: string) {
    setPreferred(id);
    try {
      localStorage.setItem(key, id);
    } catch {
      /* Selection works without persistence. */
    }
  }
  return (
    <Context.Provider
      value={{
        warehouses: rows,
        warehouse,
        select,
        loading: query.isPending,
        error: query.error,
        reload: () => {
          void query.refetch();
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useWarehouse() {
  const value = useContext(Context);
  if (!value) throw new Error("WarehouseProvider requerido.");
  return value;
}
