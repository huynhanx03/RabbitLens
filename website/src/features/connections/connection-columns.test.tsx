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
    Link: ({
      children,
      params,
      ...props
    }: React.ComponentProps<"a"> & { params: { name: string } }) => (
      <a href={`/connections/${encodeURIComponent(params.name)}`} {...props}>{children}</a>
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

  it("renders force close as a direct trash action", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(
      <DataTable
        ariaLabel="Connections"
        columns={createConnectionColumns(translate, onClose)}
        data={[row]}
      />,
    );

    expect(screen.queryByRole("button", { name: `connections.actionsFor ${row.name}` })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "connections.forceClose" })).not.toBeInTheDocument();
    const trashAction = screen.getByRole("button", { name: `connections.forceCloseFor ${row.name}` });
    expect(trashAction).toHaveClass(
      "border",
      "border-transparent",
      "hover:border-destructive/40",
      "focus-visible:border-destructive/50",
    );
    await user.click(trashAction);
    expect(onClose).toHaveBeenCalledWith(row.name);
  });

  it("wraps long connection names and centers status metrics", () => {
    renderWithProviders(
      <DataTable
        ariaLabel="Connections"
        columns={createConnectionColumns(translate, vi.fn())}
        data={[row]}
      />,
    );

    expect(screen.getByRole("link", { name: row.name })).toHaveClass(
      "whitespace-normal",
      "break-all",
    );
    expect(screen.getByRole("columnheader", { name: "connections.state" })).toHaveClass(
      "text-center",
    );
    expect(screen.getByRole("columnheader", { name: "connections.channels" })).toHaveClass(
      "text-center",
    );
  });
});
