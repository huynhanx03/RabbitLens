import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import prettier from "prettier";

export const COVERAGE_THRESHOLD = 85;

export function addedLineNumbers(unifiedDiff) {
  const lines = new Set();
  let currentLine = null;
  for (const line of unifiedDiff.split("\n")) {
    const header = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(line);
    if (header) {
      currentLine = Number(header[1]);
      continue;
    }
    if (currentLine === null || line.startsWith("+++")) continue;
    if (line.startsWith("+")) {
      lines.add(currentLine);
      currentLine += 1;
    } else if (!line.startsWith("-")) {
      currentLine += 1;
    }
  }
  return lines;
}

export function changedStatementCoverage(fileCoverage, changedLines) {
  let covered = 0;
  let total = 0;
  for (const [id, location] of Object.entries(fileCoverage.statementMap ?? {})) {
    if (!changedLines.has(location.start.line)) continue;
    total += 1;
    if ((fileCoverage.s?.[id] ?? 0) > 0) covered += 1;
  }
  return { covered, total, percentage: total === 0 ? 100 : (covered / total) * 100 };
}

export function filterSourceFiles(files) {
  return files
    .map((file) => file.replace(/^website\//, ""))
    .filter((file) => {
      if (!/^src\/.+\.(?:ts|tsx)$/.test(file)) return false;
      if (file.endsWith(".d.ts") || file.endsWith(".test.ts") || file.endsWith(".test.tsx")) {
        return false;
      }
      if (file === "src/app/route-tree.gen.ts" || file.startsWith("src/components/ui/")) {
        return false;
      }
      return true;
    });
}

function gitDiff(baseRef) {
  const range = `origin/${baseRef}...HEAD`;
  try {
    execFileSync("git", ["fetch", "origin", baseRef, "--quiet"], { stdio: "ignore" });
  } catch {
    // Local branches and offline development may already have the base ref.
  }

  for (const candidate of [range, `${baseRef}...HEAD`, `${baseRef}..HEAD`]) {
    try {
      const result = execFileSync(
        "git",
        ["diff", "--ignore-all-space", "--name-only", "--diff-filter=ACMR", candidate],
        {
          encoding: "utf8",
          stdio: ["ignore", "pipe", "ignore"],
        },
      );
      return result.split("\n").filter(Boolean);
    } catch {
      // Try the next locally available comparison.
    }
  }
  throw new Error(`Could not compare the current branch with ${baseRef}.`);
}

function workingTreeDiff(args) {
  try {
    return execFileSync(
      "git",
      ["diff", "--ignore-all-space", "--name-only", "--diff-filter=ACMR", ...args],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      },
    )
      .split("\n")
      .filter(Boolean);
  } catch {
    return [];
  }
}

export function mergeChangedFiles(committedFiles, workingTreeFiles) {
  return [...new Set([...committedFiles, ...workingTreeFiles])];
}

function untrackedFiles() {
  try {
    return execFileSync("git", ["ls-files", "--others", "--exclude-standard"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .split("\n")
      .filter(Boolean);
  } catch {
    return [];
  }
}

function mergeBase(baseRef) {
  for (const ref of [`origin/${baseRef}`, baseRef]) {
    try {
      return execFileSync("git", ["merge-base", ref, "HEAD"], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
    } catch {
      // Try the next reference.
    }
  }
  return null;
}

function changedLinesBetween(previous, current) {
  const before = previous.split("\n");
  const after = current.split("\n");
  const table = Array.from({ length: before.length + 1 }, () => new Uint16Array(after.length + 1));
  for (let row = before.length - 1; row >= 0; row -= 1) {
    for (let column = after.length - 1; column >= 0; column -= 1) {
      table[row][column] =
        before[row] === after[column]
          ? table[row + 1][column + 1] + 1
          : Math.max(table[row + 1][column], table[row][column + 1]);
    }
  }
  const changed = new Set();
  let row = 0;
  let column = 0;
  while (row < before.length || column < after.length) {
    if (row < before.length && column < after.length && before[row] === after[column]) {
      row += 1;
      column += 1;
    } else if (
      column < after.length &&
      (row === before.length || table[row][column + 1] >= table[row + 1][column])
    ) {
      changed.add(column + 1);
      column += 1;
    } else {
      row += 1;
    }
  }
  return changed;
}

async function changedLinesForFile(baseCommit, file) {
  if (!baseCommit) return new Set();
  try {
    const previous = execFileSync("git", ["show", `${baseCommit}:website/${file}`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    const current = readFileSync(path.resolve(file), "utf8");
    const [normalizedPrevious, normalizedCurrent] = await Promise.all([
      prettier.format(previous, { filepath: file }),
      prettier.format(current, { filepath: file }),
    ]);
    return changedLinesBetween(normalizedPrevious, normalizedCurrent);
  } catch {
    return new Set();
  }
}

async function hasSemanticChange(file, baseCommit) {
  if (!baseCommit || !file.startsWith("website/src/")) return true;
  try {
    const previous = execFileSync("git", ["show", `${baseCommit}:${file}`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    const current = readFileSync(path.resolve("..", file), "utf8");
    const [normalizedPrevious, normalizedCurrent] = await Promise.all([
      prettier.format(previous, { filepath: file }),
      prettier.format(current, { filepath: file }),
    ]);
    return normalizedPrevious !== normalizedCurrent;
  } catch {
    return true;
  }
}

export async function runCoverage(baseRef = "main") {
  if (!/^[A-Za-z0-9._/-]+$/.test(baseRef)) {
    throw new Error(`Invalid base ref: ${baseRef}`);
  }

  const changedFiles = mergeChangedFiles(gitDiff(baseRef), [
    ...workingTreeDiff([]),
    ...workingTreeDiff(["--cached"]),
    ...untrackedFiles(),
  ]);
  const baseCommit = mergeBase(baseRef);
  const semanticFiles = [];
  for (const file of changedFiles) {
    if (await hasSemanticChange(file, baseCommit)) semanticFiles.push(file);
  }
  const sourceFiles = filterSourceFiles(semanticFiles);
  if (sourceFiles.length === 0) {
    console.log("No changed first-party TypeScript files require coverage.");
    return 0;
  }

  const argumentsForVitest = [
    "vitest",
    "related",
    "--coverage",
    "--coverage.reporter=json",
    "--coverage.reportsDirectory=coverage/pr-changed",
    ...sourceFiles.flatMap((file) => ["--coverage.include", file]),
    ...sourceFiles,
  ];
  console.log(`Checking changed-file coverage (>=${COVERAGE_THRESHOLD}%):`);
  sourceFiles.forEach((file) => console.log(`  - ${file}`));
  const status = spawnSync("npx", argumentsForVitest, { stdio: "inherit" }).status ?? 1;
  if (status !== 0) return status;

  const coverage = JSON.parse(readFileSync("coverage/pr-changed/coverage-final.json", "utf8"));
  let covered = 0;
  let total = 0;
  for (const file of sourceFiles) {
    const absoluteFile = path.resolve(file);
    const fileCoverage = coverage[absoluteFile];
    const changedLines = await changedLinesForFile(baseCommit, file);
    if (!fileCoverage || changedLines.size === 0) continue;
    const result = changedStatementCoverage(fileCoverage, changedLines);
    covered += result.covered;
    total += result.total;
  }
  const percentage = total === 0 ? 100 : (covered / total) * 100;
  console.log(`Changed-line coverage: ${percentage.toFixed(2)}% (${covered}/${total} statements)`);
  if (percentage < COVERAGE_THRESHOLD) {
    console.error(`Changed-line coverage must be at least ${COVERAGE_THRESHOLD}%.`);
    return 1;
  }
  return 0;
}

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  runCoverage(process.argv[2] ?? process.env.BASE_REF ?? "main")
    .then((status) => {
      process.exitCode = status;
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
