import { describe, it, expect } from "vitest";
import {
  getAvailableExtensionNavigation,
  isExtensionInstalled,
  extensionRegistry,
} from "./extension-registry";

describe("Extension Registry", () => {
  const allMarkers = [
    { javascript: "dispatcher.js" },
    { javascript: "federation.js" },
    { javascript: "shovel.js" },
    { javascript: "stream.js" },
    { javascript: "top.js" },
    { javascript: "tracing.js" },
  ];

  const adminTags: string[] = ["administrator"];
  const monitoringTags: string[] = ["monitoring"];
  const noTags: string[] = [];

  it("resolves broker installation independently from user authorization", () => {
    expect(isExtensionInstalled("federation", allMarkers)).toBe(true);
    expect(isExtensionInstalled("top", allMarkers)).toBe(true);
  });

  it("returns false if marker is missing", () => {
    const markersWithoutTop = allMarkers.filter(m => m.javascript !== "top.js");
    expect(isExtensionInstalled("top", markersWithoutTop)).toBe(false);
  });

  it("getAvailableExtensionNavigation returns correctly filtered list", () => {
    const navAdmin = getAvailableExtensionNavigation(allMarkers, adminTags);
    expect(navAdmin.length).toBe(extensionRegistry.length);

    const navMonitoring = getAvailableExtensionNavigation(allMarkers, monitoringTags);
    expect(navMonitoring.map(n => n.id)).toEqual(["federation", "shovel", "streams"]);

    const navNoTags = getAvailableExtensionNavigation(allMarkers, noTags);
    expect(navNoTags.length).toBe(0);

    const navMissingPlugin = getAvailableExtensionNavigation([{ javascript: "federation.js" }], adminTags);
    expect(navMissingPlugin.map(n => n.id)).toEqual(["federation"]);
  });

  it("handles empty markers", () => {
    expect(isExtensionInstalled("federation", [])).toBe(false);
    expect(getAvailableExtensionNavigation([], adminTags).length).toBe(0);
  });

  it("uses a real route as each extension navigation target", () => {
    expect(
      Object.fromEntries(
        extensionRegistry.map(({ id, routePrefix }) => [id, routePrefix]),
      ),
    ).toEqual({
      federation: "/extensions/federation/status",
      shovel: "/extensions/shovels/status",
      streams: "/extensions/streams/connections",
      top: "/extensions/top",
      tracing: "/extensions/tracing",
    });
  });

  it("owns the complete child navigation for multi-surface extensions", () => {
    expect(
      Object.fromEntries(
        extensionRegistry.map(({ id, children }) => [
          id,
          children.map(({ route }) => route),
        ]),
      ),
    ).toEqual({
      federation: [
        "/extensions/federation/status",
        "/extensions/federation/upstreams",
      ],
      shovel: [
        "/extensions/shovels/status",
        "/extensions/shovels/management",
      ],
      streams: [
        "/extensions/streams/connections",
        "/extensions/streams/super-streams",
      ],
      top: ["/extensions/top", "/extensions/top/ets"],
      tracing: ["/extensions/tracing"],
    });
  });
});
