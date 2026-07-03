import { createFileRoute } from "@tanstack/react-router";
import { ExtensionRouteGuard } from "@/extensions/extension-route-guard";
import { TracingPage } from "@/features/tracing/tracing-page";

export const Route = createFileRoute("/_authenticated/extensions/tracing/")({
  component: () => (
    <ExtensionRouteGuard id="tracing">
      <TracingPage />
    </ExtensionRouteGuard>
  ),
});
