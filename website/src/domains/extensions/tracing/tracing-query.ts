import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ManagementApiClient } from "@/api/management-api-client";
import { createPollingInterval } from "@/api/polling";
import { PRODUCT_DEFAULTS } from "@/config/defaults";
import {
  createTrace,
  deleteTrace,
  deleteTraceFile,
  getTrace,
  getTraceFiles,
  getTraces,
  type TraceBody,
} from "./tracing-api";

export const tracingKeys = {
  all: ["tracing"] as const,
  traces: (node: string) => [...tracingKeys.all, "traces", node] as const,
  files: (node: string) => [...tracingKeys.all, "files", node] as const,
  trace: (node: string, vhost: string, name: string) =>
    [...tracingKeys.all, "trace", node, vhost, name] as const,
};

export function tracesQueryOptions(client: ManagementApiClient, node: string) {
  return queryOptions({
    queryKey: tracingKeys.traces(node),
    queryFn: () => getTraces(client, node),
    enabled: node.length > 0,
    refetchInterval: createPollingInterval(PRODUCT_DEFAULTS.polling.heavyListsMs),
  });
}

export function traceFilesQueryOptions(client: ManagementApiClient, node: string) {
  return queryOptions({
    queryKey: tracingKeys.files(node),
    queryFn: () => getTraceFiles(client, node),
    enabled: node.length > 0,
    refetchInterval: createPollingInterval(PRODUCT_DEFAULTS.polling.heavyListsMs),
  });
}

export function traceDetailQueryOptions(
  client: ManagementApiClient,
  node: string,
  vhost: string,
  name: string,
) {
  return queryOptions({
    queryKey: tracingKeys.trace(node, vhost, name),
    queryFn: () => getTrace(client, node, vhost, name),
    refetchInterval: createPollingInterval(PRODUCT_DEFAULTS.polling.nodeDetailsMs),
  });
}

type TraceTarget = { node: string; vhost: string; name: string };

export function useCreateTrace(client: ManagementApiClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ node, vhost, name, body }: TraceTarget & { body: TraceBody }) =>
      createTrace(client, node, vhost, name, body),
    onSuccess: (_data, target) =>
      queryClient.invalidateQueries({ queryKey: tracingKeys.traces(target.node) }),
  });
}

export function useDeleteTrace(client: ManagementApiClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (target: TraceTarget) =>
      deleteTrace(client, target.node, target.vhost, target.name),
    onSuccess: (_data, target) => {
      void queryClient.invalidateQueries({ queryKey: tracingKeys.traces(target.node) });
      void queryClient.invalidateQueries({ queryKey: tracingKeys.files(target.node) });
    },
  });
}

export function useDeleteTraceFile(client: ManagementApiClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ node, name }: { node: string; name: string }) =>
      deleteTraceFile(client, node, name),
    onSuccess: (_data, target) =>
      queryClient.invalidateQueries({ queryKey: tracingKeys.files(target.node) }),
  });
}
