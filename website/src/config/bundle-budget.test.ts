import { describe, expect, it } from "vitest";

describe("bundle budget manifest traversal", () => {
  it("collects and deduplicates the complete static import closure", async () => {
    // @ts-expect-error The Node build script intentionally has no TS declaration.
    const budgetModule = await import("../../scripts/verify-bundle-budget.mjs");
    const collectInitialJavaScriptFiles = (
      budgetModule as {
        collectInitialJavaScriptFiles?: (
          manifest: Record<string, unknown>,
          entryName: string,
        ) => string[];
      }
    ).collectInitialJavaScriptFiles;

    expect(collectInitialJavaScriptFiles).toBeTypeOf("function");
    if (!collectInitialJavaScriptFiles) return;

    const files = collectInitialJavaScriptFiles(
      {
        "index.html": {
          file: "assets/index.js",
          isEntry: true,
          imports: ["_shared.js", "_feature.js"],
        },
        "_shared.js": {
          file: "assets/shared.js",
          imports: ["_nested.js"],
        },
        "_feature.js": {
          file: "assets/feature.js",
          imports: ["_nested.js", "_nested-alias.js"],
        },
        "_nested.js": { file: "assets/nested.js" },
        "_nested-alias.js": { file: "assets/nested.js" },
        "styles.css": { file: "assets/index.css" },
      },
      "index.html",
    );

    expect(files).toEqual([
      "assets/index.js",
      "assets/shared.js",
      "assets/nested.js",
      "assets/feature.js",
    ]);
  });

  it("rejects a manifest without the application entry", async () => {
    // @ts-expect-error The Node build script intentionally has no TS declaration.
    const { collectInitialJavaScriptFiles } = await import("../../scripts/verify-bundle-budget.mjs");

    expect(() => collectInitialJavaScriptFiles({}, "index.html")).toThrow(
      "Missing JavaScript entry",
    );
  });
});
