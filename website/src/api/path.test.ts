import { describe, expect, it } from "vitest";
import { apiPath } from "./path";

describe("apiPath", () => {
  it("encodes each RabbitMQ resource as one complete path segment", () => {
    expect(apiPath("nodes", "rabbit@node/a")).toBe(
      "/nodes/rabbit%40node%2Fa",
    );
    expect(apiPath("vhosts", "/")).toBe("/vhosts/%2F");
  });

  it("omits empty structural segments", () => {
    expect(apiPath("", "nodes", "")).toBe("/nodes");
  });
});
