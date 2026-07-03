import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testResultsDir = path.join(__dirname, "../test-results");

const FORBIDDEN_PATTERNS = [
  /Basic\s+[A-Za-z0-9+/=]+/,
  /Bearer\s+[A-Za-z0-9-._~+/]+=*/,
  /password=/i,
  /client_secret=/i,
  /access_token/i,
];

async function scanDirectory(dir) {
  let hasError = false;

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        const errorInSubdir = await scanDirectory(fullPath);
        if (errorInSubdir) hasError = true;
      } else if (entry.isFile() && (entry.name.endsWith(".txt") || entry.name.endsWith(".log") || entry.name.endsWith(".json"))) {
        const content = await fs.readFile(fullPath, "utf-8");
        
        for (const pattern of FORBIDDEN_PATTERNS) {
          if (pattern.test(content)) {
            console.error(`❌ Secret leaked in artifact: ${fullPath}`);
            console.error(`   Pattern matched: ${pattern}`);
            hasError = true;
          }
        }
      }
    }
  } catch (e) {
    if (e.code === "ENOENT") {
      // Directory doesn't exist, which is fine
      return false;
    }
    console.error("Error scanning artifacts:", e);
    return true;
  }

  return hasError;
}

async function run() {
  console.log("Scanning test artifacts for leaked secrets...");
  const hasError = await scanDirectory(testResultsDir);

  if (hasError) {
    console.error("\nArtifact secret scan failed. Secrets were leaked in test outputs.");
    process.exit(1);
  } else {
    console.log("\n✅ Artifact secret scan passed.");
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
