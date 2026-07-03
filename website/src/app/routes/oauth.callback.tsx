import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useOAuthManager } from "@/auth/oauth/oauth-provider";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { reportOAuthFailure } from "@/auth/oauth/oauth-error";

export const Route = createFileRoute("/oauth/callback")({
  component: OAuthCallback,
});

export function OAuthCallback() {
  const manager = useOAuthManager();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    manager.completeLogin()
      .then((user) => {
        // oidc-client-ts passes state in user.state
        const returnPath = user.state && typeof user.state === "string" ? user.state : "/";
        const isValid = returnPath.startsWith("/") && !returnPath.startsWith("//");
        navigate({ to: isValid ? returnPath : "/", replace: true });
      })
      .catch((error: unknown) => {
        reportOAuthFailure("login", error);
        setHasError(true);
      });
  }, [manager, navigate]);

  if (hasError) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-lg">
          <AlertTitle role="heading" aria-level={1}>
            {t("auth.oauth.loginFailedTitle")}
          </AlertTitle>
          <AlertDescription className="space-y-4">
            <p>{t("auth.oauth.loginFailedDescription")}</p>
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
        {t("auth.oauth.completingLogin")}
      </p>
    </div>
  );
}
