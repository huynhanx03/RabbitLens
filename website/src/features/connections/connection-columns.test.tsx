import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import type { ConnectionViewModel } from "@/domains/connections/connection-view-model";
import { DataTable } from "@/components/shared/data-table";
import { createConnectionColumns } from "./connection-columns";

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-router")>(
    "@tanstack/react-router",
  );
  return {
    ...actual,
    Link: ({ children, params }: { children: React.ReactNode; params: { name: string } }) => (
      <a href={`/connections/${encodeURIComponent(params.name)}`}>{children}</a>
    ),
  };
});

const row: ConnectionViewModel = {
  name: "client / one",
  user: "admin",
  vhost: "/",
  state: "running",
  protocol: "AMQP 0-9-1",
  channels: 2,
  ssl: true,
  peerEndpoint: "127.0.0.1:55000",
  endpoint: "127.0.0.1:5671",
  node: "rabbit@demo",
  connectedAt: null,
  sendRate: null,
  recvRate: null,
  sendBytes: null,
  recvBytes: null,
};

const translate = (key: string, options?: Record<string, unknown>) =>
  options?.name ? `${key} ${String(options.name)}` : key;

describe("connection columns", () => {
  it("renders a primary detail link and accessible TLS state", () => {
    renderWithProviders(
      <DataTable
        ariaLabel="Connections"
        columns={createConnectionColumns(translate, vi.fn())}
        data={[row]}
      />,
    );

    expect(screen.getByRole("link", { name: row.name })).toHaveAttribute(
      "href",
      "/connections/client%20%2F%20one",
    );
    expect(screen.getByLabelText("connections.tlsEnabled")).toBeVisible();
    expect(screen.getByText("running")).toBeVisible();
  });

  it("keeps close inside the row action menu", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(
      <DataTable
        ariaLabel="Connections"
        columns={createConnectionColumns(translate, onClose)}
        data={[row]}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: `connections.actionsFor ${row.name}` }),
    );
    await user.click(screen.getByRole("menuitem", { name: "connections.forceClose" }));
    expect(onClose).toHaveBeenCalledWith(row.name);
  });
});
