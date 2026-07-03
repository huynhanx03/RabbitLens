import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ApiError, type ApiErrorKind } from "@/api/api-error";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type AsyncStateProps = {
  children: ReactNode;
  error?: unknown;
  isEmpty?: boolean;
  isError?: boolean;
  isFetching?: boolean;
  isPending?: boolean;
  isUnavailable?: boolean;
  onRetry?: () => void;
  emptyTitle?: ReactNode;
  emptyDescription?: ReactNode;
  emptyAction?: ReactNode;
  notFoundAction?: ReactNode;
};

function getErrorTranslationKey(kind: ApiErrorKind) {
  switch (kind) {
    case "unauthorized":
      return "errors.unauthorized";
    case "forbidden":
      return "errors.forbidden";
    case "not-found":
      return "errors.notFound";
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

export function AsyncState({
  children,
  error,
  isEmpty = false,
  isError = false,
  isFetching = false,
  isPending = false,
  isUnavailable = false,
  onRetry,
  emptyTitle,
  emptyDescription,
  emptyAction,
  notFoundAction,
}: AsyncStateProps) {
  const { t } = useTranslation();

  if (isPending) {
    return (
      <div role="status" className="space-y-3" aria-label={t("common.loading")}>
        <span className="sr-only">{t("common.loading")}</span>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (isUnavailable) {
    return (
      <Alert>
        <AlertTitle>{t("common.unavailable")}</AlertTitle>
        <AlertDescription>{t("errors.featureUnavailable")}</AlertDescription>
      </Alert>
    );
  }

  if (isError) {
    const apiError = error instanceof ApiError ? error : null;
    const messageKey = apiError
      ? getErrorTranslationKey(apiError.kind)
      : "errors.unexpected";

    if (apiError?.kind === "not-found" && notFoundAction) {
      return (
        <Alert>
          <AlertTitle>{t("common.unavailable")}</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{t("errors.notFound")}</p>
            <div>{notFoundAction}</div>
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Alert variant="destructive">
        <AlertTitle>{t("errors.requestFailed")}</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{t(messageKey)}</p>
          {apiError?.retryable && onRetry ? (
            <Button type="button" variant="outline" onClick={onRetry}>
              {t("common.retry")}
            </Button>
          ) : null}
        </AlertDescription>
      </Alert>
    );
  }

  if (isEmpty) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/20 p-8 text-center">
        <p className="font-medium text-foreground">{emptyTitle ?? t("common.noData")}</p>
        {emptyDescription ? <p className="mt-1 text-sm text-muted-foreground">{emptyDescription}</p> : null}
        {emptyAction ? <div className="mt-4 flex justify-center">{emptyAction}</div> : null}
      </div>
    );
  }

  return (
    <div className="relative">
      {isFetching ? (
        <div className="mb-2 text-xs text-muted-foreground" aria-hidden="true">
          {t("common.refreshing")}
        </div>
      ) : null}
      {children}
    </div>
  );
}
