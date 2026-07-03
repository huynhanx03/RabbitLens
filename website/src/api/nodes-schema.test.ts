import { describe, expect, it } from "vitest";
import { nodeSchema, nodesSchema } from "./nodes-schema";

describe("Nodes Schema", () => {
  const mockNode = {
    name: "rabbit@localhost",
    type: "disc",
    running: true,
    uptime: 123456,
    fd_used: 25,
    fd_total: 1024,
    sockets_used: 10,
    sockets_total: 829,
    mem_used: 536870912, // 512 MB
    mem_limit: 1073741824, // 1 GB
    disk_free: 53687091200, // 50 GB
    disk_free_limit: 53687091, // 50 MB
  };

  it("parses a valid node object", () => {
    const parsed = nodeSchema.parse(mockNode);
    expect(parsed.name).toBe("rabbit@localhost");
    expect(parsed.uptime).toBe(123456);
  });

  it("parses a valid nodes array", () => {
    const parsed = nodesSchema.parse([mockNode]);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].name).toBe("rabbit@localhost");
  });
});
