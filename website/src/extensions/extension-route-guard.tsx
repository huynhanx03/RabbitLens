import { useRouteContext } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { ExtensionId } from "./extension-descriptor";
import { extensionsQueryOptions } from "@/domains/extensions/extension-query";
import { extensionRegistry, isExtensionInstalled } from "./extension-registry";
import { Skeleton } from "@/components/ui/skeleton";
import { evaluatePermission } from "@/auth/permissions/permission-decision";
import { CapabilityUnavailable } from "@/components/shared/capability-unavailable";

interface ExtensionRouteGuardProps {
  id: ExtensionId;
  children: React.ReactNode;
}

export function ExtensionRouteGuard({ id, children }: ExtensionRouteGuardProps) {
  const context = useRouteContext({ from: "__root__" });
  const { data: extensions, isPending, isError } = useQuery(
    extensionsQueryOptions(context.apiClient),
  );
  if (isPending) {
    return <Skeleton className="h-[200px] w-full" />;
  }

  if (isError || !extensions) {
    return <CapabilityUnavailable reason="discovery-failed" />;
  }

  if (!isExtensionInstalled(id, extensions)) {
    return <CapabilityUnavailable reason="not-installed" />;
  }

  const descriptor = extensionRegistry.find((extension) => extension.id === id);
  const user = context.auth.user;
  if (
    !descriptor ||
    !user ||
    evaluatePermission(descriptor.accessPolicy, user, null).kind === "deny"
  ) {
    return <CapabilityUnavailable reason="forbidden" />;
  }

  return <>{children}</>;
}
