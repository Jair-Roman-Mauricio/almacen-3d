"use client";
import { FormSummary } from "./form-summary";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Product } from "@almacen/contracts";
import { Button, Dialog, Field } from "@almacen/ui";
import { productEditFormSchema } from "../lib/form-schemas";
import { useApiFieldErrors } from "../lib/form-errors";
import { CommandFeedback, useCommand } from "./command";
export function ProductActions({ product }: { product: Product }) {
  const [editing, setEditing] = useState(false),
    [removing, setRemoving] = useState(false),
    form = useForm({
      resolver: zodResolver(productEditFormSchema),
      defaultValues: { name: product.name },
    }),
    edit = useCommand<Product>("product-edit:" + product.id, () =>
      setEditing(false),
    ),
    remove = useCommand("product-remove:" + product.id, () =>
      setRemoving(false),
    ),
    mapped = useApiFieldErrors(edit.error, form.setError, {
      INVALID_NAME: "name",
    });
  return (
    <div className="action-row product-actions">
      <Dialog
        open={editing}
        onOpenChange={(open) => {
          if (open && edit.status !== "uncertain")
            form.reset({ name: product.name });
          setEditing(open);
        }}
        trigger={
          <Button variant="secondary" aria-label={"Editar " + product.sku}>
            Editar
          </Button>
        }
        title="Editar producto"
        description="El SKU y la unidad base se conservan."
      >
        <dl className="product-identity">
          <div>
            <dt>SKU</dt>
            <dd>{product.sku}</dd>
          </div>
          <div>
            <dt>Unidad base</dt>
            <dd>{product.unit.label}</dd>
          </div>
        </dl>
        <form
          className="form-grid"
          noValidate
          onSubmit={form.handleSubmit((values) => {
            form.clearErrors();
            void edit.run("/products/" + product.id, "PATCH", values);
          })}
        >
          <FormSummary errors={form.formState.errors} />
          <Field
            label="Nombre del producto"
            required
            {...form.register("name")}
            error={form.formState.errors.name?.message}
            disabled={edit.locked}
          />
          <Button type="submit" disabled={edit.locked}>
            Guardar producto
          </Button>
        </form>
        <CommandFeedback command={edit} hideError={mapped} />
      </Dialog>
      <Dialog
        open={removing}
        onOpenChange={setRemoving}
        trigger={
          <Button
            variant="ghost"
            className="danger-text"
            aria-label={"Retirar " + product.sku}
          >
            Retirar
          </Button>
        }
        title="Retirar producto"
        description={
          "Se retirará " +
          product.name +
          " del catálogo. Sus referencias históricas se conservan."
        }
      >
        <p className="muted">
          La retirada solo se permite si no quedan existencias, reservas o
          trabajo pendiente.
        </p>
        <Button
          variant="danger"
          disabled={remove.locked}
          onClick={() => void remove.run("/products/" + product.id, "DELETE")}
        >
          Confirmar retirada
        </Button>
        <CommandFeedback command={remove} />
      </Dialog>
    </div>
  );
}
