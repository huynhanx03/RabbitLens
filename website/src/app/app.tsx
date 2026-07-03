import { useState, useCallback, useRef } from "react";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { createAuthStore } from "@/auth/auth-store";
import { AuthProvider } from "@/auth/auth-provider";
import { ManagementApiClient } from "@/api/management-api-client";
import { useRuntimeConfig } from "@/config/runtime-config-context";
import { TooltipProvider } from "@/components/ui/tooltip";
import { shouldRetry, getRetryDelay } from "@/api/polling";
import { routeTree } from "./route-tree.gen";
import { useAuth } from "@/auth/auth-context";
import { PRODUCT_DEFAULTS } from "@/config/defaults";
import { OAuthManager } from "@/auth/oauth/oauth-manager";
import { OAuthProvider } from "@/auth/oauth/oauth-provider";

const router = createRouter({
  routeTree,
  context: {
    auth: undefined!,
    queryClient: undefined!,
    apiClient: undefined!,
    runtimeConfig: undefined!,
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function InnerApp({ queryClient, apiClient }: { queryClient: QueryClient, apiClient: ManagementApiClient }) {
  const auth = useAuth();
  const config = useRuntimeConfig();

  return (
    <TooltipProvider>
      <RouterProvider
        router={router}
        context={{ auth, queryClient, apiClient, runtimeConfig: config }}
      />
    </TooltipProvider>
  );
}

export function App() {
  const { t } = useTranslation();
  const config = useRuntimeConfig();
  const [authStore] = useState(() => createAuthStore());
  const [oauthManager] = useState(() =>
    config.auth.oauth ? new OAuthManager(config.auth.oauth) : null,
  );
  const translateRef = useRef(t);
  translateRef.current = t;

  const [queryClient] = useState(() => new QueryClient({
    mutationCache: new MutationCache({
      onSuccess: () => toast.success(translateRef.current("common.changesSaved")),
    }),
    defaultOptions: {
      queries: {
        networkMode: "offlineFirst",
        retry: shouldRetry,
        retryDelay: getRetryDelay,
      }
    }
  }));

  const [apiClient] = useState(() => new ManagementApiClient({
    baseUrl: config.apiBaseUrl,
    getSession: () => authStore.getSnapshot().session,
    timeoutMs: PRODUCT_DEFAULTS.requests.timeoutMs,
    fetcher: fetch,
    onUnauthorized: () => {
      authStore.clear();
      queryClient.clear();
    }
  }));

  const handleLogout = useCallback(() => {
    queryClient.clear();
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider store={authStore} onLogout={handleLogout}>
        {oauthManager ? (
          <OAuthProvider manager={oauthManager}>
            <InnerApp queryClient={queryClient} apiClient={apiClient} />
          </OAuthProvider>
        ) : (
          <InnerApp queryClient={queryClient} apiClient={apiClient} />
        )}
      </AuthProvider>
    </QueryClientProvider>
  );
}
