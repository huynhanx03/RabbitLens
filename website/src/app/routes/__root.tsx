import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { type AuthContextValue } from '@/auth/auth-context';
import { type QueryClient } from '@tanstack/react-query';
import { type ManagementApiClient } from '@/api/management-api-client';
import { type RuntimeConfig } from '@/config/runtime-config-schema';

export interface RouterContext {
  auth: AuthContextValue;
  queryClient: QueryClient;
  apiClient: ManagementApiClient;
  runtimeConfig: RuntimeConfig;
}

import { AppErrorBoundary } from '@/app/app-error-boundary';

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />,
  errorComponent: AppErrorBoundary,
});
