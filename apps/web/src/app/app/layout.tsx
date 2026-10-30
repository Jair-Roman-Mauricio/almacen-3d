import { AppShell } from "../../components/shell";
import { Protected } from "../../components/session";
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Protected>
      <AppShell>{children}</AppShell>
    </Protected>
  );
}
