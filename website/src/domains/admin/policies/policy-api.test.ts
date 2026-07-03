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
    await policyApi.putPolicy(client, "/", "test", { pattern: ".*", "apply-to": "all", definition: {} });
    expect(client.requestVoid).toHaveBeenCalledWith("/policies/%2F/test", {
      method: "PUT",
      body: expect.any(String),
    });
  });
});
