import { describe, expect, it, vi } from "vitest";
import { loadRuntimeConfig } from "./runtime-config";

const validConfig = {
  apiBaseUrl: "/api",
  auth: { basic: true, oauth: null },
  defaultLocale: "en",
  defaultTheme: "system",
} as const;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("loadRuntimeConfig", () => {
  it("loads valid same-origin Basic configuration without caching", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse(validConfig));

    await expect(loadRuntimeConfig(fetcher)).resolves.toEqual(validConfig);
    expect(fetcher).toHaveBeenCalledOnce();
    expect(fetcher).toHaveBeenCalledWith(
      new URL("runtime-config.json", document.baseURI),
      { cache: "no-store" },
    );
  });

  it("accepts public OAuth metadata without a client secret", async () => {
    const config = {
      ...validConfig,
      auth: {
        basic: false,
        oauth: {
          resources: [
            {
              id: "rabbitlens",
              label: "My IdP",
              authority: "https://identity.example.com",
              metadataUrl: "https://identity.example.com/.well-known/openid-configuration",
              clientId: "rabbitlens",
              scopes: ["openid", "profile"],
              resource: "rabbitmq",
              redirectUri: "https://rabbitlens.example.com/oauth/callback",
              logoutUri: "https://rabbitlens.example.com",
            }
          ]
        },
      },
    };
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse(config));

    await expect(loadRuntimeConfig(fetcher)).resolves.toEqual(config);
  });

  it.each([
    ["client secrets", { ...validConfig, auth: { basic: false, oauth: {
      resources: [
        {
          id: "rabbitlens",
          label: "My IdP",
          authority: "https://identity.example.com",
          clientId: "rabbitlens",
          clientSecret: "must-not-be-public",
          scopes: ["openid"],
          redirectUri: "https://rabbitlens.example.com/oauth/callback",
        }
      ]
    } } }],
    ["unsupported locales", { ...validConfig, defaultLocale: "fr" }],
    ["protocol-relative API URLs", { ...validConfig, apiBaseUrl: "//attacker.example/api" }],
    ["non-HTTP API URLs", { ...validConfig, apiBaseUrl: "ftp://rabbitmq.example.com/api" }],
    ["configuration without authentication", { ...validConfig, auth: { basic: false, oauth: null } }],
  ])("rejects %s", async (_caseName, config) => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse(config));

    await expect(loadRuntimeConfig(fetcher)).rejects.toBeDefined();
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("rejects an unsuccessful configuration response", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({}, 503));

    await expect(loadRuntimeConfig(fetcher)).rejects.toThrow(
      "Runtime configuration request failed: 503",
    );
  });

  it("rejects malformed JSON", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("{", {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(loadRuntimeConfig(fetcher)).rejects.toBeDefined();
  });

  it("propagates network failures", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new TypeError("Network unavailable"));

    await expect(loadRuntimeConfig(fetcher)).rejects.toThrow("Network unavailable");
  });
});
