import { createFileRoute } from "@tanstack/react-router";
import { ExtensionRouteGuard } from "@/extensions/extension-route-guard";
import { TraceDetailPage } from "@/features/tracing/trace-detail-page";

export const Route = createFileRoute(
  "/_authenticated/extensions/tracing/$node/$vhost/$name",
)({ component: RouteComponent });

function RouteComponent() {
  const { node, vhost, name } = Route.useParams();
  return (
    <ExtensionRouteGuard id="tracing">
      <TraceDetailPage node={node} vhost={vhost} name={name} />
    </ExtensionRouteGuard>
  );
}
