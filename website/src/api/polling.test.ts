import { afterEach, describe, expect, it } from "vitest";
import { createPollingInterval } from "./polling";

const originalVisibilityState = Object.getOwnPropertyDescriptor(
  document,
  "visibilityState",
);
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
});
