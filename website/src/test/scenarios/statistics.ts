import type { OverviewResponse } from "@/domains/overview/overview-schema";

export const mockOverviewStatsEnabled: OverviewResponse = {
  rabbitmq_version: "4.4.0",
  erlang_version: "26.2.1",
  management_version: "4.4.0",
  cluster_name: "rabbit@localhost",
  disable_stats: false,
  rates_mode: "basic",
};

export const mockOverviewStatsDisabled: OverviewResponse = {
  ...mockOverviewStatsEnabled,
  disable_stats: true,
};

export const mockOverviewQueueTotalsOnly: OverviewResponse = {
  ...mockOverviewStatsEnabled,
  disable_stats: true,
  enable_queue_totals: true,
};

export const mockOverviewRatesNone: OverviewResponse = {
  ...mockOverviewStatsEnabled,
  disable_stats: false,
  rates_mode: "none",
};

export const mockOverviewRatesDetailed: OverviewResponse = {
  ...mockOverviewStatsEnabled,
  disable_stats: false,
  rates_mode: "detailed",
};
