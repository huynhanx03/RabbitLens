import type { ManagementApiClient } from "@/api/management-api-client";
import { policySchema, type PolicyBody, type PolicyResponse } from "./policy-schema";
import * as z from "zod";

export const policyApi = {
  getPolicies: async (client: ManagementApiClient): Promise<PolicyResponse[]> => {
    return client.request("/policies", z.array(policySchema));
  },

  getOperatorPolicies: async (client: ManagementApiClient): Promise<PolicyResponse[]> => {
    return client.request("/operator-policies", z.array(policySchema));
  },

  getPolicy: async (client: ManagementApiClient, vhost: string, name: string): Promise<PolicyResponse> => {
    return client.request(`/policies/${encodeURIComponent(vhost)}/${encodeURIComponent(name)}`, policySchema);
  },

  getOperatorPolicy: async (client: ManagementApiClient, vhost: string, name: string): Promise<PolicyResponse> => {
    return client.request(`/operator-policies/${encodeURIComponent(vhost)}/${encodeURIComponent(name)}`, policySchema);
  },

  putPolicy: async (
    client: ManagementApiClient,
    vhost: string,
    name: string,
    body: PolicyBody
  ): Promise<void> => {
    await client.requestVoid(`/policies/${encodeURIComponent(vhost)}/${encodeURIComponent(name)}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  putOperatorPolicy: async (
    client: ManagementApiClient,
    vhost: string,
    name: string,
    body: PolicyBody
  ): Promise<void> => {
    await client.requestVoid(`/operator-policies/${encodeURIComponent(vhost)}/${encodeURIComponent(name)}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  deletePolicy: async (client: ManagementApiClient, vhost: string, name: string): Promise<void> => {
    await client.requestVoid(`/policies/${encodeURIComponent(vhost)}/${encodeURIComponent(name)}`, {
      method: "DELETE",
    });
  },

  deleteOperatorPolicy: async (client: ManagementApiClient, vhost: string, name: string): Promise<void> => {
    await client.requestVoid(`/operator-policies/${encodeURIComponent(vhost)}/${encodeURIComponent(name)}`, {
      method: "DELETE",
    });
  },
};
