import { createFileRoute } from "@tanstack/react-router";
import { ExtensionRouteGuard } from "@/extensions/extension-route-guard";
import { FederationUpstreamListPage } from "@/features/federation/federation-upstream-list-page";

export const Route = createFileRoute("/_authenticated/extensions/federation/upstreams/")({
  component: () => (
    <ExtensionRouteGuard id="federation">
      <FederationUpstreamListPage />
    </ExtensionRouteGuard>
  ),
});
