import { describe, it, expect } from "vitest";
import { oauthResourceConfigSchema, oauthConfigSchema } from "./oauth-config";

describe("OAuth Configuration", () => {
  it("rejects unknown keys like clientSecret", () => {
    const data = {
      id: "my-id",
      label: "My IdP",
      authority: "https://auth.example.com",
      clientId: "my-client",
      scopes: ["openid", "profile"],
      redirectUri: "https://rabbitlens.example.com/oauth/callback",
      clientSecret: "super-secret"
    };
    const result = oauthResourceConfigSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("requires at least one scope", () => {
    const data = {
      id: "my-id",
      label: "My IdP",
      authority: "https://auth.example.com",
      clientId: "my-client",
      scopes: [],
      redirectUri: "https://rabbitlens.example.com/oauth/callback",
    };
    const result = oauthResourceConfigSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("validates a complete resource", () => {
    const data = {
      id: "my-id",
      label: "My IdP",
      authority: "https://auth.example.com",
      clientId: "my-client",
      scopes: ["openid", "profile"],
      redirectUri: "https://rabbitlens.example.com/oauth/callback",
    };
    const result = oauthResourceConfigSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("rejects duplicate resource IDs", () => {
    const data = {
      resources: [
        {
          id: "my-id",
          label: "IdP 1",
          authority: "https://auth1.example.com",
          clientId: "my-client",
          scopes: ["openid"],
          redirectUri: "https://rabbitlens.example.com/oauth/callback",
        },
        {
          id: "my-id",
          label: "IdP 2",
          authority: "https://auth2.example.com",
          clientId: "my-client",
          scopes: ["openid"],
          redirectUri: "https://rabbitlens.example.com/oauth/callback",
        }
      ]
    };
    const result = oauthConfigSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects unknown defaultResourceId", () => {
    const data = {
      defaultResourceId: "unknown",
      resources: [
        {
          id: "my-id",
          label: "IdP 1",
          authority: "https://auth1.example.com",
          clientId: "my-client",
          scopes: ["openid"],
          redirectUri: "https://rabbitlens.example.com/oauth/callback",
        }
      ]
    };
    const result = oauthConfigSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});
