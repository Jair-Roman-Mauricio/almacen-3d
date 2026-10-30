import { notFound } from "next/navigation";
import { UiFixture } from "../../components/ui-fixture";
export const dynamic = "force-dynamic";
export default function ComponentsPage() {
  if (process.env.WMS_UI_FIXTURES !== "true") notFound();
  return <UiFixture />;
}
