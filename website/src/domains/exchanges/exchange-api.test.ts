import { describe, expect, it, vi } from "vitest";
import { getExchanges, getExchange } from "./exchange-api";
import { ManagementApiClient } from "@/api/management-api-client";

describe("exchange API", () => {
  const getSession = vi.fn().mockReturnValue({ type: "anonymous" });
  const onUnauthorized = vi.fn();

  it("builds the correct list URL with search params", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ items: [], filtered_count: 0, item_count: 0, page: 1, page_count: 0, page_size: 100, total_count: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    
    const client = new ManagementApiClient({
      baseUrl: "http://localhost:15672/api",
      getSession,
      timeoutMs: 1000,
      onUnauthorized,
      fetcher,
    });

    await getExchanges(client, {
      page: 1,
      pageSize: 50,
      name: "amq.",
      useRegex: false,
      sortReverse: false,
    });

    expect(fetcher).toHaveBeenCalledWith(
      "http://localhost:15672/api/exchanges?page=1&page_size=50&name=amq.",
      expect.any(Object)
    );
  });

  it("builds the correct detail URL with encoding for vhost and name", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ name: "my-exchange" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    
    const client = new ManagementApiClient({
      baseUrl: "http://localhost:15672/api",
      getSession,
      timeoutMs: 1000,
      onUnauthorized,
      fetcher,
    });

    // Special characters in vhost and exchange name
    await getExchange(client, "/my-vhost", "my/exchange");

    expect(fetcher).toHaveBeenCalledWith(
      "http://localhost:15672/api/exchanges/%2Fmy-vhost/my%2Fexchange",
      expect.any(Object)
    );
  });
});
