"use client";
import { FormSummary } from "./form-summary";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Field } from "@almacen/ui";
import type { Company } from "@almacen/contracts";
import { companyFormSchema } from "../lib/form-schemas";
import { useApiFieldErrors } from "../lib/form-errors";
import { Protected, useSession } from "./session";
import { PageHeading } from "./shell";
import { CommandFeedback, useCommand } from "./command";
export function CompanyPage() {
  return (
    <Protected admin>
      <CompanyForm />
    </Protected>
  );
}
function CompanyForm() {
  const { session, refresh } = useSession();
  const form = useForm({
      resolver: zodResolver(companyFormSchema),
      defaultValues: {
        name: session?.company.name ?? "",
        timeZone: session?.company.timeZone ?? "America/Lima",
      },
    }),
    errors = form.formState.errors,
    [now, setNow] = useState("");
  const command = useCommand<Company>("company-profile", () => {
      void refresh();
    }),
    mapped = useApiFieldErrors(command.error, form.setError, {
      INVALID_NAME: "name",
      INVALID_TIME_ZONE: "timeZone",
    });
  useEffect(() => setNow(new Date().toISOString()), []);
  const zone = session?.company.timeZone ?? "America/Lima";
  return (
    <>
      <PageHeading
        title="Empresa"
        description="Datos de tu empresa y zona horaria de las operaciones."
      />
      <section className="settings-section">
        <div className="section-description">
          <h2>Perfil de empresa</h2>
          <p className="muted">
            El código identifica a tu empresa al iniciar sesión.
          </p>
          <dl className="identity-data">
            <dt>Código de empresa</dt>
            <dd>{session?.company.code}</dd>
          </dl>
        </div>
        <div className="settings-form">
          <form
            className="form-grid"
            noValidate
            onSubmit={form.handleSubmit((values) => {
              form.clearErrors();
              void command.run("/company", "PATCH", values);
            })}
          >
            <FormSummary errors={errors} />
            <Field
              label="Nombre de empresa"
              required
              {...form.register("name")}
              error={errors.name?.message}
              disabled={command.locked}
            />
            <Field
              label="Zona horaria"
              required
              {...form.register("timeZone")}
              error={errors.timeZone?.message}
              hint="Nombre IANA, por ejemplo America/Lima."
              disabled={command.locked}
            />
            <div>
              <Button type="submit" disabled={command.locked}>
                Guardar empresa
              </Button>
            </div>
          </form>
          <CommandFeedback command={command} hideError={mapped} />
          <div className="time-example">
            <p className="muted">Hora local al abrir esta página</p>
            {now ? (
              <time dateTime={now} data-time-zone={zone}>
                {new Intl.DateTimeFormat("es-PE", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: zone,
                }).format(new Date(now))}
              </time>
            ) : null}
            <p className="muted">{zone}</p>
          </div>
        </div>
      </section>
    </>
  );
}
