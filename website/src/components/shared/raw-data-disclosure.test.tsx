import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { RawDataDisclosure } from "./raw-data-disclosure";

describe("RawDataDisclosure", () => {
  it("keeps raw operational data out of the DOM until an operator asks for it", async () => {
    const user = userEvent.setup();
    render(
      <RawDataDisclosure title="RabbitMQ response" value={{ queue: "orders", messages: 3 }} />,
    );

    expect(screen.getByText("RabbitMQ response")).toBeVisible();
    expect(screen.queryByText(/"queue": "orders"/)).not.toBeInTheDocument();

    await user.click(screen.getByText("RabbitMQ response"));

    expect(screen.getByText(/"queue": "orders"/)).toBeVisible();
    expect(screen.getByText(/"messages": 3/)).toBeVisible();
  });

  it("uses the default label and supports custom container styling", () => {
    const { container } = render(<RawDataDisclosure className="audit-marker" value={null} />);

    expect(screen.getByText("Raw data")).toBeVisible();
    expect(container.querySelector("details")).toHaveClass("audit-marker");
  });
});
