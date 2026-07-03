import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const auditedFiles = [
  "src/auth/permissions/permission-gate.tsx",
  "src/domains/admin/deprecated-features/deprecated-feature-api.ts",
  "src/domains/queues/queue-api.ts",
  "src/features/bindings/binding-columns.tsx",
  "src/features/connections/connection-detail-page.tsx",
  "src/features/exchanges/exchange-list-page.tsx",
  "src/features/queues/delete-queue-dialog.tsx",
  "src/features/queues/get-messages-dialog.tsx",
  "src/features/queues/queue-detail-page.tsx",
  "src/features/queues/queue-list-page.tsx",
] as const;

describe("production type boundary", () => {
  it.each(auditedFiles)("keeps %s free of escape casts", (file) => {
    const source = readFileSync(resolve(process.cwd(), file), "utf8");

    expect(source, file).not.toMatch(/\bas any\b|:\s*any\b/);
  });

  it.each([
    "src/domains/connections/connection-schema.ts",
    "src/domains/bindings/binding-schema.ts",
    "src/domains/extensions/shovels/shovel-schema.ts",
    "src/features/bindings/create-binding-dialog.tsx",
    "src/features/exchanges/create-exchange-dialog.tsx",
    "src/features/exchanges/publish-message-dialog.tsx",
    "src/features/queues/create-queue-dialog.tsx",
    "src/domains/admin/vhosts/vhost-schema.ts",
    "src/domains/admin/users/user-schema.ts",
    "src/domains/admin/policies/policy-schema.ts",
    "src/domains/admin/feature-flags/feature-flag-schema.ts",
    "src/domains/admin/deprecated-features/deprecated-feature-schema.ts",
    "src/domains/exchanges/exchange-schema.ts",
    "src/domains/extensions/federation/federation-schema.ts",
  ])("keeps %s free of untyped Zod values", (file) => {
    const source = readFileSync(resolve(process.cwd(), file), "utf8");

    expect(source, file).not.toContain("z.any(");
  });
});
