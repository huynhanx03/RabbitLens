import { createFileRoute } from "@tanstack/react-router";
import { ExtensionRouteGuard } from "@/extensions/extension-route-guard";
import { FederationStatusPage } from "@/features/federation/federation-status-page";

export const Route = createFileRoute("/_authenticated/extensions/federation/status")({
  component: () => (
    <ExtensionRouteGuard id="federation">
      <FederationStatusPage />
    </ExtensionRouteGuard>
  ),
});
