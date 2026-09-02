import { describe, expect, it, vi } from "vitest";
import type { ManagementApiClient } from "@/api/management-api-client";
import { getChannel, getChannels, getConnectionChannels } from "./channel-api";

describe("channel API", () => {
  const search = {
    page: 2,
    pageSize: 25,
    name: "consumer.*",
    useRegex: true,
    sort: "name",
    sortReverse: false,
  };

  it("requests paginated channels with the validated RabbitMQ list query", async () => {
    const request = vi.fn().mockResolvedValue({ items: [] });
    const client = { request } as unknown as ManagementApiClient;
    const signal = new AbortController().signal;

    await getChannels(client, search, signal);

    expect(request).toHaveBeenCalledWith(
      "/channels?page=2&page_size=25&name=consumer.*&use_regex=true&sort=name&sort_reverse=false",
      expect.any(Object),
      { signal },
    );
  });

  it("encodes a connection name before requesting its channel collection", async () => {
    const request = vi.fn().mockResolvedValue({ items: [] });
    const client = { request } as unknown as ManagementApiClient;

    await getConnectionChannels(client, "127.0.0.1:5672 -> client/a", search);

    expect(request).toHaveBeenCalledWith(
      "/connections/127.0.0.1%3A5672%20-%3E%20client%2Fa/channels?page=2&page_size=25&name=consumer.*&use_regex=true&sort=name&sort_reverse=false",
      expect.any(Object),
      { signal: undefined },
    );

    const schema = request.mock.calls[0]?.[1] as {
      parse: (value: unknown) => unknown;
    };
    expect(schema.parse([{ name: "channel/a" }])).toEqual({
      items: [{ name: "channel/a" }],
      item_count: 1,
      filtered_count: 1,
      total_count: 1,
      page: 1,
      page_count: 1,
      page_size: 1,
    });
  });

  it("encodes channel names and preserves metric range parameters", async () => {
    const request = vi.fn().mockResolvedValue({ name: "channel/a" });
    const client = { request } as unknown as ManagementApiClient;
    const signal = new AbortController().signal;

    await getChannel(client, "channel/a", new URLSearchParams({ length: "60", age: "30" }), signal);

    expect(request).toHaveBeenCalledWith(
      "/channels/channel%2Fa?length=60&age=30",
      expect.any(Object),
      { signal },
    );
  });
});
