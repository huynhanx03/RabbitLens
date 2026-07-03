import { createFileRoute } from "@tanstack/react-router";
import { ExtensionRouteGuard } from "@/extensions/extension-route-guard";
import { ShovelManagementPage } from "@/features/shovels/shovel-management-page";

export const Route = createFileRoute("/_authenticated/extensions/shovels/management/")({
  component: () => (
    <ExtensionRouteGuard id="shovel"><ShovelManagementPage /></ExtensionRouteGuard>
  ),
});
