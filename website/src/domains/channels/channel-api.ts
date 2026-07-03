import type { ManagementApiClient } from "@/api/management-api-client";
import { paginatedResponseSchema } from "@/api/pagination-schema";
import { buildListQuery, withQuery } from "@/api/query-string";
import type { ResourceListSearch } from "@/api/pagination-schema";
import { channelSchema } from "./channel-schema";
import { z } from "zod";

const paginatedChannelsSchema = paginatedResponseSchema(channelSchema);

export async function getChannels(
  client: ManagementApiClient,
  search: ResourceListSearch,
  signal?: AbortSignal,
) {
  const query = buildListQuery(search);
  return client.request(withQuery("/channels", query), paginatedChannelsSchema, {
    signal,
  });
}

export async function getConnectionChannels(
  client: ManagementApiClient,
  connectionName: string,
  search: ResourceListSearch,
  signal?: AbortSignal,
) {
  // Use paginated list for children
  const query = buildListQuery(search);
  const path = `/connections/${encodeURIComponent(connectionName)}/channels`;
  // The API doesn't fully paginate /connections/:name/channels, it often just returns a JSON array.
  // We need to parse it conditionally based on what the API actually returns (paginated object vs array).
  // Some versions of RabbitMQ return a paginated object here, others just an array.
  // The safest way is to use a union schema, or if we know RabbitMQ >= 3.8.0 does pagination here:
  // Actually, rabbitmq-management pagination is usually applied globally to lists.
  // To be safe, we will assume it might be unpaginated and map it to paginated format if it's an array.
  
  const flexibleSchema = z.union([
    paginatedChannelsSchema,
    z.array(channelSchema).transform((items) => ({
      items,
      item_count: items.length,
      filtered_count: items.length,
      total_count: items.length,
      page: 1,
      page_count: 1,
      page_size: items.length,
    })),
  ]);

  return client.request(withQuery(path, query), flexibleSchema, { signal });
}

export async function getChannel(
  client: ManagementApiClient,
  name: string,
  rangeParams?: URLSearchParams,
  signal?: AbortSignal,
) {
  const path = `/channels/${encodeURIComponent(name)}`;
  const query = rangeParams?.toString() ?? "";
  return client.request(withQuery(path, query), channelSchema, { signal });
}
