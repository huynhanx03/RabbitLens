import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/render";
import { StreamPublisherTable } from "./stream-publisher-table";

describe("StreamPublisherTable", () => {
  it("renders stream publisher operational counters", () => {
    renderWithProviders(
      <StreamPublisherTable
        publishers={[
          {
            publisher_id: 7,
            connection_details: { name: "stream-client" },
            reference: "orders-worker",
            published: 12,
            confirmed: 11,
            errored: 1,
          },
        ]}
      />,
    );

    expect(screen.getByText("stream-client")).toBeVisible();
    expect(screen.getByText("orders-worker")).toBeVisible();
    expect(screen.getByText("12")).toBeVisible();
    expect(screen.getByText("11")).toBeVisible();
    expect(screen.getByText("1")).toBeVisible();
  });

  it("renders the intentional empty state", () => {
    renderWithProviders(<StreamPublisherTable publishers={[]} />);
    expect(screen.getByText("No stream publishers.")).toBeVisible();
  });
});
