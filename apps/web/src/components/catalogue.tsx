"use client";
import { FormSummary } from "./form-summary";
import { ProductActions } from "./product-actions";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Product } from "@almacen/contracts";
import { Button, DataTable, Field, SelectField } from "@almacen/ui";
import { productFormSchema } from "../lib/form-schemas";
import { useApiFieldErrors } from "../lib/form-errors";
import { CommandFeedback, useCommand } from "./command";
import { useSession } from "./session";
import { PageHeading } from "./shell";
import { ListBody, ListPagination, usePagedList } from "./paged-list";
export const unitKinds = {
  piece: "Pieza",
  box: "Caja",
  pallet: "Pallet",
  weight: "Peso",
  volume: "Volumen",
  length: "Longitud",
};
export function CataloguePage() {
  const { session } = useSession(),
    canWrite =
      session?.user.role === "admin" || session?.user.role === "supervisor",
    [creating, setCreating] = useState(false),
    [q, setQ] = useState(""),
    query = usePagedList<Product>("/products", { q });
  return (
    <>
      <PageHeading
        title="Catálogo"
        description="Productos y unidades base compartidos por tus almacenes."
        action={
          canWrite ? (
            <Button disabled={creating} onClick={() => setCreating(true)}>
              Nuevo producto
            </Button>
          ) : null
        }
      />
      {creating && canWrite ? (
        <CreateProduct onClose={() => setCreating(false)} />
      ) : null}
      <div className="list-toolbar">
        <Field
          label="Buscar productos"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="SKU o nombre"
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
          emptyTitle="Aún no hay productos"
        >
          <DataTable
            caption="Catálogo de productos"
            rows={query.data?.data ?? []}
            rowKey={(row) => row.id}
            columns={[
              {
                key: "name",
                header: "Producto",
                render: (row) => (
                  <div>
                    <strong>{row.name}</strong>
                    <span className="cell-secondary sku">{row.sku}</span>
                  </div>
                ),
              },
              {
                key: "unit",
                header: "Unidad base",
                render: (row) => (
                  <div>
                    <strong>{row.unit.label}</strong>
                    <span className="cell-secondary">
                      {unitKinds[row.unit.kind]}
                    </span>
                  </div>
                ),
              },
              ...(canWrite
                ? [
                    {
                      key: "actions",
                      header: "Acciones",
                      render: (row: Product) => (
                        <ProductActions product={row} />
                      ),
                    },
                  ]
                : []),
            ]}
          />
        </ListBody>
        <ListPagination query={query} />
      </div>
      <p className="list-note">
        Cada producto mantiene su SKU y unidad base durante las operaciones.
      </p>
    </>
  );
}
function CreateProduct({ onClose }: { onClose: () => void }) {
  const form = useForm({
      resolver: zodResolver(productFormSchema),
      defaultValues: {
        sku: "",
        name: "",
        kind: "piece" as const,
        label: "unidad",
      },
    }),
    errors = form.formState.errors,
    command = useCommand<Product>("product-create"),
    mapped = useApiFieldErrors(command.error, form.setError, {
      SKU_EXISTS: "sku",
      INVALID_CODE: "sku",
      INVALID_NAME: "name",
      INVALID_UNIT: "kind",
    });
  return (
    <section className="create-panel" aria-labelledby="create-product-heading">
      <div className="panel-heading">
        <div>
          <h2 id="create-product-heading">Nuevo producto</h2>
          <p className="muted">La unidad base se conserva después del alta.</p>
        </div>
        <Button variant="ghost" disabled={command.locked} onClick={onClose}>
          Cancelar
        </Button>
      </div>
      <form
        className="form-grid"
        noValidate
        onSubmit={form.handleSubmit(({ sku, name, kind, label }) => {
          form.clearErrors();
          void command.run("/products", "POST", {
            sku,
            name,
            unit: { kind, label },
          });
        })}
      >
        <FormSummary errors={errors} />
        <div className="form-row">
          <Field
            label="SKU"
            required
            spellCheck={false}
            {...form.register("sku")}
            error={errors.sku?.message}
            disabled={command.locked}
          />
          <Field
            label="Nombre del producto"
            required
            {...form.register("name")}
            error={errors.name?.message}
            disabled={command.locked}
          />
        </div>
        <div className="form-row">
          <SelectField
            label="Tipo de unidad"
            required
            {...form.register("kind")}
            error={errors.kind?.message}
            disabled={command.locked}
          >
            {Object.entries(unitKinds).map(([kind, label]) => (
              <option key={kind} value={kind}>
                {label}
              </option>
            ))}
          </SelectField>
          <Field
            label="Unidad base"
            required
            {...form.register("label")}
            error={errors.label?.message}
            disabled={command.locked}
            hint="Etiqueta visible: unidad, kg, L, m…"
          />
        </div>
        <p className="muted form-help">
          Pieza, caja y pallet usan cantidades enteras. Peso, volumen y longitud
          admiten hasta tres decimales.
        </p>
        <div>
          <Button type="submit" disabled={command.locked}>
            Crear producto
          </Button>
        </div>
      </form>
      <CommandFeedback command={command} hideError={mapped} />
    </section>
  );
}
