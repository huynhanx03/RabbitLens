import { describe, it, expect } from "vitest";
import { userSchema, userBodySchema, permissionSchema } from "./user-schema";
import { mockUsers, mockPermissions } from "@/test/fixtures/users";

describe("userSchema", () => {
  it("validates valid user responses", () => {
    mockUsers.forEach((user) => {
      const result = userSchema.safeParse(user);
      expect(result.success).toBe(true);
    });
  });
});

describe("userBodySchema", () => {
  it("validates valid creation bodies", () => {
    const body = {
      password: "pass",
      tags: "administrator, monitoring",
    };
    const result = userBodySchema.safeParse(body);
    expect(result.success).toBe(true);
  });
});

describe("permissionSchema", () => {
  it("validates valid permission responses", () => {
    mockPermissions.forEach((perm) => {
      const result = permissionSchema.safeParse(perm);
      expect(result.success).toBe(true);
    });
  });
});
