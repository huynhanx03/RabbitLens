import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { OAuthResourcePicker } from "./oauth-resource-picker";
import { OAuthContext } from "./oauth-provider";
import { RuntimeConfigContext } from "@/config/runtime-config-context";
import type { RuntimeConfig } from "@/config/runtime-config-schema";
import type { OAuthManager } from "./oauth-manager";

describe("OAuthResourcePicker", () => {
  const config: RuntimeConfig = {
    apiBaseUrl: "/api",
    defaultLocale: "en",
    defaultTheme: "system",
    auth: {
      basic: false,
      oauth: {
        resources: [
          { id: "idp1", label: "IdP 1", authority: "https://auth1", clientId: "client1", scopes: ["openid"], redirectUri: "https://cb" },
          { id: "idp2", label: "IdP 2", authority: "https://auth2", clientId: "client2", scopes: ["openid"], redirectUri: "https://cb" },
        ]
      }
    }
  };

  it("renders buttons for each resource", () => {
    const manager = { login: vi.fn() } as unknown as OAuthManager;
    render(
      <RuntimeConfigContext.Provider value={config}>
        <OAuthContext.Provider value={manager}>
          <OAuthResourcePicker />
        </OAuthContext.Provider>
      </RuntimeConfigContext.Provider>
    );

    expect(screen.getByText("Log in with IdP 1")).toBeInTheDocument();
    expect(screen.getByText("Log in with IdP 2")).toBeInTheDocument();
  });

  it("disables buttons and calls login on click", async () => {
    const manager = { login: vi.fn().mockReturnValue(new Promise(() => {})) } as unknown as OAuthManager; // pending promise
    render(
      <RuntimeConfigContext.Provider value={config}>
        <OAuthContext.Provider value={manager}>
          <OAuthResourcePicker />
        </OAuthContext.Provider>
      </RuntimeConfigContext.Provider>
    );

    const btn = screen.getByText("Log in with IdP 1");
    fireEvent.click(btn);

    expect(manager.login).toHaveBeenCalledWith("idp1");
    expect(await screen.findAllByText("Redirecting…")).toHaveLength(2);
  });

  it("does not log provider-controlled login errors", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const manager = {
      login: vi.fn().mockRejectedValue(new Error("state=secret-state")),
    } as unknown as OAuthManager;
    render(
      <RuntimeConfigContext.Provider value={config}>
        <OAuthContext.Provider value={manager}>
          <OAuthResourcePicker />
        </OAuthContext.Provider>
      </RuntimeConfigContext.Provider>,
    );

    fireEvent.click(screen.getByText("Log in with IdP 1"));

    await waitFor(() => expect(warn).toHaveBeenCalledWith("OAuth initiation failed"));
    expect(JSON.stringify(warn.mock.calls)).not.toContain("secret-state");
    warn.mockRestore();
  });
});
