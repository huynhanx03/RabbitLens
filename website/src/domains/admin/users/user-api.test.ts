import { describe, it, expect, vi, beforeEach } from "vitest";
import { userApi } from "./user-api";
import { ManagementApiClient } from "@/api/management-api-client";
import { mockUsers } from "@/test/fixtures/users";

describe("userApi", () => {
  let client: ManagementApiClient;

  beforeEach(() => {
    client = {
      request: vi.fn(),
      requestVoid: vi.fn(),
    } as unknown as ManagementApiClient;
  });

  it("getUsers calls GET /users", async () => {
    vi.mocked(client.request).mockResolvedValueOnce(mockUsers);
    const result = await userApi.getUsers(client);
    expect(client.request).toHaveBeenCalledWith("/users", expect.any(Object));
    expect(result).toEqual(mockUsers);
  });

  it("getUser calls GET /users/:name", async () => {
    vi.mocked(client.request).mockResolvedValueOnce(mockUsers[0]);
    const result = await userApi.getUser(client, "guest");
    expect(client.request).toHaveBeenCalledWith("/users/guest", expect.any(Object));
    expect(result).toEqual(mockUsers[0]);
  });

  it("putUser calls PUT /users/:name with body", async () => {
    await userApi.putUser(client, "new-user", { tags: "administrator" });
    expect(client.requestVoid).toHaveBeenCalledWith("/users/new-user", {
      method: "PUT",
      body: JSON.stringify({ tags: "administrator" }),
    });
  });

  it("deleteUser calls DELETE /users/:name", async () => {
    await userApi.deleteUser(client, "old-user");
    expect(client.requestVoid).toHaveBeenCalledWith("/users/old-user", {
      method: "DELETE",
    });
  });

  it("deletes one topic permission with the exchange in the path", async () => {
    await userApi.deleteUserTopicPermission(
      client,
      "service user",
      "/",
      "amq.topic",
    );

    expect(client.requestVoid).toHaveBeenCalledWith(
      "/topic-permissions/%2F/service%20user/amq.topic",
      { method: "DELETE" },
    );
  });
});
