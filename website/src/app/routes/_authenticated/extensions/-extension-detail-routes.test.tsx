import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/render";

const { useParams } = vi.hoisted(() => ({ useParams: vi.fn() }));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({ ...options, useParams }),
}));

vi.mock("@/extensions/extension-route-guard", () => ({
  ExtensionRouteGuard: ({ children, id }: { children: React.ReactNode; id: string }) => (
    <div data-testid={`guard-${id}`}>{children}</div>
  ),
}));

vi.mock("@/features/shovels/shovel-detail-page", () => ({
  ShovelDetailPage: (props: { vhost: string; name: string }) => (
    <output>{JSON.stringify(props)}</output>
  ),
}));

vi.mock("@/features/tracing/trace-detail-page", () => ({
  TraceDetailPage: (props: { node: string; vhost: string; name: string }) => (
    <output>{JSON.stringify(props)}</output>
  ),
}));

import { ShovelDetailRoute } from "./shovels/management/$vhost.$name";
import { TracingDetailRoute } from "./tracing/$node.$vhost.$name";

describe("extension detail routes", () => {
  it("passes shovel route params through the shovel extension guard", () => {
    useParams.mockReturnValue({ vhost: "/", name: "shipper" });
    renderWithProviders(<ShovelDetailRoute />);
    expect(screen.getByTestId("guard-shovel")).toHaveTextContent('"name":"shipper"');
  });

  it("passes tracing route params through the tracing extension guard", () => {
    useParams.mockReturnValue({ node: "rabbit@node", vhost: "/", name: "audit" });
    renderWithProviders(<TracingDetailRoute />);
    expect(screen.getByTestId("guard-tracing")).toHaveTextContent('"node":"rabbit@node"');
  });
});
