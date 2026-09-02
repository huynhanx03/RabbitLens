import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { FederationUpstreamDetailPage } from "./federation-upstream-detail-page";

const client = { request: vi.fn(), requestVoid: vi.fn() };
const navigate = vi.fn();

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return { ...actual, useRouteContext: () => ({ apiClient: client }), useNavigate: () => navigate };
});

describe("FederationUpstreamDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client.request.mockResolvedValue({
      vhost: "/",
      name: "remote",
      value: { uri: "amqp://remote.example", "ack-mode": "on-confirm" },
    });
    client.requestVoid.mockResolvedValue(undefined);
  });

  it("loads and saves an existing scoped upstream parameter", async () => {
    renderWithProviders(<FederationUpstreamDetailPage vhost="/" name="remote" />);

    expect(screen.getByRole("heading", { name: "remote" })).toBeVisible();
    expect(await screen.findByLabelText("Name")).toHaveValue("remote");
    expect(screen.getByLabelText("Value (JSON)")).toHaveValue(
      JSON.stringify({ uri: "amqp://remote.example", "ack-mode": "on-confirm" }, null, 2),
    );

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(client.requestVoid).toHaveBeenCalledWith(
        "/parameters/federation-upstream/%2F/remote",
        expect.objectContaining({ method: "PUT" }),
      ),
    );
    expect(navigate).toHaveBeenCalledWith({ to: "/extensions/federation/upstreams" });
  });
});
