import { describe, it, expect } from "vitest";
import { verifyManifest } from "../../scripts/verify-parity.mjs";

const existingFiles = new Set([
  "dispatcher.js",
  "src/app/routes/test.tsx",
  "src/features/test-page.tsx",
  "tests/e2e/parity.spec.ts",
]);

const options = {
  existsSync: (file: string) => existingFiles.has(file),
};

function covered(overrides: Record<string, unknown> = {}) {
  return {
    sourceKey: "overview",
    sourceFile: "dispatcher.js",
    sourceRouteOrAction: "#/",
    apiMethod: "GET",
    apiPath: "/api/overview",
    rabbitLensRoute: "/",
    routeModule: "src/app/routes/test.tsx",
    uiSurface: "Overview dashboard",
    permission: "monitoring or management tag",
    implementationFiles: ["src/features/test-page.tsx"],
    compatibility:
      "Typed optional fields preserve compatibility with RabbitMQ Management API responses.",
    capability: "read",
    evidence: ["tests/e2e/parity.spec.ts"],
    status: "covered",
    requiredTags: ["monitoring"],
    requiredExtensions: [],
    ...overrides,
  };
}

describe("verifyManifest", () => {
  it("passes valid manifest", () => {
    const manifest = [covered()];
    const {
      errors,
      covered: coveredCount,
      excluded,
    } = verifyManifest(manifest, options);
    expect(errors).toHaveLength(0);
    expect(coveredCount).toBe(1);
    expect(excluded).toBe(0);
  });

  it("fails on duplicate sourceKey", () => {
    const manifest = [
      {
        sourceKey: "test",
        status: "covered",
        evidence: ["test"],
        rabbitLensRoute: "/test",
      },
      {
        sourceKey: "test",
        status: "covered",
        evidence: ["test"],
        rabbitLensRoute: "/test",
      },
    ];
    const { errors } = verifyManifest(manifest, options);
    expect(errors).toContain("Duplicate sourceKey: test");
  });

  it("fails on missing evidence for covered", () => {
    const manifest = [
      { sourceKey: "test", status: "covered", rabbitLensRoute: "/test" },
    ];
    const { errors } = verifyManifest(manifest, options);
    expect(errors).toContain("Missing evidence for covered entry: test");
  });

  it("fails on missing route for covered", () => {
    const manifest = [
      { sourceKey: "test", status: "covered", evidence: ["test"] },
    ];
    const { errors } = verifyManifest(manifest, options);
    expect(errors).toContain("Missing rabbitLensRoute for covered entry: test");
  });

  it("fails on missing exclusion reason", () => {
    const manifest = [
      { sourceKey: "test", status: "checked-source-exclusion" },
    ];
    const { errors } = verifyManifest(manifest, options);
    expect(errors).toContain(
      "Missing exclusionReason for excluded entry: test",
    );
  });

  it("fails on invalid status", () => {
    const manifest = [{ sourceKey: "test", status: "partial" }];
    const { errors } = verifyManifest(manifest, options);
    expect(errors).toContain("Invalid status for entry: test");
  });

  it.each([
    ["sourceFile", "Missing sourceFile for covered entry: overview"],
    [
      "sourceRouteOrAction",
      "Missing sourceRouteOrAction for covered entry: overview",
    ],
    ["apiMethod", "Missing apiMethod for covered entry: overview"],
    ["apiPath", "Missing apiPath for covered entry: overview"],
    ["uiSurface", "Missing uiSurface for covered entry: overview"],
    ["permission", "Missing permission for covered entry: overview"],
    [
      "implementationFiles",
      "Missing implementationFiles for covered entry: overview",
    ],
    ["compatibility", "Missing compatibility for covered entry: overview"],
    ["routeModule", "Missing routeModule for covered entry: overview"],
    ["capability", "Missing capability for covered entry: overview"],
  ])("fails when %s is missing", (field, expectedError) => {
    const entry = covered();
    delete entry[field as keyof typeof entry];
    expect(verifyManifest([entry], options).errors).toContain(expectedError);
  });

  it("fails when declared source, route, or evidence files do not exist", () => {
    const entry = covered({
      sourceFile: "missing-source.js",
      routeModule: "missing-route.tsx",
      implementationFiles: ["missing-implementation.tsx"],
      evidence: ["missing-evidence.spec.ts"],
    });

    expect(verifyManifest([entry], options).errors).toEqual(
      expect.arrayContaining([
        "Source file not found for covered entry: overview",
        "Route module not found for covered entry: overview",
        "Implementation file not found for covered entry: overview (missing-implementation.tsx)",
        "Evidence file not found for covered entry: overview (missing-evidence.spec.ts)",
      ]),
    );
  });

  it("fails on invalid apiMethod", () => {
    expect(
      verifyManifest([covered({ apiMethod: "PATCH" })], options).errors,
    ).toContain("Invalid apiMethod for covered entry: overview");
  });

  it("fails on duplicate route capability coverage", () => {
    const manifest = [
      covered({ sourceKey: "first" }),
      covered({ sourceKey: "second" }),
    ];

    expect(verifyManifest(manifest, options).errors).toContain(
      "Duplicate route capability: /:read",
    );
  });
});
