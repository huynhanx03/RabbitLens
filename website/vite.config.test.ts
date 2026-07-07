import { describe, expect, it } from "vitest";
import { CHUNK_SIZE_WARNING_LIMIT_KB, manualChunksForVendor } from "./vite.config";

describe("manualChunksForVendor", () => {
  it.each([
    ["/node_modules/react/index.js", "react-core"],
    ["/node_modules/react-dom/client.js", "react-core"],
    ["/node_modules/@tanstack/react-router/dist/index.js", "router"],
    ["/node_modules/@tanstack/react-query/build/index.js", "query"],
    ["/node_modules/lucide-react/dist/esm/icons/search.js", "ui-icons"],
    ["/node_modules/radix-ui/dist/index.js", "ui-vendor"],
    ["/node_modules/echarts/core.js", "echarts"],
    ["/node_modules/zrender/lib/core.js", "zrender"],
    ["/node_modules/oidc-client-ts/dist/browser.js", "oidc-client"],
  ])("places %s in %s", (id, chunk) => {
    expect(manualChunksForVendor(id)).toBe(chunk);
  });

  it("does not chunk application source explicitly", () => {
    expect(manualChunksForVendor("/src/features/overview/overview-page.tsx")).toBeUndefined();
  });

  it("keeps an explicit budget for the lazy chart chunk", () => {
    expect(CHUNK_SIZE_WARNING_LIMIT_KB).toBe(600);
  });
});
