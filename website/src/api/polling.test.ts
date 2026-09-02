import { afterEach, describe, expect, it } from "vitest";
import { ApiError } from "./api-error";
import { createPollingInterval, getRetryDelay, shouldRetry } from "./polling";

const originalVisibilityState = Object.getOwnPropertyDescriptor(document, "visibilityState");
const originalOnLine = Object.getOwnPropertyDescriptor(navigator, "onLine");

function setVisibilityState(value: DocumentVisibilityState) {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value,
  });
}

function setOnline(value: boolean) {
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value,
  });
}

afterEach(() => {
  if (originalVisibilityState) {
    Object.defineProperty(document, "visibilityState", originalVisibilityState);
  }
  if (originalOnLine) {
    Object.defineProperty(navigator, "onLine", originalOnLine);
  }
});

describe("createPollingInterval", () => {
  it("returns the interval only while polling is enabled and the page is active", () => {
    setVisibilityState("visible");
    setOnline(true);

    expect(createPollingInterval(5_000, () => true)({} as any)).toBe(5_000);
    expect(createPollingInterval(5_000, () => false)({} as any)).toBe(false);
  });

  it("pauses while the document is hidden or the browser is offline", () => {
    setVisibilityState("hidden");
    setOnline(true);
    expect(createPollingInterval(5_000, () => true)({} as any)).toBe(false);

    setVisibilityState("visible");
    setOnline(false);
    expect(createPollingInterval(5_000, () => true)({} as any)).toBe(false);
  });

  it("stops polling after a non-retryable API error", () => {
    setVisibilityState("visible");
    setOnline(true);
    const error = new ApiError("forbidden", 403, false, "Forbidden");

    expect(createPollingInterval(5_000)({ state: { error } } as any)).toBe(false);
  });
});

describe("retry policies", () => {
  it("retries network and retryable API errors at most three times", () => {
    expect(shouldRetry(0, new Error("offline"))).toBe(true);
    expect(shouldRetry(2, new ApiError("server", 503, true, "Unavailable"))).toBe(true);
    expect(shouldRetry(3, new Error("offline"))).toBe(false);
    expect(shouldRetry(0, new ApiError("forbidden", 403, false, "Forbidden"))).toBe(false);
  });

  it("honours RabbitMQ retry-after values and bounds exponential backoff", () => {
    expect(getRetryDelay(0, new Error("offline"))).toBe(1_000);
    expect(getRetryDelay(2, new Error("offline"))).toBe(4_000);
    expect(getRetryDelay(10, new Error("offline"))).toBe(30_000);
    expect(getRetryDelay(0, new ApiError("server", 503, true, "Busy", 7_500))).toBe(7_500);
  });
});
