import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RateChartSeries } from "./rate-chart";

const echartsMock = vi.hoisted(() => {
  const chart = { dispose: vi.fn(), resize: vi.fn(), setOption: vi.fn() };
  return {
    chart,
    init: vi.fn(() => chart),
    linearGradient: vi.fn(),
    use: vi.fn(),
  };
});

vi.mock("echarts/core", () => ({
  graphic: { LinearGradient: echartsMock.linearGradient },
  init: echartsMock.init,
  use: echartsMock.use,
}));
vi.mock("echarts/charts", () => ({ LineChart: {} }));
vi.mock("echarts/components", () => ({
  DataZoomComponent: {},
  GridComponent: {},
  LegendComponent: {},
  TooltipComponent: {},
}));
vi.mock("echarts/renderers", () => ({ CanvasRenderer: {} }));

import EChartsRenderer from "./rate-chart-renderer";

class ResizeObserverMock {
  static instance: ResizeObserverMock | undefined;
  callback: ResizeObserverCallback;
  disconnect = vi.fn();
  observe = vi.fn();

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    ResizeObserverMock.instance = this;
  }
}

const series: RateChartSeries[] = [
  { name: "Published", data: [[0, 4]] as [number, number][] },
  { name: "Delivered", data: [[0, 2]] as [number, number][], color: "#db2777" },
];

describe("EChartsRenderer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ResizeObserverMock.instance = undefined;
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    document.documentElement.style.setProperty("--muted-foreground", "#64748b");
    document.documentElement.style.setProperty("--border", "#cbd5e1");
    document.documentElement.style.setProperty("--foreground", "#0f172a");
    document.documentElement.style.setProperty("--chart-1", "#2563eb");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("creates a compact, themed line chart and reacts to resize", () => {
    render(<EChartsRenderer heightClassName="h-72" series={series} unit="msg/s" />);

    const container = screen.getByRole("img", { name: "Rate chart" });
    expect(container).toHaveClass("h-72");
    expect(echartsMock.init).toHaveBeenCalledWith(container);
    expect(ResizeObserverMock.instance?.observe).toHaveBeenCalledWith(container);

    const [option, replace] = echartsMock.chart.setOption.mock.calls[0];
    expect(replace).toBe(true);
    expect(option).toMatchObject({
      animation: true,
      animationDuration: 200,
      legend: { data: ["Published", "Delivered"], textStyle: { color: "#0f172a" } },
      xAxis: { axisLine: { lineStyle: { color: "#cbd5e1" } } },
      yAxis: { name: "msg/s", axisLabel: { color: "#64748b" } },
    });
    expect(option.series).toHaveLength(2);
    expect(option.series[0]).toMatchObject({
      data: [[0, 4]],
      lineStyle: { color: "#2563eb" },
      name: "Published",
    });
    expect(option.series[1]).toMatchObject({ lineStyle: { color: "#db2777" } });

    ResizeObserverMock.instance?.callback(
      [],
      ResizeObserverMock.instance as unknown as ResizeObserver,
    );
    expect(echartsMock.chart.resize).toHaveBeenCalledOnce();
  });

  it("honors reduced motion and disposes chart resources on unmount", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true } as MediaQueryList);
    const { unmount } = render(<EChartsRenderer series={series} />);

    const [option] = echartsMock.chart.setOption.mock.calls[0];
    expect(option).toMatchObject({ animation: false, animationDuration: 0 });

    unmount();
    expect(ResizeObserverMock.instance?.disconnect).toHaveBeenCalledOnce();
    expect(echartsMock.chart.dispose).toHaveBeenCalledOnce();
  });

  it("uses the default height and cycles the theme palette for additional series", () => {
    const manySeries: RateChartSeries[] = Array.from({ length: 7 }, (_, index) => ({
      name: `Series ${index}`,
      data: [[index, index]] as [number, number][],
    }));
    render(<EChartsRenderer series={manySeries} />);

    expect(screen.getByRole("img", { name: "Rate chart" })).toHaveClass("h-48", "w-full");
    const [option] = echartsMock.chart.setOption.mock.calls[0];
    expect(option.series[6]).toMatchObject({ lineStyle: { color: "#2563eb" } });
  });
});
