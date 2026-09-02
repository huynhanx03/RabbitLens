import { describe, it, expect, vi, beforeEach } from "vitest";
import { policyApi } from "./policy-api";
import { ManagementApiClient } from "@/api/management-api-client";
import { mockPolicies, mockOperatorPolicies } from "@/test/fixtures/policies";

describe("policyApi", () => {
  let client: ManagementApiClient;

  beforeEach(() => {
    client = {
      request: vi.fn(),
      requestVoid: vi.fn(),
    } as unknown as ManagementApiClient;
  });

  it("getPolicies calls GET /policies", async () => {
    vi.mocked(client.request).mockResolvedValueOnce(mockPolicies);
    const result = await policyApi.getPolicies(client);
    expect(client.request).toHaveBeenCalledWith("/policies", expect.any(Object));
    expect(result).toEqual(mockPolicies);
  });

  it("getOperatorPolicies calls GET /operator-policies", async () => {
    vi.mocked(client.request).mockResolvedValueOnce(mockOperatorPolicies);
    const result = await policyApi.getOperatorPolicies(client);
    expect(client.request).toHaveBeenCalledWith("/operator-policies", expect.any(Object));
    expect(result).toEqual(mockOperatorPolicies);
  });

  it("putPolicy calls PUT /policies/vhost/name", async () => {
    const body = {
      pattern: ".*",
      "apply-to": "all" as const,
      definition: {},
    };
    await policyApi.putPolicy(client, "/", "test", body);
    expect(client.requestVoid).toHaveBeenCalledWith("/policies/%2F/test", {
      method: "PUT",
      body: JSON.stringify(body),
    });
  });

  it("encodes vhost and name for normal and operator policy detail reads", async () => {
    vi.mocked(client.request).mockResolvedValue(mockPolicies[0]!);

    await policyApi.getPolicy(client, "/team a", "ha/policy");
    await policyApi.getOperatorPolicy(client, "/team a", "ha/policy");

    expect(client.request).toHaveBeenNthCalledWith(
      1,
      "/policies/%2Fteam%20a/ha%2Fpolicy",
      expect.any(Object),
    );
    expect(client.request).toHaveBeenNthCalledWith(
      2,
      "/operator-policies/%2Fteam%20a/ha%2Fpolicy",
      expect.any(Object),
    );
  });

  it("writes operator policies with the exact serialized RabbitMQ body", async () => {
    const body = {
      pattern: "^orders\\.",
      "apply-to": "queues" as const,
      definition: { "message-ttl": 30000 },
      priority: 10,
    };

    await policyApi.putOperatorPolicy(client, "/team a", "ttl/policy", body);

    expect(client.requestVoid).toHaveBeenCalledWith("/operator-policies/%2Fteam%20a/ttl%2Fpolicy", {
      method: "PUT",
      body: JSON.stringify(body),
    });
  });

  it("deletes normal and operator policies through their isolated endpoints", async () => {
    await policyApi.deletePolicy(client, "/team a", "ttl/policy");
    await policyApi.deleteOperatorPolicy(client, "/team a", "ttl/policy");

    expect(client.requestVoid).toHaveBeenNthCalledWith(1, "/policies/%2Fteam%20a/ttl%2Fpolicy", {
      method: "DELETE",
    });
    expect(client.requestVoid).toHaveBeenNthCalledWith(
      2,
      "/operator-policies/%2Fteam%20a/ttl%2Fpolicy",
      { method: "DELETE" },
    );
  });
});
