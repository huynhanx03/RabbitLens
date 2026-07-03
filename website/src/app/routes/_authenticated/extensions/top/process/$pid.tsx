import { createFileRoute } from "@tanstack/react-router";
import { ExtensionRouteGuard } from "@/extensions/extension-route-guard";
import { ProcessDetailPage } from "@/features/top/process-detail-page";

export const Route = createFileRoute(
  "/_authenticated/extensions/top/process/$pid",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { pid } = Route.useParams();
  return (
    <ExtensionRouteGuard id="top">
      <ProcessDetailPage pid={pid} />
    </ExtensionRouteGuard>
  );
}
