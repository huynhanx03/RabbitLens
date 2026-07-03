import { describe, expect, it } from "vitest";
import { buildListQuery, isValidRegex, withQuery } from "./query-string";

describe("isValidRegex", () => {
  it("accepts valid patterns", () => {
    expect(isValidRegex("orders.*")).toBe(true);
    expect(isValidRegex("^amq\\.")).toBe(true);
    expect(isValidRegex("")).toBe(true);
  });

  it("rejects invalid patterns", () => {
    expect(isValidRegex("[invalid")).toBe(false);
    expect(isValidRegex("(unclosed")).toBe(false);
  });
});

describe("buildListQuery", () => {
  it("produces the correct query string with all fields", () => {
    expect(
      buildListQuery({
        page: 2,
        pageSize: 100,
        name: "orders.*",
        useRegex: true,
        sort: "name",
        sortReverse: false,
        vhost: "/",
      }),
    ).toBe(
      "page=2&page_size=100&name=orders.*&use_regex=true&sort=name&sort_reverse=false&vhost=%2F",
    );
  });

  it("omits name-related params when name is empty", () => {
    const qs = buildListQuery({
      page: 1,
      pageSize: 100,
      name: "",
      useRegex: false,
      sortReverse: false,
    });
    expect(qs).toBe("page=1&page_size=100");
    expect(qs).not.toContain("name=");
    expect(qs).not.toContain("use_regex");
  });

  it("omits sort when undefined", () => {
    const qs = buildListQuery({
      page: 1,
      pageSize: 100,
      name: "",
      useRegex: false,
      sortReverse: false,
    });
    expect(qs).not.toContain("sort=");
    expect(qs).not.toContain("sort_reverse=");
  });

  it("omits vhost when undefined", () => {
    const qs = buildListQuery({
      page: 1,
      pageSize: 100,
      name: "",
      useRegex: false,
      sortReverse: false,
    });
    expect(qs).not.toContain("vhost=");
  });

  it("falls back to literal match for invalid regex", () => {
    const qs = buildListQuery({
      page: 1,
      pageSize: 100,
      name: "[invalid",
      useRegex: true,
      sortReverse: false,
    });
    expect(qs).toContain("name=%5Binvalid");
    expect(qs).toContain("use_regex=false");
  });

  it("URL-encodes the vhost /", () => {
    const qs = buildListQuery({
      page: 1,
      pageSize: 100,
      name: "",
      useRegex: false,
      sortReverse: false,
      vhost: "/",
    });
    expect(qs).toContain("vhost=%2F");
  });
});

describe("withQuery", () => {
  it("appends query to path", () => {
    expect(withQuery("/connections", "page=1")).toBe("/connections?page=1");
  });

  it("returns path unchanged when query is empty", () => {
    expect(withQuery("/connections", "")).toBe("/connections");
  });
});
