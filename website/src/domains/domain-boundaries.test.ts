import { describe, expect, it } from "vitest";

const domainSources = import.meta.glob(
  [
    "./overview/*.{ts,tsx}",
    "./extensions/*.{ts,tsx}",
    "./connections/*.{ts,tsx}",
    "./channels/*.{ts,tsx}",
  ],
  { eager: true, query: "?raw", import: "default" },
) as Record<string, string>;

const legacyOverviewSources = import.meta.glob(
  ["../features/overview/overview-api.ts", "../features/overview/overview-query.ts"],
  { eager: true, query: "?raw", import: "default" },
) as Record<string, string>;

const legacyConnectionDataSources = import.meta.glob(
  [
    "../features/connections/connection-api.ts",
    "../features/connections/connection-query.ts",
    "../features/connections/connection-schema.ts",
    "../features/connections/connection-view-model.ts",
  ],
  { eager: true, query: "?raw", import: "default" },
) as Record<string, string>;

const apiHookSources = import.meta.glob("../api/hooks.ts", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

const uiOwnedDataSources = import.meta.glob(
  ["../features/**/*-api.ts", "../features/**/*-query.ts", "../features/**/*-schema.ts"],
  { eager: true, query: "?raw", import: "default" },
) as Record<string, string>;

const legacySharedEntitySources = import.meta.glob(
  [
    "../features/consumers/consumer-table.tsx",
    "../features/channels/channel-columns.tsx",
    "../features/streams/stream-publisher-table.tsx",
    "../features/bindings/binding-columns.tsx",
    "../features/bindings/binding-list.tsx",
    "../features/bindings/create-binding-dialog.tsx",
    "../features/exchanges/publish-message-dialog.tsx",
  ],
  { eager: true, query: "?raw", import: "default" },
) as Record<string, string>;

describe("data-domain boundaries", () => {
  it("owns Overview and Extensions data contracts outside UI features", () => {
    expect(Object.keys(domainSources)).toEqual(
      expect.arrayContaining([
        "./overview/overview-api.ts",
        "./overview/overview-query.ts",
        "./extensions/extension-api.ts",
        "./extensions/extension-query.ts",
      ]),
    );
  });

  it("owns Connections data contracts outside UI features", () => {
    expect(Object.keys(domainSources)).toEqual(
      expect.arrayContaining([
        "./connections/connection-api.ts",
        "./connections/connection-query.ts",
        "./connections/connection-schema.ts",
        "./connections/connection-view-model.ts",
      ]),
    );
    expect(Object.keys(legacyConnectionDataSources)).toEqual([]);
  });

  it("owns Channels data contracts outside UI features", () => {
    expect(Object.keys(domainSources)).toEqual(
      expect.arrayContaining([
        "./channels/channel-api.ts",
        "./channels/channel-query.ts",
        "./channels/channel-schema.ts",
        "./channels/channel-view-model.ts",
      ]),
    );
  });

  it("keeps shared UI independent from domain and transport clients", () => {
    const sharedSources = import.meta.glob("../components/shared/*.{ts,tsx}", {
      eager: true,
      query: "?raw",
      import: "default",
    }) as Record<string, string>;

    for (const [path, source] of Object.entries(sharedSources)) {
      expect(source, path).not.toMatch(/ManagementApiClient|@\/domains\//);
    }
  });

  it("removes global resource hooks and UI-owned Overview data files", () => {
    expect(Object.keys(apiHookSources)).toEqual([]);
    expect(Object.keys(legacyOverviewSources)).toEqual([]);
  });

  it("keeps transport, query, and response schemas out of UI features", () => {
    expect(Object.keys(uiOwnedDataSources)).toEqual([]);
  });

  it("keeps reusable entity presentation with its RabbitMQ domain", () => {
    expect(Object.keys(legacySharedEntitySources)).toEqual([]);
    expect(Object.keys(domainSources)).toEqual(
      expect.arrayContaining(["./channels/channel-columns.tsx", "./connections/connection-api.ts"]),
    );
    expect(
      Object.keys(
        import.meta.glob(
          [
            "./consumers/consumer-table.tsx",
            "./bindings/binding-columns.tsx",
            "./bindings/binding-list.tsx",
            "./bindings/create-binding-dialog.tsx",
            "./exchanges/publish-message-dialog.tsx",
            "./extensions/streams/stream-publisher-table.tsx",
          ],
          { eager: true },
        ),
      ),
    ).toHaveLength(6);
  });

  it("keeps screen features independent from sibling features", () => {
    const featureSources = import.meta.glob("../features/**/*.{ts,tsx}", {
      eager: true,
      query: "?raw",
      import: "default",
    }) as Record<string, string>;

    for (const [file, source] of Object.entries(featureSources)) {
      expect(source, file).not.toMatch(/from ["']@\/features\//);
      expect(source, file).not.toMatch(/from ["']\.\.\//);
    }
  });
});
