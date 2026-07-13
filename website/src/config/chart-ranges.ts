/**
 * Chart range definitions mapping UI range selections to
 * RabbitMQ Management API age/increment parameters.
 */

export type ChartRange = {
  /** Display label key for i18n */
  labelKey: string;
  /** Age parameter in seconds for the API query */
  ageSeconds: number;
  /** Increment parameter in seconds for the API query */
  incrementSeconds: number;
};

export const CHART_RANGES: readonly ChartRange[] = [
  { labelKey: "charts.range60s", ageSeconds: 60, incrementSeconds: 5 },
  { labelKey: "charts.range10m", ageSeconds: 600, incrementSeconds: 5 },
  { labelKey: "charts.range1h", ageSeconds: 3600, incrementSeconds: 60 },
  { labelKey: "charts.range8h", ageSeconds: 28800, incrementSeconds: 600 },
  { labelKey: "charts.range24h", ageSeconds: 86400, incrementSeconds: 1800 },
] as const;

export type RangeQueryParams = {
  /** Parameter prefix, e.g. "data_rates" or "msg_rates" */
  prefix: string;
  ageSeconds: number;
  incrementSeconds: number;
};

/**
 * Build RabbitMQ range query parameters for a specific domain.
 * Connection detail uses data_rates; channels add msg_rates;
 * queues add lengths.
 */
export function buildRangeQueryParams(
  range: ChartRange,
  prefixes: readonly string[],
): URLSearchParams {
  const params = new URLSearchParams();
  for (const prefix of prefixes) {
    params.set(`${prefix}_age`, String(range.ageSeconds));
    params.set(`${prefix}_incr`, String(range.incrementSeconds));
  }
  return params;
}

/** Connection detail range parameter prefixes */
export const CONNECTION_RANGE_PREFIXES = ["data_rates"] as const;

/** Channel detail range parameter prefixes */
export const CHANNEL_RANGE_PREFIXES = ["data_rates", "msg_rates"] as const;

/** Queue detail only retains backlog length history. */
export const QUEUE_RANGE_PREFIXES = ["lengths"] as const;
