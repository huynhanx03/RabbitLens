import { useEffect, useRef } from "react";
import * as echarts from "echarts/core";
import { LineChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { RateChartSeries } from "./rate-chart";

// Register only what we need
echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  CanvasRenderer,
]);

type EChartsRendererProps = {
  series: RateChartSeries[];
  unit?: string;
};

const THEME_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function EChartsRenderer({ series, unit }: EChartsRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  // Check reduced motion preference
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = echarts.init(containerRef.current);
    chartRef.current = chart;

    const observer = new ResizeObserver(() => {
      chart.resize();
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const option: echarts.EChartsCoreOption = {
      animation: !prefersReducedMotion,
      animationDuration: prefersReducedMotion ? 0 : 200,
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "cross" },
      },
      legend: {
        data: series.map((s) => s.name),
        bottom: 0,
        textStyle: {
          color: "hsl(var(--foreground))",
          fontSize: 11,
        },
      },
      grid: {
        left: 50,
        right: 16,
        top: 8,
        bottom: 36,
        containLabel: false,
      },
      xAxis: {
        type: "time",
        axisLine: { lineStyle: { color: "hsl(var(--border))" } },
        axisLabel: {
          color: "hsl(var(--muted-foreground))",
          fontSize: 10,
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: "value",
        name: unit,
        nameTextStyle: {
          color: "hsl(var(--muted-foreground))",
          fontSize: 10,
        },
        axisLine: { show: false },
        axisLabel: {
          color: "hsl(var(--muted-foreground))",
          fontSize: 10,
        },
        splitLine: {
          lineStyle: { color: "hsl(var(--border))", type: "dashed" },
        },
      },
      series: series.map((s, i) => ({
        name: s.name,
        type: "line" as const,
        data: s.data,
        smooth: true,
        showSymbol: false,
        lineStyle: {
          width: 1.5,
          color: s.color ?? THEME_COLORS[i % THEME_COLORS.length],
        },
        itemStyle: {
          color: s.color ?? THEME_COLORS[i % THEME_COLORS.length],
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color:
                (s.color ?? THEME_COLORS[i % THEME_COLORS.length]) + "33",
            },
            {
              offset: 1,
              color:
                (s.color ?? THEME_COLORS[i % THEME_COLORS.length]) + "05",
            },
          ]),
        },
      })),
    };

    chart.setOption(option, true);
  }, [series, unit, prefersReducedMotion]);

  return (
    <div
      ref={containerRef}
      className="h-48 w-full"
      role="img"
      aria-label="Rate chart"
    />
  );
}
