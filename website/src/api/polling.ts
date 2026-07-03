import type { Query } from "@tanstack/react-query";
import { ApiError } from "./api-error";

export function createPollingInterval(
  intervalMs: number,
  isEnabled: () => boolean = () => true,
) {
  return (query: Query<any, any, any, any>) => {
    if (
      !isEnabled() ||
      document.visibilityState !== "visible" ||
      !navigator.onLine
    ) {
      return false;
    }

    if (query?.state?.error instanceof ApiError && !query.state.error.retryable) {
      return false;
    }

    return intervalMs;
  };
}

export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.retryable && failureCount < 3;
  }
  return failureCount < 3;
}

export function getRetryDelay(failureCount: number, error: unknown): number {
  if (error instanceof ApiError && error.retryAfterMs !== undefined) {
    return error.retryAfterMs;
  }
  // Default network backoff: 1s, 2s, 4s...
  return Math.min(1000 * 2 ** failureCount, 30000);
}
