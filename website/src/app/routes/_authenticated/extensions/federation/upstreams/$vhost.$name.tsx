import { createFileRoute } from "@tanstack/react-router";
import { ExtensionRouteGuard } from "@/extensions/extension-route-guard";
import { FederationUpstreamDetailPage } from "@/features/federation/federation-upstream-detail-page";

export const Route = createFileRoute("/_authenticated/extensions/federation/upstreams/$vhost/$name")({
  component: UpstreamDetailRoute,
});

function UpstreamDetailRoute() {
  const { vhost, name } = Route.useParams();
  return (
    <ExtensionRouteGuard id="federation">
      <FederationUpstreamDetailPage vhost={vhost} name={name} />
    </ExtensionRouteGuard>
  );
}
