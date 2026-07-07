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
  heightClassName?: string;
};

const THEME_COLORS = [
  "--chart-1",
  "--chart-2",
  "--chart-3",
  "--chart-4",
  "--chart-5",
  "--chart-6",
];

function readThemeColor(token: string) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(token)
    .trim();
}

export default function EChartsRenderer({
  series,
  unit,
  heightClassName,
}: EChartsRendererProps) {
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
    const axisColor = readThemeColor("--muted-foreground");
    const borderColor = readThemeColor("--border");
    const foregroundColor = readThemeColor("--foreground");
    const themeColors = THEME_COLORS.map(readThemeColor);

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
          color: foregroundColor,
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
        axisLine: { lineStyle: { color: borderColor } },
        axisLabel: {
          color: axisColor,
          fontSize: 10,
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: "value",
        name: unit,
        nameTextStyle: {
          color: axisColor,
          fontSize: 10,
        },
        axisLine: { show: false },
        axisLabel: {
          color: axisColor,
          fontSize: 10,
        },
        splitLine: {
          lineStyle: { color: borderColor, type: "dashed" },
        },
      },
      series: series.map((s, i) => {
        const color = s.color ?? themeColors[i % themeColors.length];
        return {
          name: s.name,
          type: "line" as const,
          data: s.data,
          smooth: true,
          showSymbol: false,
          lineStyle: {
            width: 1.5,
            color,
          },
          itemStyle: {
            color,
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: `${color}33`,
              },
              {
                offset: 1,
                color: `${color}05`,
              },
            ]),
          },
        };
      }),
    };

    chart.setOption(option, true);
  }, [series, unit, prefersReducedMotion]);

  return (
    <div
      ref={containerRef}
      className={heightClassName ?? "h-48 w-full"}
      role="img"
      aria-label="Rate chart"
    />
  );
}
