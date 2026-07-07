import { lazy, Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { type ChartRange, CHART_RANGES } from "@/config/chart-ranges";
import { Skeleton } from "@/components/ui/skeleton";
import { StatisticsAvailability } from "./statistics-availability";
import { cn } from "@/lib/utils";

export type RateChartSeries = {
  name: string;
  data: [number, number][];
  color?: string;
};

export type RateChartProps = {
  /** Chart title */
  title: string;
  /** Series data with timestamps and values */
  series: RateChartSeries[];
  /** Unit label for Y-axis, e.g., "msg/s", "bytes/s" */
  unit?: string;
  /** Currently selected chart range */
  selectedRange: ChartRange;
  /** Callback when range changes */
  onRangeChange: (range: ChartRange) => void;
  /** Whether the chart data is available in the current statistics mode */
  isAvailable?: boolean;
  /** The reason why data might be unavailable */
  availabilityReason?: string;
  showDataTable?: boolean;
  chartClassName?: string;
  className?: string;
};

// Lazy-load the ECharts rendering implementation
const EChartsRenderer = lazy(() => import("./rate-chart-renderer"));

export function RateChart({
  title,
  series,
  unit,
  selectedRange,
  onRangeChange,
  isAvailable = true,
  availabilityReason,
  showDataTable = true,
  chartClassName,
  className,
}: RateChartProps) {
  const { t } = useTranslation();
  const [showTable, setShowTable] = useState(false);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h4 className="text-sm font-medium">{title}</h4>
        <div className="flex flex-wrap items-center gap-1">
          {CHART_RANGES.map((range) => (
            <Button
              key={range.labelKey}
              variant={range === selectedRange ? "default" : "outline"}
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => onRangeChange(range)}
              disabled={!isAvailable}
            >
              {t(range.labelKey)}
            </Button>
          ))}
        </div>
      </div>

      {!isAvailable ? (
        <StatisticsAvailability reason={availabilityReason} />
      ) : (
        <Suspense fallback={<Skeleton className={cn("h-48 w-full", chartClassName)} />}>
          <EChartsRenderer
            series={series}
            unit={unit}
            heightClassName={cn("h-48 w-full", chartClassName)}
          />
        </Suspense>
      )}

      {showDataTable ? (
        <details
          open={showTable}
          onToggle={(e) => setShowTable((e.target as HTMLDetailsElement).open)}
        >
          <summary className="cursor-pointer text-xs text-muted-foreground">
            {t("charts.dataTable")}
          </summary>
          <div className="overflow-auto max-h-48 mt-2">
            <table className="w-full text-xs" role="table">
              <thead>
                <tr>
                  <th className="text-left px-2 py-1">{t("charts.time")}</th>
                  {series.map((s) => (
                    <th key={s.name} className="text-right px-2 py-1">
                      {s.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {series[0]?.data.map(([timestamp], i) => (
                  <tr key={timestamp} className="border-t border-border/50">
                    <td className="px-2 py-1 tabular-nums">
                      {new Date(timestamp).toLocaleTimeString()}
                    </td>
                    {series.map((s) => (
                      <td key={s.name} className="text-right px-2 py-1 tabular-nums">
                        {s.data[i]?.[1]?.toFixed(1) ?? "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ) : null}
    </div>
  );
}
