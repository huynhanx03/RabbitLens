import { describe, expect, it } from "vitest";
import { resolveStatisticsMode, getStatisticsSelectors } from "./statistics-capabilities";
import type { OverviewResponse } from "@/domains/overview/overview-schema";

describe("Statistics Capabilities", () => {
  const baseOverview: Partial<OverviewResponse> = {
    disable_stats: false,
    rates_mode: "basic",
  };

  describe("resolveStatisticsMode", () => {
    it("returns disabled when disable_stats is true", () => {
      expect(resolveStatisticsMode({ ...baseOverview, disable_stats: true })).toBe("disabled");
    });

    it("returns queue-totals-only when disable_stats is true and enable_queue_totals is true", () => {
      expect(resolveStatisticsMode({ ...baseOverview, disable_stats: true, enable_queue_totals: true })).toBe("queue-totals-only");
    });

    it("returns no-rates when rates_mode is none", () => {
      expect(resolveStatisticsMode({ ...baseOverview, rates_mode: "none" })).toBe("no-rates");
    });

    it("returns basic-rates when rates_mode is basic", () => {
      expect(resolveStatisticsMode({ ...baseOverview, rates_mode: "basic" })).toBe("basic-rates");
    });

    it("returns detailed-rates when rates_mode is detailed", () => {
      expect(resolveStatisticsMode({ ...baseOverview, rates_mode: "detailed" })).toBe("detailed-rates");
    });

    it("returns basic-rates as fallback when rates_mode is undefined", () => {
      expect(resolveStatisticsMode({ disable_stats: false })).toBe("basic-rates");
    });
    
    it("returns basic-rates as fallback when overview is undefined", () => {
      expect(resolveStatisticsMode(undefined)).toBe("basic-rates");
    });
  });

  describe("getStatisticsSelectors", () => {
    it("returns correct selectors for disabled", () => {
      const selectors = getStatisticsSelectors("disabled");
      expect(selectors.canShowQueueTotals).toBe(false);
      expect(selectors.canShowRates).toBe(false);
      expect(selectors.canShowFineStats).toBe(false);
      expect(selectors.canPollSamples).toBe(false);
    });

    it("returns correct selectors for queue-totals-only", () => {
      const selectors = getStatisticsSelectors("queue-totals-only");
      expect(selectors.canShowQueueTotals).toBe(true);
      expect(selectors.canShowRates).toBe(false);
      expect(selectors.canShowFineStats).toBe(false);
      expect(selectors.canPollSamples).toBe(false);
    });

    it("returns correct selectors for no-rates", () => {
      const selectors = getStatisticsSelectors("no-rates");
      expect(selectors.canShowQueueTotals).toBe(true);
      expect(selectors.canShowRates).toBe(false);
      expect(selectors.canShowFineStats).toBe(false);
      expect(selectors.canPollSamples).toBe(false);
    });

    it("returns correct selectors for basic-rates", () => {
      const selectors = getStatisticsSelectors("basic-rates");
      expect(selectors.canShowQueueTotals).toBe(true);
      expect(selectors.canShowRates).toBe(true);
      expect(selectors.canShowFineStats).toBe(false);
      expect(selectors.canPollSamples).toBe(true);
    });

    it("returns correct selectors for detailed-rates", () => {
      const selectors = getStatisticsSelectors("detailed-rates");
      expect(selectors.canShowQueueTotals).toBe(true);
      expect(selectors.canShowRates).toBe(true);
      expect(selectors.canShowFineStats).toBe(true);
      expect(selectors.canPollSamples).toBe(true);
    });
  });
});
