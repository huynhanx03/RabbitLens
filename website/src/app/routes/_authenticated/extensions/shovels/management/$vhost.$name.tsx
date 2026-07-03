import { createFileRoute } from "@tanstack/react-router";
import { ExtensionRouteGuard } from "@/extensions/extension-route-guard";
import { ShovelDetailPage } from "@/features/shovels/shovel-detail-page";

export const Route = createFileRoute("/_authenticated/extensions/shovels/management/$vhost/$name")({ component: ShovelDetailRoute });

function ShovelDetailRoute() {
  const { vhost, name } = Route.useParams();
  return <ExtensionRouteGuard id="shovel"><ShovelDetailPage vhost={vhost} name={name} /></ExtensionRouteGuard>;
}
