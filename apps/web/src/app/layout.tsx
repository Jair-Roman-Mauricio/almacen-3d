import type { Metadata, Viewport } from "next";
import "./globals.css";
import { QueryScope } from "../components/query-scope";
import { SessionProvider } from "../components/session";
import { InputModality } from "../components/input-modality";
export const metadata: Metadata = {
  title: { default: "Almacén 3D", template: "%s | Almacén 3D" },
  description: "Gestión de inventario y almacenes",
  robots: { index: false, follow: false },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f8fafc",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <InputModality />
        <SessionProvider>
          <QueryScope>{children}</QueryScope>
        </SessionProvider>
      </body>
    </html>
  );
}
