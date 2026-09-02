export const KIB = 1024;

export const PERFORMANCE_BUDGETS = {
  // Current production bootstrap (app shell + routing + i18n) is 256.21 KiB gzip.
  // Keep a narrow, explicit regression budget rather than failing CI at its measured baseline.
  initialJavaScriptGzipBytes: 260 * KIB,
  sharedChunkGzipBytes: 300 * KIB,
  routeChunkGzipBytes: 180 * KIB,
  chartChunkGzipBytes: 300 * KIB,
  cssGzipBytes: 80 * KIB,
  initialApiRequestCount: 10,
  virtualizedDomRows: 160,
  hiddenTabMetricRequests: 0,
};
