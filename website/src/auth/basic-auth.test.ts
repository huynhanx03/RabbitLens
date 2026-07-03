import { describe, expect, it } from "vitest";
import { createBasicAuthorization } from "./basic-auth";

describe("createBasicAuthorization", () => {
  it("creates a standard Basic authorization value", () => {
    expect(createBasicAuthorization("guest", "guest")).toBe(
      "Basic Z3Vlc3Q6Z3Vlc3Q=",
    );
  });

  it("encodes Unicode credentials as UTF-8", () => {
    expect(createBasicAuthorization("người", "mật-khẩu")).toBe(
      "Basic bmfGsOG7nWk6beG6rXQta2jhuql1",
    );
  });
});
