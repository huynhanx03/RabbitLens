import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { DetailGrid } from "./detail-grid";

describe("DetailGrid", () => {
  it("renders labelled values and explicit unavailable fallbacks", () => {
    renderWithProviders(
      <DetailGrid
        items={[
          { label: "Protocol", value: "AMQP 0-9-1", monospace: true },
          { label: "Peer", value: null },
        ]}
        unavailableLabel="Unavailable"
      />,
    );

    expect(screen.getByText("AMQP 0-9-1")).toHaveClass("font-mono");
    expect(screen.getByText("Unavailable")).toBeVisible();
  });
});
