import { describe, expect, it } from "vitest";
import { PRODUCT_DEFAULTS } from "./defaults";

describe("product defaults", () => {
  it("does not persist removed density and sidebar preferences", () => {
    expect(PRODUCT_DEFAULTS.persistenceKeys).not.toHaveProperty("tableDensity");
    expect(PRODUCT_DEFAULTS.persistenceKeys).not.toHaveProperty("sidebar");
    expect(PRODUCT_DEFAULTS).not.toHaveProperty("layout");
    expect(PRODUCT_DEFAULTS.tables).not.toHaveProperty("defaultDensity");
  });
});
