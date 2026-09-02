import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  manager: {
    completeLogin: vi.fn(),
    completeLogout: vi.fn(),
  },
  navigate: vi.fn(),
  reportOAuthFailure: vi.fn(),
  signinSilentCallback: vi.fn(),
  UserManager: vi.fn(function UserManager() {
    return { signinSilentCallback: mocks.signinSilentCallback };
  }),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => options,
  useNavigate: () => mocks.navigate,
}));

vi.mock("@/auth/oauth/oauth-provider", () => ({
  useOAuthManager: () => mocks.manager,
}));

vi.mock("@/auth/oauth/oauth-error", () => ({
  reportOAuthFailure: mocks.reportOAuthFailure,
}));

vi.mock("oidc-client-ts", () => ({ UserManager: mocks.UserManager }));

import { OAuthCallback } from "./oauth.callback";
import { OAuthLogoutCallback } from "./oauth.logout-callback";
import { OAuthSilentCallback } from "./oauth.silent-callback";

describe("OAuth callback pages", () => {
  beforeEach(() => {
    mocks.navigate.mockReset();
    mocks.manager.completeLogin.mockReset();
    mocks.manager.completeLogout.mockReset();
    mocks.reportOAuthFailure.mockReset();
    mocks.signinSilentCallback.mockReset();
    mocks.UserManager.mockClear();
  });

  it("renders a safe localized login failure", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    mocks.manager.completeLogin.mockRejectedValue(new Error("code=secret-code state=secret-state"));

    render(<OAuthCallback />);

    expect(await screen.findByRole("heading", { name: "Login failed" })).toBeVisible();
    expect(
      screen.getByText("The identity provider could not complete sign-in. Try again."),
    ).toBeVisible();
    expect(document.body.textContent).not.toContain("secret-");
    expect(JSON.stringify(warn.mock.calls)).not.toContain("secret-");
    await screen.findByRole("button", { name: "Return to login" }).then((button) => button.click());
    expect(mocks.navigate).toHaveBeenCalledWith({ to: "/login", replace: true });
    warn.mockRestore();
  });

  it("returns to a safe in-app path after a successful login", async () => {
    mocks.manager.completeLogin.mockResolvedValue({ state: "/queues?tab=messages" });

    render(<OAuthCallback />);

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith({
        to: "/queues?tab=messages",
        replace: true,
      });
    });
  });

  it("rejects protocol-relative OAuth state redirects", async () => {
    mocks.manager.completeLogin.mockResolvedValue({ state: "//attacker.example" });

    render(<OAuthCallback />);

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith({ to: "/", replace: true });
    });
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
    expect(
      screen.getByText(
        "The identity provider could not complete sign-out. Return to login and try again.",
      ),
    ).toBeVisible();
    expect(document.body.textContent).not.toContain("secret-");
    expect(JSON.stringify(warn.mock.calls)).not.toContain("secret-");
    await screen.findByRole("button", { name: "Return to login" }).then((button) => button.click());
    expect(mocks.navigate).toHaveBeenCalledWith({ to: "/login", replace: true });
    warn.mockRestore();
  });

  it("returns to login after a successful logout callback", async () => {
    mocks.manager.completeLogout.mockResolvedValue(undefined);

    render(<OAuthLogoutCallback />);

    await waitFor(() => {
      expect(mocks.navigate).toHaveBeenCalledWith({ to: "/login", replace: true });
    });
  });

  it("completes the silent renewal callback without rendering UI", async () => {
    mocks.signinSilentCallback.mockResolvedValue(undefined);
    const { container } = render(<OAuthSilentCallback />);

    await waitFor(() => expect(mocks.signinSilentCallback).toHaveBeenCalledOnce());
    expect(mocks.UserManager).toHaveBeenCalledWith({
      authority: "",
      client_id: "",
      redirect_uri: "",
    });
    expect(container).toBeEmptyDOMElement();
    expect(mocks.reportOAuthFailure).not.toHaveBeenCalled();
  });

  it("reports a failed silent renewal without exposing an error UI", async () => {
    const error = new Error("state=secret-state");
    mocks.signinSilentCallback.mockRejectedValue(error);
    const { container } = render(<OAuthSilentCallback />);

    await waitFor(() => {
      expect(mocks.reportOAuthFailure).toHaveBeenCalledWith("silent-callback", error);
    });
    expect(container).toBeEmptyDOMElement();
  });
});
