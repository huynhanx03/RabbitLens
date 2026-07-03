import type { OverviewResponse } from "@/domains/overview/overview-schema";

export type StatisticsMode =
  | "disabled"
  | "queue-totals-only"
  | "no-rates"
  | "basic-rates"
  | "detailed-rates";

export function resolveStatisticsMode(overview: Partial<OverviewResponse> | undefined | null): StatisticsMode {
  if (!overview) return "basic-rates"; // fallback if not loaded yet
  
  if (overview.disable_stats) {
    return overview.enable_queue_totals ? "queue-totals-only" : "disabled";
  }

  const rm = overview.rates_mode;
  if (rm === "none") return "no-rates";
  if (rm === "detailed") return "detailed-rates";
  
  // Default when disable_stats is false and rates_mode is undefined or "basic"
  return "basic-rates";
}

export interface StatisticsSelectors {
  mode: StatisticsMode;
  canShowQueueTotals: boolean;
  canShowRates: boolean;
  canShowFineStats: boolean;
  canPollSamples: boolean;
  availabilityReason?: string;
}

export function getStatisticsSelectors(mode: StatisticsMode): StatisticsSelectors {
  switch (mode) {
    case "disabled":
      return {
        mode,
        canShowQueueTotals: false,
        canShowRates: false,
        canShowFineStats: false,
        canPollSamples: false,
        availabilityReason: "Statistics are globally disabled on this node.",
      };
    case "queue-totals-only":
      return {
        mode,
        canShowQueueTotals: true,
        canShowRates: false,
        canShowFineStats: false,
        canPollSamples: false,
        availabilityReason: "Statistics are disabled, but queue totals are explicitly enabled.",
      };
    case "no-rates":
      return {
        mode,
        canShowQueueTotals: true,
        canShowRates: false,
        canShowFineStats: false,
        canPollSamples: false,
        availabilityReason: "Rates mode is set to 'none'. Metric rates and samples are not available.",
      };
    case "basic-rates":
      return {
        mode,
        canShowQueueTotals: true,
        canShowRates: true,
        canShowFineStats: false,
        canPollSamples: true,
      };
    case "detailed-rates":
      return {
        mode,
        canShowQueueTotals: true,
        canShowRates: true,
        canShowFineStats: true,
        canPollSamples: true,
      };
  }
}
