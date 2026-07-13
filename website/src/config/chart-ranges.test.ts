import { describe, expect, it } from "vitest";
import {
  buildRangeQueryParams,
  CHART_RANGES,
  CONNECTION_RANGE_PREFIXES,
  CHANNEL_RANGE_PREFIXES,
  QUEUE_RANGE_PREFIXES,
} from "./chart-ranges";

describe("CHART_RANGES", () => {
  it("defines 5 ranges from 60s to 24h", () => {
    expect(CHART_RANGES).toHaveLength(5);
    expect(CHART_RANGES[0].ageSeconds).toBe(60);
    expect(CHART_RANGES[4].ageSeconds).toBe(86400);
  });
});

describe("buildRangeQueryParams", () => {
  const range60s = CHART_RANGES[0];

  it("builds connection range parameters", () => {
    const params = buildRangeQueryParams(range60s, CONNECTION_RANGE_PREFIXES);
    expect(params.get("data_rates_age")).toBe("60");
    expect(params.get("data_rates_incr")).toBe("5");
    expect(params.has("msg_rates_age")).toBe(false);
  });

  it("builds channel range parameters with msg_rates", () => {
    const params = buildRangeQueryParams(range60s, CHANNEL_RANGE_PREFIXES);
    expect(params.get("data_rates_age")).toBe("60");
    expect(params.get("msg_rates_age")).toBe("60");
    expect(params.get("msg_rates_incr")).toBe("5");
  });

  it("builds queue range parameters with lengths only", () => {
    const params = buildRangeQueryParams(range60s, QUEUE_RANGE_PREFIXES);
    expect(params.get("lengths_age")).toBe("60");
    expect(params.get("lengths_incr")).toBe("5");
    expect(params.has("data_rates_age")).toBe(false);
    expect(params.has("msg_rates_age")).toBe(false);
  });
});
