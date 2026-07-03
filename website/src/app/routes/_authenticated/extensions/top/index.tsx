import { createFileRoute } from "@tanstack/react-router";
import { ExtensionRouteGuard } from "@/extensions/extension-route-guard";
import { TopPage } from "@/features/top/top-page";

export const Route = createFileRoute("/_authenticated/extensions/top/")({
  component: () => (
    <ExtensionRouteGuard id="top">
      <TopPage />
    </ExtensionRouteGuard>
  ),
});
