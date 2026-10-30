"use client";
import { FormSummary } from "./form-summary";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { CubeIcon } from "@phosphor-icons/react";
import type { PublicConfig, Session } from "@almacen/contracts";
import { Button, Field } from "@almacen/ui";
import { accessSchema } from "../lib/form-schemas";
import { errorMessage, request } from "../lib/api";
import { useSession } from "./session";
export function usePublicConfig() {
  return useQuery({
    queryKey: ["public-config"],
    queryFn: ({ signal }) =>
      request<{ data: PublicConfig }>("/public/config", { signal }).then(
        (value) => value.data,
      ),
  });
}
export function AuthFrame({
  title,
  description,
  children,
  wide = false,
}: {
  title: string;
  description: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="auth-page">
      <header className="auth-header">
        <Link className="brand" href="/acceso">
          <CubeIcon size={28} weight="fill" aria-hidden="true" />
          <span>
            Almacén <strong>3D</strong>
          </span>
        </Link>
        <span className="muted">Gestión de almacenes</span>
      </header>
      <main className={"auth-panel" + (wide ? " wide" : "")}>
        <div className="auth-heading">
          <h1>{title}</h1>
          <p className="muted">{description}</p>
        </div>
        {children}
      </main>
      <footer className="auth-footer">
        Tu empresa, tu inventario, tu espacio de trabajo.
      </footer>
    </div>
  );
}
export function Access() {
  const config = usePublicConfig(),
    router = useRouter(),
    { refresh } = useSession(),
    [failure, setFailure] = useState("");
  const form = useForm({
    resolver: zodResolver(accessSchema),
    defaultValues: { companyCode: "", email: "", password: "" },
  });
  const errors = form.formState.errors;
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("empresa");
    if (code) form.setValue("companyCode", code);
  }, [form]);
  async function submit(values: {
    companyCode: string;
    email: string;
    password: string;
  }) {
    setFailure("");
    try {
      await request<{ data: Session }>("/sessions", {
        method: "POST",
        body: values,
      });
      form.resetField("password");
      await refresh();
      router.replace("/app");
    } catch (error) {
      setFailure(errorMessage(error));
    }
  }
  return (
    <AuthFrame
      title="Accede a tu empresa"
      description="Consulta el inventario y trabaja con tu equipo."
    >
      <form
        className="form-grid"
        noValidate
        onSubmit={form.handleSubmit(submit)}
      >
        <FormSummary errors={errors} />
        <Field
          label="Código de empresa"
          autoComplete="organization"
          autoCapitalize="characters"
          spellCheck={false}
          required
          {...form.register("companyCode")}
          error={errors.companyCode?.message}
          hint="El código que recibiste al registrar tu empresa."
        />
        <Field
          label="Correo electrónico"
          type="email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          {...form.register("email")}
          error={errors.email?.message}
        />
        <Field
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          required
          {...form.register("password")}
          error={errors.password?.message}
        />
        {failure ? (
          <p className="form-error" role="alert">
            {failure}
          </p>
        ) : null}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Iniciando sesión…" : "Iniciar sesión"}
        </Button>
      </form>
      <div className="auth-links">
        {config.data?.mode === "saas" ? (
          <p>
            ¿Tu empresa es nueva?{" "}
            <Link href="/registro">Registrar empresa</Link>
          </p>
        ) : config.data?.localSetupRequired ? (
          <Link href="/configuracion-inicial">Configurar esta instalación</Link>
        ) : null}
        {config.data?.demoMode ? (
          <p className="demo-note">
            Entorno de demostración con datos ficticios.
          </p>
        ) : null}
        {config.isError ? (
          <p role="alert">
            No se pudo comprobar la modalidad.{" "}
            <button
              className="text-button"
              onClick={() => void config.refetch()}
            >
              Reintentar
            </button>
          </p>
        ) : null}
      </div>
    </AuthFrame>
  );
}
