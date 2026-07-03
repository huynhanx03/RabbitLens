/// <reference types="node" />

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(
  resolve(process.cwd(), "src/styles/tokens.css"),
  "utf8",
);

describe("design token contract", () => {
  it.each([
    "--surface-elevated",
    "--border-interactive",
    "--shadow-card",
    "--shadow-overlay",
    "--app-sidebar-width",
    "--app-sidebar-width-collapsed",
    "--app-sidebar-width-mobile",
    "--page-gutter",
    "--table-row-height",
  ])("defines %s", (token) => {
    expect(css).toContain(token);
  });

  it("uses one fixed table density", () => {
    expect(css).not.toContain("data-density");
    expect(css).toMatch(/--table-row-height:\s*2\.75rem/);
  });

  it("keeps reduced-motion protection", () => {
    expect(css).toContain("prefers-reduced-motion: reduce");
  });
});
