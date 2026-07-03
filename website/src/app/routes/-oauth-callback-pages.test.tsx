import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  manager: {
    completeLogin: vi.fn(),
    completeLogout: vi.fn(),
  },
  navigate: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => options,
  useNavigate: () => mocks.navigate,
}));

vi.mock("@/auth/oauth/oauth-provider", () => ({
  useOAuthManager: () => mocks.manager,
}));

import { OAuthCallback } from "./oauth.callback";
import { OAuthLogoutCallback } from "./oauth.logout-callback";

describe("OAuth callback pages", () => {
  beforeEach(() => {
    mocks.navigate.mockReset();
    mocks.manager.completeLogin.mockReset();
    mocks.manager.completeLogout.mockReset();
  });

  it("renders a safe localized login failure", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    mocks.manager.completeLogin.mockRejectedValue(
      new Error("code=secret-code state=secret-state"),
    );

    render(<OAuthCallback />);

    expect(await screen.findByRole("heading", { name: "Login failed" })).toBeVisible();
    expect(screen.getByText("The identity provider could not complete sign-in. Try again.")).toBeVisible();
    expect(document.body.textContent).not.toContain("secret-");
    expect(JSON.stringify(warn.mock.calls)).not.toContain("secret-");
    warn.mockRestore();
  });

  it("renders a safe localized logout failure", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    mocks.manager.completeLogout.mockRejectedValue(
      new Error("state=secret-state token=secret-token"),
    );

    render(<OAuthLogoutCallback />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Logout failed" })).toBeVisible();
    });
    expect(screen.getByText("The identity provider could not complete sign-out. Return to login and try again.")).toBeVisible();
    expect(document.body.textContent).not.toContain("secret-");
    expect(JSON.stringify(warn.mock.calls)).not.toContain("secret-");
    warn.mockRestore();
  });
});
