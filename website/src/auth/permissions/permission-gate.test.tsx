import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PermissionGate } from "./permission-gate";
import { AuthContext } from "../auth-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RuntimeConfigContext } from "@/config/runtime-config-context";
import type { AuthenticatedUser } from "../auth-session";
import type { RuntimeConfig } from "@/config/runtime-config-schema";

describe("PermissionGate", () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const config: RuntimeConfig = {
    apiBaseUrl: "",
    auth: { basic: true, oauth: null },
    defaultLocale: "en",
    defaultTheme: "system",
  };

  function renderWithProviders(ui: React.ReactNode, user: AuthenticatedUser | null) {
    return render(
      <RuntimeConfigContext.Provider value={config}>
        <AuthContext.Provider
          value={{
            session: { type: "anonymous" },
            user,
            loginBasic: vi.fn(),
            setBearer: vi.fn(),
            setRestoringOAuth: vi.fn(),
            setExpiring: vi.fn(),
            setExpired: vi.fn(),
            setUser: vi.fn(),
            logout: vi.fn(),
          }}
        >
          <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
        </AuthContext.Provider>
      </RuntimeConfigContext.Provider>,
    );
  }

  it("renders fallback if access denied", () => {
    // Missing capabilities will cause deny immediately in usePermissionDecision
    renderWithProviders(
      <PermissionGate policy={{ requiredAnyTag: ["administrator"] }} fallback={<div>Denied</div>}>
        <div>Allowed Content</div>
      </PermissionGate>,
      { name: "guest", tags: [] },
    );
    expect(screen.getByText("Denied")).toBeInTheDocument();
    expect(screen.queryByText("Allowed Content")).not.toBeInTheDocument();
  });

  it("renders protected content for a user with the required tag", () => {
    renderWithProviders(
      <PermissionGate policy={{ requiredAnyTag: ["policymaker"] }} fallback={<div>Denied</div>}>
        <div>Allowed Content</div>
      </PermissionGate>,
      { name: "policy", tags: ["policymaker"] },
    );

    expect(screen.getByText("Allowed Content")).toBeInTheDocument();
    expect(screen.queryByText("Denied")).not.toBeInTheDocument();
  });

  it("keeps content available when a fine-grained check must be enforced by RabbitMQ", () => {
    renderWithProviders(
      <PermissionGate policy={{ fineGrainedPermission: "configure" }} fallback={<div>Denied</div>}>
        <div>Server-checked action</div>
      </PermissionGate>,
      { name: "operator", tags: [] },
    );

    expect(screen.getByText("Server-checked action")).toBeInTheDocument();
    expect(screen.queryByText("Denied")).not.toBeInTheDocument();
  });
});
