import type { ManagementApiClient } from "@/api/management-api-client";
import { paginatedResponseSchema } from "@/api/pagination-schema";
import { buildListQuery, withQuery } from "@/api/query-string";
import type { ResourceListSearch } from "@/api/pagination-schema";
import { connectionSchema } from "./connection-schema";

const paginatedConnectionsSchema = paginatedResponseSchema(connectionSchema);

export async function getConnections(
  client: ManagementApiClient,
  search: ResourceListSearch,
  signal?: AbortSignal,
) {
  const query = buildListQuery(search);
  return client.request(
    withQuery("/connections", query),
    paginatedConnectionsSchema,
    { signal },
  );
}

export async function getConnection(
  client: ManagementApiClient,
  name: string,
  rangeParams?: URLSearchParams,
  signal?: AbortSignal,
) {
  const path = `/connections/${encodeURIComponent(name)}`;
  const query = rangeParams?.toString() ?? "";
  return client.request(withQuery(path, query), connectionSchema, { signal });
}

export async function closeConnection(
  client: ManagementApiClient,
  name: string,
  reason: string = "Closed via RabbitLens",
) {
  const path = `/connections/${encodeURIComponent(name)}`;
  return client.requestVoid(path, {
    method: "DELETE",
    headers: {
      "X-Reason": reason,
    },
  });
}

