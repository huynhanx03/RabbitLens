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

  console.log("Analyzing bundle budgets...\n");

  for (const [entryName, entryInfo] of Object.entries(manifest)) {
    if (!entryInfo.file) continue;

    const filePath = path.join(distDir, entryInfo.file);
    let gzipSize = 0;
    
    try {
      gzipSize = await getGzipSize(filePath);
    } catch {
      console.warn(`Warning: Could not read ${filePath}`);
      continue;
    }

    let budget = PERFORMANCE_BUDGETS.routeChunkGzipBytes;
    let budgetName = "routeChunkGzipBytes";

    if (entryInfo.isEntry && entryName === "index.html") {
      budget = PERFORMANCE_BUDGETS.initialJavaScriptGzipBytes;
      budgetName = "initialJavaScriptGzipBytes";
    } else if (entryInfo.file.endsWith(".css")) {
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

verifyBudgets().catch(err => {
  console.error("Verification script error:", err);
  process.exit(1);
});
