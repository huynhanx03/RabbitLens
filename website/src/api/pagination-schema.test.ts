import { describe, expect, it } from "vitest";
import { resourceListSearchSchema } from "./pagination-schema";

describe("resourceListSearchSchema", () => {
  it("applies sensible defaults for missing values", () => {
    const result = resourceListSearchSchema.parse({});
    expect(result).toEqual({
      page: 1,
      pageSize: 100,
      name: "",
      useRegex: false,
      sortReverse: false,
    });
  });

  it("coerces string numbers", () => {
    const result = resourceListSearchSchema.parse({
      page: "3",
      pageSize: "50",
    });
    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(50);
  });

  it("clamps page to minimum 1", () => {
    expect(resourceListSearchSchema.parse({ page: -5 }).page).toBe(1);
    expect(resourceListSearchSchema.parse({ page: 0 }).page).toBe(1);
  });

  it("clamps pageSize to maximum 500", () => {
    expect(resourceListSearchSchema.parse({ pageSize: 999 }).pageSize).toBe(100);
  });

  it("preserves optional sort and vhost when provided", () => {
    const result = resourceListSearchSchema.parse({
      sort: "name",
      vhost: "/",
    });
    expect(result.sort).toBe("name");
    expect(result.vhost).toBe("/");
  });

  it("leaves sort and vhost undefined when not provided", () => {
    const result = resourceListSearchSchema.parse({});
    expect(result.sort).toBeUndefined();
    expect(result.vhost).toBeUndefined();
  });
});
