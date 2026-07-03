import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRuntimeConfig } from "@/config/runtime-config-context";
import { useOAuthManager } from "./oauth-provider";
import { useTranslation } from "react-i18next";
import { reportOAuthFailure } from "./oauth-error";

export function OAuthResourcePicker() {
  const config = useRuntimeConfig();
  const manager = useOAuthManager();
  const { t } = useTranslation();
  const [isPending, setIsPending] = useState(false);
  
  if (!config.auth.oauth) return null;
  
  const resources = config.auth.oauth.resources;

  const handleLogin = async (resourceId: string) => {
    setIsPending(true);
    try {
      await manager.login(resourceId);
    } catch (error: unknown) {
      reportOAuthFailure("initiation", error);
      setIsPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {resources.map((res) => (
        <Button 
          key={res.id} 
          variant="outline" 
          onClick={() => handleLogin(res.id)}
          disabled={isPending}
          className="w-full"
        >
          {isPending
            ? t("auth.oauth.redirecting")
            : t("auth.oauth.loginWith", { provider: res.label })}
        </Button>
      ))}
    </div>
  );
}
