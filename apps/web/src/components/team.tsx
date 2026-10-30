"use client";
import { FormSummary } from "./form-summary";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { User } from "@almacen/contracts";
import { Button, DataTable, Field, SelectField, Dialog } from "@almacen/ui";
import { userFormSchema, userUpdateFormSchema } from "../lib/form-schemas";
import { useApiFieldErrors } from "../lib/form-errors";
import { CommandFeedback, useCommand } from "./command";
import { Protected, roleLabels } from "./session";
import { PageHeading } from "./shell";
import { ListBody, ListPagination, usePagedList } from "./paged-list";
export function TeamPage() {
  return (
    <Protected admin>
      <Team />
    </Protected>
  );
}
function Team() {
  const [creating, setCreating] = useState(false),
    [q, setQ] = useState(""),
    query = usePagedList<User>("/users", { q });
  return (
    <>
      <PageHeading
        title="Equipo"
        description="Cuentas, permisos y acceso a tu empresa."
        action={
          <Button disabled={creating} onClick={() => setCreating(true)}>
            Nueva cuenta
          </Button>
        }
      />
      {creating ? <CreateUser onClose={() => setCreating(false)} /> : null}
      <div className="list-toolbar">
        <Field
          label="Buscar cuentas"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nombre o correo"
        />
      </div>
      <div className="list-surface">
        <ListBody query={query} filtered={!!q} emptyTitle="Aún no hay cuentas">
          <DataTable
            caption="Equipo de la empresa"
            rows={query.data?.data ?? []}
            rowKey={(row) => row.id}
            columns={[
              {
                key: "name",
                header: "Persona",
                render: (row) => (
                  <div>
                    <strong>{row.name}</strong>
                    <span className="cell-secondary">{row.email}</span>
                  </div>
                ),
              },
              {
                key: "role",
                header: "Rol",
                render: (row) => roleLabels[row.role],
              },
              {
                key: "active",
                header: "Estado",
                render: (row) => (
                  <span
                    className={"status-label " + (row.active ? "enabled" : "")}
                  >
                    {row.active ? "Activa" : "Inactiva"}
                  </span>
                ),
              },
              {
                key: "actions",
                header: "Acciones",
                render: (row) => <UserManagement user={row} />,
              },
            ]}
          />
        </ListBody>
        <ListPagination query={query} />
      </div>
      <p className="list-note">
        Los cambios de permiso se aplican también a las sesiones abiertas.
      </p>
    </>
  );
}
function CreateUser({ onClose }: { onClose: () => void }) {
  const form = useForm({
      resolver: zodResolver(userFormSchema),
      defaultValues: {
        name: "",
        email: "",
        password: "",
        role: "operator" as const,
      },
    }),
    errors = form.formState.errors,
    command = useCommand<User>("user-create", () =>
      form.resetField("password"),
    ),
    mapped = useApiFieldErrors(command.error, form.setError, {
      EMAIL_EXISTS: "email",
      INVALID_EMAIL: "email",
      INVALID_ROLE: "role",
      INVALID_NAME: "name",
      "field:password": "password",
    });
  return (
    <section className="create-panel" aria-labelledby="create-user-heading">
      <div className="panel-heading">
        <div>
          <h2 id="create-user-heading">Nueva cuenta</h2>
          <p className="muted">
            Comparte las credenciales con la persona por un canal privado.
          </p>
        </div>
        <Button variant="ghost" disabled={command.locked} onClick={onClose}>
          Cancelar
        </Button>
      </div>
      <form
        className="form-grid"
        noValidate
        onSubmit={form.handleSubmit((values) => {
          form.clearErrors();
          void command.run("/users", "POST", values);
        })}
      >
        <FormSummary errors={errors} />
        <div className="form-row">
          <Field
            label="Nombre de la cuenta"
            required
            {...form.register("name")}
            error={errors.name?.message}
            disabled={command.locked}
          />
          <Field
            label="Correo electrónico"
            type="email"
            autoComplete="off"
            required
            {...form.register("email")}
            error={errors.email?.message}
            disabled={command.locked}
          />
        </div>
        <div className="form-row">
          <SelectField
            label="Rol de la nueva cuenta"
            required
            {...form.register("role")}
            error={errors.role?.message}
            disabled={command.locked}
          >
            {Object.entries(roleLabels).map(([role, label]) => (
              <option key={role} value={role}>
                {label}
              </option>
            ))}
          </SelectField>
          <Field
            label="Contraseña"
            type="password"
            autoComplete="new-password"
            required
            {...form.register("password")}
            error={errors.password?.message}
            disabled={command.locked}
          />
        </div>
        <div>
          <Button type="submit" disabled={command.locked}>
            Crear cuenta
          </Button>
        </div>
      </form>
      <CommandFeedback command={command} hideError={mapped} />
    </section>
  );
}

function UserManagement({ user }: { user: User }) {
  const [open, setOpen] = useState(false),
    form = useForm({
      resolver: zodResolver(userUpdateFormSchema),
      defaultValues: { role: user.role, active: user.active },
    }),
    command = useCommand<User>("user-update:" + user.id, () => setOpen(false)),
    mapped = useApiFieldErrors(command.error, form.setError, {
      INVALID_ROLE: "role",
    });
  useEffect(
    () => form.reset({ role: user.role, active: user.active }),
    [user.role, user.active, form],
  );
  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button variant="secondary" aria-label={"Gestionar " + user.email}>
          Gestionar
        </Button>
      }
      title="Gestionar cuenta"
      description={user.name + " · " + user.email}
    >
      <form
        className="form-grid"
        noValidate
        onSubmit={form.handleSubmit((values) => {
          form.clearErrors();
          void command.run("/users/" + user.id, "PATCH", values);
        })}
      >
        <FormSummary errors={form.formState.errors} />
        <SelectField
          label="Rol de la cuenta"
          required
          {...form.register("role")}
          error={form.formState.errors.role?.message}
          disabled={command.locked}
        >
          {Object.entries(roleLabels).map(([role, label]) => (
            <option key={role} value={role}>
              {label}
            </option>
          ))}
        </SelectField>
        <label className="checkbox-label">
          <input
            type="checkbox"
            {...form.register("active")}
            disabled={command.locked}
          />
          Cuenta activa
        </label>
        <p className="muted">
          Desactivar la cuenta impide continuar con sus sesiones abiertas.
          Siempre debe quedar un administrador activo.
        </p>
        <Button type="submit" disabled={command.locked}>
          Guardar cambios
        </Button>
      </form>
      <CommandFeedback command={command} hideError={mapped} />
    </Dialog>
  );
}
