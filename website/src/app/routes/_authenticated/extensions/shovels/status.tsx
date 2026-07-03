import { createFileRoute } from "@tanstack/react-router";
import { ExtensionRouteGuard } from "@/extensions/extension-route-guard";
import { ShovelStatusPage } from "@/features/shovels/shovel-status-page";

export const Route = createFileRoute("/_authenticated/extensions/shovels/status")({
  component: () => (
    <ExtensionRouteGuard id="shovel">
      <ShovelStatusPage />
    </ExtensionRouteGuard>
  ),
});
