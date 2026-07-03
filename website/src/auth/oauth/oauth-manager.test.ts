import { describe, it, expect } from "vitest";
import { OAuthManager } from "./oauth-manager";

describe("OAuthManager", () => {
  it("initializes without throwing", () => {
    const manager = new OAuthManager({
      resources: [
        {
          id: "test",
          label: "Test",
          authority: "https://auth.example.com",
          clientId: "client",
          scopes: ["openid"],
          redirectUri: "https://app.example.com/cb",
        }
      ]
    });
    expect(manager).toBeDefined();
  });

  // the real underlying oidc-client-ts gets tested in integration
  // or we mock the module if we want deeper unit tests
});
