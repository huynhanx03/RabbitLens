import { describe, it, expect } from "vitest";
import { vhostSchema, vhostBodySchema } from "./vhost-schema";
import { mockVhosts } from "@/test/fixtures/vhosts";

describe("vhostSchema", () => {
  it("validates valid vhost responses", () => {
    mockVhosts.forEach((vhost) => {
      const result = vhostSchema.safeParse(vhost);
      expect(result.success).toBe(true);
    });
  });

  it("fails on missing name", () => {
    const result = vhostSchema.safeParse({ description: "No name" });
    expect(result.success).toBe(false);
  });
});

describe("vhostBodySchema", () => {
  it("validates valid creation bodies", () => {
    const body = {
      description: "My vhost",
      tags: ["production"],
      default_queue_type: "quorum",
      tracing: true,
    };
    const result = vhostBodySchema.safeParse(body);
    expect(result.success).toBe(true);
  });

  it("allows empty objects", () => {
    const result = vhostBodySchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
