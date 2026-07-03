import React, { createContext, useContext, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../auth-context";
import { evaluatePermission, type PermissionDecision } from "./permission-decision";
import type { ActionPolicy } from "./action-policy";
import type { ManagementApiClient } from "@/api/management-api-client";
import { extensionsQueryOptions } from "@/domains/extensions/extension-query";
import { overviewQueryOptions } from "@/domains/overview/overview-query";
import { useRouteContext } from "@tanstack/react-router";

type CurrentVhostContextValue = string | undefined;

export const CurrentVhostContext = createContext<CurrentVhostContextValue>(undefined);

export function useCurrentVhost(): string | undefined {
  return useContext(CurrentVhostContext);
}

function hasApiClient(value: unknown): value is { apiClient: ManagementApiClient } {
  return typeof value === "object" && value !== null && "apiClient" in value;
}

export function usePermissionDecision(policy: ActionPolicy): PermissionDecision {
  const { user } = useAuth();
  
  // Try to grab apiClient from route context. 
  // In tests without router, this might throw or be undefined, so we default safely.
  let apiClient: ManagementApiClient | undefined;
  try {
    const context: unknown = useRouteContext({ strict: false });
    apiClient = hasApiClient(context) ? context.apiClient : undefined;
  } catch {
    apiClient = undefined;
  }

  const enabled = !!apiClient && !!policy.requiredFeature;
  const { data: overview } = useQuery({
    ...overviewQueryOptions(
      apiClient!,
      () => enabled,
    ),
    enabled,
  });
  const { data: extensions } = useQuery({
    ...extensionsQueryOptions(apiClient!),
    enabled,
  });
  
  const currentVhost = useCurrentVhost();

  const capabilities = useMemo(() => {
    if (!overview || !extensions) return null;
    return {
      features: {
        statistics: !overview.disable_stats,
      },
      extensions: {
        federation: extensions.some((ext) => ext.javascript_src.includes("federation")),
        shovel: extensions.some((ext) => ext.javascript_src.includes("shovel")),
        stream: extensions.some((ext) => ext.javascript_src.includes("stream")),
        top: extensions.some((ext) => ext.javascript_src.includes("top")),
        tracing: extensions.some((ext) => ext.javascript_src.includes("tracing")),
      }
    };
  }, [overview, extensions]);

  return useMemo(() => {
    return evaluatePermission(policy, user, capabilities, currentVhost);
  }, [policy, user, capabilities, currentVhost]);
}

type PermissionGateProps = {
  policy: ActionPolicy;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function PermissionGate({ policy, children, fallback = null }: PermissionGateProps) {
  const decision = usePermissionDecision(policy);

  if (decision.kind === "deny") {
    return <>{fallback}</>;
  }

  // If allow or server, we render the children.
  // If the server denies it later, it will throw a 403 ApiError, which should be caught by an ErrorBoundary.
  return <>{children}</>;
}
