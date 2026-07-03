import { describe, expect, it } from "vitest";

const routes = import.meta.glob("../../app/routes/_authenticated/admin/route.tsx", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

describe("admin layout boundary", () => {
  it("delegates navigation to the shared sidebar without a duplicate tab bar", () => {
    const source = Object.values(routes).join("\n");
    expect(source).not.toMatch(/adminNav|<nav|routePrefix as any/);
  });
});
