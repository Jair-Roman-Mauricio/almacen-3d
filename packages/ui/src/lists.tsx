"use client";
import { useMemo, type ReactNode } from "react";
import {
  useTable,
  tableFeatures,
  type ColumnDef,
  type RowData,
} from "@tanstack/react-table";
import { Button } from "./fields.js";
export type QueryState =
  | "loading"
  | "empty"
  | "no-results"
  | "error"
  | "forbidden";
const titles: Record<QueryState, string> = {
  loading: "Cargando datos",
  empty: "Aún no hay registros",
  "no-results": "No hay coincidencias",
  error: "No se pudieron cargar los datos",
  forbidden: "No tienes permiso",
};
const descriptions: Record<QueryState, string> = {
  loading: "Espera un momento.",
  empty: "Los registros aparecerán aquí cuando se creen.",
  "no-results": "Prueba con otra búsqueda o limpia los filtros.",
  error: "Comprueba la conexión y vuelve a intentarlo.",
  forbidden: "Tu rol actual no permite acceder a esta información.",
};
export function QueryStatus({
  state,
  title,
  description,
  action,
}: {
  state: QueryState;
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <section
      className="query-status"
      aria-busy={state === "loading"}
      role={state === "error" ? "alert" : "status"}
    >
      <h2>{title ?? titles[state]}</h2>
      <p className="muted">{description ?? descriptions[state]}</p>
      {state === "loading" ? (
        <div className="skeleton" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      ) : (
        action
      )}
    </section>
  );
}
export interface TableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  numeric?: boolean;
}
const features = tableFeatures({});
export function DataTable<T extends RowData>({
  caption,
  columns,
  rows,
  rowKey,
  className = "",
}: {
  caption: string;
  columns: TableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  className?: string;
}) {
  const defs = useMemo<ColumnDef<typeof features, T>[]>(
    () => columns.map((column) => ({ id: column.key, header: column.header })),
    [columns],
  );
  const table = useTable({
    features,
    columns: defs,
    data: rows,
    getRowId: rowKey,
  });
  return (
    <table className={"data-table " + className}>
      <caption className="sr-only">{caption}</caption>
      <thead>
        {table.getHeaderGroups().map((group) => (
          <tr key={group.id}>
            {group.headers.map((header) => (
              <th
                scope="col"
                key={header.id}
                className={
                  columns.find((c) => c.key === header.column.id)?.numeric
                    ? "numeric"
                    : ""
                }
              >
                <table.FlexRender header={header} />
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id}>
            {row.getAllCells().map((cell) => (
              <td
                key={cell.id}
                data-label={
                  columns.find((c) => c.key === cell.column.id)?.header
                }
                className={
                  columns.find((c) => c.key === cell.column.id)?.numeric
                    ? "numeric"
                    : ""
                }
              >
                {columns
                  .find((column) => column.key === cell.column.id)
                  ?.render(row.original)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
export function Pagination({
  page,
  hasNext,
  onNext,
  onPrevious,
  busy = false,
}: {
  page: number;
  hasNext: boolean;
  onNext: () => void;
  onPrevious: () => void;
  busy?: boolean;
}) {
  return (
    <nav className="pagination" aria-label="Paginación">
      <span className="muted">Página {page}</span>
      <div>
        <Button
          variant="secondary"
          disabled={page === 1 || busy}
          onClick={onPrevious}
        >
          Anterior
        </Button>
        <Button
          variant="secondary"
          disabled={!hasNext || busy}
          onClick={onNext}
        >
          Siguiente
        </Button>
      </div>
    </nav>
  );
}
