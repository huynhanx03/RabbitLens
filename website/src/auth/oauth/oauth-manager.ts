import type { UserManager, User } from "oidc-client-ts";
import type { OAuthConfig, OAuthResourceConfig } from "./oauth-config";

import type * as OidcClientTsType from "oidc-client-ts";

export interface OAuthAdapter {
  restore(): Promise<User | null>;
  login(resourceId?: string, returnPath?: string): Promise<void>;
  completeLogin(): Promise<User>;
  renew(): Promise<User | null>;
  logout(resourceId?: string): Promise<void>;
  completeLogout(): Promise<void>;
  clear(): Promise<void>;
  subscribe(
    onUserLoaded: (user: User) => void,
    onUserUnloaded: () => void,
    onAccessTokenExpiring: () => void,
    onAccessTokenExpired: () => void,
    onSilentRenewError: (err: Error) => void
  ): () => void;
}

export class OAuthManager implements OAuthAdapter {
  private userManager: UserManager | null = null;
  private oidcClientTs: typeof OidcClientTsType | null = null;
  private currentResource: OAuthResourceConfig | null = null;

  private config: OAuthConfig;

  constructor(config: OAuthConfig) {
    this.config = config;
  }

  private async getOidcLib() {
    if (!this.oidcClientTs) {
      this.oidcClientTs = await import("oidc-client-ts");
      // keep logs safe in production, maybe warn/error only
      this.oidcClientTs.Log.setLogger(console);
      this.oidcClientTs.Log.setLevel(this.oidcClientTs.Log.WARN);
    }
    return this.oidcClientTs;
  }

  private async getOrCreateUserManager(resourceId?: string) {
    if (this.userManager && (!resourceId || this.currentResource?.id === resourceId)) {
      return this.userManager;
    }

    const lib = await this.getOidcLib();
    
    // figure out resource
    let res = this.config.resources[0];
    if (resourceId) {
      const found = this.config.resources.find(r => r.id === resourceId);
      if (found) res = found;
    } else if (this.config.defaultResourceId) {
      const found = this.config.resources.find(r => r.id === this.config.defaultResourceId);
      if (found) res = found;
    }

    this.currentResource = res;

    this.userManager = new lib.UserManager({
      authority: res.authority,
      metadataUrl: res.metadataUrl,
      client_id: res.clientId,
      redirect_uri: res.redirectUri,
      silent_redirect_uri: res.silentRedirectUri,
      post_logout_redirect_uri: res.logoutUri,
      scope: res.scopes.join(" "),
      response_type: "code",
      userStore: new lib.WebStorageStateStore({ store: window.sessionStorage, prefix: `rabbitlens_oidc_${res.id}_` }),
      stateStore: new lib.WebStorageStateStore({ store: window.sessionStorage, prefix: `rabbitlens_oidc_${res.id}_state_` }),
      automaticSilentRenew: !!res.silentRedirectUri,
      // Pass resource if provided (for resource indicators)
      extraQueryParams: res.resource ? { resource: res.resource } : undefined,
    });

    return this.userManager;
  }

  async restore(): Promise<User | null> {
    const um = await this.getOrCreateUserManager();
    return um.getUser();
  }

  async login(resourceId?: string, returnPath?: string): Promise<void> {
    const um = await this.getOrCreateUserManager(resourceId);
    await um.signinRedirect({ state: returnPath });
  }

  async completeLogin(): Promise<User> {
    const um = await this.getOrCreateUserManager();
    return um.signinRedirectCallback();
  }

  async renew(): Promise<User | null> {
    const um = await this.getOrCreateUserManager();
    return um.signinSilent();
  }

  async logout(resourceId?: string): Promise<void> {
    const um = await this.getOrCreateUserManager(resourceId);
    await um.signoutRedirect();
  }

  async completeLogout(): Promise<void> {
    const um = await this.getOrCreateUserManager();
    await um.signoutRedirectCallback();
  }

  async clear(): Promise<void> {
    if (this.userManager) {
      await this.userManager.clearStaleState();
      await this.userManager.removeUser();
    }
  }

  subscribe(
    onUserLoaded: (user: User) => void,
    onUserUnloaded: () => void,
    onAccessTokenExpiring: () => void,
    onAccessTokenExpired: () => void,
    onSilentRenewError: (err: Error) => void
  ): () => void {
    if (!this.userManager) return () => {};

    this.userManager.events.addUserLoaded(onUserLoaded);
    this.userManager.events.addUserUnloaded(onUserUnloaded);
    this.userManager.events.addAccessTokenExpiring(onAccessTokenExpiring);
    this.userManager.events.addAccessTokenExpired(onAccessTokenExpired);
    this.userManager.events.addSilentRenewError(onSilentRenewError);

    return () => {
      if (!this.userManager) return;
      this.userManager.events.removeUserLoaded(onUserLoaded);
      this.userManager.events.removeUserUnloaded(onUserUnloaded);
      this.userManager.events.removeAccessTokenExpiring(onAccessTokenExpiring);
      this.userManager.events.removeAccessTokenExpired(onAccessTokenExpired);
      this.userManager.events.removeSilentRenewError(onSilentRenewError);
    };
  }
}
