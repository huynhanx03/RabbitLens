import { afterEach, describe, expect, it, vi } from "vitest";

const oidc = vi.hoisted(() => {
  const events = {
    addUserLoaded: vi.fn(),
    addUserUnloaded: vi.fn(),
    addAccessTokenExpiring: vi.fn(),
    addAccessTokenExpired: vi.fn(),
    addSilentRenewError: vi.fn(),
    removeUserLoaded: vi.fn(),
    removeUserUnloaded: vi.fn(),
    removeAccessTokenExpiring: vi.fn(),
    removeAccessTokenExpired: vi.fn(),
    removeSilentRenewError: vi.fn(),
  };
  const userManager = {
    getUser: vi.fn(),
    signinRedirect: vi.fn(),
    signinRedirectCallback: vi.fn(),
    signinSilent: vi.fn(),
    signoutRedirect: vi.fn(),
    signoutRedirectCallback: vi.fn(),
    clearStaleState: vi.fn(),
    removeUser: vi.fn(),
    events,
  };
  return {
    events,
    userManager,
    UserManager: vi.fn(function UserManager() {
      return userManager;
    }),
    WebStorageStateStore: vi.fn(),
    Log: { setLogger: vi.fn(), setLevel: vi.fn(), WARN: "warn" },
  };
});

vi.mock("oidc-client-ts", () => oidc);

import { OAuthManager } from "./oauth-manager";

const config = {
  defaultResourceId: "secondary",
  resources: [
    {
      id: "primary",
      label: "Primary",
      authority: "https://primary.example.com",
      clientId: "primary-client",
      scopes: ["openid", "profile"],
      redirectUri: "https://app.example.com/callback",
    },
    {
      id: "secondary",
      label: "Secondary",
      authority: "https://secondary.example.com",
      metadataUrl: "https://secondary.example.com/metadata",
      clientId: "secondary-client",
      scopes: ["openid"],
      resource: "rabbitmq",
      redirectUri: "https://app.example.com/callback",
      silentRedirectUri: "https://app.example.com/silent",
      logoutUri: "https://app.example.com/logout",
    },
  ],
};

describe("OAuthManager", () => {
  afterEach(() => vi.clearAllMocks());

  it("creates the default resource manager with session-only storage", async () => {
    const manager = new OAuthManager(config);
    await manager.restore();

    expect(oidc.UserManager).toHaveBeenCalledWith(
      expect.objectContaining({
        authority: "https://secondary.example.com",
        metadataUrl: "https://secondary.example.com/metadata",
        client_id: "secondary-client",
        scope: "openid",
        automaticSilentRenew: true,
        extraQueryParams: { resource: "rabbitmq" },
      }),
    );
    expect(oidc.WebStorageStateStore).toHaveBeenCalledWith(
      expect.objectContaining({
        prefix: "rabbitlens_oidc_secondary_",
      }),
    );
    expect(oidc.WebStorageStateStore).toHaveBeenCalledWith(
      expect.objectContaining({
        prefix: "rabbitlens_oidc_secondary_state_",
      }),
    );
    expect(oidc.Log.setLevel).toHaveBeenCalledWith("warn");
  });

  it("delegates login, callbacks, renew and logout to the selected resource", async () => {
    const manager = new OAuthManager(config);
    const user = { profile: { sub: "operator" } };
    oidc.userManager.signinRedirectCallback.mockResolvedValue(user);
    oidc.userManager.signinSilent.mockResolvedValue(user);

    await manager.login("primary", "/queues?tab=messages");
    await expect(manager.completeLogin()).resolves.toBe(user);
    await expect(manager.renew()).resolves.toBe(user);
    await manager.logout("secondary");
    await manager.completeLogout();

    expect(oidc.UserManager).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        authority: "https://primary.example.com",
      }),
    );
    expect(oidc.userManager.signinRedirect).toHaveBeenCalledWith({ state: "/queues?tab=messages" });
    expect(oidc.userManager.signinRedirectCallback).toHaveBeenCalledOnce();
    expect(oidc.userManager.signinSilent).toHaveBeenCalledOnce();
    expect(oidc.userManager.signoutRedirect).toHaveBeenCalledOnce();
    expect(oidc.userManager.signoutRedirectCallback).toHaveBeenCalledOnce();
  });

  it("clears an initialized session and registers a removable event subscription", async () => {
    const manager = new OAuthManager(config);
    await manager.restore();
    const callbacks = [vi.fn(), vi.fn(), vi.fn(), vi.fn(), vi.fn()] as const;
    const unsubscribe = manager.subscribe(...callbacks);
    await manager.clear();
    unsubscribe();

    expect(oidc.userManager.clearStaleState).toHaveBeenCalledOnce();
    expect(oidc.userManager.removeUser).toHaveBeenCalledOnce();
    expect(oidc.events.addUserLoaded).toHaveBeenCalledWith(callbacks[0]);
    expect(oidc.events.addSilentRenewError).toHaveBeenCalledWith(callbacks[4]);
    expect(oidc.events.removeUserLoaded).toHaveBeenCalledWith(callbacks[0]);
    expect(oidc.events.removeSilentRenewError).toHaveBeenCalledWith(callbacks[4]);
  });

  it("leaves subscriptions inert before a user manager is initialized", () => {
    const manager = new OAuthManager(config);
    manager.subscribe(vi.fn(), vi.fn(), vi.fn(), vi.fn(), vi.fn())();
    expect(oidc.events.addUserLoaded).not.toHaveBeenCalled();
  });
});
