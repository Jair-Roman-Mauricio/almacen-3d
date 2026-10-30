"use client";
import Link from "next/link";
import { PendingOperationsNotice } from "./pending-operations";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  CubeIcon,
  ListIcon,
  PackageIcon,
  WarehouseIcon,
  UsersIcon,
  GearIcon,
  ChartBarIcon,
  CaretDownIcon,
} from "@phosphor-icons/react";
import { Button, Dialog, Menu, QueryStatus, SelectField } from "@almacen/ui";
import { errorMessage } from "../lib/api";
import { roleLabels, useSession } from "./session";
import { useWarehouse, WarehouseProvider } from "./warehouse-context";
const entries = [
  { href: "/app/inventario", label: "Inventario", icon: ChartBarIcon },
  { href: "/app/catalogo", label: "Catálogo", icon: PackageIcon },
  { href: "/app/almacenes", label: "Almacenes", icon: WarehouseIcon },
  { href: "/app/configuracion", label: "Empresa", icon: GearIcon, admin: true },
  { href: "/app/equipo", label: "Equipo", icon: UsersIcon, admin: true },
];
function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  const { session } = useSession(),
    path = usePathname();
  return (
    <nav aria-label="Navegación principal" className="main-nav">
      {entries
        .filter((item) => !item.admin || session?.user.role === "admin")
        .map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={path === item.href ? "page" : undefined}
            {...(onNavigate ? { onClick: onNavigate } : {})}
          >
            <item.icon size={20} aria-hidden="true" />
            {item.label}
          </Link>
        ))}
    </nav>
  );
}
function Brand() {
  return (
    <Link className="brand" href="/app">
      <CubeIcon size={28} weight="fill" aria-hidden="true" />
      <span>
        Almacén <strong>3D</strong>
      </span>
    </Link>
  );
}
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <WarehouseProvider>
      <Shell>{children}</Shell>
    </WarehouseProvider>
  );
}
function Shell({ children }: { children: ReactNode }) {
  const { session, connected, refresh, logout } = useSession(),
    context = useWarehouse(),
    router = useRouter(),
    [menu, setMenu] = useState(false),
    [error, setError] = useState("");
  async function signout() {
    try {
      await logout();
      router.replace("/acceso");
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>
      <aside className="sidebar">
        <Brand />
        <p className="nav-label">OPERACIÓN</p>
        <Navigation />
        <div className="sidebar-bottom">
          <p>Espacio de trabajo</p>
          <strong>{session?.company.code}</strong>
          {session?.demoMode ? (
            <span className="demo-badge">Demostración · datos ficticios</span>
          ) : null}
        </div>
      </aside>
      <div className="workspace">
        <header className="context-bar">
          <div className="mobile-menu">
            <Dialog
              open={menu}
              onOpenChange={setMenu}
              title="Navegación"
              description="Módulos de tu espacio de trabajo."
              trigger={
                <Button variant="ghost" aria-label="Abrir navegación">
                  <ListIcon size={24} />
                </Button>
              }
            >
              <Navigation onNavigate={() => setMenu(false)} />
            </Dialog>
          </div>
          <div className="company-context">
            <span className="context-label">
              Empresa{session?.demoMode ? " · Demo" : ""}
            </span>
            <strong title={session?.company.name}>
              {session?.company.name}
            </strong>
          </div>
          <div className="warehouse-selector">
            <SelectField
              label="Almacén actual"
              value={context.warehouse?.id ?? ""}
              disabled={context.loading || !context.warehouses.length}
              onChange={(e) => context.select(e.target.value)}
            >
              {!context.warehouses.length ? (
                <option value="">
                  {context.loading ? "Cargando almacenes…" : "Sin almacenes"}
                </option>
              ) : (
                context.warehouses.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.code} · {row.name}
                  </option>
                ))
              )}
            </SelectField>
          </div>
          <div className="account-menu">
            <Menu
              trigger={
                <Button variant="ghost" aria-label="Opciones de cuenta">
                  <span className="account-text">
                    <strong>{session?.user.name}</strong>
                    <span>{session ? roleLabels[session.user.role] : ""}</span>
                  </span>
                  <CaretDownIcon size={16} />
                </Button>
              }
              items={[
                { label: "Cambiar empresa", onSelect: () => void signout() },
                { label: "Cerrar sesión", onSelect: () => void signout() },
              ]}
            />
          </div>
        </header>
        {!connected ? (
          <div className="connection-banner" role="status">
            Sin conexión verificada. Las confirmaciones están deshabilitadas.{" "}
            <Button variant="secondary" onClick={() => void refresh()}>
              Comprobar conexión
            </Button>
          </div>
        ) : null}
        {error ? (
          <p role="alert" className="form-error">
            {error}
          </p>
        ) : null}
        <PendingOperationsNotice />
        <main className="page-content" id="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
export function WorkspaceHome() {
  const { session } = useSession(),
    context = useWarehouse();
  if (context.loading) return <QueryStatus state="loading" />;
  if (context.error)
    return (
      <QueryStatus
        state="error"
        action={<Button onClick={context.reload}>Reintentar</Button>}
      />
    );
  if (!context.warehouses.length)
    return (
      <>
        <PageHeading
          title="Almacenes"
          description="Configura los espacios donde trabaja tu equipo."
        />
        <QueryStatus
          state="empty"
          title="Esta empresa aún no tiene almacenes"
          description={
            session?.user.role === "admin"
              ? "Crea el primer almacén con su código y dimensiones."
              : "Un administrador puede crear el primer almacén."
          }
          action={
            session?.user.role === "admin" ? (
              <Link className="button" href="/app/almacenes">
                Crear primer almacén
              </Link>
            ) : null
          }
        />
      </>
    );
  return (
    <>
      <PageHeading
        title="Tu espacio de trabajo"
        description="Consulta el inventario y administra el catálogo de tu empresa."
      />
      <div className="workspace-intro">
        <WarehouseIcon size={36} aria-hidden="true" />
        <h2>{context.warehouse?.name}</h2>
        <p className="muted">Almacén seleccionado: {context.warehouse?.code}</p>
        <Link className="button" href="/app/inventario">
          Consultar inventario
        </Link>
      </div>
    </>
  );
}
export function PageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        <p className="muted">{description}</p>
      </div>
      {action}
    </div>
  );
}
