"use client";
import { FormSummary } from "./form-summary";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Field, QueryStatus } from "@almacen/ui";
import { registrationFormSchema } from "../lib/form-schemas";
import { applyFieldError } from "../lib/form-errors";
import { ApiError, errorMessage, request } from "../lib/api";
import { AuthFrame, usePublicConfig } from "./access";
export function Registration() {
  const config = usePublicConfig();
  if (config.isPending)
    return (
      <AuthFrame
        title="Registro de empresa"
        description="Comprobando la modalidad del servicio."
      >
        <QueryStatus state="loading" />
      </AuthFrame>
    );
  if (config.isError)
    return (
      <AuthFrame
        title="Registro de empresa"
        description="No se pudo comprobar la modalidad."
      >
        <QueryStatus
          state="error"
          action={
            <Button onClick={() => void config.refetch()}>Reintentar</Button>
          }
        />
      </AuthFrame>
    );
  if (config.data.mode !== "saas")
    return (
      <AuthFrame
        title="Registro no disponible"
        description="Esta instalación local administra una sola empresa."
      >
        <Link href="/acceso">Ir al acceso</Link>
      </AuthFrame>
    );
  return <RegistrationForm />;
}
export function RegistrationForm({ local = false }: { local?: boolean }) {
  const config = usePublicConfig();
  const [result, setResult] = useState<string | null>(null),
    [failure, setFailure] = useState("");
  const form = useForm({
      resolver: zodResolver(registrationFormSchema),
      defaultValues: {
        companyName: "",
        companyCode: "",
        timeZone: "America/Lima",
        adminName: "",
        email: "",
        password: "",
      },
    }),
    errors = form.formState.errors;
  async function submit(values: {
    companyName: string;
    companyCode: string;
    timeZone: string;
    adminName: string;
    email: string;
    password: string;
  }) {
    setFailure("");
    try {
      const response = await request<{ data: { loginCompanyCode: string } }>(
        local ? "/local-setup" : "/registrations",
        {
          method: "POST",
          body: {
            company: {
              name: values.companyName,
              code: values.companyCode,
              timeZone: values.timeZone,
            },
            administrator: {
              name: values.adminName,
              email: values.email,
              password: values.password,
            },
          },
        },
      );
      form.resetField("password");
      setResult(response.data.loginCompanyCode);
    } catch (error) {
      if (
        local &&
        error instanceof ApiError &&
        error.code === "ALREADY_CONFIGURED"
      ) {
        await config.refetch();
        return;
      }
      if (
        !applyFieldError(error, form.setError, {
          COMPANY_CODE_EXISTS: "companyCode",
          INVALID_CODE: "companyCode",
          INVALID_TIME_ZONE: "timeZone",
          INVALID_EMAIL: "email",
          "field:password": "password",
        })
      )
        setFailure(errorMessage(error));
    }
  }
  if (result)
    return (
      <AuthFrame
        title={local ? "Instalación configurada" : "Empresa creada"}
        description="Guarda este código: tu equipo lo usará para iniciar sesión."
      >
        <p className="confirmed-code">
          <strong>{result}</strong>
        </p>
        <p className="muted">
          El primer administrador ya puede acceder con su correo y contraseña.
        </p>
        <Link
          className="button"
          href={"/acceso?empresa=" + encodeURIComponent(result)}
        >
          Ir al acceso
        </Link>
      </AuthFrame>
    );
  return (
    <AuthFrame
      wide
      title={local ? "Configura esta instalación" : "Registra tu empresa"}
      description={
        local
          ? "Crea la empresa y su primer administrador. Esta instalación administra una sola empresa."
          : "Crea tu espacio de trabajo y la primera cuenta de administrador."
      }
    >
      <form
        className="form-grid"
        noValidate
        onSubmit={form.handleSubmit(submit)}
      >
        <FormSummary errors={errors} />
        <fieldset className="form-section">
          <legend>Empresa</legend>
          <Field
            label="Nombre de empresa"
            autoComplete="organization"
            required
            {...form.register("companyName")}
            error={errors.companyName?.message}
          />
          <Field
            label="Código de empresa"
            required
            spellCheck={false}
            {...form.register("companyCode")}
            error={errors.companyCode?.message}
            hint="Identificador de acceso. Hasta 64 letras, números, guion, punto o barra."
          />
          <Field
            label="Zona horaria"
            required
            {...form.register("timeZone")}
            error={errors.timeZone?.message}
            hint="Nombre IANA, por ejemplo America/Lima."
          />
        </fieldset>
        <fieldset className="form-section">
          <legend>Primer administrador</legend>
          <Field
            label="Nombre del administrador"
            autoComplete="name"
            required
            {...form.register("adminName")}
            error={errors.adminName?.message}
          />
          <Field
            label="Correo electrónico"
            type="email"
            autoComplete="username"
            autoCapitalize="none"
            required
            {...form.register("email")}
            error={errors.email?.message}
          />
          <Field
            label="Contraseña"
            type="password"
            autoComplete="new-password"
            required
            {...form.register("password")}
            error={errors.password?.message}
          />
        </fieldset>
        {failure ? (
          <p role="alert" className="form-error">
            {failure}
          </p>
        ) : null}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting
            ? "Creando empresa…"
            : local
              ? "Configurar instalación"
              : "Crear empresa"}
        </Button>
        <Link href="/acceso">Ya tengo una cuenta</Link>
      </form>
    </AuthFrame>
  );
}

export function LocalSetup() {
  const config = usePublicConfig();
  if (config.isPending)
    return (
      <AuthFrame
        title="Configuración inicial"
        description="Comprobando el estado de la instalación."
      >
        <QueryStatus state="loading" />
      </AuthFrame>
    );
  if (config.isError)
    return (
      <AuthFrame
        title="Configuración inicial"
        description="No se pudo comprobar el estado."
      >
        <QueryStatus
          state="error"
          action={
            <Button onClick={() => void config.refetch()}>Reintentar</Button>
          }
        />
      </AuthFrame>
    );
  if (config.data.mode !== "local")
    return (
      <AuthFrame
        title="Configuración local no disponible"
        description="Este servicio utiliza registro de empresas SaaS."
      >
        <Link href="/acceso">Ir al acceso</Link>
      </AuthFrame>
    );
  if (!config.data.localSetupRequired)
    return (
      <AuthFrame
        title="Instalación configurada"
        description="La empresa y su administrador ya están creados. Accede con sus credenciales."
      >
        <Link className="button" href="/acceso">
          Ir al acceso
        </Link>
      </AuthFrame>
    );
  return <RegistrationForm local />;
}
