import { createFileRoute } from "@tanstack/react-router";
import { ExtensionRouteGuard } from "@/extensions/extension-route-guard";
import { SuperStreamPage } from "@/features/streams/super-stream-page";

export const Route = createFileRoute("/_authenticated/extensions/streams/super-streams")({
  component: () => <ExtensionRouteGuard id="streams"><SuperStreamPage /></ExtensionRouteGuard>,
});
