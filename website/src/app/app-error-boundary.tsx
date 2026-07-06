import { useTranslation } from "react-i18next";
import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ApiError, type ApiErrorKind } from "@/api/api-error";
import { RefreshCcw, Home, ArrowLeft } from "lucide-react";
import { resolveListPath } from "./resolve-list-path";

export type AppErrorBoundaryProps = {
  error: unknown;
  reset: () => void;
};

function getErrorTranslationKey(kind: ApiErrorKind) {
  switch (kind) {
    case "unauthorized":
      return "errors.unauthorized";
    case "forbidden":
      return "errors.forbidden";
    case "not-found":
      return "errors.notFound";
    case "conflict":
      return "errors.conflict";
    case "validation":
      return "errors.validation";
    case "network":
      return "errors.network";
    case "timeout":
      return "errors.timeout";
    case "compatibility":
      return "errors.compatibility";
    case "server":
      return "errors.server";
    case "unexpected":
      return "errors.unexpected";
  }
}

export function AppErrorBoundary({ error, reset }: AppErrorBoundaryProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const state = useRouterState();
  const apiError = error instanceof ApiError ? error : null;

  const currentPath = state.location.pathname;
  const pathParts = currentPath.split("/").filter(Boolean);
  const isDetailPage = pathParts.length >= 2;
  const listPath = resolveListPath(currentPath);

  if (apiError?.kind === "not-found" && isDetailPage) {
    return (
      <div className="p-8">
        <Alert variant="destructive" className="mx-auto max-w-2xl">
          <AlertTitle className="text-lg">{t("common.unavailable")}</AlertTitle>
          <AlertDescription className="mt-4 space-y-4">
            <p>{t("errors.notFound")}</p>
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => router.history.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("common.back")}
              </Button>
              <Button asChild variant="secondary">
                <Link to={listPath as never}>
                  <Home className="mr-2 h-4 w-4" />
                  {t("common.returnToList")}
                </Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const messageKey = apiError
    ? getErrorTranslationKey(apiError.kind)
    : "errors.unexpected";

  return (
    <div className="p-8">
      <Alert variant="destructive" className="mx-auto max-w-2xl">
        <AlertTitle className="text-lg">{t("errors.requestFailed")}</AlertTitle>
        <AlertDescription className="mt-4 space-y-4">
          <p>{t(messageKey)}</p>
          {(!apiError || apiError.retryable) && (
            <Button onClick={reset} variant="outline" className="mt-4">
              <RefreshCcw className="mr-2 h-4 w-4" />
              {t("common.retry")}
            </Button>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}
