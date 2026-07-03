import { describe, it, expect, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { OAuthProvider } from "./oauth-provider";
import { OAuthManager } from "./oauth-manager";
import { AuthContext, type AuthContextValue } from "../auth-context";
import { RuntimeConfigContext } from "@/config/runtime-config-context";
import type { RuntimeConfig } from "@/config/runtime-config-schema";

describe("OAuthProvider", () => {
  it("restores session on mount", async () => {
    const manager = {
      restore: vi.fn().mockResolvedValue({ access_token: "token123" }),
      subscribe: vi.fn().mockReturnValue(() => {}),
    } as unknown as OAuthManager;

    const authContextValue: AuthContextValue = {
      session: { type: "anonymous" },
      user: null,
      loginBasic: vi.fn(),
      setBearer: vi.fn(),
      setRestoringOAuth: vi.fn(),
      setExpiring: vi.fn(),
      setExpired: vi.fn(),
      setUser: vi.fn(),
      logout: vi.fn(),
    };

    const config: RuntimeConfig = {
      apiBaseUrl: "/api",
      defaultLocale: "en",
      defaultTheme: "system",
      auth: {
        basic: true,
        oauth: {
          resources: [{ id: "test", label: "test", authority: "https://auth", clientId: "client", scopes: ["openid"], redirectUri: "https://cb" }]
        }
      }
    };

    render(
      <RuntimeConfigContext.Provider value={config}>
        <AuthContext.Provider value={authContextValue}>
          <OAuthProvider manager={manager}>
            <div>Child</div>
          </OAuthProvider>
        </AuthContext.Provider>
      </RuntimeConfigContext.Provider>
    );

    expect(authContextValue.setRestoringOAuth).toHaveBeenCalled();
    
    await waitFor(() => {
      expect(manager.restore).toHaveBeenCalled();
      expect(authContextValue.setBearer).toHaveBeenCalledWith("token123");
    });
  });

  it("does not overwrite a Basic session established while OAuth restore is pending", async () => {
    let finishRestore: (value: null) => void = () => undefined;
    const manager = {
      restore: vi.fn(() => new Promise<null>((resolve) => { finishRestore = resolve; })),
      subscribe: vi.fn().mockReturnValue(() => {}),
    } as unknown as OAuthManager;
    const logout = vi.fn();
    const baseAuth = {
      user: null,
      loginBasic: vi.fn(),
      setBearer: vi.fn(),
      setRestoringOAuth: vi.fn(),
      setExpiring: vi.fn(),
      setExpired: vi.fn(),
      setUser: vi.fn(),
      logout,
    };
    const config: RuntimeConfig = {
      apiBaseUrl: "/api",
      defaultLocale: "en",
      defaultTheme: "system",
      auth: {
        basic: true,
        oauth: {
          resources: [{ id: "test", label: "test", authority: "https://auth", clientId: "client", scopes: ["openid"], redirectUri: "https://cb" }],
        },
      },
    };
    const renderTree = (session: AuthContextValue["session"]) => (
      <RuntimeConfigContext.Provider value={config}>
        <AuthContext.Provider value={{ ...baseAuth, session }}>
          <OAuthProvider manager={manager}><div>Child</div></OAuthProvider>
        </AuthContext.Provider>
      </RuntimeConfigContext.Provider>
    );
    const view = render(renderTree({ type: "anonymous" }));
    view.rerender(renderTree({ type: "basic", authorization: "Basic encoded" }));

    finishRestore(null);
    await waitFor(() => expect(manager.restore).toHaveBeenCalled());
    expect(logout).not.toHaveBeenCalled();
  });

  it("does not write OAuth restore error details to the console", async () => {
    const sensitiveError = new Error("callback state=secret-state");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const manager = {
      restore: vi.fn().mockRejectedValue(sensitiveError),
      subscribe: vi.fn().mockReturnValue(() => {}),
    } as unknown as OAuthManager;
    const authContextValue: AuthContextValue = {
      session: { type: "restoring_oauth" },
      user: null,
      loginBasic: vi.fn(),
      setBearer: vi.fn(),
      setRestoringOAuth: vi.fn(),
      setExpiring: vi.fn(),
      setExpired: vi.fn(),
      setUser: vi.fn(),
      logout: vi.fn(),
    };
    const config: RuntimeConfig = {
      apiBaseUrl: "/api",
      defaultLocale: "en",
      defaultTheme: "system",
      auth: {
        basic: true,
        oauth: {
          resources: [{ id: "test", label: "test", authority: "https://auth", clientId: "client", scopes: ["openid"], redirectUri: "https://cb" }],
        },
      },
    };

    render(
      <RuntimeConfigContext.Provider value={config}>
        <AuthContext.Provider value={authContextValue}>
          <OAuthProvider manager={manager}><div>Child</div></OAuthProvider>
        </AuthContext.Provider>
      </RuntimeConfigContext.Provider>,
    );

    await waitFor(() => expect(authContextValue.logout).toHaveBeenCalled());
    expect(warn).toHaveBeenCalledWith("Failed to restore OAuth session");
    expect(warn).not.toHaveBeenCalledWith(expect.anything(), sensitiveError);
    warn.mockRestore();
  });
});
