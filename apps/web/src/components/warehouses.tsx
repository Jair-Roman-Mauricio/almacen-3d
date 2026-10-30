"use client";
import { FormSummary } from "./form-summary";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Warehouse } from "@almacen/contracts";
import { Button, DataTable, Field, formatExact } from "@almacen/ui";
import { warehouseFormSchema } from "../lib/form-schemas";
import { useApiFieldErrors } from "../lib/form-errors";
import { CommandFeedback, useCommand } from "./command";
import { useSession } from "./session";
import { PageHeading } from "./shell";
import { useWarehouse } from "./warehouse-context";
import { ListBody, ListPagination, usePagedList } from "./paged-list";
export function WarehousesPage() {
  const { session } = useSession(),
    context = useWarehouse(),
    [creating, setCreating] = useState(false),
    [q, setQ] = useState(""),
    query = usePagedList<Warehouse>("/warehouses", { q });
  return (
    <>
      <PageHeading
        title="Almacenes"
        description="Espacios físicos y dimensiones de tu operación."
        action={
          session?.user.role === "admin" ? (
            <Button disabled={creating} onClick={() => setCreating(true)}>
              Nuevo almacén
            </Button>
          ) : null
        }
      />
      {creating ? <CreateWarehouse onClose={() => setCreating(false)} /> : null}
      <div className="list-toolbar">
        <Field
          label="Buscar almacenes"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Código o nombre"
        />
      </div>
      <div className="list-surface">
        <ListBody
          query={query}
          filtered={!!q}
          emptyTitle="Esta empresa aún no tiene almacenes"
        >
          <DataTable
            caption="Almacenes de la empresa"
            rows={query.data?.data ?? []}
            rowKey={(row) => row.id}
            columns={[
              {
                key: "name",
                header: "Almacén",
                render: (row) => (
                  <div>
                    <strong>{row.name}</strong>
                    <span className="cell-secondary">{row.code}</span>
                  </div>
                ),
              },
              {
                key: "dimensions",
                header: "Ancho × alto × profundidad",
                render: (row) => (
                  <span className="numeral">
                    {formatExact(row.dimensions.width)} ×{" "}
                    {formatExact(row.dimensions.height)} ×{" "}
                    {formatExact(row.dimensions.depth)} m
                  </span>
                ),
              },
              {
                key: "selection",
                header: "Contexto",
                render: (row) => (
                  <Button
                    variant="secondary"
                    disabled={context.warehouse?.id === row.id}
                    aria-label={"Seleccionar " + row.code}
                    onClick={() => context.select(row.id)}
                  >
                    {context.warehouse?.id === row.id
                      ? "Seleccionado"
                      : "Seleccionar"}
                  </Button>
                ),
              },
            ]}
          />
        </ListBody>
        <ListPagination query={query} />
      </div>
    </>
  );
}
function CreateWarehouse({ onClose }: { onClose: () => void }) {
  const context = useWarehouse(),
    form = useForm({
      resolver: zodResolver(warehouseFormSchema),
      defaultValues: { code: "", name: "", width: "", height: "", depth: "" },
    }),
    errors = form.formState.errors,
    command = useCommand<Warehouse>("warehouse-create", (value) =>
      context.select(value.result.id),
    ),
    mapped = useApiFieldErrors(command.error, form.setError, {
      CODE_EXISTS: "code",
      INVALID_CODE: "code",
      INVALID_NAME: "name",
      "field:dimensions.width": "width",
      "field:dimensions.height": "height",
      "field:dimensions.depth": "depth",
    });
  return (
    <section
      className="create-panel"
      aria-labelledby="create-warehouse-heading"
    >
      <div className="panel-heading">
        <div>
          <h2 id="create-warehouse-heading">Nuevo almacén</h2>
          <p className="muted">
            Dimensiones interiores en metros. Usa punto para los decimales.
          </p>
        </div>
        <Button variant="ghost" disabled={command.locked} onClick={onClose}>
          Cancelar
        </Button>
      </div>
      <form
        className="form-grid"
        noValidate
        onSubmit={form.handleSubmit(({ code, name, width, height, depth }) => {
          form.clearErrors();
          void command.run("/warehouses", "POST", {
            code,
            name,
            dimensions: { width, height, depth },
          });
        })}
      >
        <FormSummary errors={errors} />
        <div className="form-row">
          <Field
            label="Código del almacén"
            required
            {...form.register("code")}
            error={errors.code?.message}
            disabled={command.locked}
          />
          <Field
            label="Nombre del almacén"
            required
            {...form.register("name")}
            error={errors.name?.message}
            disabled={command.locked}
          />
        </div>
        <div className="form-row dimensions-row">
          {(["width", "height", "depth"] as const).map((key, index) => (
            <Field
              key={key}
              label={["Ancho (m)", "Alto (m)", "Profundidad (m)"][index]!}
              inputMode="decimal"
              required
              {...form.register(key)}
              error={errors[key]?.message}
              disabled={command.locked}
            />
          ))}
        </div>
        <div>
          <Button type="submit" disabled={command.locked}>
            Crear almacén
          </Button>
        </div>
      </form>
      <CommandFeedback command={command} hideError={mapped} />
    </section>
  );
}
