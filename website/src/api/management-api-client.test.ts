import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import type { AuthSession } from "@/auth/auth-session";
import { ApiError } from "./api-error";
import { ManagementApiClient } from "./management-api-client";

const resultSchema = z.object({ value: z.string() });

function createClient(options: {
  fetcher: typeof fetch;
  session?: AuthSession;
  timeoutMs?: number;
  onUnauthorized?: () => void;
}) {
  return new ManagementApiClient({
    baseUrl: "/api",
    getSession: () => options.session ?? { type: "anonymous" },
    timeoutMs: options.timeoutMs ?? 1_000,
    fetcher: options.fetcher,
    onUnauthorized: options.onUnauthorized ?? vi.fn(),
  });
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("ManagementApiClient", () => {
  afterEach(() => vi.useRealTimers());

  it("joins the API URL, adds Basic auth, and parses the response schema", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({ value: "ok" }),
    );
    const client = createClient({
      fetcher,
      session: { type: "basic", authorization: "Basic encoded" },
    });

    await expect(client.request("/nodes/rabbit%40one", resultSchema)).resolves.toEqual(
      { value: "ok" },
    );

    const [url, init] = fetcher.mock.calls[0] ?? [];
    const headers = new Headers(init?.headers);
    expect(url).toBe("/api/nodes/rabbit%40one");
    expect(headers.get("accept")).toBe("application/json");
    expect(headers.get("authorization")).toBe("Basic encoded");
  });

  it("invokes browser fetch with the Window receiver", async () => {
    let receiver: unknown;
    const fetcher = function (this: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      receiver = this;
      return Promise.resolve(jsonResponse({ value: "ok" }));
    } as typeof fetch;
    const client = createClient({ fetcher });

    await client.request("/overview", resultSchema);

    expect(receiver).toBe(window);
  });

  it("adds Bearer auth without accepting a caller override", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({ value: "ok" }),
    );
    const client = createClient({
      fetcher,
      session: { type: "bearer", accessToken: "access-token" },
    });

    await client.request("/overview", resultSchema, {
      headers: { Authorization: "Basic attacker" },
    });

    const headers = new Headers(fetcher.mock.calls[0]?.[1]?.headers);
    expect(headers.get("authorization")).toBe("Bearer access-token");
  });

  it("omits authorization for anonymous requests", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({ value: "ok" }),
    );
    const client = createClient({ fetcher });

    await client.request("/overview", resultSchema);

    const headers = new Headers(fetcher.mock.calls[0]?.[1]?.headers);
    expect(headers.has("authorization")).toBe(false);
  });

  it("supports empty successful responses", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 204 }));
    const client = createClient({ fetcher });

    await expect(client.requestVoid("/reset", { method: "DELETE" })).resolves.toBeUndefined();
  });

  it("downloads authenticated non-JSON responses as blobs", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("trace contents", { headers: { "content-type": "text/plain" } }),
    );
    const client = createClient({
      fetcher,
      session: { type: "basic", authorization: "Basic encoded" },
    });

    const blob = await client.requestBlob("/trace-files/node/rabbit%40node/a.log");

    expect(await blob.text()).toBe("trace contents");
    const headers = new Headers(fetcher.mock.calls[0]?.[1]?.headers);
    expect(headers.get("authorization")).toBe("Basic encoded");
  });

  it.each([
    [400, "validation", false],
    [401, "unauthorized", false],
    [403, "forbidden", false],
    [404, "not-found", false],
    [409, "conflict", false],
    [412, "validation", false],
    [503, "server", true],
  ] as const)(
    "normalizes HTTP %s as %s",
    async (status, kind, retryable) => {
      const fetcher = vi
        .fn<typeof fetch>()
        .mockResolvedValue(jsonResponse({ error: "request_failed", reason: "Denied" }, status));
      const client = createClient({ fetcher });

      const rejection = client.request("/overview", resultSchema);

      await expect(rejection).rejects.toMatchObject({
        name: "ApiError",
        kind,
        status,
        retryable,
        message: "Denied",
      });
    },
  );

  it("ends the local session exactly once on 401", async () => {
    const onUnauthorized = vi.fn();
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ error: "not_authorised" }, 401));
    const client = createClient({ fetcher, onUnauthorized });

    await expect(client.request("/whoami", resultSchema)).rejects.toBeInstanceOf(
      ApiError,
    );
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it("reports incompatible successful responses without retrying", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ value: 42 }));
    const client = createClient({ fetcher });

    await expect(client.request("/overview", resultSchema)).rejects.toMatchObject({
      kind: "compatibility",
      retryable: false,
    });
  });

  it("normalizes network failures as retryable", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new TypeError("Connection refused"));
    const client = createClient({ fetcher });

    await expect(client.request("/overview", resultSchema)).rejects.toMatchObject({
      kind: "network",
      retryable: true,
    });
  });

  it("distinguishes request timeouts from caller cancellation", async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn<typeof fetch>().mockImplementation(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        }),
    );
    const client = createClient({ fetcher, timeoutMs: 25 });
    const request = client.request("/overview", resultSchema);
    const timeoutExpectation = expect(request).rejects.toMatchObject({
      kind: "timeout",
      retryable: true,
    });

    await vi.advanceTimersByTimeAsync(25);
    await timeoutExpectation;

    vi.useRealTimers();
    const caller = new AbortController();
    const cancelledRequest = client.request("/overview", resultSchema, {
      signal: caller.signal,
    });
    const cancellationExpectation = expect(cancelledRequest).rejects.toMatchObject({
      name: "AbortError",
    });
    caller.abort();
    await cancellationExpectation;
  });

  it("redacts the active authorization value from server diagnostics", async () => {
    const authorization = "Basic secret-value";
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse(
        { reason: `Rejected header ${authorization}` },
        400,
      ),
    );
    const client = createClient({
      fetcher,
      session: { type: "basic", authorization },
    });

    const error = await client
      .request("/overview", resultSchema)
      .catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as Error).message).toContain("[REDACTED]");
    expect((error as Error).message).not.toContain(authorization);
  });
});
