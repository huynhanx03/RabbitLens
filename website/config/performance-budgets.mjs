export const KIB = 1024;

export const PERFORMANCE_BUDGETS = {
  // Current production bootstrap (app shell + routing + i18n) is 263.11 KiB gzip
  // after the compatible dependency security updates. Keep about 3.9 KiB of regression headroom.
  initialJavaScriptGzipBytes: 267 * KIB,
  sharedChunkGzipBytes: 300 * KIB,
  routeChunkGzipBytes: 180 * KIB,
  chartChunkGzipBytes: 300 * KIB,
  cssGzipBytes: 80 * KIB,
  initialApiRequestCount: 10,
  virtualizedDomRows: 160,
  hiddenTabMetricRequests: 0,
};
