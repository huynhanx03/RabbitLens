import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { reportOAuthFailure } from "@/auth/oauth/oauth-error";

export const Route = createFileRoute("/oauth/silent-callback")({
  component: OAuthSilentCallback,
});

function OAuthSilentCallback() {
  useEffect(() => {
    import("oidc-client-ts").then((oidc) => {
      const um = new oidc.UserManager({
        authority: "", // not needed for callback
        client_id: "", 
        redirect_uri: "",
      });
      um.signinSilentCallback().catch((error: unknown) => {
        reportOAuthFailure("silent-callback", error);
      });
    });
  }, []);

  return null;
}
