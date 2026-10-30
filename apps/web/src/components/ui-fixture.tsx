"use client";
import { CacheFixture } from "./query-scope";
import { CommandFixture } from "./command";
import { useState } from "react";
import {
  Field,
  Button,
  quantityError,
  formatExact,
  Dialog,
  Menu,
  SelectField,
  QueryStatus,
  DataTable,
  type QueryState,
} from "@almacen/ui";
export function UiFixture() {
  const [listState, setListState] = useState<QueryState | "ready">("ready");
  const [quantity, setQuantity] = useState(""),
    [error, setError] = useState<string | undefined>(),
    [value, setValue] = useState<string | null>(null);
  return (
    <main className="ui-fixture">
      <h1>Componentes de interfaz</h1>
      <p className="muted">
        Comprobaciones locales de los controles compartidos.
      </p>
      <section>
        <h2>Tipografía y color</h2>
        <p>Inventario por ubicación y cantidades exactas.</p>
        <p className="numeral">1.250,125 kg</p>
        <button className="button">Acción principal</button>
      </section>
      <section>
        <h2>Cantidades exactas</h2>
        <form
          noValidate
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            const invalid = quantityError(quantity);
            setError(invalid ?? undefined);
            setValue(invalid ? null : quantity);
          }}
        >
          <Field
            label="Cantidad exacta"
            name="quantity"
            inputMode="decimal"
            required
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            error={error}
            hint="Unidad: kg. Usa punto para los decimales."
          />
          <Button type="submit">Validar cantidad</Button>
        </form>
        {value ? (
          <p role="status" className="numeral">
            {formatExact(value)} kg
          </p>
        ) : null}
      </section>
      <section>
        <h2>Diálogos y menús</h2>
        <div className="flex flex-wrap gap-3">
          <Dialog
            trigger={<Button>Abrir diálogo</Button>}
            title="Confirmar acción"
            description="Revisa la acción antes de continuar."
          >
            <Button>Confirmar</Button>
          </Dialog>
          <Menu
            trigger={<Button variant="secondary">Acciones de prueba</Button>}
            items={[{ label: "Acción de ejemplo", onSelect: () => {} }]}
          />
        </div>
      </section>
      <section>
        <h2>Listas y estados</h2>
        <SelectField
          label="Estado de la lista"
          value={listState}
          onChange={(e) => setListState(e.target.value as QueryState | "ready")}
        >
          {[
            "ready",
            "loading",
            "empty",
            "no-results",
            "error",
            "forbidden",
          ].map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </SelectField>
        {listState === "ready" ? (
          <DataTable
            caption="Inventario de prueba"
            rows={[
              {
                id: "one",
                name: "Motor de demostración con una descripción extensa para revisar el espacio",
                quantity: "9007199254740993.125",
                unit: "kg",
              },
            ]}
            rowKey={(row) => row.id}
            columns={[
              { key: "name", header: "Producto", render: (row) => row.name },
              {
                key: "quantity",
                header: "Físico",
                numeric: true,
                render: (row) => formatExact(row.quantity),
              },
              { key: "unit", header: "Unidad", render: (row) => row.unit },
            ]}
          />
        ) : (
          <QueryStatus state={listState} />
        )}
      </section>
      <CommandFixture />
      <CacheFixture />
    </main>
  );
}
