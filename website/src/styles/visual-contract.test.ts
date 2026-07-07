/// <reference types="node" />

import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sourceRoot = resolve(process.cwd(), "src");

function readSourceFiles(pattern: string) {
  const root = resolve(sourceRoot, pattern);
  const files: string[] = [];

  function walk(directory: string) {
    for (const entry of readdirSync(directory)) {
      const path = join(directory, entry);
      if (statSync(path).isDirectory()) {
        walk(path);
        continue;
      }
      if ([".ts", ".tsx"].includes(extname(path))) {
        files.push(path);
      }
    }
  }

  walk(root);

  return files.map((path) => ({
    path,
    label: relative(sourceRoot, path),
    source: readFileSync(path, "utf8"),
  }));
}

describe("visual system contract", () => {
  it("keeps accent tokens for interaction states instead of warning states", () => {
    const tokens = readFileSync(resolve(sourceRoot, "styles/tokens.css"), "utf8");

    expect(tokens).not.toContain("--accent: #fef3c7");
    expect(tokens).not.toContain("--accent-foreground: #92400e");
    expect(tokens).not.toContain("--accent: rgba(245, 158, 11, 0.16)");
    expect(tokens).not.toContain("--accent-foreground: #fcd34d");
  });

  it("flattens nested action strips inside page toolbars", () => {
    const tokens = readFileSync(resolve(sourceRoot, "styles/tokens.css"), "utf8");

    expect(tokens).toContain(".rl-toolbar .rl-action-strip");
    expect(tokens).toContain("box-shadow: none");
    expect(tokens).toContain("background: transparent");
  });


  it("does not pass CSS variable expressions directly to chart renderers", () => {
    const invalidChartTokenExpression = "hsl" + "(var(--";
    const offenders = readSourceFiles(".")
      .filter(({ label }) => label.includes("chart"))
      .filter(({ source }) => source.includes(invalidChartTokenExpression));

    expect(offenders.map(({ label }) => label)).toEqual([]);
  });

  it("keeps shared components on semantic color tokens", () => {
    const disallowedPaletteClass =
      /\b(?:bg|text|border|ring|shadow)-(?:amber|orange|violet|purple|green|red|blue|slate|gray|zinc|neutral)-\d{2,3}\b/;
    const offenders = readSourceFiles(join("components", "shared"))
      .filter(({ source }) => disallowedPaletteClass.test(source))
      .map(({ label }) => label);

    expect(offenders).toEqual([]);
  });

  it("keeps feature surfaces on semantic color tokens", () => {
    const disallowedPaletteClass =
      /\b(?:bg|text|border|ring|shadow)-(?:amber|orange|violet|purple|green|red|blue|slate|gray|zinc|neutral)-\d{2,3}\b/;
    const offenders = readSourceFiles("features")
      .filter(({ label }) => !label.endsWith(".test.tsx"))
      .filter(({ source }) => disallowedPaletteClass.test(source))
      .map(({ label }) => label);

    expect(offenders).toEqual([]);
  });
});
