import { describe, expect, it } from "vitest";
import { buildNavigation } from "./navigation-registry";

describe("buildNavigation", () => {
  it("groups core destinations in stable order", () => {
    const groups = buildNavigation({
      userTags: ["monitoring"],
      extensions: [],
    });

    expect(groups.map((group) => group.id)).toEqual([
      "monitor",
      "topology",
    ]);
    expect(
      groups.flatMap((group) => group.items.map((item) => item.id)),
    ).toEqual([
      "overview",
      "nodes",
      "connections",
      "channels",
      "exchanges",
      "queues",
    ]);
  });

  it("shows administration only to allowed roles", () => {
    expect(
      buildNavigation({
        userTags: ["monitoring"],
        extensions: [],
      }).some((group) => group.id === "administration"),
    ).toBe(false);
    expect(
      buildNavigation({
        userTags: ["policymaker"],
        extensions: [],
      }).some((group) => group.id === "administration"),
    ).toBe(true);
    expect(
      buildNavigation({
        userTags: ["administrator"],
        extensions: [],
      }).some((group) => group.id === "administration"),
    ).toBe(true);
  });

  it("shows only available and permitted extensions", () => {
    const groups = buildNavigation({
      userTags: ["administrator"],
      extensions: [
        { javascript_src: "federation.js" },
        { javascript_src: "top.js" },
      ],
    });

    expect(
      groups
        .find((group) => group.id === "extensions")
        ?.items.map((item) => item.id),
    ).toEqual(["federation", "top"]);
  });

  it("does not expose an extension to a role that lacks access", () => {
    const groups = buildNavigation({
      userTags: ["management"],
      extensions: [{ javascript_src: "top.js" }],
    });

    expect(groups.some((group) => group.id === "extensions")).toBe(false);
  });

  it("filters extension children by their own access policy", () => {
    const monitoring = buildNavigation({
      userTags: ["monitoring"],
      extensions: [{ javascript_src: "federation.js" }],
    });
    const policymaker = buildNavigation({
      userTags: ["policymaker"],
      extensions: [{ javascript_src: "federation.js" }],
    });

    expect(monitoring.at(-1)?.items[0]?.children?.map((item) => item.id)).toEqual([
      "federation-status",
    ]);
    expect(policymaker.at(-1)?.items[0]?.children?.map((item) => item.id)).toEqual([
      "federation-status",
      "federation-upstreams",
    ]);
  });
});
