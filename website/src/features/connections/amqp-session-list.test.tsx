import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AmqpSessionList } from "./amqp-session-list";

describe("AmqpSessionList", () => {
  it("explains when an AMQP 1.0 connection has no sessions", () => {
    render(<AmqpSessionList sessions={[]} />);

    expect(screen.getByRole("region", { name: "AMQP 1.0 sessions" })).toHaveTextContent(
      "No sessions on this connection.",
    );
  });

  it("renders incoming and outgoing AMQP links with unavailable values safely", () => {
    render(
      <AmqpSessionList
        sessions={[
          {
            channel_number: 7,
            incoming_window: 100,
            remote_incoming_window: null,
            remote_outgoing_window: 200,
            outgoing_unsettled_deliveries: 3,
            incoming_links: [
              {
                link_name: "orders-publisher",
                target_address: "orders",
                delivery_count: 5,
                credit: 20,
                snd_settle_mode: "unsettled",
              },
            ],
            outgoing_links: [
              {
                link_name: "orders-consumer",
                source_address: "orders",
                delivery_count: null,
                credit: 10,
                send_settled: false,
              },
            ],
          },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Session channel 7" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Incoming links" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Outgoing links" })).toBeVisible();
    expect(screen.getByText("orders-publisher")).toBeVisible();
    expect(screen.getByText("orders-consumer")).toBeVisible();
    expect(screen.getAllByLabelText("Unavailable").length).toBeGreaterThan(0);
  });
});
