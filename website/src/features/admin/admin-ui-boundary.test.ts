import { describe, expect, it } from "vitest";

const adminUiSources = import.meta.glob(
  [
    "../users/*.{ts,tsx}",
    "../vhosts/*.{ts,tsx}",
    "../policies/*.{ts,tsx}",
    "../definitions/*.{ts,tsx}",
    "../deprecated-features/*.{ts,tsx}",
    "../feature-flags/*.{ts,tsx}",
  ],
  { eager: true, query: "?raw", import: "default" },
) as Record<string, string>;

describe("admin UI boundary", () => {
  it("uses typed shared page primitives instead of legacy page patterns", () => {
    for (const [path, source] of Object.entries(adminUiSources)) {
      expect(source, path).not.toMatch(
        /\bas any\b|\(\{ row \}: any\)|Error: \{|<h1|ResourcePageHeader/,
      );
    }
  });
});
