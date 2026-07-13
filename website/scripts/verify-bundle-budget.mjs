import fs from "node:fs/promises";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { PERFORMANCE_BUDGETS } from "../config/performance-budgets.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "../dist");
const manifestPath = path.join(distDir, ".vite/manifest.json");

async function getGzipSize(filePath) {
  const content = await fs.readFile(filePath);
  return zlib.gzipSync(content).length;
}

function formatBytes(bytes) {
  return (bytes / 1024).toFixed(2) + " KiB";
}

export function collectInitialJavaScriptFiles(manifest, entryName) {
  const rootEntry = manifest[entryName];
  if (
    !rootEntry ||
    typeof rootEntry !== "object" ||
    rootEntry.isEntry !== true ||
    typeof rootEntry.file !== "string" ||
    !rootEntry.file.endsWith(".js")
  ) {
    throw new Error(`Missing JavaScript entry: ${entryName}`);
  }

  const files = [];
  const visitedEntries = new Set();
  const visitedFiles = new Set();

  function visit(manifestKey) {
    if (visitedEntries.has(manifestKey)) return;
    visitedEntries.add(manifestKey);

    const entry = manifest[manifestKey];
    if (!entry || typeof entry !== "object") return;
    if (
      typeof entry.file === "string" &&
      entry.file.endsWith(".js") &&
      !visitedFiles.has(entry.file)
    ) {
      visitedFiles.add(entry.file);
      files.push(entry.file);
    }
    for (const importedKey of entry.imports ?? []) {
      visit(importedKey);
    }
  }

  visit(entryName);
  return files;
}

async function verifyBudgets() {
  let manifest;
  try {
    const manifestContent = await fs.readFile(manifestPath, "utf-8");
    manifest = JSON.parse(manifestContent);
  } catch {
    console.error(`Failed to read manifest at ${manifestPath}. Did you run 'npm run build'?`);
    process.exit(1);
  }

  let hasError = false;
  const gzipSizes = new Map();

  async function getAssetGzipSize(file) {
    if (!gzipSizes.has(file)) {
      gzipSizes.set(file, await getGzipSize(path.join(distDir, file)));
    }
    return gzipSizes.get(file);
  }

  console.log("Analyzing bundle budgets...\n");

  const initialFiles = collectInitialJavaScriptFiles(manifest, "index.html");
  let initialJavaScriptGzipSize = 0;
  for (const file of initialFiles) {
    initialJavaScriptGzipSize += await getAssetGzipSize(file);
  }

  const initialBudget = PERFORMANCE_BUDGETS.initialJavaScriptGzipBytes;
  if (initialJavaScriptGzipSize > initialBudget) {
    console.error(
      `❌ Initial JavaScript (${formatBytes(initialJavaScriptGzipSize)}, ${initialFiles.length} chunks) exceeds initialJavaScriptGzipBytes (${formatBytes(initialBudget)}) by ${formatBytes(initialJavaScriptGzipSize - initialBudget)}`,
    );
    hasError = true;
  } else {
    console.log(
      `✅ Initial JavaScript: ${formatBytes(initialJavaScriptGzipSize)} across ${initialFiles.length} chunks (Budget: ${formatBytes(initialBudget)})`,
    );
  }

  for (const [entryName, entryInfo] of Object.entries(manifest)) {
    if (!entryInfo.file) continue;

    if (entryInfo.isEntry && entryName === "index.html") {
      continue;
    }

    const filePath = path.join(distDir, entryInfo.file);
    let gzipSize = 0;
    
    try {
      gzipSize = await getAssetGzipSize(entryInfo.file);
    } catch {
      console.warn(`Warning: Could not read ${filePath}`);
      continue;
    }

    let budget = PERFORMANCE_BUDGETS.routeChunkGzipBytes;
    let budgetName = "routeChunkGzipBytes";

    if (entryInfo.file.endsWith(".css")) {
      budget = PERFORMANCE_BUDGETS.cssGzipBytes;
      budgetName = "cssGzipBytes";
    } else if (entryInfo.file.includes("echarts") || entryInfo.file.includes("rate-chart")) {
      budget = PERFORMANCE_BUDGETS.chartChunkGzipBytes;
      budgetName = "chartChunkGzipBytes";
    } else if (entryInfo.file.includes("vendor") || entryInfo.file.includes("react") || entryInfo.file.includes("tanstack")) {
      budget = PERFORMANCE_BUDGETS.sharedChunkGzipBytes;
      budgetName = "sharedChunkGzipBytes";
    }

    const overBudget = gzipSize > budget;
    
    if (overBudget) {
      console.error(`❌ ${entryInfo.file} (${formatBytes(gzipSize)}) exceeds ${budgetName} (${formatBytes(budget)}) by ${formatBytes(gzipSize - budget)}`);
      hasError = true;
    } else if (entryInfo.isEntry || entryInfo.file.includes("echarts")) {
      console.log(`✅ ${entryInfo.file}: ${formatBytes(gzipSize)} (Budget: ${formatBytes(budget)})`);
    }
  }

  if (hasError) {
    console.error("\nBundle budget verification failed.");
    process.exit(1);
  } else {
    console.log("\n✅ All bundle budgets passed.");
  }
}

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  verifyBudgets().catch(err => {
    console.error("Verification script error:", err);
    process.exit(1);
  });
}
