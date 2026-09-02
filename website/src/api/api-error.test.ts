import { describe, expect, it } from "vitest";
import { ApiError } from "./api-error";

describe("ApiError", () => {
  it("preserves management API classification, retry policy and retry hint", () => {
    const error = new ApiError("timeout", 504, true, "RabbitMQ timed out", 2_500);

    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({
      name: "ApiError",
      kind: "timeout",
      status: 504,
      retryable: true,
      message: "RabbitMQ timed out",
      retryAfterMs: 2_500,
    });
  });

  it("keeps client-side errors valid without an HTTP response", () => {
    const error = new ApiError("network", undefined, false, "Connection refused");
    expect(error.status).toBeUndefined();
    expect(error.retryAfterMs).toBeUndefined();
    expect(error.retryable).toBe(false);
  });
});
