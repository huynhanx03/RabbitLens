import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CHART_RANGES } from "@/config/chart-ranges";
import { renderWithProviders } from "@/test/render";
import { RateChart } from "./rate-chart";

vi.mock("./rate-chart-renderer", () => ({
  default: ({ series, unit }: { series: { name: string }[]; unit?: string }) => (
    <div aria-label="Rate chart" role="img">
      {series.map((seriesEntry) => seriesEntry.name).join(", ")} {unit}
    </div>
  ),
}));

const series = [
  {
    name: "Published",
    data: [
      [0, 1.2],
      [1_000, 2.3],
    ] as [number, number][],
  },
  { name: "Delivered", data: [[0, 0.5]] as [number, number][] },
];

function renderChart(overrides: Partial<React.ComponentProps<typeof RateChart>> = {}) {
  const onRangeChange = vi.fn();
  const rendered = renderWithProviders(
    <RateChart
      title="Message rates"
      series={series}
      unit="msg/s"
      selectedRange={CHART_RANGES[0]}
      onRangeChange={onRangeChange}
      {...overrides}
    />,
  );
  return { ...rendered, onRangeChange };
}

describe("RateChart", () => {
  it("changes API range through the selected range contract", async () => {
    const user = userEvent.setup();
    const { onRangeChange } = renderChart();
    const buttons = screen.getAllByRole("button");

    expect(buttons).toHaveLength(CHART_RANGES.length);
    await user.click(buttons[2]);

    expect(onRangeChange).toHaveBeenCalledWith(CHART_RANGES[2]);
    expect(await screen.findByRole("img", { name: "Rate chart" })).toHaveTextContent(
      "Published, Delivered msg/s",
    );
  });

  it("disables range changes and explains an unavailable statistics mode", () => {
    renderChart({ isAvailable: false, availabilityReason: "Statistics collection is disabled." });

    expect(screen.getByRole("alert")).toHaveTextContent("Statistics collection is disabled.");
    for (const button of screen.getAllByRole("button")) {
      expect(button).toBeDisabled();
    }
    expect(screen.queryByRole("img", { name: "Rate chart" })).not.toBeInTheDocument();
  });

  it("keeps the optional table closed until an operator opens it", async () => {
    const user = userEvent.setup();
    renderChart();

    const disclosure = screen.getByRole("group");
    expect(disclosure).not.toHaveAttribute("open");
    await user.click(screen.getByText("Show data table"));

    expect(disclosure).toHaveAttribute("open");
    expect(screen.getByRole("table")).toHaveTextContent("Published");
    expect(screen.getByRole("table")).toHaveTextContent("1.2");
    expect(screen.getByRole("table")).toHaveTextContent("—");
  });

  it("can omit the detailed table for compact pages", () => {
    renderChart({ showDataTable: false });
    expect(screen.queryByText("Data table")).not.toBeInTheDocument();
  });
});
