import { createFileRoute } from "@tanstack/react-router";
import { ExtensionRouteGuard } from "@/extensions/extension-route-guard";
import { EtsTablesPage } from "@/features/top/ets-tables-page";

export const Route = createFileRoute("/_authenticated/extensions/top/ets")({
  component: () => (
    <ExtensionRouteGuard id="top">
      <EtsTablesPage />
    </ExtensionRouteGuard>
  ),
});
