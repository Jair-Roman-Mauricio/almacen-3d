"use client";
import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Page } from "@almacen/contracts";
import { Button, Pagination, QueryStatus } from "@almacen/ui";
import { ApiError, request } from "../lib/api";
import { useScopeKey } from "./query-scope";
export function usePagedList<T>(
  resource: string,
  filters: Record<string, string | undefined>,
  enabled = true,
) {
  const scope = useScopeKey(),
    filterKey = JSON.stringify(filters),
    [paging, setPaging] = useState<{
      filterKey: string;
      cursors: (string | null)[];
    }>({ filterKey, cursors: [null] });
  const cursors = paging.filterKey === filterKey ? paging.cursors : [null],
    cursor = cursors.at(-1) ?? null;
  const params = new URLSearchParams({ limit: "25" });
  for (const [key, value] of Object.entries(filters))
    if (value) params.set(key, value);
  if (cursor) params.set("cursor", cursor);
  const query = useQuery({
    queryKey: [...scope, resource, filters, cursor],
    queryFn: ({ signal }) =>
      request<Page<T>>(resource + "?" + params, { signal }),
    enabled,
  });
  return {
    ...query,
    pageNo: cursors.length,
    hasNext: !!query.data?.page.nextCursor,
    next: () => {
      const next = query.data?.page.nextCursor;
      if (next) setPaging({ filterKey, cursors: [...cursors, next] });
    },
    previous: () => setPaging({ filterKey, cursors: cursors.slice(0, -1) }),
  };
}
export function ListBody({
  query,
  filtered,
  emptyTitle,
  children,
}: {
  query: {
    isPending: boolean;
    isError: boolean;
    error: unknown;
    data?: Page<unknown> | undefined;
    refetch: () => unknown;
  };
  filtered: boolean;
  emptyTitle: string;
  children: ReactNode;
}) {
  if (query.isPending) return <QueryStatus state="loading" />;
  if (query.isError)
    return (
      <QueryStatus
        state={
          query.error instanceof ApiError && query.error.status === 403
            ? "forbidden"
            : "error"
        }
        action={
          <Button variant="secondary" onClick={() => void query.refetch()}>
            Reintentar
          </Button>
        }
      />
    );
  if (!query.data?.data.length)
    return (
      <QueryStatus
        state={filtered ? "no-results" : "empty"}
        {...(filtered ? {} : { title: emptyTitle })}
      />
    );
  return children;
}
export function ListPagination({
  query,
}: {
  query: {
    pageNo: number;
    hasNext: boolean;
    next: () => void;
    previous: () => void;
    isFetching: boolean;
  };
}) {
  return (
    <Pagination
      page={query.pageNo}
      hasNext={query.hasNext}
      onNext={query.next}
      onPrevious={query.previous}
      busy={query.isFetching}
    />
  );
}
