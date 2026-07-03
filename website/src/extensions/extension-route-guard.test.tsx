import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { ExtensionRouteGuard } from "./extension-route-guard";

const client = { request: vi.fn().mockResolvedValue([{ javascript: "top.js" }]) };

vi.mock("@tanstack/react-router", async () => ({
  ...(await vi.importActual("@tanstack/react-router")),
  useRouteContext: () => ({
    apiClient: client,
    auth: { user: { name: "viewer", tags: ["monitoring"] } },
  }),
}));

describe("ExtensionRouteGuard", () => {
  it("renders translated denial copy when the account cannot access a plugin", async () => {
    renderWithProviders(
      <ExtensionRouteGuard id="top"><div>secret page</div></ExtensionRouteGuard>,
    );

    await waitFor(() =>
      expect(screen.getByText("Extension unavailable")).toBeVisible(),
    );
    expect(
      screen.getByText("This extension is disabled or your account cannot access it."),
    ).toBeVisible();
    expect(screen.queryByText("secret page")).not.toBeInTheDocument();
  });
});
