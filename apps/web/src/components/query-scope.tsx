"use client";
import { useEffect, useState, type ReactNode } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { Page, Warehouse } from "@almacen/contracts";
import { QueryStatus } from "@almacen/ui";
import { request } from "../lib/api";
import { useSession } from "./session";
export function QueryScope({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const key = session
    ? `${session.company.id}:${session.user.id}:${session.user.role}`
    : "anonymous";
  return <Scope key={key}>{children}</Scope>;
}
function Scope({ children }: { children: ReactNode }) {
  const [client] = useState(
      () =>
        new QueryClient({
          defaultOptions: {
            queries: { retry: false, staleTime: 0, refetchOnWindowFocus: true },
            mutations: { retry: false },
          },
        }),
    ),
    { session, refresh } = useSession();
  useEffect(() => {
    const invalidate = () => {
      void client.invalidateQueries();
    };
    window.addEventListener("operation-confirmed", invalidate);
    let source: EventSource | undefined;
    if (session) {
      source = new EventSource("/api/v1/changes");
      source.addEventListener("ready", () => {
        invalidate();
        void refresh();
      });
      source.addEventListener("change", () => {
        invalidate();
        void refresh();
      });
      source.onerror = () => {
        void refresh();
      };
    }
    return () => {
      source?.close();
      window.removeEventListener("operation-confirmed", invalidate);
      client.clear();
    };
  }, [client, session?.company.id, session?.user.id, refresh]);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
export function useScopeKey() {
  const { session } = useSession();
  return [
    session?.company.id ?? "anonymous",
    session?.user.id ?? "anonymous",
  ] as const;
}
export async function allWarehouses(signal?: AbortSignal) {
  const rows: Warehouse[] = [];
  let cursor: string | null = null;
  do {
    const result: Page<Warehouse> = await request(
      "/warehouses?limit=100" +
        (cursor ? "&cursor=" + encodeURIComponent(cursor) : ""),
      signal ? { signal } : {},
    );
    rows.push(...result.data);
    cursor = result.page.nextCursor;
  } while (cursor);
  return rows;
}
export function useWarehouses() {
  const { session } = useSession(),
    scope = useScopeKey();
  return useQuery({
    queryKey: [...scope, "warehouses"],
    queryFn: ({ signal }) => allWarehouses(signal),
    enabled: !!session,
  });
}
export function CacheFixture() {
  const { session } = useSession(),
    query = useWarehouses();
  if (!session) return null;
  return (
    <section aria-label="Caché de almacenes">
      <h2>Caché de almacenes</h2>
      <p>{session.company.code}</p>
      {query.isPending ? (
        <QueryStatus state="loading" />
      ) : query.isError ? (
        <QueryStatus state="error" />
      ) : (
        <ul>
          {query.data.map((row) => (
            <li key={row.id}>{row.name}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
export { useQueryClient };
