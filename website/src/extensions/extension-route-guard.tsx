import { useRouteContext } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { ExtensionId } from "./extension-descriptor";
import { extensionsQueryOptions } from "@/domains/extensions/extension-query";
import { isExtensionAvailable } from "./extension-registry";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";

interface ExtensionRouteGuardProps {
  id: ExtensionId;
  children: React.ReactNode;
}

export function ExtensionRouteGuard({ id, children }: ExtensionRouteGuardProps) {
  const context = useRouteContext({ from: "__root__" });
  const { data: extensions, isPending, isError } = useQuery(
    extensionsQueryOptions(context.apiClient),
  );
  const { t } = useTranslation();

  if (isPending) {
    return <Skeleton className="h-[200px] w-full" />;
  }

  if (isError || !extensions) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{t("common.error")}</AlertTitle>
        <AlertDescription>{t("extensions.unavailableDesc")}</AlertDescription>
      </Alert>
    );
  }

  const isAvailable = isExtensionAvailable(
    id,
    extensions,
    context.auth.user?.tags ?? [],
  );

  if (!isAvailable) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{t("extensions.unavailable")}</AlertTitle>
        <AlertDescription>{t("extensions.accessDenied")}</AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}
