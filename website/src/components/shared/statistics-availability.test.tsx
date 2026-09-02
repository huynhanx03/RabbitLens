import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { StatisticsAvailability } from "./statistics-availability";

describe("StatisticsAvailability", () => {
  it("renders nothing when statistics remain available", () => {
    const { container } = renderWithProviders(<StatisticsAvailability />);
    expect(container).toBeEmptyDOMElement();
  });

  it("explains why live statistics are unavailable", () => {
    renderWithProviders(<StatisticsAvailability reason="The management plugin disabled rates." />);

    expect(screen.getByRole("alert")).toHaveTextContent("Statistics Unavailable");
    expect(screen.getByRole("alert")).toHaveTextContent("The management plugin disabled rates.");
  });
});
