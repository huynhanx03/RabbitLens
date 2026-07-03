import { createFileRoute } from "@tanstack/react-router";
import { ExtensionRouteGuard } from "@/extensions/extension-route-guard";
import { StreamConnectionDetailPage } from "@/features/streams/stream-connection-detail-page";

export const Route = createFileRoute("/_authenticated/extensions/streams/connections/$vhost/$name")({ component: RouteComponent });

function RouteComponent() {
  const { vhost, name } = Route.useParams();
  return <ExtensionRouteGuard id="streams"><StreamConnectionDetailPage vhost={vhost} name={name} /></ExtensionRouteGuard>;
}
