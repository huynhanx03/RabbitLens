import assert from "node:assert/strict";
import test from "node:test";
import {
  addedLineNumbers,
  changedStatementCoverage,
  filterSourceFiles,
  mergeChangedFiles,
} from "./check-pr-coverage.mjs";

test("addedLineNumbers keeps only current-side changed lines", () => {
  assert.deepEqual([...addedLineNumbers("@@ -4,2 +4,3 @@\n same\n-old\n+new\n+another")], [5, 6]);
});

test("changedStatementCoverage measures only statements on changed lines", () => {
  assert.deepEqual(
    changedStatementCoverage(
      {
        statementMap: { 0: { start: { line: 4 } }, 1: { start: { line: 5 } } },
        s: { 0: 1, 1: 0 },
      },
      new Set([5]),
    ),
    { covered: 0, total: 1, percentage: 0 },
  );
});

test("filterSourceFiles keeps changed first-party production modules only", () => {
  assert.deepEqual(
    filterSourceFiles([
      "src/auth/login-form.tsx",
      "src/api/query-string.ts",
      "src/app/route-tree.gen.ts",
      "src/components/ui/button.tsx",
      "src/auth/login-form.test.tsx",
      "website/src/brand/brand-logo.tsx",
      "README.md",
    ]),
    ["src/auth/login-form.tsx", "src/api/query-string.ts", "src/brand/brand-logo.tsx"],
  );
});

test("mergeChangedFiles keeps an uncommitted source file once", () => {
  assert.deepEqual(
    mergeChangedFiles(
      ["src/auth/login-form.tsx"],
      ["src/auth/login-form.tsx", "src/brand/brand-logo.tsx"],
    ),
    ["src/auth/login-form.tsx", "src/brand/brand-logo.tsx"],
  );
});
