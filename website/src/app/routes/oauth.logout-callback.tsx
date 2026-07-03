import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useOAuthManager } from "@/auth/oauth/oauth-provider";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { reportOAuthFailure } from "@/auth/oauth/oauth-error";

export const Route = createFileRoute("/oauth/logout-callback")({
  component: OAuthLogoutCallback,
});

export function OAuthLogoutCallback() {
  const manager = useOAuthManager();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    manager.completeLogout()
      .then(() => {
        navigate({ to: "/login", replace: true });
      })
      .catch((error: unknown) => {
        reportOAuthFailure("logout", error);
        setHasError(true);
      });
  }, [manager, navigate]);

  if (hasError) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-lg">
          <AlertTitle role="heading" aria-level={1}>
            {t("auth.oauth.logoutFailedTitle")}
          </AlertTitle>
          <AlertDescription className="space-y-4">
            <p>{t("auth.oauth.logoutFailedDescription")}</p>
          <Button
            onClick={() => navigate({ to: "/login", replace: true })}
            variant="outline"
          >
            {t("auth.oauth.returnToLogin")}
          </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center p-4">
      <p role="status" className="text-muted-foreground animate-pulse">
        {t("auth.oauth.completingLogout")}
      </p>
    </div>
  );
}
