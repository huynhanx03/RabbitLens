import type { ComponentProps } from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { Binding } from "@/domains/bindings/binding-schema";
import { mockQueue } from "@/test/fixtures/queues";
import { renderWithProviders } from "@/test/render";
import { QueueConsumerRoutes } from "./queue-consumer-routes";
import type { QueueTopologyConfig } from "./queue-topology-view-model";

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual("@tanstack/react-router");
  return {
    ...actual,
    Link: ({ children, className }: ComponentProps<"a">) => (
      <a href="#exchange" className={className}>
        {children}
      </a>
    ),
  };
});

const explicitBinding: Binding = {
  source: "pentest.response",
  vhost: "/",
  destination: "my-queue",
  destination_type: "queue",
  routing_key: "",
  arguments: { alternate: true },
  properties_key: "~",
};

const systemBinding: Binding = {
  source: "",
  vhost: "/",
  destination: "my-queue",
  destination_type: "queue",
  routing_key: "my-queue",
  arguments: {},
  properties_key: "my-queue",
};

function topology(
  exchangeStatus: "available" | "unavailable" = "available",
): QueueTopologyConfig {
  return {
    queue: mockQueue,
    explicitRoutes: [
      {
        binding: explicitBinding,
        exchange:
          exchangeStatus === "available"
            ? {
                name: "pentest.response",
                vhost: "/",
                type: "topic",
                durable: true,
                arguments: {},
              }
            : null,
        exchangeStatus,
        isImplicitDefault: false,
      },
    ],
    systemRoutes: [
      {
        binding: systemBinding,
        exchange: null,
        exchangeStatus: "available",
        isImplicitDefault: true,
      },
    ],
  };
}

describe("QueueConsumerRoutes", () => {
  it("shows an explicit route and keeps the system binding collapsed", async () => {
    const onRemoveBinding = vi.fn();
    renderWithProviders(
      <QueueConsumerRoutes
        topology={topology()}
        onAddBinding={vi.fn()}
        onRemoveBinding={onRemoveBinding}
        onRetryBindings={vi.fn()}
        onRetryExchange={vi.fn()}
      />,
    );

    expect(screen.getByText("pentest.response")).toBeVisible();
    expect(screen.getByText("topic")).toBeVisible();
    expect(screen.getByText('""')).toBeVisible();
    expect(screen.getByText(/alternate:/)).toBeVisible();
    expect(screen.queryByText("(AMQP default)")).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: "System bindings (1)" }),
    );
    expect(screen.getByText("(AMQP default)")).toBeVisible();

    await userEvent.click(
      screen.getByRole("button", {
        name: 'Remove binding from pentest.response with routing key "" and arguments {"alternate":true}',
      }),
    );
    expect(onRemoveBinding).toHaveBeenCalledWith(explicitBinding);
  });

  it("keeps a route visible and retries unavailable exchange data", async () => {
    const onRetryExchange = vi.fn();
    renderWithProviders(
      <QueueConsumerRoutes
        topology={topology("unavailable")}
        onAddBinding={vi.fn()}
        onRemoveBinding={vi.fn()}
        onRetryBindings={vi.fn()}
        onRetryExchange={onRetryExchange}
      />,
    );

    expect(screen.getByText("pentest.response")).toBeVisible();
    expect(screen.getByText("Exchange configuration unavailable")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetryExchange).toHaveBeenCalledWith("pentest.response");
  });
});
