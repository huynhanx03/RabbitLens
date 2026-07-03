import { describe, it, expect } from "vitest";
import { federationLinkSchema, sanitizeFederationUri } from "./federation-schema";
import { mockFederationLinks } from "@/test/fixtures/extensions/federation";

describe("federationLinkSchema", () => {
  it("validates valid federation link responses", () => {
    mockFederationLinks.forEach((ff) => {
      const result = federationLinkSchema.safeParse(ff);
      expect(result.success).toBe(true);
    });
  });
});

describe("sanitizeFederationUri", () => {
  it("redacts passwords in standard amqp URIs", () => {
    expect(sanitizeFederationUri("amqp://user:secret123@host:5672/vhost")).toBe("amqp://user:***@host:5672/vhost");
  });

  it("redacts passwords in amqps URIs", () => {
    expect(sanitizeFederationUri("amqps://admin:password@rabbitmq.example.com/")).toBe("amqps://admin:***@rabbitmq.example.com/");
  });

  it("does not affect URIs without passwords", () => {
    expect(sanitizeFederationUri("amqp://host:5672/vhost")).toBe("amqp://host:5672/vhost");
  });

  it("handles malformed URIs gracefully by regex matching", () => {
    // some legacy plugin endpoints return non-standard URIs that new URL() fails to parse
    expect(sanitizeFederationUri("amqp://user:pass@host1,host2")).toBe("amqp://user:***@host1,host2");
  });
});
