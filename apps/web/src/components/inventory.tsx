"use client";
import Link from "next/link";
import { useState } from "react";
import type { ProductTotal, Stock, Warehouse } from "@almacen/contracts";
import {
  Button,
  DataTable,
  Field,
  QueryStatus,
  formatExact,
  type TableColumn,
} from "@almacen/ui";
import { PageHeading } from "./shell";
import { useWarehouse } from "./warehouse-context";
import { ListBody, ListPagination, usePagedList } from "./paged-list";
export function InventoryPage() {
  const context = useWarehouse();
  if (context.loading) return <QueryStatus state="loading" />;
  if (context.error)
    return (
      <QueryStatus
        state="error"
        action={<Button onClick={context.reload}>Reintentar</Button>}
      />
    );
  if (!context.warehouse)
    return (
      <>
        <PageHeading
          title="Inventario"
          description="Existencias confirmadas por producto y ubicación."
        />
        <QueryStatus
          state="empty"
          title="Selecciona un almacén"
          description="El inventario se consulta dentro de un almacén de tu empresa."
          action={
            <Link href="/app/almacenes" className="button">
              Ver almacenes
            </Link>
          }
        />
      </>
    );
  return <InventoryList warehouse={context.warehouse} />;
}
function InventoryList({ warehouse }: { warehouse: Warehouse }) {
  const [view, setView] = useState<"positions" | "totals">("positions"),
    [q, setQ] = useState(""),
    query = usePagedList<Stock | ProductTotal>(
      view === "positions" ? "/inventory" : "/inventory/totals",
      { warehouseId: warehouse.id, q },
    );
  const columns: TableColumn<Stock | ProductTotal>[] = [
    {
      key: "product",
      header: "Producto",
      render: (row) => (
        <div>
          <strong>{row.product.name}</strong>
          <span className="cell-secondary sku">{row.product.sku}</span>
        </div>
      ),
    },
  ];
  if (view === "positions")
    columns.push({
      key: "location",
      header: "Ubicación",
      render: (row) =>
        "locationCode" in row ? (
          <div>
            <span className="location-code">{row.locationCode}</span>
            {row.blocked ? (
              <span className="blocked-label">Bloqueada</span>
            ) : null}
          </div>
        ) : null,
    });
  for (const [key, header] of [
    ["physical", "Físico"],
    ["reserved", "Reservado"],
    ["available", "Disponible"],
  ] as const)
    columns.push({
      key,
      header,
      numeric: true,
      render: (row) => (
        <span
          className={"quantity " + (key === "available" ? "available" : "")}
        >
          {formatExact(row[key])}
          <span className="quantity-unit"> {row.product.unit.label}</span>
        </span>
      ),
    });
  return (
    <>
      <PageHeading
        title="Inventario"
        description="Existencias confirmadas por producto y ubicación."
      />
      <div className="inventory-context">
        <span>{warehouse.code}</span>
        <strong>{warehouse.name}</strong>
      </div>
      <div className="view-switch" aria-label="Vista de inventario">
        <Button
          variant="ghost"
          aria-pressed={view === "positions"}
          onClick={() => setView("positions")}
        >
          Por ubicación
        </Button>
        <Button
          variant="ghost"
          aria-pressed={view === "totals"}
          onClick={() => setView("totals")}
        >
          Totales por producto
        </Button>
      </div>
      <div className="list-toolbar">
        <Field
          label="Buscar inventario"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={
            view === "positions"
              ? "SKU, producto o ubicación"
              : "SKU o nombre de producto"
          }
        />
        {q ? (
          <Button variant="ghost" onClick={() => setQ("")}>
            Limpiar búsqueda
          </Button>
        ) : null}
      </div>
      <div className="list-surface">
        <ListBody
          query={query}
          filtered={!!q}
          emptyTitle="Este almacén aún no tiene existencias"
        >
          <DataTable
            className={"inventory-table " + view}
            caption={
              view === "positions"
                ? "Inventario por ubicación"
                : "Totales por producto"
            }
            rows={query.data?.data ?? []}
            rowKey={(row) =>
              ("locationId" in row ? row.locationId + ":" : "") + row.product.id
            }
            columns={columns}
          />
        </ListBody>
        <ListPagination query={query} />
      </div>
      <p className="list-note">
        Disponible excluye las reservas y las existencias de ubicaciones
        bloqueadas. Cada cantidad se expresa en la unidad base de su producto.
      </p>
    </>
  );
}
