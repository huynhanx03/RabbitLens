import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { ExtensionRouteGuard } from "./extension-route-guard";

const client = { request: vi.fn() };

vi.mock("@tanstack/react-router", async () => ({
  ...(await vi.importActual("@tanstack/react-router")),
  useRouteContext: () => ({
    apiClient: client,
    auth: { user: { name: "viewer", tags: ["monitoring"] } },
  }),
}));

describe("ExtensionRouteGuard", () => {
  beforeEach(() => {
    client.request.mockReset();
  });

  it("renders translated denial copy when the account cannot access a plugin", async () => {
    client.request.mockResolvedValue([{ javascript: "top.js" }]);

    renderWithProviders(
      <ExtensionRouteGuard id="top"><div>secret page</div></ExtensionRouteGuard>,
    );

    await waitFor(() =>
      expect(screen.getByText("Extension unavailable")).toBeVisible(),
    );
    expect(
      screen.getByText("Your account cannot access this extension."),
    ).toBeVisible();
    expect(screen.queryByText("secret page")).not.toBeInTheDocument();
  });

  it("distinguishes an extension that is not installed", async () => {
    client.request.mockResolvedValue([]);

    renderWithProviders(
      <ExtensionRouteGuard id="top"><div>secret page</div></ExtensionRouteGuard>,
    );

    await waitFor(() =>
      expect(screen.getByText("Extension unavailable")).toBeVisible(),
    );
    expect(
      screen.getByText("This extension is not enabled on the RabbitMQ server."),
    ).toBeVisible();
  });
});
